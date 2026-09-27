#!/usr/bin/env python3
"""Local shelf for the Pi. Serves the page and starts the real programs."""
import base64
import json
import os
import re
import shutil
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
HOME = Path(os.environ.get("BAZZPI_HOME", str(Path.home()))).resolve()
PORT = 8765
HOST_RE = re.compile(r"^[A-Za-z0-9._-]{1,253}$")
APP_RE = re.compile(r"^[A-Za-z0-9 ._-]{1,64}$")
PIN_RE = re.compile(r"\b(\d{4})\b")
PAIR = {}
PAIR_LOCK = threading.Lock()
TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".ttf": "font/ttf",
}


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


def spawn(argv):
    subprocess.Popen(
        argv,
        env=session_env(),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )


def browser(url):
    binary = which(("chromium", "chromium-browser"))
    if not binary:
        raise RuntimeError("Chromium is not installed")
    profile = HOME / ".config" / "bazzpi-browser"
    spawn([binary, f"--user-data-dir={profile}", "--new-window", url])


def moonlight_bin():
    binary = which(("moonlight-qt", "moonlight"))
    if not binary:
        raise RuntimeError("Moonlight is not installed yet. Leave the Pi online and try again.")
    return binary


def moonlight(host, app, width, height, fps, bitrate, codec):
    binary = moonlight_bin()
    if not host:
        spawn([binary])
        return
    if not HOST_RE.match(host) or not APP_RE.match(app):
        raise RuntimeError("That address or app name is not allowed")
    codec_flag = "H.264" if codec != "HEVC" else "HEVC"
    spawn(
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
            codec_flag,
            "--video-decoder",
            "auto",
            "--display-mode",
            "fullscreen",
        ]
    )


def start_pair(host):
    if not HOST_RE.match(host):
        raise RuntimeError("That address is not allowed")
    binary = moonlight_bin()
    with PAIR_LOCK:
        old = PAIR.get(host)
        if old and old.get("proc") and old["proc"].poll() is None:
            old["proc"].kill()
    proc = subprocess.Popen(
        [binary, "pair", host],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=session_env(),
        start_new_session=True,
    )
    job = {"pin": "", "status": "waiting", "log": "", "proc": proc}

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

    threading.Thread(target=reader, daemon=True).start()
    with PAIR_LOCK:
        PAIR[host] = job
    return public_pair(job)


def public_pair(job):
    if not job:
        return {"status": "idle", "pin": "", "log": ""}
    return {"status": job["status"], "pin": job["pin"], "log": job["log"][-500:]}


def list_apps(host):
    if not HOST_RE.match(host):
        raise RuntimeError("That address is not allowed")
    binary = moonlight_bin()
    proc = subprocess.run(
        [binary, "list", host],
        capture_output=True,
        text=True,
        timeout=25,
        env=session_env(),
    )
    text = (proc.stdout or "") + (proc.stderr or "")
    apps = []
    for line in text.splitlines():
        line = re.sub(r"^\d+[\.\)]\s*", "", line.strip())
        if not line or len(line) > 64:
            continue
        lower = line.lower()
        if lower.startswith(("usage", "error", "failed", "connect", "please", "pin")):
            continue
        if line not in apps:
            apps.append(line)
    if proc.returncode != 0 and not apps:
        raise RuntimeError(text.strip() or "Sunshine did not answer. Pair first, and check the address.")
    return apps


def update_status():
    try:
        text = Path("/tmp/bazzpi-update-status").read_text().strip().splitlines()[0]
    except (OSError, IndexError):
        return "unknown"
    if text in {"updated", "current", "offline", "checking"}:
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
    binary = which(("lxterminal", "x-terminal-emulator", "foot", "kitty", "gnome-terminal", "konsole", "xterm"))
    if not binary:
        raise RuntimeError("No terminal program is installed")
    spawn([binary])


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
    binary = which(("emulationstation", "retroarch"))
    if not binary:
        raise RuntimeError("RetroPie is not installed. Run the RetroPie setup from the shelf first.")
    spawn([binary])


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
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self, limit=16384):
        length = int(self.headers.get("Content-Length", "0"))
        if length > limit:
            raise RuntimeError("Request is too large")
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode() or "{}")

    def do_GET(self):
        parsed = urlparse(self.path)
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
            host = query.get("host", [""])[0]
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
        parsed = urlparse(self.path)
        try:
            body = self.read_json(12_000_000 if parsed.path == "/api/wallpaper" else 16384)
        except (RuntimeError, json.JSONDecodeError) as exc:
            self.send_json(400, {"error": str(exc)})
            return
        try:
            if parsed.path == "/api/launch":
                kind = body.get("kind")
                if kind in ("moonlight", "desktop"):
                    app = "Desktop" if kind == "desktop" else str(body.get("app") or "Steam")
                    width, height = (1280, 720) if body.get("resolution") == "720p" else (1920, 1080)
                    fps = 30 if int(body.get("fps") or 60) <= 30 else 60
                    bitrate = max(2000, min(80000, int(body.get("bitrate") or 20000)))
                    codec = "HEVC" if body.get("codec") == "HEVC" else "H.264"
                    moonlight(str(body.get("host") or ""), app, width, height, fps, bitrate, codec)
                elif kind == "browser":
                    url = str(body.get("url") or "https://www.google.com")
                    if not url.startswith(("http://", "https://")):
                        raise RuntimeError("Only web addresses can be opened")
                    browser(url)
                elif kind == "gamepass":
                    browser("https://www.xbox.com/play")
                elif kind == "retropie":
                    retropie()
                elif kind == "terminal":
                    terminal()
                else:
                    raise RuntimeError("Unknown app")
            elif parsed.path == "/api/moonlight/pair":
                host = str(body.get("host") or "")
                self.send_json(200, start_pair(host))
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
