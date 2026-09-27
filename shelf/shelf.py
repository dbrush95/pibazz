#!/usr/bin/env python3
"""Local shelf for the Pi. Serves the page and starts the real programs."""
import base64
import socket
from concurrent.futures import ThreadPoolExecutor
import hashlib
import hmac
import json
import os
import re
import secrets
import shutil
import subprocess
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
HOME = Path(os.environ.get("BAZZPI_HOME", str(Path.home()))).resolve()
PROFILE_PATH = HOME / ".config" / "bazzpi" / "profile.json"
PORT = 8765
HOST_RE = re.compile(r"^[A-Za-z0-9._-]{1,253}$")
APP_RE = re.compile(r"^[^\x00-\x1f]{1,256}$")
PIN_RE = re.compile(r"\b(\d{4})\b")
LAUNCH = {"status": "idle", "label": "", "log": "", "code": None}
LAUNCH_LOCK = threading.Lock()
AUTH_TOKEN = secrets.token_urlsafe(32)
UNLOCKED = False
PAIR = {}
PAIR_LOCK = threading.Lock()
SYSTEMS = {
    "nes", "snes", "gb", "gbc", "gba", "mastersystem", "megadrive", "gamegear",
    "segacd", "pcengine", "neogeo", "fbneo", "psx", "n64", "dreamcast", "psp", "nds",
}
CORE_HINTS = {
    "nes": "nestopia", "snes": "snes9x", "gb": "gambatte", "gbc": "gambatte",
    "gba": "mgba", "mastersystem": "genesis_plus_gx", "megadrive": "genesis_plus_gx",
    "gamegear": "genesis_plus_gx", "segacd": "genesis_plus_gx", "pcengine": "pce",
    "neogeo": "fbneo", "fbneo": "fbneo", "psx": "pcsx_rearmed", "n64": "mupen64plus",
    "dreamcast": "flycast", "psp": "ppsspp", "nds": "melonds",
}
ROM_HINTS = {
    ".nes": "nestopia", ".sfc": "snes9x", ".smc": "snes9x", ".gb": "gambatte",
    ".gbc": "gambatte", ".gba": "mgba", ".md": "genesis_plus_gx", ".gen": "genesis_plus_gx",
    ".sms": "genesis_plus_gx", ".gg": "genesis_plus_gx", ".pce": "pce",
    ".n64": "mupen64plus", ".z64": "mupen64plus", ".v64": "mupen64plus",
    ".nds": "melonds", ".cdi": "flycast", ".gdi": "flycast",
}
TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".ttf": "font/ttf",
}


def read_profile():
    try:
        data = json.loads(PROFILE_PATH.read_text())
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict) or not str(data.get("name") or "").strip():
        return None
    return data


def write_profile(data):
    PROFILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    temp = PROFILE_PATH.with_suffix(".tmp")
    temp.touch(mode=0o600, exist_ok=True)
    temp.write_text(json.dumps(data))
    os.replace(temp, PROFILE_PATH)


def public_profile(data):
    if not data:
        return {"name": "", "hasPin": False}
    return {"name": str(data.get("name") or ""), "hasPin": bool(data.get("pin"))}


def hash_pin(pin, salt=None):
    salt = salt or secrets.token_hex(16)
    raw_salt = bytes.fromhex(salt)
    try:
        digest = hashlib.scrypt(pin.encode(), salt=raw_salt, n=2**14, r=8, p=1, dklen=32).hex()
    except ValueError:
        digest = hashlib.pbkdf2_hmac("sha256", pin.encode(), raw_salt, 200000).hex()
    return salt, digest


def check_pin(data, pin):
    stored = str(data.get("pin") or "")
    salt = str(data.get("salt") or "")
    if not stored:
        return True
    if not salt or len(pin) != 4 or not pin.isdigit():
        return False
    _, digest = hash_pin(pin, salt)
    return hmac.compare_digest(digest, stored)


def session_env():
    env = os.environ.copy()
    uid = os.getuid()
    env.setdefault("XDG_RUNTIME_DIR", f"/run/user/{uid}")
    env.setdefault("WAYLAND_DISPLAY", "wayland-0")
    env.setdefault("DISPLAY", ":0")
    return env


def which(names):
    for name in names:
        found = shutil.which(name)
        if found:
            return found
    return None


