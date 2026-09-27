const APPS = [
  ["play", "Play"],
  ["desktop", "Desktop"],
  ["retropie", "RetroPie"],
  ["gamepass", "Game Pass"],
  ["browser", "Browser"],
  ["files", "Files"],
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
  settings: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/></svg>',
  wifi: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>',
};

const defaults = {
  host: "", app: "Steam", resolution: "1080p", fps: 60, bitrate: 20000,
  theme: "light", desktop: "paper", hostname: "bazzpi", country: "US",
  timezone: "America/New_York", ssh: true, volume: 70,
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
  desk.innerHTML = `
    <div class="wallpaper"></div>
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
  if (id === "files") return `<div id="files">Loading the Pi…</div>`;
  return settingsBody();
}

function playBody(desktop) {
  const s = state.settings;
  return `<h1 class="h1">${desktop ? "Desktop" : "Play"}</h1>
    <p class="sub">${desktop ? "Opens the Bazzite desktop through Moonlight, like a remote PC." : "Opens Moonlight and streams a game from the Bazzite PC."}</p>
    <label class="lbl">PC address</label>
    <input class="field" data-host value="${escapeHtml(s.host)}" placeholder="192.168.1.20" />
    ${desktop ? "" : `<label class="lbl">App on the PC</label>
      <select class="select" data-game>${["Steam", "Desktop", "Heroic"].map((name) => `<option ${s.app === name ? "selected" : ""}>${name}</option>`).join("")}</select>`}
    <div class="row">
      <button type="button" class="btn primary" data-stream="${desktop ? "desktop" : "moonlight"}">Open ${desktop ? "the PC" : "Moonlight"}</button>
    </div>
    <p class="fine">Quit a stream with Ctrl+Alt+Shift+Q. The shelf is still here when you come back.</p>`;
}

function retroBody() {
  const list = CONSOLES.filter((item) => state.pace === "All" || item[2] === state.pace);
  return `<h1 class="h1">RetroPie</h1>
    <p class="sub">${escapeHtml(state.profile.name)}, these systems run on the Pi. PlayStation 2, GameCube, Wii, and Switch do not.</p>
    <div class="row">
      ${["All", "Full speed", "Hit or miss"].map((item) => `<button type="button" class="btn ${state.pace === item ? "primary" : ""}" data-pace="${item}">${item}</button>`).join("")}
      <button type="button" class="btn primary" data-stream="retropie">Open RetroPie</button>
    </div>
    <div class="cards">
      ${list.map((item) => `<button type="button" class="card" data-console="${item[0]}"><b>${item[0]}</b><span>${item[2]}</span></button>`).join("")}
    </div>
    ${state.picked ? `<div class="preview">${escapeHtml(state.picked)}\nFolder ~/RetroPie/roms/${escapeHtml((CONSOLES.find((item) => item[0] === state.picked) || ["", ""])[1])}\nNo games are included. Put your own files in that folder.</div>` : ""}`;
}

function gameBody() {
  return `<h1 class="h1">Game Pass</h1>
    <p class="sub">${escapeHtml(state.profile.name)}, this opens Xbox Cloud Gaming in Chromium. It needs Game Pass Ultimate. The Pi streams the picture. It does not install the games.</p>
    <button type="button" class="btn primary" data-stream="gamepass">Open Xbox Cloud Gaming</button>
    <p class="fine">xbox.com/play</p>`;
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
        ${DESKS.map(([id, name]) => `<button type="button" class="deskpick ${s.desktop === id ? "on" : ""}" data-desk="${id}"><span class="swatch ${id}"></span>${name}</button>`).join("")}
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
      <p class="fine">${state.status.moonlight ? "Moonlight is installed." : "Moonlight is still installing. Leave the Pi online."} ${state.status.retropie ? "RetroPie is installed." : "RetroPie is not installed yet."}</p>`;
  }
  return `<div class="settings"><div class="snav">${nav}</div><div>${pane}</div></div>`;
}

function gateCreate() {
  return `<form class="gate" data-create>
    <p class="kicker">First boot</p><h1 class="h1">Create a profile</h1>
    <p class="sub">This card starts here once. The name shows on RetroPie and Game Pass.</p>
    <label class="lbl">Name</label><input class="field" name="name" autofocus />
    <label class="lbl">Code, optional</label><input class="field" name="pin" inputmode="numeric" maxlength="4" placeholder="4 digits" />
    <button type="submit" class="btn primary">Create profile</button>
  </form>`;
}

function gateLock() {
  return `<form class="gate" data-unlock>
    <p class="kicker">Welcome back</p><h1 class="h1">${escapeHtml(state.profile.name)}</h1>
    <p class="sub">Enter the 4 digit code for this profile.</p>
    <input class="field" name="pin" inputmode="numeric" maxlength="4" aria-label="Code" />
    <button type="submit" class="btn primary">Unlock</button>
  </form>`;
}

function bind() {
  const desk = document.getElementById("desk");
  desk.querySelector("[data-grid]")?.addEventListener("click", () => { state.launcher = !state.launcher; state.tray = false; draw(); });
  desk.querySelector("[data-clock]")?.addEventListener("click", () => { state.tray = !state.tray; state.launcher = false; draw(); });
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
  desk.querySelector("[data-game]")?.addEventListener("change", (event) => patch({ app: event.target.value }));
  desk.querySelector("[data-res]")?.addEventListener("change", (event) => patch({ resolution: event.target.value }));
  desk.querySelector("[data-fps]")?.addEventListener("change", (event) => patch({ fps: Number(event.target.value) }));
  desk.querySelector("[data-bitrate]")?.addEventListener("change", (event) => patch({ bitrate: Number(event.target.value) }));
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
  desk.querySelectorAll("[data-desk]").forEach((node) => node.addEventListener("click", () => patch({ desktop: node.dataset.desk })));
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
}

async function stream(kind) {
  const s = state.settings;
  const url = normalize(deskValue("[data-url]") || state.url);
  state.url = url;
  try {
    await api("/api/launch", {
      kind, host: s.host, app: s.app, resolution: s.resolution, fps: s.fps, bitrate: s.bitrate, url,
    });
    toast(kind === "retropie" ? "Opening RetroPie" : "Opening");
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
    box.innerHTML = `<h1 class="h1">Files</h1><p class="sub">The home folder on this Pi.</p>
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

fetch("/api/status").then((response) => response.json()).then((data) => { state.status = data; }).catch(() => {});
draw();
tick();
setInterval(tick, 10000);
