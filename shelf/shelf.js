const APPS = [
  ["play", "Play"],
  ["desktop", "Desktop"],
  ["retropie", "RetroArch"],
  ["gamepass", "Game Pass"],
  ["geforcenow", "GeForce NOW"],
  ["driftguard", "DriftGuard"],
  ["browser", "Browser"],
  ["files", "Files"],
  ["terminal", "Terminal"],
  ["settings", "Settings"],
];

const CONSOLES = [
  ["NES", "nes", "Full speed"], ["SNES", "snes", "Full speed"], ["Game Boy", "gb", "Full speed"],
  ["Game Boy Color", "gbc", "Full speed"], ["Game Boy Advance", "gba", "Full speed"],
  ["Master System", "mastersystem", "Full speed"], ["Genesis", "megadrive", "Full speed"],
  ["Game Gear", "gamegear", "Full speed"], ["Sega CD", "segacd", "Full speed"],
  ["TurboGrafx-16", "pcengine", "Full speed"], ["Neo Geo", "neogeo", "Full speed"],
  ["Arcade", "fbneo", "Full speed"], ["PlayStation", "psx", "Hit or miss"],
  ["Nintendo 64", "n64", "Hit or miss"], ["Dreamcast", "dreamcast", "Hit or miss"],
  ["PSP", "psp", "Hit or miss"], ["Nintendo DS", "nds", "Hit or miss"],
];

const DESKS = [
  ["paper", "Paper"], ["shore", "Shore"], ["dusk", "Dusk"], ["night", "Night"],
];

const ICONS = {
  grid: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h4M8 10v4M15 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0v2a2 2 0 0 0 2 2h1M4 8h16v8H4z"/></svg>',
  desktop: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
  retropie: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 11v2M17 11v2M8 16h8"/><rect x="2" y="7" width="20" height="10" rx="3"/></svg>',
  gamepass: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 18a5 5 0 0 1 0-10 6 6 0 0 1 11 2 4 4 0 0 1 0 8H7z"/></svg>',
  geforcenow: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 18a5 5 0 0 1 0-10 6 6 0 0 1 11 2 4 4 0 0 1 0 8H7z"/><path d="m13 8-3 5h4l-3 5"/></svg>',
  driftguard: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
  browser: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  files: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12 15h5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/></svg>',
  wifi: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>',
};

const defaults = {
  host: "", app: "Steam", resolution: "1080p", fps: 60, bitrate: 20000, codec: "H.264", decoder: "auto",
  theme: "light", desktop: "paper", hostname: "bazzpi", country: "US",
  timezone: "America/New_York", ssh: true, volume: 70, paired: false, wallpaper: "",
};