def spawn(argv, env=None):
    subprocess.Popen(
        argv,
        env=env or session_env(),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )


def tuck_shelf(away):
    tool = which(("wlrctl",))
    if tool:
        subprocess.run([tool, "toplevel", "minimize" if away else "focus", "title:Bazzpi"],
                       env=session_env(), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                       timeout=3)


def run_in_front(argv, env=None):
    # One native application at a time: predictable return-to-home on a TV.
    with LAUNCH_LOCK:
        if LAUNCH["status"] == "running":
            raise RuntimeError("An app is already open. Use Alt+Tab to return to it, then close it first.")
        LAUNCH.update(status="running", label=Path(argv[0]).name, log="", code=None)
    folder = HOME / ".local/state/bazzpi"
    log = folder / "last-app.log"
    try:
        folder.mkdir(parents=True, exist_ok=True)
        output = log.open("w")
        proc = subprocess.Popen(argv, env=env or session_env(), stdout=output,
                                stderr=subprocess.STDOUT, start_new_session=True)
    except OSError as exc:
        if "output" in locals():
            output.close()
        with LAUNCH_LOCK:
            LAUNCH.update(status="failed", log=str(exc))
        raise RuntimeError(str(exc)) from exc

    def work():
        try:
            try:
                tuck_shelf(True)
            except (OSError, subprocess.TimeoutExpired):
                pass
            code = proc.wait()
            output.close()
            with log.open("rb") as stream:
                stream.seek(max(0, log.stat().st_size - 6000))
                tail = stream.read().decode(errors="replace")
            with LAUNCH_LOCK:
                LAUNCH.update(status="finished" if code == 0 else "failed", code=code, log=tail)
        finally:
            output.close()
            try:
                tuck_shelf(False)
            except (OSError, subprocess.TimeoutExpired):
                pass
    threading.Thread(target=work, daemon=True).start()


def normalize_host(value):
    value = str(value).strip()
    if value.startswith(("http://", "https://")):
        parsed = urlparse(value)
        value = parsed.hostname or ""
    if value.endswith(":47990"):
        value = value[:-6]
    if not HOST_RE.fullmatch(value) or value.startswith("-"):
        raise RuntimeError("Use the PC's local IPv4 address or hostname, for example 192.168.1.20.")
    return value


def diagnose(host):
    host = normalize_host(host)
    def probe(item):
        port, label = item
        start = time.monotonic()
        try:
            with socket.create_connection((host, port), timeout=2):
                return {"port": port, "label": label, "ok": True,
                        "ms": round((time.monotonic() - start) * 1000)}
        except OSError as exc:
            return {"port": port, "label": label, "ok": False, "error": str(exc)}
    with ThreadPoolExecutor(max_workers=4) as pool:
        checks = list(pool.map(probe, [(47989, "Discovery / host"), (47984, "Pairing"),
                                      (48010, "Stream setup"), (47990, "Sunshine settings (optional)")]))
    return {"host": host, "checks": checks,
            "note": "TCP checks do not prove video/audio UDP works. Stream traffic uses UDP 47998–48000. "
                    "Use the same home LAN; no router port forwarding or UPnP is needed."}


def browser(url):
    binary = which(("chromium", "chromium-browser"))
    if not binary:
        raise RuntimeError("Chromium is not installed")
    profile = HOME / ".config" / "bazzpi-browser"
    run_in_front([binary, f"--user-data-dir={profile}", "--ozone-platform=wayland", "--disable-background-mode", "--start-maximized", "--new-window", url])


def moonlight_bin():
    binary = which(("moonlight-qt", "moonlight"))
    if not binary:
        raise RuntimeError("Moonlight is not installed. Run the Lite installer again.")
    return binary


def moonlight_env():
    env = session_env()
    env.pop("H264_DECODER_HINT", None)
    return env


def moonlight(host, app, width, height, fps, bitrate, codec, decoder="auto"):
    if host:
        host = normalize_host(host)
    binary = moonlight_bin()
    env = moonlight_env()
    if not host:
        run_in_front([binary], env)
        return
    if not HOST_RE.match(host) or not APP_RE.match(app):
        raise RuntimeError("That address or app name is not allowed")
    run_in_front(
        [
            binary,
            "stream",
            host,
            app,
            "--resolution",
            f"{width}x{height}",
            "--fps",
            str(fps),
            "--bitrate",
            str(bitrate),
            "--video-codec",
            codec,
            "--video-decoder",
            decoder,
            "--display-mode",
            "fullscreen",
        ],
        env,
    )


