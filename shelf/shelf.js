const APPS = [
  ["play", "Play"],
  ["desktop", "Desktop"],
  ["retropie", "RetroArch"],
  ["gamepass", "Game Pass"],
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
  browser: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  files: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12 15h5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/></svg>',
  wifi: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>',
};

const defaults = {
  host: "", app: "Steam", resolution: "1080p", fps: 60, bitrate: 20000, codec: "H.264",
  theme: "light", desktop: "paper", hostname: "bazzpi", country: "US",
  timezone: "America/New_York", ssh: true, volume: 70, paired: false, wallpaper: "",
};

const state = {
  settings: load("bazzpi-settings", defaults),
  profile: load("bazzpi-profile", null),
  open: [],
  focus: null,
  min: [],
  launcher: true,
  tray: false,
  query: "",
  section: "Appearance",
  notice: "",
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
  state.settings = { ...state.settings, ...next };
  save("bazzpi-settings", state.settings);
  draw();
}

async function api(path, body) {
  const response = await fetch(path, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
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
  const desk = document.getElementById("desk");
  const theme = state.settings.theme === "dark" ? "dark" : "";
  desk.className = `desk ${theme} desk-${state.settings.desktop}`;
  const who = state.profile && state.profile.name;
  if (!who) {
    desk.innerHTML = gateCreate();
    bind();
    return;
  }
  if (state.profile.pin && !state.unlocked) {
    desk.innerHTML = gateLock();
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
    <div class="stage">${windows}</div>
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
      <button type="button" class="clockbtn" data-keyboard>Keys</button>
      <button type="button" class="clockbtn" data-exit>Exit</button>
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
  return `<section class="window${back}" data-focus="${id}">
    <div class="wbar"><span class="glyph">${ICONS[id]}</span><span class="wtitle">${name}</span><span class="wgrow"></span>
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
  if (id === "gamepass") return gameBody();
  if (id === "browser") return browserBody();
  if (id === "terminal") return terminalBody();
  if (id === "files") return `<div id="files">Loading the Pi…</div>`;
  return settingsBody();
}

function playBody(desktop) {
  const s = state.settings;
  const host = s.host || "the-pc";
  const apps = state.apps.length ? state.apps : ["Steam", "Desktop"];
  if (desktop) {
    return `<h1 class="h1">Desktop</h1>
      <p class="sub">Opens the Bazzite desktop through the Moonlight pairing. Set the host up in Play first.</p>
      <p class="fine">${s.paired ? "Paired" : "Not paired yet"} · ${escapeHtml(s.host || "No address")} · ${escapeHtml(s.resolution)} ${s.fps} fps</p>
      <button type="button" class="btn primary" data-stream="desktop">Open the PC</button>
      <p class="fine">If the picture is blank, on the Bazzite PC open the Steam power menu and choose Switch to Desktop. Quit with Ctrl+Alt+Shift+Q.</p>`;
  }
  return `<h1 class="h1">Moonlight</h1>
    <p class="sub">Pair this Pi with Sunshine on the Bazzite PC. You only do this once.</p>
    <h2 class="h2">1. Sunshine host</h2>
    <label class="lbl">PC address</label>
    <input class="field" data-host value="${escapeHtml(s.host)}" placeholder="192.168.1.20" />
    <p class="fine">The PC and the Pi have to be on the same network. On the PC, Sunshine’s page is https://${escapeHtml(host)}:47990. The browser warning about the certificate is normal.</p>
    <h2 class="h2">2. Pair</h2>
    <ol class="steps">
      <li>Sunshine has to be running on the PC. On Bazzite it starts with the desktop.</li>
      <li>Press Get a PIN. If a Moonlight window opens, the PIN is on that window too.</li>
      <li>On the PC, open https://${escapeHtml(host)}:47990, sign in, and open the PIN tab.</li>
      <li>Type the 4 digits, name the device bazzpi, and press Send.</li>
    </ol>
    <p class="pin" data-pin>${escapeHtml(state.pair.pin || "····")}</p>
    <p class="fine" data-pair-status>${escapeHtml(pairLabel(state.pair, s.paired))}</p>
    <div class="row">
      <button type="button" class="btn primary" data-pair>Get a PIN</button>
      <button type="button" class="btn" data-moonlight>Open Moonlight</button>
    </div>
    <h2 class="h2">3. What to stream</h2>
    <div class="row">
      <button type="button" class="btn" data-apps>Refresh apps from the PC</button>
    </div>
    <div class="cards">
      ${apps.map((name) => `<button type="button" class="card ${s.app === name ? "on" : ""}" data-pick="${escapeHtml(name)}"><b>${escapeHtml(name)}</b><span>${name === "Desktop" ? "The whole PC" : "On the PC"}</span></button>`).join("")}
    </div>
    <p class="fine">Desktop is the normal computer. Steam is Game Mode. If Desktop is a blank screen, switch the PC to Desktop Mode once from the Steam power menu.</p>
    <h2 class="h2">4. Picture</h2>
    <label class="lbl">Resolution</label>
    <select class="select" data-res><option ${s.resolution === "1080p" ? "selected" : ""}>1080p</option><option ${s.resolution === "720p" ? "selected" : ""}>720p</option></select>
    <label class="lbl">Frame rate</label>
    <select class="select" data-fps><option ${Number(s.fps) === 60 ? "selected" : ""} value="60">60</option><option ${Number(s.fps) === 30 ? "selected" : ""} value="30">30</option></select>
    <label class="lbl">Codec</label>
    <select class="select" data-codec><option ${s.codec !== "HEVC" ? "selected" : ""}>H.264</option><option ${s.codec === "HEVC" ? "selected" : ""}>HEVC</option></select>
    <label class="lbl">Bitrate ${Math.round(s.bitrate / 1000)} Mb/s</label>
    <input class="slider" type="range" min="5000" max="50000" step="1000" value="${s.bitrate}" data-bitrate />
    <p class="fine">Keep H.264 on a Pi 4. 1080p60 is right on Ethernet. Drop to 720p or 30 if the picture stutters on Wi-Fi.</p>
    <button type="button" class="btn primary" data-stream="moonlight">Play ${escapeHtml(s.app || "Steam")}</button>`;
}

function pairLabel(pair, paired) {
  if (pair.status === "waiting") return "Asking Sunshine for a PIN…";
  if (pair.status === "pin") return "Type this PIN in Sunshine and press Send. This screen updates when it connects.";
  if (pair.status === "paired" || paired) return "Paired with Sunshine.";
  if (pair.status === "failed") return pair.log || "Pairing failed. Check the address and that Sunshine is running.";
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

function gameBody() {
  return `<h1 class="h1">Game Pass</h1>
    <p class="sub">${escapeHtml(state.profile.name)}, this opens Xbox Cloud Gaming in Chromium. It needs Game Pass Ultimate. The Pi streams the picture. It does not install the games.</p>
    <button type="button" class="btn primary" data-stream="gamepass">Open Xbox Cloud Gaming</button>
    <p class="fine">xbox.com/play</p>`;
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
    <p class="sub">Opens Chromium on this Pi, outside the shelf, so a page can sign in.</p>`;
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
      <input class="slider" type="range" min="2000" max="60000" step="1000" value="${s.bitrate}" data-bitrate />`;
  } else {
    pane = `<h1 class="h1">Pi</h1><p class="sub">These change the machine, the same jobs as raspi-config.</p>
      <label class="lbl">Hostname</label><input class="field" data-hostname value="${escapeHtml(s.hostname)}" />
      <label class="lbl">Wi-Fi country</label><input class="field" data-country value="${escapeHtml(s.country)}" maxlength="2" />
      <label class="lbl">Timezone</label><input class="field" data-timezone value="${escapeHtml(s.timezone)}" />
      <label class="check"><input type="checkbox" data-ssh ${s.ssh ? "checked" : ""} /> SSH</label>
      <button type="button" class="btn primary" data-apply>Apply</button>
      <p class="fine">${state.status.moonlight ? "Moonlight is installed." : "Moonlight is not installed yet."} ${state.status.retropie ? "RetroArch is installed." : "RetroArch is not installed yet."} ${updateLine(state.status.update)}</p>`;
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
  desk.querySelector("[data-grid]")?.addEventListener("click", () => { state.launcher = !state.launcher; state.tray = false; draw(); });
  desk.querySelector("[data-clock]")?.addEventListener("click", () => { state.tray = !state.tray; state.launcher = false; draw(); });
  desk.querySelector("[data-exit]")?.addEventListener("click", () => {
    api("/api/exit", {}).catch((error) => toast(error.message));
  });
  desk.querySelector("[data-keyboard]")?.addEventListener("click", () => toggleOsk());
  if (state.osk) renderOsk();
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
  desk.querySelector("[data-host]")?.addEventListener("change", (event) => patch({ host: event.target.value.trim() }));
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
  desk.querySelectorAll("[data-section]").forEach((node) => node.addEventListener("click", () => { state.section = node.dataset.section; draw(); }));
  desk.querySelectorAll("[data-theme]").forEach((node) => node.addEventListener("click", () => patch({ theme: node.dataset.theme })));
  desk.querySelector("[data-shell]")?.addEventListener("submit", runShell);
  desk.querySelector("[data-upload]")?.addEventListener("change", (event) => uploadWallpaper(event.target.files?.[0]));
  desk.querySelector("[data-clear-wall]")?.addEventListener("click", () => patch({ wallpaper: "" }));
  desk.querySelectorAll("[data-desk]").forEach((node) => node.addEventListener("click", () => patch({ desktop: node.dataset.desk, wallpaper: "" })));
  desk.querySelectorAll("[data-pace]").forEach((node) => node.addEventListener("click", () => { state.pace = node.dataset.pace; draw(); }));
  desk.querySelectorAll("[data-console]").forEach((node) => node.addEventListener("click", () => { state.picked = node.dataset.console; draw(); }));
  desk.querySelector("[data-apply]")?.addEventListener("click", applySystem);
  desk.querySelector("[data-create]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = new FormData(event.target).get("name").trim();
    const pin = String(new FormData(event.target).get("pin") || "").replace(/\D/g, "");
    if (!name) return toast("Add a name.");
    if (pin && pin.length !== 4) return toast("Use a 4 digit code, or leave it empty.");
    state.profile = { name, pin };
    state.unlocked = true;
    save("bazzpi-profile", state.profile);
    draw();
  });
  desk.querySelector("[data-unlock]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const pin = String(new FormData(event.target).get("pin") || "");
    if (pin !== state.profile.pin) return toast("That code does not match.");
    state.unlocked = true;
    draw();
  });
  if (state.focus === "files") loadFiles();
  if (state.focus === "settings" && state.section === "Appearance" && !state.wallsLoaded) {
    state.wallsLoaded = true;
    loadWallpapers();
  }
  ensurePoll();
}

async function stream(kind) {
  const s = state.settings;
  const url = normalize(deskValue("[data-url]") || state.url);
  state.url = url;
  try {
    await api("/api/launch", {
      kind: kind === "moonlight-gui" ? "moonlight" : kind,
      host: kind === "moonlight-gui" ? "" : s.host,
      app: s.app, resolution: s.resolution, fps: s.fps, bitrate: s.bitrate, codec: s.codec, url,
      system: (CONSOLES.find((item) => item[0] === state.picked) || [])[1] || "",
    });
    toast(kind === "retropie" ? "Opening RetroArch" : "Opening");
  } catch (error) {
    toast(error.message);
  }
}

async function applySystem() {
  const next = {
    hostname: deskValue("[data-hostname]"),
    country: deskValue("[data-country]"),
    timezone: deskValue("[data-timezone]"),
    ssh: document.querySelector("[data-ssh]")?.checked || false,
  };
  patch(next);
  try {
    await api("/api/system", next);
    toast("Pi settings saved");
  } catch (error) {
    toast(error.message);
  }
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
  if (status === "offline") return "Could not check for updates on boot.";
  return "Updates are checked on boot.";
}

fetch("/api/status").then((response) => response.json()).then((data) => {
  state.status = data;
  if (data.update === "updated") toast("Shelf updated");
}).catch(() => {});

function textField(el) {
  return !!el && el.matches && el.matches("input, textarea") && !el.matches("[type=range], [type=checkbox], [type=file], [type=button], [type=submit]");
}

function toggleOsk() {
  if (state.osk) {
    setOsk(false);
    return;
  }
  const active = document.activeElement;
  state.oskTarget = textField(active) ? active : document.querySelector("input, textarea");
  setOsk(true);
}

function setOsk(open) {
  state.osk = open;
  if (!open) {
    document.querySelector(".osk")?.remove();
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
  return `<div class="osk" role="group" aria-label="Keyboard">${keys}
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
    target?.dispatchEvent(new Event("change", { bubbles: true }));
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
  return [...document.querySelectorAll("#desk button, #desk input, #desk select, #desk textarea")].filter((el) => {
    const box = el.getBoundingClientRect();
    return box.width > 2 && box.height > 2 && !el.disabled;
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

function activateGp() {
  const el = document.querySelector(".gpfocus") || gpItems()[0];
  if (!el) return;
  setGp(el);
  if (textField(el)) {
    el.focus();
    state.oskTarget = el;
    setOsk(true);
    const key = document.querySelector(".osk [data-key]");
    if (key) setGp(key);
    return;
  }
  el.click();
}

function backGp() {
  if (state.osk) {
    setOsk(false);
    return;
  }
  const win = document.querySelector(".gpfocus")?.closest(".window");
  win?.querySelector("[data-close]")?.click();
}

const gpHeld = { dir: "", next: 0 };
function pollPad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = [...pads].find(Boolean);
  if (pad) {
    state.pad = true;
    if (!state.padReady) {
      state.padButtons = pad.buttons.map((button) => button.pressed);
      state.padReady = true;
    } else {
      const now = performance.now();
      const dirs = [
        ["left", pad.axes[0] < -0.45 || pad.buttons[14]?.pressed, -1, 0],
        ["right", pad.axes[0] > 0.45 || pad.buttons[15]?.pressed, 1, 0],
        ["up", pad.axes[1] < -0.45 || pad.buttons[12]?.pressed, 0, -1],
        ["down", pad.axes[1] > 0.45 || pad.buttons[13]?.pressed, 0, 1],
      ];
      const dir = dirs.find((item) => item[1]);
      if (!dir) gpHeld.dir = "";
      else if (gpHeld.dir !== dir[0] || now >= gpHeld.next) {
        moveGp(dir[2], dir[3]);
        gpHeld.next = now + (gpHeld.dir === dir[0] ? 150 : 340);
        gpHeld.dir = dir[0];
      }
      pad.buttons.forEach((button, index) => {
        const down = button.pressed;
        if (down && !state.padButtons[index]) {
          if (index === 0) activateGp();
          if (index === 1) backGp();
          if (index === 2) toggleOsk();
          if (index === 9) document.querySelector("[data-grid]")?.click();
        }
        state.padButtons[index] = down;
      });
    }
  }
  requestAnimationFrame(pollPad);
}

draw();
tick();
setInterval(tick, 10000);
requestAnimationFrame(pollPad);