const state = {
  settings: load("bazzpi-settings", defaults),
  profile: null,
  unlocked: false,
  authReady: false,
  open: [],
  focus: null,
  min: [],
  launcher: true,
  tray: false,
  query: "",
  section: "Appearance",
  notice: "",
  diagnostics: null,
  native: { status: "idle" },
  token: "",
  pi: null,
  piLoading: false,
  piError: "",
  panels: {},
  clock: "",
  filePath: "",
  fileText: "",
  pace: "All",
  picked: null,
  url: "bazzpi://newtab",
  status: {},
  pair: { status: "idle", pin: "", log: "" },
  apps: ["Steam", "Desktop"],
  wallpapers: [],
  termLog: "bazzpi terminal\nCommands run on this Pi.\n",
  osk: false,
  oskMode: "abc",
  oskShift: false,
  oskTarget: null,
  pad: false,
  padReady: false,
  padButtons: [],
  padMode: "cursor",
  oskSelector: "",
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return fallback && !Array.isArray(fallback) ? { ...fallback, ...JSON.parse(raw) } : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function patch(next) {
  if ("host" in next && next.host !== state.settings.host) {
    clearInterval(pairTimer); pairTimer = null;
    state.pair = { status: "idle", pin: "", log: "" };
    state.diagnostics = null;
    state.apps = ["Steam", "Desktop"];
  }
  state.settings = { ...state.settings, ...next };
  save("bazzpi-settings", state.settings);
  draw();
}

async function api(path, body) {
  const headers = { "X-Bazzpi-Token": state.token };
  if (body) headers["Content-Type"] = "application/json";
  const response = await fetch(path, { headers, ...(body ? { method: "POST", body: JSON.stringify(body) } : {}) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "That did not work");
  return data;
}

function toast(message) {
  state.notice = message;
  draw();
  setTimeout(() => {
    if (state.notice === message) {
      state.notice = "";
      draw();
    }
  }, 3200);
}

function launch(id) {
  state.launcher = false;
  state.tray = false;
  if (!state.open.includes(id)) state.open.push(id);
  state.min = state.min.filter((item) => item !== id);
  state.focus = id;
  draw();
}

function el(html) {
  const wrap = document.createElement("template");
  wrap.innerHTML = html.trim();
  return wrap.content.firstChild;
}

function draw() {
  if (state.oskTarget && document.contains?.(state.oskTarget)) {
    state.oskSelector = fieldSelector(state.oskTarget);
    state.oskValue = state.oskTarget.value;
    state.oskPosition = state.oskTarget.selectionStart;
  }
  const desk = document.getElementById("desk");
  const theme = state.settings.theme === "dark" ? "dark" : "";
  desk.className = `desk ${theme} desk-${state.settings.desktop}`;
  if (!state.authReady) {
    desk.innerHTML = "";
    return;
  }
  const who = state.authReady && state.profile && state.profile.name;
  if (!who) {
    desk.innerHTML = gateCreate() + (state.notice ? `<div class="toast" role="alert">${escapeHtml(state.notice)}</div>` : "");
    bind();
    return;
  }
  if (state.profile.pin && !state.unlocked) {
    desk.innerHTML = gateLock() + (state.notice ? `<div class="toast" role="alert">${escapeHtml(state.notice)}</div>` : "");
    bind();
    return;
  }
  const windows = state.open.filter((id) => !state.min.includes(id)).map((id) => windowFor(id)).join("");
  const apps = APPS.filter((app) => app[1].toLowerCase().includes(state.query.toLowerCase()));
  const wall = state.settings.wallpaper
    ? ` style="background-image:url('/api/wallpaper-file?path=${encodeURIComponent(state.settings.wallpaper)}');background-size:cover;background-position:center"`
    : "";
  desk.innerHTML = `
    <div class="wallpaper"${wall}></div>
    ${state.notice ? `<div class="toast">${escapeHtml(state.notice)}</div>` : ""}
    <div class="home-welcome"><p class="kicker">Your living room, connected</p><h1>Hi, ${escapeHtml(state.profile.name)}.</h1><p>Pick something to play.</p></div>
    <div class="stage">${windows}</div>
    ${state.native.status === "failed" ? `<aside class="launch-error" role="alert"><b>Could not start ${escapeHtml(state.native.label)}</b><pre>${escapeHtml(state.native.log || "No output was recorded. Try Test connection in Play.")}</pre><button class="btn" data-dismiss-error>Dismiss</button></aside>` : ""}
    ${state.launcher ? launcherHtml(apps) : ""}
    ${state.tray ? trayHtml() : ""}
    <nav class="shelf" aria-label="Shelf">
      <button type="button" class="shelf-btn ${state.launcher ? "on" : ""}" data-grid>${ICONS.grid}</button>
      <div class="shelf-mid">
        ${APPS.map(([id, name]) => {
          const running = state.open.includes(id);
          const on = running && !state.min.includes(id) && state.focus === id;
          return `<button type="button" class="shelf-btn ${on ? "on run" : running ? "run" : ""}" data-app="${id}" aria-label="${name}">${ICONS[id]}</button>`;
        }).join("")}
      </div>
      ${ICONS.wifi}
      ${state.profile && state.profile.pin ? `<button type="button" class="clockbtn" data-lock>Lock</button>` : ""}
      <button type="button" class="clockbtn" data-keyboard>Keys</button>
      <span class="home-hint">Super + H · Home</span>
      <button type="button" class="clockbtn ${state.tray ? "on" : ""}" data-clock>${state.clock || "—"}</button>
    </nav>`;
  bind();
}

function launcherHtml(apps) {
  return `<div class="launcher">
    <input class="search" placeholder="Search" aria-label="Search apps" value="${escapeHtml(state.query)}" data-search />
    <div class="grid">
      ${apps.map(([id, name]) => `<button type="button" class="app" data-app="${id}"><span class="glyph">${ICONS[id]}</span><span>${name}</span></button>`).join("")}
    </div>
  </div>`;
}

function trayHtml() {
  return `<div class="tray">
    <h3>${escapeHtml(state.status.hostname || "bazzpi")}</h3>
    <label class="lbl">Volume ${state.settings.volume}</label>
    <input class="slider" type="range" min="0" max="100" value="${state.settings.volume}" data-volume />
    <div class="powerrow">
      <button type="button" class="btn" data-power="sleep">Sleep</button>
      <button type="button" class="btn" data-power="restart">Restart</button>
      <button type="button" class="btn" data-power="shutdown">Shut down</button>
    </div>
  </div>`;
}

function windowFor(id) {
  const name = APPS.find((app) => app[0] === id)[1];
  const back = state.focus !== id ? " back" : "";
  return `<section class="window${back}" style="z-index:${state.focus === id ? 2 : 1}" data-focus="${id}">
    <div class="wbar"><span class="glyph">${ICONS[id]}</span><span class="wtitle">${name}</span><span class="wgrow"></span>
      <button type="button" class="iconbtn" data-max aria-label="Maximize">□</button>
      <button type="button" class="iconbtn" data-min="${id}" aria-label="Minimize">–</button>
      <button type="button" class="iconbtn" data-close="${id}" aria-label="Close">×</button>
    </div>
    <div class="wbody">${bodyFor(id)}</div>
  </section>`;
}

function bodyFor(id) {
  if (id === "play") return playBody(false);
  if (id === "desktop") return playBody(true);
  if (id === "retropie") return retroBody();
  if (["gamepass", "geforcenow", "driftguard"].includes(id)) return webAppBody(id);
  if (id === "browser") return browserBody();
  if (id === "terminal") return terminalBody();
  if (id === "files") return `<div id="files">Loading the Pi…</div>`;
  return settingsBody();
}

function playBody(desktop) {
  const s = state.settings;
  if (desktop) return `<div class="page-head"><p class="kicker">Your PC, here</p><h1 class="h1">Desktop</h1><p class="sub">${escapeHtml(s.host || "Set up your PC in Play first.")}</p></div><button class="btn primary" data-stream="desktop">Open desktop</button><p class="fine">Close the stream with Ctrl + Alt + Shift + Q.</p>`;
  return `<div class="play-layout">
    <div class="play-main">
      <div class="page-head"><p class="kicker">Local streaming</p><h1 class="h1">Ready to play?</h1><p class="sub">${escapeHtml(s.host || "Connect your Bazzite PC to get started.")}</p></div>
      <div class="stream-summary"><span>${escapeHtml(s.resolution)} · ${s.fps} fps</span><span>${Math.round(s.bitrate/1000)} Mb/s · H.264</span></div>
      <div class="cards app-cards">${state.apps.map(name => `<button class="card ${s.app === name ? "on" : ""}" data-pick="${escapeHtml(name)}"><span class="glyph">${name === "Desktop" ? ICONS.desktop : ICONS.play}</span><b>${escapeHtml(name)}</b></button>`).join("")}</div>
      <div class="row"><button class="btn primary play-now" data-stream="moonlight">Play ${escapeHtml(s.app || "Steam")}</button><button class="btn" data-apps>Refresh games</button></div>
      <p class="fine">Ctrl + Alt + Shift + Q ends the stream.</p>
      <details data-panel="picture"><summary>Picture & performance</summary>
        <div class="form-grid"><label>Resolution<select class="select" data-res><option ${s.resolution === "1080p" ? "selected" : ""}>1080p</option><option ${s.resolution === "720p" ? "selected" : ""}>720p</option></select></label>
        <label>Frame rate<select class="select" data-fps><option value="60" ${Number(s.fps) === 60 ? "selected" : ""}>60 fps</option><option value="30" ${Number(s.fps) === 30 ? "selected" : ""}>30 fps</option></select></label></div>
        <label class="lbl">Bitrate · ${Math.round(s.bitrate/1000)} Mb/s</label><input class="slider" type="range" min="5000" max="40000" step="1000" value="${s.bitrate}" data-bitrate />
        <label class="lbl">Decoder</label><select class="select" data-decoder>${["auto","hardware","software"].map(v => `<option value="${v}" ${s.decoder === v ? "selected" : ""}>${{auto:"Automatic (recommended)",hardware:"Hardware only",software:"Software (test only)"}[v]}</option>`).join("")}</select>
        <p class="fine">Keep the Pi display at 1080p. Automatic decoding does not guarantee hardware acceleration.</p>
      </details>
    </div>
    <aside class="connection-panel">
      <h2 class="h2">Your connection</h2><label class="lbl">PC address</label><input class="field" data-host value="${escapeHtml(s.host)}" placeholder="192.168.1.20" aria-label="PC address" />
      <button class="btn" data-diagnose>Test connection</button><div class="diagnostics">${diagnosticHtml()}</div>
      <details data-panel="pair" ${!s.paired ? "open" : ""}><summary>Pair this Pi</summary><p class="fine">Get a PIN, then enter it in Sunshine’s PIN page on your PC at https://localhost:47990.</p>
        <p class="pin" data-pin>${escapeHtml(state.pair.pin || "····")}</p><p class="fine" data-pair-status>${escapeHtml(pairLabel(state.pair,s.paired))}</p><button class="btn" data-pair>Get a PIN</button>
      </details>
      <details data-panel="trouble"><summary>No video / firewall error?</summary><p class="fine">This message means Moonlight received no video. It does not identify the cause. TCP checks cannot verify UDP video.</p><button class="btn" data-compatibility>Try compatibility stream</button><p class="fine">One attempt at 720p30, 5 Mb/s, H.264 and 1024-byte packets. Your normal settings stay saved.</p><button class="btn" data-moonlight>Open Moonlight</button><p class="fine">If it still fails, check Sunshine’s capture/encoder log and test another Moonlight client on the same LAN.</p></details>
    </aside>
  </div>`;
}

function diagnosticHtml() {
  const d = state.diagnostics;
  if (!d) return '<p class="fine">Check the PC address and Sunshine services before pairing.</p>';
  if (d.loading) return '<p role="status">Checking the local connection…</p>';
  return `<div class="check-grid">${d.checks.map(c => `<div class="check-result ${c.ok ? "good" : "bad"}"><b>${c.ok ? "✓" : "!"} ${escapeHtml(c.label)}</b><span>TCP ${c.port} · ${c.ok ? c.ms + " ms" : escapeHtml(c.error)}</span></div>`).join("")}</div><p class="fine">${escapeHtml(d.note)}</p>`;
}

async function testConnection() {
  const host = deskValue("[data-host]") || state.settings.host;
  if (!host) return toast("Add the PC address first.");
  state.diagnostics = { loading: true }; draw();
  try { state.diagnostics = await api("/api/moonlight/diagnose", {host}); draw(); }
  catch (error) { state.diagnostics = null; toast(error.message); }
}

function pairLabel(pair, paired) {
  if (pair.status === "waiting") return "Asking Sunshine for a PIN…";
  if (pair.status === "pin") return "Type this PIN in Sunshine and press Send. This screen updates when it connects.";
  if (pair.status === "failed") return pair.log || "Pairing failed. Check the address and that Sunshine is running.";
  if (pair.status === "paired" || paired) return "Paired with Sunshine.";
  return "Not paired yet.";
}

let pairTimer = null;

function ensurePoll() {
  if (pairTimer || !["waiting", "pin"].includes(state.pair.status)) return;
  pairTimer = setInterval(pollPair, 1000);
}

async function pollPair() {
  const host = state.settings.host;
  if (!host) return;
  try {
    const data = await api(`/api/moonlight/pair?host=${encodeURIComponent(host)}`);
    state.pair = data;
    if (data.status === "paired") {
      clearInterval(pairTimer);
      pairTimer = null;
      state.settings = { ...state.settings, paired: true };
      save("bazzpi-settings", state.settings);
      draw();
      refreshApps();
      return;
    }
    if (data.status === "failed") {
      clearInterval(pairTimer);
      pairTimer = null;
      draw();
      return;
    }
    const pin = document.querySelector("[data-pin]");
    const status = document.querySelector("[data-pair-status]");
    if (pin) pin.textContent = data.pin || "····";
    if (status) status.textContent = pairLabel(data, state.settings.paired);
  } catch (error) {
    clearInterval(pairTimer);
    pairTimer = null;
    toast(error.message);
  }
}

async function startPair() {
  const host = deskValue("[data-host]") || state.settings.host;
  if (!host) return toast("Add the PC address first.");
  state.settings = { ...state.settings, host };
  save("bazzpi-settings", state.settings);
  state.settings.paired = false;
  state.pair = { status: "waiting", pin: "", log: "" };
  draw();
  try {
    const data = await api("/api/moonlight/pair", { host });
    state.pair = data;
    ensurePoll();
    draw();
    ensurePoll();
  } catch (error) {
    state.pair = { status: "failed", pin: "", log: error.message };
    toast(error.message);
  }
}

async function refreshApps() {
  const host = deskValue("[data-host]") || state.settings.host;
  if (!host) return toast("Add the PC address first.");
  try {
    const data = await api("/api/moonlight/list", { host });
    if (data.apps && data.apps.length) {
      state.apps = data.apps;
      if (!data.apps.includes(state.settings.app)) state.settings.app = data.apps[0];
      save("bazzpi-settings", state.settings);
      draw();
    } else {
      toast("Sunshine answered, but it has no apps yet.");
    }
  } catch (error) {
    toast(error.message);
  }
}

function retroBody() {
  const list = CONSOLES.filter((item) => state.pace === "All" || item[2] === state.pace);
  const picked = CONSOLES.find((item) => item[0] === state.picked);
  return `<h1 class="h1">RetroArch</h1>
    <p class="sub">${escapeHtml(state.profile.name)}, these systems run on the Pi. PlayStation 2, GameCube, Wii, and Switch do not.</p>
    <div class="row">
      ${["All", "Full speed", "Hit or miss"].map((item) => `<button type="button" class="btn ${state.pace === item ? "primary" : ""}" data-pace="${item}">${item}</button>`).join("")}
      <button type="button" class="btn primary" data-stream="retropie">Open RetroArch</button>
    </div>
    <div class="cards">
      ${list.map((item) => `<button type="button" class="card ${state.picked === item[0] ? "on" : ""}" data-console="${item[0]}"><b>${item[0]}</b><span>${item[2]}</span></button>`).join("")}
    </div>
    ${picked ? `<div class="preview">${escapeHtml(picked[0])}\nPut games in ~/ROMs/${escapeHtml(picked[1])}\nThen open RetroArch, or click the game in Files.</div>` : `<p class="fine">Games go in ~/ROMs. Click a game in Files and it opens here.</p>`}`;
}

function webAppBody(id) {
  const apps = {
    gamepass: {name: "Game Pass", kicker: "Cloud gaming", button: "Open Xbox Cloud Gaming",
      description: "Play supported Xbox games over the internet. Sign in with your Microsoft account; subscription requirements depend on the game.",
      note: "Your Xbox sign-in is saved in its own app window. You will need to sign in once after this update."},
    geforcenow: {name: "GeForce NOW", kicker: "Cloud gaming", button: "Open GeForce NOW",
      description: "Stream supported games from your PC game libraries through NVIDIA. Sign in with your NVIDIA account to get started.",
      note: "Uses the web player on Raspberry Pi. NVIDIA’s native Linux app requires an x86/x64 PC. Pi browser compatibility and streaming performance may vary; start at 720p."},
    driftguard: {name: "DriftGuard", kicker: "Controller workshop", button: "Open DriftGuard",
      description: "Check sticks, buttons and drift on a controller connected to this Pi. Connect by USB first, then choose your controller in DriftGuard.",
      note: "Approve the browser’s device prompt if requested. Available tests and calibration depend on your controller and Linux device permissions. Testing does not automatically change PiBazz or Moonlight deadzones."},
  };
  const app = apps[id];
  return `<div class="page-head"><p class="kicker">${app.kicker}</p><h1 class="h1">${app.name}</h1><p class="sub">${app.description}</p></div>
    <button type="button" class="btn primary" data-stream="${id}">${app.button}</button>
    <p class="fine">${app.note}</p>
    <p class="fine">Opens in a dedicated app window. Close it to return, or press Super + H for Home. Initial sign-in or device selection may need a mouse and keyboard.</p>`;
}

function terminalBody() {
  return `<h1 class="h1">Terminal</h1>
    <p class="sub">Commands run on this Pi. Open terminal starts a full window for programs that need it.</p>
    <div class="term" data-term>${escapeHtml(state.termLog)}</div>
    <form class="termline" data-shell>
      <span>$</span>
      <input data-command aria-label="Command" autocomplete="off" />
    </form>
    <button type="button" class="btn" data-stream="terminal">Open terminal</button>`;
}

function wallCards() {
  const items = state.wallpapers || [];
  if (!items.length) return `<p class="fine">No pictures in Pictures or Downloads yet.</p>`;
  return items.map((item) => `<button type="button" class="deskpick ${state.settings.wallpaper === item.path ? "on" : ""}" data-wall="${escapeHtml(item.path)}">${escapeHtml(item.name)}</button>`).join("");
}

async function loadWallpapers() {
  try {
    const data = await api("/api/wallpapers");
    state.wallpapers = data.wallpapers || [];
    const box = document.querySelector("[data-walls]");
    if (!box) return;
    box.innerHTML = wallCards();
    box.querySelectorAll("[data-wall]").forEach((node) => node.addEventListener("click", () => patch({ wallpaper: node.dataset.wall })));
  } catch (error) {
    toast(error.message);
  }
}

async function uploadWallpaper(file) {
  if (!file) return;
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Could not read that picture"));
    reader.readAsDataURL(file);
  });
  try {
    const saved = await api("/api/wallpaper", { name: file.name, data });
    patch({ wallpaper: saved.path });
    state.wallsLoaded = false;
  } catch (error) {
    toast(error.message);
  }
}