def start_pair(host):
    host = normalize_host(host)
    binary = moonlight_bin()
    with PAIR_LOCK:
        old = PAIR.get(host)
        if old and old.get("proc") and old["proc"].poll() is None:
            old["proc"].kill()
    pin = f"{secrets.randbelow(10000):04d}"
    proc = subprocess.Popen(
        [binary, "pair", host, "--pin", pin],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env={**moonlight_env(), "QT_QPA_PLATFORM": "offscreen"},
        start_new_session=True,
    )
    job = {"pin": pin, "status": "pin", "log": "", "proc": proc}

    def reader():
        try:
            for line in proc.stdout:
                job["log"] = (job["log"] + line)[-4000:]
                match = PIN_RE.search(line)
                if match and job["status"] == "waiting":
                    job["pin"] = match.group(1)
                    job["status"] = "pin"
        except Exception as exc:
            job["log"] += str(exc)
        code = proc.wait()
        job["status"] = "paired" if code == 0 else "failed"

    def expire():
        if proc.poll() is None:
            proc.kill()
    timer = threading.Timer(120, expire)
    timer.daemon = True
    timer.start()
    threading.Thread(target=reader, daemon=True).start()
    with PAIR_LOCK:
        PAIR[host] = job
    return public_pair(job)


def public_pair(job):
    if not job:
        return {"status": "idle", "pin": "", "log": ""}
    return {"status": job["status"], "pin": job["pin"], "log": job["log"][-500:]}


def list_apps(host):
    host = normalize_host(host)
    binary = moonlight_bin()
    proc = subprocess.run(
        [binary, "list", host],
        capture_output=True,
        text=True,
        timeout=25,
        env={**session_env(), "QT_QPA_PLATFORM": "offscreen"},
    )
    if proc.returncode != 0:
        raise RuntimeError(((proc.stderr or "") + (proc.stdout or ""))[-2000:].strip()
                           or "Sunshine did not answer. Pair first and check the address.")
    # Only stdout contains app names. Qt diagnostics on stderr are not games.
    return list(dict.fromkeys(line.strip() for line in proc.stdout.splitlines()
                             if line.strip() and line.strip() != "Loading app list..."))


def update_status():
    try:
        text = (HOME / ".local/state/bazzpi/update-status").read_text().strip().splitlines()[0]
    except (OSError, IndexError):
        return "unknown"
    if text in {"updated", "current", "offline", "checking", "failed", "rollback", "disabled"}:
        return text
    return "unknown"


def exit_shelf():
    subprocess.Popen(
        ["pkill", "-f", "127.0.0.1:8765"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )


def install_launcher():
    folder = HOME / ".local" / "share" / "applications"
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "bazzpi-shelf.desktop").write_text(
        "[Desktop Entry]\n"
        "Name=Bazzpi Shelf\n"
        "Comment=Open the shelf\n"
        "Exec=/usr/local/bin/bazzpi-shelf\n"
        "Terminal=false\n"
        "Type=Application\n"
        "Categories=Utility;\n"
    )


def terminal():
    binary = which(("foot", "lxterminal", "x-terminal-emulator", "kitty", "gnome-terminal", "konsole", "xterm"))
    if not binary:
        raise RuntimeError("No terminal program is installed")
    run_in_front([binary])


def find_core(hint):
    if not hint:
        return None
    for path in Path("/usr/lib").glob("**/libretro/*.so"):
        if hint in path.name:
            return path
    return None


def retroarch(system="", rom=""):
    if system and system not in SYSTEMS:
        raise RuntimeError("That system is not on this Pi")
    binary = which(("retroarch", "emulationstation"))
    if not binary:
        raise RuntimeError("RetroArch is not installed")
    if binary.endswith("emulationstation") and not rom:
        run_in_front([binary])
        return
    folder = HOME / "ROMs" / system if system else HOME / "ROMs"
    folder.mkdir(parents=True, exist_ok=True)
    command = [binary, "--fullscreen"]
    target = safe_path(rom) if rom else None
    if target is not None:
        if not target.is_file():
            raise RuntimeError("That game is not in the home folder")
        hint = CORE_HINTS.get(system) or CORE_HINTS.get(target.parent.name) or ROM_HINTS.get(target.suffix.lower(), "")
        core = find_core(hint)
        if core:
            command += ["-L", str(core), str(target)]
        else:
            command.append(str(target))
    run_in_front(command)


def wallpaper_roots():
    roots = [HOME / "Pictures", HOME / "Downloads"]
    for extra in (Path("/usr/share/rpd-wallpaper"), Path("/usr/share/backgrounds")):
        if extra.is_dir():
            roots.append(extra)
    return roots


def allowed_image(path):
    path = path.resolve()
    if path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"} or not path.is_file():
        return False
    return any(path == root.resolve() or root.resolve() in path.parents for root in wallpaper_roots() if root.exists())


def list_wallpapers():
    found = []
    for root in wallpaper_roots():
        if not root.is_dir():
            continue
        for child in sorted(root.rglob("*")):
            if child.is_file() and allowed_image(child) and not child.name.startswith("."):
                found.append({"name": child.name, "path": str(child)})
            if len(found) >= 40:
                return found
    return found


def save_wallpaper(name, data_b64):
    raw = base64.b64decode(data_b64)
    if len(raw) > 8_000_000:
        raise RuntimeError("That picture is too large")
    folder = HOME / "Pictures"
    folder.mkdir(parents=True, exist_ok=True)
    safe = re.sub(r"[^A-Za-z0-9._-]", "", Path(name).name) or "wallpaper.jpg"
    if Path(safe).suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
        safe += ".jpg"
    target = folder / safe
    target.write_bytes(raw)
    return str(target)


def run_shell(command):
    command = str(command or "").strip()
    if not command:
        raise RuntimeError("Type a command")
    if len(command) > 400:
        raise RuntimeError("Command is too long")
    proc = subprocess.run(
        ["bash", "-lc", command],
        capture_output=True,
        text=True,
        timeout=20,
        cwd=str(HOME),
        env=session_env(),
    )
    return {"output": ((proc.stdout or "") + (proc.stderr or ""))[-8000:], "code": proc.returncode}


def retropie():
    retroarch()