async function runShell(event) {
  event.preventDefault();
  const input = document.querySelector("[data-command]");
  const command = input?.value.trim() || "";
  if (!command) return;
  if (input) input.value = "";
  state.termLog += `$ ${command}\n`;
  const box = document.querySelector("[data-term]");
  if (box) box.textContent = state.termLog;
  try {
    const data = await api("/api/shell", { command });
    state.termLog += `${data.output || ""}${data.output && data.output.endsWith("\n") ? "" : "\n"}`;
  } catch (error) {
    state.termLog += `${error.message}\n`;
  }
  if (box) {
    box.textContent = state.termLog;
    box.scrollTop = box.scrollHeight;
  }
}

function browserBody() {
  return `<h1 class="h1">Browser</h1>
    <div class="chrome"><input class="field omni" data-url value="${escapeHtml(state.url)}" /><button type="button" class="btn primary" data-stream="browser">Open</button></div>
    <p class="sub">Your browser opens with normal tabs, sign-ins, and downloads. Close it to return here, or press Super + H for Home.</p>`;
}

function settingsBody() {
  const s = state.settings;
  const nav = ["Appearance", "Moonlight", "Pi"].map((name) => `<button type="button" class="navbtn ${state.section === name ? "on" : ""}" data-section="${name}">${name}</button>`).join("");
  let pane = "";
  if (state.section === "Appearance") {
    pane = `<h1 class="h1">Appearance</h1><p class="sub">Light or dark, and the desktop behind the windows.</p>
      <div class="row">
        <button type="button" class="btn ${s.theme === "light" ? "primary" : ""}" data-theme="light">Light</button>
        <button type="button" class="btn ${s.theme === "dark" ? "primary" : ""}" data-theme="dark">Dark</button>
      </div>
      <div class="desks">
        ${DESKS.map(([id, name]) => `<button type="button" class="deskpick ${s.desktop === id && !s.wallpaper ? "on" : ""}" data-desk="${id}"><span class="swatch ${id}"></span>${name}</button>`).join("")}
      </div>
      <h2 class="h2">Your picture</h2>
      <p class="sub">A picture covers the color. Choose one already on the Pi, or add one.</p>
      <div class="desks" data-walls>${wallCards()}</div>
      <div class="row">
        <label class="btn primary">Choose a picture<input class="filepick" type="file" accept="image/*" data-upload /></label>
        ${s.wallpaper ? `<button type="button" class="btn" data-clear-wall>Use the color</button>` : ""}
      </div>`;
  } else if (state.section === "Moonlight") {
    pane = `<h1 class="h1">Moonlight</h1>
      <label class="lbl">Resolution</label>
      <select class="select" data-res><option ${s.resolution === "1080p" ? "selected" : ""}>1080p</option><option ${s.resolution === "720p" ? "selected" : ""}>720p</option></select>
      <label class="lbl">Frame rate</label>
      <select class="select" data-fps><option ${s.fps === 60 ? "selected" : ""} value="60">60</option><option ${s.fps === 30 ? "selected" : ""} value="30">30</option></select>
      <label class="lbl">Bitrate ${s.bitrate}</label>
      <input class="slider" type="range" min="2000" max="40000" step="1000" value="${s.bitrate}" data-bitrate />`;
  } else {
    const pi = state.pi;
    pane = `<div class="page-head"><p class="kicker">This device</p><h1 class="h1">Raspberry Pi</h1><p class="sub">System settings read directly from your Pi.</p></div>
      <div class="row"><button class="btn" data-refresh-pi>${state.piLoading ? "Reading…" : "Refresh settings"}</button><button class="btn" data-stream="raspi-config">Open full raspi-config</button><button class="btn" data-app="driftguard">Controller tests</button></div>
      <p class="fine">The full tool opens in a terminal and needs a keyboard. Finish closes it and returns here.</p>
      ${state.piError ? `<p class="settings-error" role="alert">${escapeHtml(state.piError)}</p>` : ""}
      ${pi ? `<div class="form-grid"><label>Hostname<input class="field" data-hostname value="${escapeHtml(pi.hostname)}" /></label><label>Wi-Fi country<input class="field" data-country value="${escapeHtml(pi.country || "")}" maxlength="2" placeholder="US" /></label></div>
      <label class="lbl">Timezone</label><input class="field" data-timezone value="${escapeHtml(pi.timezone || "")}" placeholder="America/New_York" />
      <label class="check"><input type="checkbox" data-ssh ${pi.ssh ? "checked" : ""} ${pi.ssh === null ? "disabled" : ""} /> Allow SSH access</label><p class="fine">Turning SSH off disables remote terminal access.</p>
      <label class="lbl">Audio output</label><select class="select" data-audio ${!pi.sinks.length ? "disabled" : ""}>${pi.sinks.length ? pi.sinks.map(item => `<option value="${escapeHtml(item.name)}" ${pi.audio === item.name ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("") : '<option>No outputs found</option>'}</select>
      ${!pi.sinks.length ? '<p class="fine">Rerun the Lite installer to add audio controls if needed. Check that your HDMI/audio device is connected.</p>' : ''}
      <button class="btn primary" data-apply>Apply changes</button>
      ${pi.errors.length ? `<details><summary>Some settings could not be read</summary><p class="fine">${escapeHtml(pi.errors.join(" · "))}</p></details>` : ""}` : '<p class="fine">Reading device settings…</p>'}
      <p class="fine">${updateLine(state.status.update)}</p>`;
  }
  return `<div class="settings"><div class="snav">${nav}</div><div>${pane}</div></div>`;
}

function gateCreate() {
  return `<form class="gate" data-create>
    <p class="kicker">First boot</p><h1 class="h1">Create a profile</h1>
    <p class="sub">This card starts here once. The name shows on RetroArch and Game Pass. A controller works. Press X for the keyboard.</p>
    <label class="lbl">Name</label><input class="field" name="name" autofocus />
    <label class="lbl">Code, optional</label><input class="field" name="pin" inputmode="numeric" maxlength="4" placeholder="4 digits" />
    <div class="row">
      <button type="submit" class="btn primary">Create profile</button>
      <button type="button" class="btn" data-keyboard>Keyboard</button>
    </div>
  </form>`;
}

function gateLock() {
  return `<form class="gate" data-unlock>
    <p class="kicker">Welcome back</p><h1 class="h1">${escapeHtml(state.profile.name)}</h1>
    <p class="sub">Enter the 4 digit code for this profile. Press X for the keyboard.</p>
    <input class="field" name="pin" inputmode="numeric" maxlength="4" aria-label="Code" />
    <div class="row">
      <button type="submit" class="btn primary">Unlock</button>
      <button type="button" class="btn" data-keyboard>Keyboard</button>
    </div>
  </form>`;
}

function bind() {
  const desk = document.getElementById("desk");
  desk.querySelector("[data-refresh-pi]")?.addEventListener("click", loadPi);
  desk.querySelector("[data-compatibility]")?.addEventListener("click", () => stream("moonlight", true));
  desk.querySelectorAll("details[data-panel]").forEach(node => {
    if (node.dataset.panel in state.panels) node.open = state.panels[node.dataset.panel];
    node.addEventListener("toggle", () => { state.panels[node.dataset.panel] = node.open; });
  });
  desk.querySelector("[data-dismiss-error]")?.addEventListener("click", () => { state.native.status = "idle"; draw(); });
  desk.querySelector("[data-diagnose]")?.addEventListener("click", testConnection);
  desk.querySelectorAll("[data-max]").forEach(node => node.addEventListener("click", () => node.closest(".window").classList.toggle("maximized")));
  desk.querySelector("[data-decoder]")?.addEventListener("change", event => patch({decoder: event.target.value}));
  desk.querySelector("[data-grid]")?.addEventListener("click", () => { state.launcher = !state.launcher; state.tray = false; draw(); });
  desk.querySelector("[data-clock]")?.addEventListener("click", () => { state.tray = !state.tray; state.launcher = false; draw(); });
  desk.querySelector("[data-exit]")?.addEventListener("click", () => {
    api("/api/exit", {}).catch((error) => toast(error.message));
  });
  desk.querySelector("[data-keyboard]")?.addEventListener("click", () => toggleOsk());
  if (state.osk) {
    const target = state.oskSelector ? desk.querySelector(state.oskSelector) : null;
    if (target) {
      state.oskTarget = target;
      target.value = state.oskValue ?? target.value;
      if (state.oskPosition != null) target.setSelectionRange?.(state.oskPosition, state.oskPosition);
    }
    renderOsk();
  }
  desk.classList.toggle("keyboard-open", state.osk);
  desk.querySelectorAll("input,textarea").forEach(node => node.addEventListener("focus", () => {
    if (state.pad && textField(node) && !state.osk && state.oskTarget !== node) openKeyboard(node);
  }));
  desk.querySelectorAll("[data-app]").forEach((node) => node.addEventListener("click", () => launch(node.dataset.app)));
  desk.querySelectorAll("[data-focus]").forEach((node) => node.addEventListener("mousedown", (event) => {
    if (event.target.closest("button, input, select, textarea, label")) return;
    if (state.focus !== node.dataset.focus) {
      state.focus = node.dataset.focus;
      draw();
    }
  }));
  desk.querySelectorAll("[data-min]").forEach((node) => node.addEventListener("click", (event) => { event.stopPropagation(); state.min.push(node.dataset.min); draw(); }));
  desk.querySelectorAll("[data-close]").forEach((node) => node.addEventListener("click", (event) => {
    event.stopPropagation();
    state.open = state.open.filter((id) => id !== node.dataset.close);
    draw();
  }));
  const search = desk.querySelector("[data-search]");
  if (search) {
    search.addEventListener("input", () => { state.query = search.value; draw(); desk.querySelector("[data-search]")?.focus(); });
  }
  desk.querySelector("[data-host]")?.addEventListener("change", (event) => patch({ host: event.target.value.trim(), paired: false }));
  desk.querySelector("[data-res]")?.addEventListener("change", (event) => patch({ resolution: event.target.value }));
  desk.querySelector("[data-fps]")?.addEventListener("change", (event) => patch({ fps: Number(event.target.value) }));
  desk.querySelector("[data-codec]")?.addEventListener("change", (event) => patch({ codec: event.target.value }));
  desk.querySelector("[data-bitrate]")?.addEventListener("change", (event) => patch({ bitrate: Number(event.target.value) }));
  desk.querySelector("[data-pair]")?.addEventListener("click", startPair);
  desk.querySelector("[data-apps]")?.addEventListener("click", refreshApps);
  desk.querySelector("[data-moonlight]")?.addEventListener("click", () => stream("moonlight-gui"));
  desk.querySelectorAll("[data-pick]").forEach((node) => node.addEventListener("click", () => patch({ app: node.dataset.pick })));
  desk.querySelector("[data-volume]")?.addEventListener("change", (event) => {
    patch({ volume: Number(event.target.value) });
    api("/api/volume", { volume: state.settings.volume }).catch((error) => toast(error.message));
  });
  desk.querySelectorAll("[data-power]").forEach((node) => node.addEventListener("click", () => {
    api("/api/power", { action: node.dataset.power }).catch((error) => toast(error.message));
  }));
  desk.querySelectorAll("[data-stream]").forEach((node) => node.addEventListener("click", () => stream(node.dataset.stream)));
  desk.querySelectorAll("[data-section]").forEach((node) => node.addEventListener("click", () => { state.section = node.dataset.section; draw(); if (state.section === "Pi") loadPi(); }));
  desk.querySelectorAll("[data-theme]").forEach((node) => node.addEventListener("click", () => patch({ theme: node.dataset.theme })));
  desk.querySelector("[data-shell]")?.addEventListener("submit", runShell);
  desk.querySelector("[data-upload]")?.addEventListener("change", (event) => uploadWallpaper(event.target.files?.[0]));
  desk.querySelector("[data-clear-wall]")?.addEventListener("click", () => patch({ wallpaper: "" }));
  desk.querySelectorAll("[data-desk]").forEach((node) => node.addEventListener("click", () => patch({ desktop: node.dataset.desk, wallpaper: "" })));
  desk.querySelectorAll("[data-pace]").forEach((node) => node.addEventListener("click", () => { state.pace = node.dataset.pace; draw(); }));
  desk.querySelectorAll("[data-console]").forEach((node) => node.addEventListener("click", () => { state.picked = node.dataset.console; draw(); }));
  desk.querySelector("[data-apply]")?.addEventListener("click", applySystem);
  desk.querySelector("[data-create]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = new FormData(event.target).get("name").trim();
    const pin = String(new FormData(event.target).get("pin") || "").replace(/\D/g, "");
    if (!name) return toast("Add a name.");
    if (pin && pin.length !== 4) return toast("Use a 4 digit code, or leave it empty.");
    try {
      state.token = (await api("/api/profile", { name, pin })).token || "";
    } catch (error) {
      if (!/already/i.test(error.message)) return toast(error.message);
    }
    state.profile = { name, pin: pin ? "1" : "" };
    state.unlocked = true;
    localStorage.removeItem("bazzpi-profile");
    draw();
  });
  desk.querySelector("[data-unlock]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const pin = String(new FormData(event.target).get("pin") || "");
    try {
      state.token = (await api("/api/unlock", { pin })).token || "";
    } catch (error) {
      return toast(error.message);
    }
    state.unlocked = true;
    draw();
  });
  desk.querySelector("[data-lock]")?.addEventListener("click", () => {
    if (!state.profile?.pin) return;
    api("/api/lock", {}).catch(() => {});
    state.token = "";
    state.unlocked = false;
    state.osk = false;
    draw();
  });
  if (state.focus === "files") loadFiles();
  if (state.focus === "settings" && state.section === "Appearance" && !state.wallsLoaded) {
    state.wallsLoaded = true;
    loadWallpapers();
  }
  ensurePoll();
}

async function stream(kind, compatibility = false) {
  const s = state.settings;
  const url = normalize(deskValue("[data-url]") || state.url);
  state.url = url;
  try {
    await api("/api/launch", {
      kind: kind === "moonlight-gui" ? "moonlight" : kind,
      host: kind === "moonlight-gui" ? "" : s.host,
      app: s.app, resolution: s.resolution, fps: s.fps, bitrate: s.bitrate, codec: s.codec, decoder: s.decoder, url, compatibility,
      system: (CONSOLES.find((item) => item[0] === state.picked) || [])[1] || "",
    });
    state.native = {status: "running"};
    toast(kind === "retropie" ? "Opening RetroArch" : "Opening");
  } catch (error) {
    toast(error.message);
  }
}

async function loadPi() {
  if (state.piLoading) return;
  state.piLoading = true; state.piError = "";
  try { state.pi = await api("/api/system"); }
  catch(error) { state.piError = error.message; }
  state.piLoading = false;
  if (state.focus === "settings" && state.section === "Pi") draw();
}

async function applySystem() {
  if (!state.pi) return;
  const values = {hostname: deskValue("[data-hostname]"), country: deskValue("[data-country]").toUpperCase(), timezone: deskValue("[data-timezone]"), audio: deskValue("[data-audio]")};
  const ssh = document.querySelector("[data-ssh]");
  if (ssh && !ssh.disabled) values.ssh = ssh.checked;
  const changes = Object.fromEntries(Object.entries(values).filter(([k,v]) => v !== state.pi[k] && v !== ""));
  if (!Object.keys(changes).length) return toast("No changes to apply");
  try {
    const result = await api("/api/system", changes);
    await loadPi();
    toast(result.rebootRecommended ? "Saved. Restart the Pi to finish the hostname change." : "Pi settings saved");
  } catch(error) { state.piError = error.message; draw(); }
}

function deskValue(selector) {
  return document.querySelector(selector)?.value?.trim() || "";
}

function normalize(value) {
  if (!value || value.startsWith("bazzpi://")) return "https://www.google.com";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.includes(".")) return `https://${value}`;
  return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
}

async function loadFiles() {
  const box = document.getElementById("files");
  if (!box) return;
  try {
    const data = await api(`/api/files?path=${encodeURIComponent(state.filePath)}`);
    const crumbs = state.filePath ? state.filePath.split("/") : [];
    box.innerHTML = `<h1 class="h1">Files</h1><p class="sub">The home folder on this Pi. A game file opens in RetroArch.</p>
      <div class="crumbs"><button type="button" class="btn" data-up="">Home</button>${crumbs.map((part, index) => `<button type="button" class="btn" data-up="${escapeHtml(crumbs.slice(0, index + 1).join("/"))}">${escapeHtml(part)}</button>`).join("")}</div>
      <div class="filelist">
        ${data.entries.map((entry) => `<button type="button" class="file" data-entry="${escapeHtml(entry.name)}" data-kind="${entry.kind}">${entry.kind === "dir" ? "Folder" : "File"} · ${escapeHtml(entry.name)}</button>`).join("") || "<p class='sub'>This folder is empty.</p>"}
      </div>
      ${state.fileText ? `<div class="preview">${escapeHtml(state.fileText)}</div>` : ""}`;
    box.querySelectorAll("[data-up]").forEach((node) => node.addEventListener("click", () => { state.filePath = node.dataset.up; state.fileText = ""; loadFiles(); }));
    box.querySelectorAll("[data-entry]").forEach((node) => node.addEventListener("click", async () => {
      const next = state.filePath ? `${state.filePath}/${node.dataset.entry}` : node.dataset.entry;
      if (node.dataset.kind === "dir") {
        state.filePath = next;
        state.fileText = "";
        loadFiles();
      } else if (/\.(nes|sfc|smc|gb|gbc|gba|md|gen|sms|gg|cue|chd|pce|zip|n64|z64|v64|nds|cdi|gdi|32x|iso|bin)$/i.test(node.dataset.entry)) {
        await api("/api/launch", { kind: "rom", path: next });
        toast("Opening in RetroArch");
      } else {
        const file = await api(`/api/file?path=${encodeURIComponent(next)}`);
        state.fileText = file.text || "";
        loadFiles();
      }
    }));
  } catch (error) {
    box.textContent = error.message;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;")
    .replace(/'/g, "\u0026#39;");
}

function tick() {
  state.clock = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const node = document.querySelector("[data-clock]");
  if (node) node.textContent = state.clock;
}

function updateLine(status) {
  if (status === "updated") return "Updated from GitHub on this boot.";
  if (status === "current") return "Checked for updates on boot. Already current.";
  if (status === "rollback") return "Restored the previous version after an update failed to start.";
  if (status === "failed") return "Update failed; keeping the installed version.";
  if (status === "disabled") return "Automatic updates are paused.";
  if (status === "offline") return "Could not check for updates on boot.";
  return "Updates are checked on boot.";
}

async function loadDeviceAuth() {
  try {
    const data = await api("/api/profile");
    if (data.name) {
      state.profile = { name: data.name, pin: data.hasPin ? "1" : "" };
      state.unlocked = !data.hasPin;
    } else {
      const old = load("bazzpi-profile", null);
      if (old && old.name && old.pin !== "1") {
        const pin = /^\d{4}$/.test(String(old.pin || "")) ? String(old.pin) : "";
        await api("/api/profile", { name: old.name, pin });
        state.profile = { name: old.name, pin: pin ? "1" : "" };
        state.unlocked = !pin;
      } else {
        state.profile = null;
      }
      localStorage.removeItem("bazzpi-profile");
    }
  } catch {
    const old = load("bazzpi-profile", null);
    state.profile = old;
    state.unlocked = !(old && old.pin);
  }
  state.authReady = true;
  draw();
}

fetch("/api/status").then((response) => response.json()).then((data) => {
  state.status = data;
  if (data.update === "updated") toast("Shelf updated");
}).catch(() => {});

function textField(el) {
  return !!el && el.matches && el.matches("input, textarea") && !el.matches("[type=range], [type=checkbox], [type=file], [type=button], [type=submit]");
}

function fieldSelector(node) {
  for (const attr of ["name", "data-host", "data-url", "data-search", "data-hostname", "data-country", "data-timezone", "data-command"]) {
    if (node.hasAttribute(attr)) return `[${attr}="${node.getAttribute(attr)}"]`;
  }
  return "";
}

function openKeyboard(target) {
  if (!textField(target)) return;
  state.oskTarget = target;
  state.oskSelector = fieldSelector(target);
  state.oskMode = target.inputMode === "numeric" ? "123" : "abc";
  target.focus({preventScroll:true});
  setOsk(true);
  target.scrollIntoView({block:"nearest"});
}

function toggleOsk() {
  if (state.osk) {
    setOsk(false);
    return;
  }
  const active = document.activeElement;
  const highlighted = document.querySelector(".gpfocus");
  openKeyboard(textField(active) ? active : textField(highlighted) ? highlighted : gpItems().find(textField));
}

function setOsk(open) {
  state.osk = open;
  document.getElementById("desk").classList.toggle("keyboard-open", open);
  if (!open) {
    document.querySelector(".osk")?.remove();
    state.oskTarget?.dispatchEvent(new Event("change", {bubbles:true}));
    return;
  }
  renderOsk();
}

function oskHtml() {
  const rows = state.oskMode === "123" ? ["1234567890", "-/:@()$&", ".,?!'"] : ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  const show = (ch) => (state.oskShift && state.oskMode === "abc" ? ch.toUpperCase() : ch);
  const keys = rows.map((row, index) => {
    const letters = [...row].map((ch) => `<button type="button" class="oskkey" data-key="${ch}">${show(ch)}</button>`).join("");
    const body = index === 2
      ? `<button type="button" class="oskkey wide" data-key="shift">${state.oskShift ? "ABC" : "Shift"}</button>${letters}<button type="button" class="oskkey wide" data-key="back">Delete</button>`
      : letters;
    return `<div class="oskrow">${body}</div>`;
  }).join("");
  return `<div class="osk" role="group" aria-label="Keyboard"><div class="osk-heading"><b>Keyboard</b><span>A Select · B Done · X Hide</span></div>${keys}
    <div class="oskrow">
      <button type="button" class="oskkey wide" data-key="mode">${state.oskMode === "abc" ? "123" : "ABC"}</button>
      <button type="button" class="oskkey wide" data-key="space">Space</button>
      <button type="button" class="oskkey wide" data-key="done">Done</button>
    </div>
  </div>`;
}

function renderOsk() {
  const html = oskHtml();
  const existing = document.querySelector(".osk");
  if (existing) existing.outerHTML = html;
  else document.getElementById("desk").insertAdjacentHTML("beforeend", html);
  document.querySelectorAll(".osk [data-key]").forEach((node) => node.addEventListener("click", () => pressKey(node.dataset.key)));
}

function pressKey(key) {
  if (key === "shift") {
    state.oskShift = !state.oskShift;
    renderOsk();
    return;
  }
  if (key === "mode") {
    state.oskMode = state.oskMode === "abc" ? "123" : "abc";
    state.oskShift = false;
    renderOsk();
    return;
  }
  if (key === "done") {
    const target = state.oskTarget;
    setOsk(false);
    target?.focus({preventScroll:true});
    return;
  }
  typeInto(key === "space" ? " " : key);
}

function typeInto(key) {
  const el = state.oskTarget;
  if (!textField(el) || !document.contains(el)) return;
  const value = el.value || "";
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? start;
  let text = key === "back" ? "" : key;
  if (text && state.oskShift && state.oskMode === "abc" && text.length === 1) text = text.toUpperCase();
  if (key === "back") {
    const from = start === end ? Math.max(0, start - 1) : start;
    el.value = value.slice(0, from) + value.slice(end);
    el.selectionStart = el.selectionEnd = from;
  } else {
    if (el.inputMode === "numeric" && !/^\d+$/.test(text)) return;
    if (el.maxLength >= 0 && value.length - (end-start) + text.length > el.maxLength) return;
    el.value = value.slice(0, start) + text + value.slice(end);
    const next = start + text.length;
    el.selectionStart = el.selectionEnd = next;
  }
  if (state.oskShift && key !== "back") {
    state.oskShift = false;
    renderOsk();
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function gpItems() {
  return [...document.querySelectorAll(state.osk ? ".osk button" : "#desk button, #desk input, #desk select, #desk textarea, #desk summary")].filter((el) => {
    const box = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(innerWidth-1, box.left + box.width/2));
    const y = Math.max(0, Math.min(innerHeight-1, box.top + box.height/2));
    const top = document.elementFromPoint(x,y);
    return box.width > 2 && box.height > 2 && !el.disabled && (top === el || el.contains(top));
  });
}

function setGp(el) {
  document.querySelectorAll(".gpfocus").forEach((node) => node.classList.remove("gpfocus"));
  if (!el) return;
  el.classList.add("gpfocus");
  el.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function moveGp(dx, dy) {
  const current = document.querySelector(".gpfocus");
  if (current?.matches("select") && dx) {
    changeSelect(current, dx); return;
  }
  if (current?.matches("input[type=range]") && dx) {
    const step = Number(current.step) || 1;
    const next = Math.min(Number(current.max || 100), Math.max(Number(current.min || 0), Number(current.value) + dx * step));
    current.value = String(next);
    current.dispatchEvent(new Event("input", { bubbles: true }));
    current.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  const items = gpItems();
  if (!items.length) return;
  const from = items.includes(current) ? current : items[0];
  if (!current) {
    setGp(from);
    return;
  }
  const box = from.getBoundingClientRect();
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  let best = null;
  let score = Infinity;
  for (const el of items) {
    if (el === from) continue;
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2 - cx;
    const y = rect.top + rect.height / 2 - cy;
    if (dx && (Math.sign(x) !== dx || Math.abs(x) < 10)) continue;
    if (dy && (Math.sign(y) !== dy || Math.abs(y) < 10)) continue;
    const primary = dx ? Math.abs(x) : Math.abs(y);
    const secondary = dx ? Math.abs(y) : Math.abs(x);
    const next = primary + secondary * 3;
    if (next < score) {
      score = next;
      best = el;
    }
  }
  if (best) setGp(best);
}

function changeSelect(node, direction) {
  const choices = [...node.options].filter(option => !option.disabled);
  if (!choices.length) return;
  const index = choices.indexOf(node.selectedOptions[0]);
  node.value = choices[(index + direction + choices.length) % choices.length].value;
  node.dispatchEvent(new Event("change", {bubbles:true}));
}

function activateGp(target = null) {
  const node = target || document.querySelector(".gpfocus") || gpItems()[0];
  if (!node || node.disabled) return;
  setGp(node);
  if (textField(node)) {
    openKeyboard(node);
    if (state.padMode === "focus") setGp(document.querySelector(".osk [data-key]"));
    return;
  }
  if (node.matches("select")) { changeSelect(node, 1); return; }
  if (node.matches("input[type=range]") && state.padMode === "cursor") {
    const rect = node.getBoundingClientRect();
    const min = Number(node.min || 0), max = Number(node.max || 100), step = Number(node.step || 1);
    const fraction = Math.max(0,Math.min(1,(padPointer.x-rect.left)/rect.width));
    node.value = String(Math.min(max,min + Math.round(fraction*(max-min)/step)*step));
    node.dispatchEvent(new Event("change", {bubbles:true}));
    return;
  }
  node.click();
}

function backGp() {
  if (state.osk) {
    setOsk(false);
    return;
  }
  if (state.launcher) { state.launcher = false; draw(); return; }
  const win = document.querySelector(".window:not(.back)");
  win?.querySelector("[data-close]")?.click();
}

const gpHeld = { dir: "", next: 0 };
const padPointer = {x: 300, y: 220, time: 0, visible: false};
function deadzone(value, zone = 0.18) {
  return Math.abs(value) <= zone ? 0 : Math.sign(value) * (Math.abs(value)-zone)/(1-zone);
}
function pointerTarget() {
  return document.elementFromPoint(padPointer.x,padPointer.y)?.closest("button,input,select,textarea,summary");
}
function showPadPointer(show) {
  let node = document.getElementById("pad-cursor");
  if (!node && show) {
    node = document.createElement("div"); node.id = "pad-cursor";
    node.setAttribute("aria-hidden","true"); document.body.appendChild(node);
  }
  if (node) { node.hidden = !show; node.style.transform = `translate(${padPointer.x}px,${padPointer.y}px)`; }
  padPointer.visible = show;
}
function scrollPad(amount) {
  const under = document.elementFromPoint(padPointer.x,padPointer.y);
  let container = under;
  while (container && container !== document.body) {
    if (container.scrollHeight > container.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(container).overflowY)) {
      container.scrollTop += amount; return;
    }
    container = container.parentElement;
  }
  const body = document.querySelector(".window:not(.back) .wbody");
  if (body) body.scrollTop += amount;
}
function pollPad(now = 0) {
  const pad = [...(navigator.getGamepads?.() || [])].find(Boolean);
  const active = !!pad && document.hasFocus() && state.native.status !== "running";
  const delta = Math.min(40, Math.max(0, now-padPointer.time))/1000;
  padPointer.time = now;
  if (!active) {
    state.padReady = false; state.pad = false; gpHeld.dir = ""; showPadPointer(false);
    requestAnimationFrame(pollPad); return;
  }
  state.pad = true;
  if (!state.padReady) {
    state.padButtons = pad.buttons.map(b=>b.pressed); state.padReady = true;
  } else {
    const x = deadzone(pad.axes[0] || 0), y = deadzone(pad.axes[1] || 0);
    if (x || y) {
      state.padMode = "cursor";
      padPointer.x = Math.max(2, Math.min(innerWidth-3, padPointer.x + Math.sign(x)*x*x*950*delta));
      padPointer.y = Math.max(2, Math.min(innerHeight-3, padPointer.y + Math.sign(y)*y*y*950*delta));
      const target = pointerTarget();
      document.querySelectorAll(".gpfocus").forEach(n=>n.classList.remove("gpfocus"));
      target?.classList.add("gpfocus");
    }
    const scroll = deadzone(pad.axes[3] || 0, 0.25);
    if (scroll) scrollPad(scroll*800*delta);
    const dirs = [["left",14,-1,0],["right",15,1,0],["up",12,0,-1],["down",13,0,1]];
    const dir = dirs.find(item=>pad.buttons[item[1]]?.pressed);
    if (!dir) gpHeld.dir = "";
    else if (gpHeld.dir !== dir[0] || now >= gpHeld.next) {
      state.padMode = "focus"; moveGp(dir[2],dir[3]);
      gpHeld.next = now+(gpHeld.dir === dir[0] ? 170 : 360); gpHeld.dir = dir[0];
    }
    pad.buttons.forEach((button,index)=>{
      if (button.pressed && !state.padButtons[index]) {
        if (index === 0) {
          if (state.padMode === "cursor") { const target=pointerTarget(); if (target) activateGp(target); }
          else activateGp();
        }
        if (index === 1) backGp();
        if (index === 2) toggleOsk();
        if (index === 9) document.querySelector("[data-grid]")?.click();
      }
      state.padButtons[index]=button.pressed;
    });
  }
  showPadPointer(state.padMode === "cursor");
  requestAnimationFrame(pollPad);
}

loadDeviceAuth();
tick();
setInterval(tick, 10000);
requestAnimationFrame(pollPad);

// Poll only after local profile access; never redraw while someone is typing.
setInterval(async () => {
  if (!state.profile || (state.profile.pin && !state.unlocked)) return;
  try {
    const native = await api("/api/launch-status");
    if (state.native.status === "running" && native.status !== "running") {
      state.native = native;
      if (native.status === "failed") draw();
      else toast("Welcome back");
    }
  } catch (_) { /* Backend restarting: next poll retries. */ }
}, 1500);