def safe_path(rel):
    rel = (rel or "").strip().lstrip("/")
    target = (HOME / rel).resolve()
    if target != HOME and HOME not in target.parents:
        raise RuntimeError("That folder is outside the home directory")
    return target


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def send_json(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self, limit=16384):
        length = int(self.headers.get("Content-Length", "0"))
        if length < 0 or length > limit:
            raise RuntimeError("Request is too large")
        raw = self.rfile.read(length) if length else b"{}"
        data = json.loads(raw.decode() or "{}")
        if not isinstance(data, dict):
            raise RuntimeError("Expected an object")
        return data

    def trusted(self):
        return self.headers.get("Host") == f"127.0.0.1:{PORT}" and self.headers.get("Sec-Fetch-Site", "same-origin") in ("same-origin", "none")

    def authorized(self):
        profile = read_profile()
        return bool(profile) and (not profile.get("pin") or
            (UNLOCKED and hmac.compare_digest(self.headers.get("X-Bazzpi-Token", ""), AUTH_TOKEN)))

    def do_GET(self):
        if not self.trusted():
            self.send_json(403, {"error": "Local shelf requests only"})
            return
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/") and parsed.path not in {"/api/profile", "/api/status"} and not self.authorized():
            self.send_json(401, {"error": "Unlock the shelf first"})
            return
        if parsed.path == "/api/launch-status":
            with LAUNCH_LOCK:
                self.send_json(200, dict(LAUNCH))
            return
        if parsed.path == "/api/profile":
            self.send_json(200, public_profile(read_profile()))
            return
        if parsed.path == "/api/wallpapers":
            self.send_json(200, {"wallpapers": list_wallpapers()})
            return
        if parsed.path == "/api/wallpaper-file":
            query = parse_qs(parsed.query)
            target = Path(query.get("path", [""])[0])
            if not allowed_image(target):
                self.send_error(404)
                return
            data = target.read_bytes()
            kind = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}[target.suffix.lower()]
            self.send_response(200)
            self.send_header("Content-Type", kind)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        if parsed.path == "/api/moonlight/pair":
            query = parse_qs(parsed.query)
            try:
                host = normalize_host(query.get("host", [""])[0])
            except RuntimeError as exc:
                self.send_json(400, {"error": str(exc)})
                return
            with PAIR_LOCK:
                job = PAIR.get(host)
            self.send_json(200, public_pair(job))
            return
        if parsed.path == "/api/status":
            self.send_json(
                200,
                {
                    "hostname": os.uname().nodename,
                    "user": os.environ.get("USER", "play"),
                    "home": str(HOME),
                    "moonlight": bool(which(("moonlight-qt", "moonlight"))),
                    "chromium": bool(which(("chromium", "chromium-browser"))),
                    "retropie": bool(which(("emulationstation", "retroarch"))),
                    "update": update_status(),
                },
            )
            return
        if parsed.path == "/api/files":
            query = parse_qs(parsed.query)
            try:
                folder = safe_path(query.get("path", [""])[0])
            except RuntimeError as exc:
                self.send_json(400, {"error": str(exc)})
                return
            if not folder.is_dir():
                self.send_json(404, {"error": "No such folder"})
                return
            entries = []
            for child in sorted(folder.iterdir(), key=lambda item: (not item.is_dir(), item.name.lower())):
                if child.name.startswith("."):
                    continue
                entries.append(
                    {
                        "name": child.name,
                        "kind": "dir" if child.is_dir() else "file",
                        "size": child.stat().st_size if child.is_file() else 0,
                    }
                )
            rel = "" if folder == HOME else str(folder.relative_to(HOME))
            self.send_json(200, {"path": rel, "entries": entries})
            return
        if parsed.path == "/api/file":
            query = parse_qs(parsed.query)
            try:
                target = safe_path(query.get("path", [""])[0])
            except RuntimeError as exc:
                self.send_json(400, {"error": str(exc)})
                return
            if not target.is_file() or target.stat().st_size > 200000:
                self.send_json(404, {"error": "Cannot show that file"})
                return
            try:
                text = target.read_text(errors="replace")
            except OSError:
                self.send_json(404, {"error": "Cannot show that file"})
                return
            self.send_json(200, {"text": text[:8000]})
            return
        rel = "index.html" if parsed.path in ("/", "") else parsed.path.lstrip("/")
        target = (ROOT / rel).resolve()
        if ROOT not in target.parents and target != ROOT or not target.is_file():
            self.send_error(404)
            return
        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", TYPES.get(target.suffix, "application/octet-stream"))
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        global UNLOCKED
        if not self.trusted() or self.headers.get("Origin") != f"http://127.0.0.1:{PORT}" or self.headers.get("Content-Type") != "application/json":
            self.send_json(403, {"error": "Local shelf requests only"})
            return
        parsed = urlparse(self.path)
        if parsed.path not in {"/api/profile", "/api/unlock"} and not self.authorized():
            self.send_json(401, {"error": "Unlock the shelf first"})
            return
        try:
            body = self.read_json(12_000_000 if parsed.path == "/api/wallpaper" else 16384)
        except (RuntimeError, ValueError, json.JSONDecodeError) as exc:
            self.send_json(400, {"error": str(exc)})
            return
        try:
            if parsed.path == "/api/profile":
                name = str(body.get("name") or "").strip()
                pin = str(body.get("pin") or "")
                if not name or len(name) > 32:
                    raise RuntimeError("Add a name.")
                if pin and (len(pin) != 4 or not pin.isdigit()):
                    raise RuntimeError("Use a 4 digit code, or leave it empty.")
                if read_profile():
                    raise RuntimeError("A profile is already on this Pi.")
                record = {"name": name}
                if pin:
                    salt, digest = hash_pin(pin)
                    record["salt"] = salt
                    record["pin"] = digest
                write_profile(record)
                UNLOCKED = True
                self.send_json(200, {"ok": True, "token": AUTH_TOKEN})
                return
            elif parsed.path == "/api/unlock":
                data = read_profile()
                if not data:
                    raise RuntimeError("Create a profile first.")
                if not check_pin(data, str(body.get("pin") or "")):
                    time.sleep(1)
                    raise RuntimeError("That code does not match.")
                UNLOCKED = True
                self.send_json(200, {"ok": True, "token": AUTH_TOKEN})
                return
            elif parsed.path == "/api/lock":
                UNLOCKED = False
            elif parsed.path == "/api/launch":
                kind = body.get("kind")
                if kind in ("moonlight", "desktop"):
                    app = "Desktop" if kind == "desktop" else str(body.get("app") or "Steam")
                    width, height = (1280, 720) if body.get("resolution") == "720p" else (1920, 1080)
                    fps = 30 if int(body.get("fps") or 60) <= 30 else 60
                    bitrate = max(2000, min(40000, int(body.get("bitrate") or 20000)))
                    codec = "HEVC" if body.get("codec") == "HEVC" else "H.264"
                    decoder = str(body.get("decoder") or "auto")
                    if decoder not in {"auto", "hardware", "software"}:
                        raise RuntimeError("Unknown decoder")
                    moonlight(str(body.get("host") or ""), app, width, height, fps, bitrate, codec, decoder)
                elif kind == "browser":
                    url = str(body.get("url") or "https://www.google.com")
                    if not url.startswith(("http://", "https://")):
                        raise RuntimeError("Only web addresses can be opened")
                    browser(url)
                elif kind == "gamepass":
                    browser("https://www.xbox.com/play")
                elif kind == "retropie":
                    retroarch(str(body.get("system") or ""))
                elif kind == "rom":
                    retroarch(rom=str(body.get("path") or ""))
                elif kind == "terminal":
                    terminal()
                else:
                    raise RuntimeError("Unknown app")
            elif parsed.path == "/api/moonlight/pair":
                host = str(body.get("host") or "")
                self.send_json(200, start_pair(host))
                return
            elif parsed.path == "/api/moonlight/diagnose":
                self.send_json(200, diagnose(body.get("host", "")))
                return
            elif parsed.path == "/api/moonlight/list":
                host = str(body.get("host") or "")
                self.send_json(200, {"apps": list_apps(host)})
                return
            elif parsed.path == "/api/shell":
                self.send_json(200, run_shell(body.get("command")))
                return
            elif parsed.path == "/api/wallpaper":
                path = save_wallpaper(str(body.get("name") or "wallpaper.jpg"), str(body.get("data") or ""))
                self.send_json(200, {"path": path})
                return
            elif parsed.path == "/api/exit":
                exit_shelf()
                self.send_json(200, {"ok": True})
                return
            elif parsed.path == "/api/power":
                action = body.get("action")
                if action == "sleep":
                    binary = which(("wlopm",))
                    if binary:
                        spawn([binary, "--off", "*"])
                    else:
                        raise RuntimeError("Sleep is not available")
                elif action == "restart":
                    spawn(["sudo", "systemctl", "reboot"])
                elif action == "shutdown":
                    spawn(["sudo", "systemctl", "poweroff"])
                else:
                    raise RuntimeError("Unknown power action")
            elif parsed.path == "/api/volume":
                level = max(0, min(100, int(body.get("volume", 70))))
                pactl = which(("wpctl", "pactl"))
                if pactl and os.path.basename(pactl) == "wpctl":
                    spawn([pactl, "set-volume", "@DEFAULT_AUDIO_SINK@", f"{level / 100:.2f}"])
                elif pactl:
                    spawn([pactl, "set-sink-volume", "@DEFAULT_SINK@", f"{level}%"])
            elif parsed.path == "/api/system":
                if body.get("hostname"):
                    name = str(body["hostname"])
                    if not HOST_RE.match(name):
                        raise RuntimeError("Hostname is not allowed")
                    spawn(["sudo", "hostnamectl", "set-hostname", name])
                if body.get("country"):
                    spawn(["sudo", "raspi-config", "nonint", "do_wifi_country", str(body["country"])[:2].upper()])
                if "ssh" in body:
                    spawn(["sudo", "raspi-config", "nonint", "do_ssh", "0" if body["ssh"] else "1"])
                if body.get("timezone"):
                    spawn(["sudo", "timedatectl", "set-timezone", str(body["timezone"])])
            else:
                self.send_error(404)
                return
        except (RuntimeError, ValueError, OSError, subprocess.TimeoutExpired) as exc:
            self.send_json(400, {"error": str(exc)})
            return
        self.send_json(200, {"ok": True})


def main():
    install_launcher()
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    server.serve_forever()


if __name__ == "__main__":
    main()
