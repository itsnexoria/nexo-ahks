const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage, shell, globalShortcut, screen, desktopCapturer, net, clipboard } = require('electron');
const fs = require('fs'), os = require('os'), path = require('path');
const { spawn, spawnSync } = require('child_process');
const SU = require('./screen-util'), CU = require('./crash-util'), COMP = require('./compile-util'), UP = require('./update-util'), RT = require('./ahk-runtime-util');
// ---------- friendly crash dialog: log it, tell the user, let them keep going ----------
const crashGate = CU.makeThrottle(3000);
const crashLog = () => { try { return path.join(app.getPath('userData'), 'crash.log'); } catch (e) { return path.join(os.tmpdir(), 'nexo-ahks-crash.log'); } };
function crashInfo() { let v = '?'; try { v = pkg.version; } catch (e) {} return { version: v, platform: process.platform + ' ' + process.arch, electron: process.versions.electron || '?' }; }
const curWin = () => { try { return win && !win.isDestroyed() ? win : undefined; } catch (e) { return undefined; } };
function onFatal(kind, err) {
  const text = CU.formatCrash(kind, err, crashInfo()); CU.appendLog(crashLog(), text);
  const msg = String((err && err.message) || err);
  if (!crashGate.begin(msg)) return;
  try {
    for (;;) {
      const r = dialog.showMessageBoxSync(curWin(), { type: 'error', title: 'Nexo Ahks hit a problem', message: 'Something went wrong, but your work is safe.', detail: msg.slice(0, 300) + '\n\nYou can keep going. If it keeps happening, copy the details and send them to the developer.', buttons: ['Keep going', 'Copy details', 'Open log folder', 'Quit'], defaultId: 0, cancelId: 0, noLink: true });
      if (r === 1) { try { clipboard.writeText(text); } catch (e) {} continue; }
      if (r === 2) { try { shell.showItemInFolder(crashLog()); } catch (e) {} continue; }
      if (r === 3) app.exit(1);
      break;
    }
  } catch (e) {} finally { crashGate.end(); }
}
process.on('uncaughtException', e => onFatal('Unexpected error', e));
process.on('unhandledRejection', e => onFatal('Unhandled promise rejection', e));
ipcMain.on('renderer-error', (_, t) => { CU.appendLog(crashLog(), CU.formatCrash('Editor error', String(t).slice(0, 4000), crashInfo())); });
let win, rec = null, tray = null, libList = [], quitting = false;
const procs = new Map(); // script id -> running AutoHotkey process
const TRAY_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABIElEQVR42sXXW08CMRAF4POHFQQRBBEEEUQIxmgkRGP8g9zkJhePgQRSlnRpu8vOSb6XdjLTxw6gSaxJhgmmiT/98ZS0gxP1FaN08IDk44pR2hueqi0pYfeAdHVJCZvhmYcFJSFbWVAScvdzSkK+PKerbYL0QKH0SxfeuPZB8W5GW7q49EKpOKMNNX5nplAuTGlKjc2dH1RupzShJkiNF6r5CY9RE2btGmo3Ex6jJszaNdRzY5pQE6TGC43smKbU2Nz5QfN6RBtq/M5MoZUZ0ZYuLr3wnP6hC29c++DlakhX2wTpgdfUkJLwdjmgJLwnB5S0+Re2E31K2P2KOxd9StjbDT7iPUbpYDP6jPUYJe2O+HXe5SkZb8nfZ12GSTfnH7M8b3rr+yReAAAAAElFTkSuQmCC';

// keep existing projects/settings from the old "AHK Blocks" folder
try { const ad = app.getPath('appData'), newD = path.join(ad, 'Nexo Ahks'), oldD = ['AHK Blocks', 'ahk-blocks'].map(n => path.join(ad, n)).find(d => fs.existsSync(d)); app.setPath('userData', oldD && !fs.existsSync(newD) ? oldD : newD); } catch (e) {}
app.setName('Nexo Ahks');
if (process.env.NEXO_USER_DATA) { try { app.setPath('userData', process.env.NEXO_USER_DATA); } catch (e) {} } // lets tests use a throwaway folder
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

// ---------- update check (needs "repository" in package.json to point at your GitHub repo) ----------
const pkg = (() => { try { return require('./package.json'); } catch (e) { return {}; } })();
const newer = UP.newer;
// installed (NSIS) builds can update themselves with electron-updater; portable/dev builds just get the "is out" toast
let updater = null;
const canSelfUpdate = () => app.isPackaged && !process.env.PORTABLE_EXECUTABLE_DIR && process.platform === 'win32';
function getUpdater() {
  if (updater !== null) return updater || null;
  try {
    const u = require('electron-updater').autoUpdater;
    u.autoDownload = false; u.autoInstallOnAppQuit = true; u.allowPrerelease = false;
    u.on('update-available', i => send('update-available', { version: String(i.version), auto: true, url: 'https://github.com/' + (UP.repoSlug(pkg.repository) || '') + '/releases/latest' }));
    u.on('download-progress', p => send('update-progress', { percent: Math.round(p.percent || 0) }));
    u.on('update-downloaded', i => send('update-ready', { version: String(i.version) }));
    u.on('error', e => send('update-error', String((e && e.message) || e).slice(0, 200)));
    updater = u;
  } catch (e) { updater = false; }
  return updater || null;
}
async function checkUpdate() {
  try {
    if (cfg().updateCheck === false) return;
    if (canSelfUpdate()) { const u = getUpdater(); if (u) { await u.checkForUpdates(); return; } }
    const slug = UP.repoSlug(pkg.repository);
    if (!slug) return;
    const r = await net.fetch('https://api.github.com/repos/' + slug + '/releases/latest', { headers: { 'User-Agent': 'Nexo-Ahks', Accept: 'application/vnd.github+json' } });
    if (!r.ok) return;
    const j = await r.json();
    if (j && j.tag_name && newer(j.tag_name, app.getVersion())) send('update-available', { version: String(j.tag_name).replace(/^v/i, ''), url: j.html_url });
  } catch (e) {}
}

// ---------- config + AutoHotkey discovery ----------
const cfgFile = () => path.join(app.getPath('userData'), 'config.json');
let cfgBroken = false;
const cfg = () => {
  let t; try { t = fs.readFileSync(cfgFile(), 'utf8'); } catch (e) { return {}; }
  try { const j = JSON.parse(t); cfgBroken = false; return j && typeof j === 'object' && !Array.isArray(j) ? j : {}; } catch (e) { cfgBroken = true; return {}; }
};
const setCfg = o => {
  try {
    const cur = cfg();
    if (cfgBroken) { try { fs.copyFileSync(cfgFile(), cfgFile() + '.bad'); } catch (e) {} cfgBroken = false; } // keep the unreadable file for the user
    const f = cfgFile(), t = f + '.tmp'; fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(t, JSON.stringify({ ...cur, ...o })); fs.renameSync(t, f);
  } catch (e) {}
};
const bases = [process.env['ProgramFiles'], process.env['ProgramFiles(x86)'], path.join(os.homedir(), 'AppData', 'Local', 'Programs')].filter(Boolean);
const first = l => l.find(p => fs.existsSync(p));
const onPath = name => {
  if (process.platform !== 'win32') return null;
  try { const r = spawnSync('where', [name], { encoding: 'utf8', windowsHide: true }); const p = (r.stdout || '').split(/\r?\n/).find(Boolean); return p && fs.existsSync(p) ? p : null; } catch (e) { return null; }
};
// the copy of AutoHotkey the app downloaded itself (Help > Program locations > Download)
const runtimeDir = () => path.join(app.getPath('userData'), 'ahk-runtime');
const ownRuntime = () => { try { const r = RT.locate(runtimeDir()); return { ahk: r.ahk && fs.existsSync(r.ahk) ? r.ahk : null, compiler: r.compiler && fs.existsSync(r.compiler) ? r.compiler : null }; } catch (e) { return {}; } };
const ahkVersionOf = exe => { try { const f = tmpFile('FileAppend(A_AhkVersion, "*")', 'ver.ahk'); const r = spawnSync(exe, [f], { timeout: 8000, encoding: 'utf8', windowsHide: true }); return String(r.stdout || '').trim(); } catch (e) { return ''; } };
const findAhk = () => {
  const c = cfg().ahk; if (c && COMP.looksLikeAhk(c) && fs.existsSync(c)) return c;
  const rt = ownRuntime().ahk; if (rt) return rt;
  return first(bases.flatMap(b => ['AutoHotkey64.exe', 'AutoHotkey32.exe', 'AutoHotkey.exe'].map(n => path.join(b, 'AutoHotkey', 'v2', n)))) || onPath('AutoHotkey64.exe');
};
const findCompiler = () => {
  const c = cfg().compiler; if (c && COMP.looksLikeCompiler(c) && fs.existsSync(c)) return c;
  const rt = ownRuntime().compiler; if (rt) return rt;
  const near = []; const a = findAhk();
  if (a) { near.push(path.join(path.dirname(a), 'Compiler', 'Ahk2Exe.exe'), path.join(path.dirname(path.dirname(a)), 'Compiler', 'Ahk2Exe.exe')); }
  return first([...near, ...bases.flatMap(b => [path.join(b, 'AutoHotkey', 'Compiler', 'Ahk2Exe.exe'), path.join(b, 'AutoHotkey', 'v2', 'Compiler', 'Ahk2Exe.exe')])]) || onPath('Ahk2Exe.exe');
};
async function ensureCompiler() {
  const p = findCompiler(); if (p) return p;
  for (;;) {
    const r = await dialog.showOpenDialog(win, { title: 'Find Ahk2Exe.exe (the AutoHotkey compiler)', filters: [{ name: 'Ahk2Exe', extensions: ['exe'] }], properties: ['openFile'] });
    if (r.canceled) return null;
    if (COMP.looksLikeCompiler(r.filePaths[0])) { setCfg({ compiler: r.filePaths[0] }); return r.filePaths[0]; }
    await dialog.showMessageBox(win, { type: 'warning', message: 'That is not Ahk2Exe.exe', detail: 'Pick the file called Ahk2Exe.exe (usually inside AutoHotkey\\Compiler).' });
  }
}
async function ensureAhk() {
  const p = findAhk(); if (p) return p;
  for (;;) {
    const r = await dialog.showOpenDialog(win, { title: 'Find AutoHotkey v2 (AutoHotkey64.exe)', filters: [{ name: 'Program', extensions: ['exe'] }], properties: ['openFile'] });
    if (r.canceled) return null;
    const f = r.filePaths[0];
    if (!COMP.looksLikeAhk(f)) { await dialog.showMessageBox(win, { type: 'warning', message: 'That is not an AutoHotkey v2 program', detail: 'Pick AutoHotkey64.exe (usually in Program Files\\AutoHotkey\\v2). Names like AutoHotkeyU64.exe are version 1.' }); continue; }
    const v = process.platform === 'win32' ? ahkVersionOf(f) : '';
    if (v && !COMP.isAhkV2(v)) { await dialog.showMessageBox(win, { type: 'warning', message: 'That is AutoHotkey version ' + v, detail: 'Nexo Ahks needs version 2.' }); continue; }
    setCfg({ ahk: f }); return f;
  }
}
let tmpRoot = null;
const tmpDir = () => { if (!tmpRoot || !fs.existsSync(tmpRoot)) tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nexo-ahks-')); return tmpRoot; }; // one private folder per app run
const tmpFile = (code, name = 'run.ahk', unique) => {
  const f = path.join(tmpDir(), unique ? Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + '_' + name : name);
  fs.writeFileSync(f, code); return f;
};
const cleanTmp = () => { try { if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (e) {} };
const NOAHK = 'AutoHotkey v2 not found. Install it from autohotkey.com, or use Help > Program locations > Download (Windows only).';
const readText = f => { const b = fs.readFileSync(f); if (b[0] === 0xFF && b[1] === 0xFE) return b.slice(2).toString('utf16le'); return b.toString('utf8').replace(/^\ufeff/, ''); };

// errors become values the UI can show instead of silent failures
// Only the app's own page (file://) may call these; every handler returns errors as values
const trusted = ev => { const u = ev && ev.senderFrame && ev.senderFrame.url; return !u || /^file:\/\//i.test(u); };
const handle = (name, fn, onErr) => ipcMain.handle(name, async (ev, ...a) => { if (!trusted(ev)) return onErr(new Error('Blocked')); try { return await fn(...a); } catch (e) { return onErr(e); } });
// script files the page may read / run / start with Windows: .ahk or .ahkb only, absolute path
const isScriptPath = p => typeof p === 'string' && p.length < 1000 && /\.(ahk|ahkb)$/i.test(p) && path.isAbsolute(p);
const isAhkFile = p => isScriptPath(p) && /\.ahk$/i.test(p) && fs.existsSync(p);
const E = e => ({ err: String((e && e.message) || e) });
const ES = e => 'Error: ' + String((e && e.message) || e);
handle('open-url', u => { if (/^https:\/\/github\.com\//i.test(String(u))) shell.openExternal(String(u)); return true; }, ES);

handle('save-project', async (s, def, as) => {
  let f = def;
  if (!f || as) {
    const r = await dialog.showSaveDialog(win, { defaultPath: def || 'my-script.ahkb', filters: [{ name: 'Nexo Ahks project', extensions: ['ahkb'] }] });
    if (r.canceled) return null; f = r.filePath;
  }
  fs.writeFileSync(f, s); return f;
}, E);
handle('open-project', async () => {
  const r = await dialog.showOpenDialog(win, { filters: [{ name: 'Nexo Ahks project', extensions: ['ahkb'] }], properties: ['openFile'] });
  if (r.canceled) return null;
  const file = r.filePaths[0]; return { name: path.basename(file), file, text: readText(file) };
}, E);
handle('export-ahk', async (code, def) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: def || 'script.ahk', filters: [{ name: 'AutoHotkey script', extensions: ['ahk'] }] });
  if (r.canceled) return null; fs.writeFileSync(r.filePath, code); return r.filePath;
}, E);
handle('import-ahk', async () => {
  const r = await dialog.showOpenDialog(win, { filters: [{ name: 'AutoHotkey script', extensions: ['ahk'] }], properties: ['openFile'] });
  if (r.canceled) return null;
  const file = r.filePaths[0];
  return { name: path.basename(file, path.extname(file)), file, text: readText(file) };
}, E);
const prefs = () => ({ closeToTray: !!cfg().closeToTray, keepRunning: !!cfg().keepRunning });
const send = (ch, d) => { try { if (win && !win.isDestroyed()) win.webContents.send(ch, d); } catch (e) {} };
function trayMenu() {
  const items = libList.slice(0, 14).map(it => ({ label: (procs.has(it.id) ? '■  Stop   ' : '▶  Run   ') + it.name, click: () => send('tray-cmd', { cmd: 'toggle', id: it.id }) }));
  return Menu.buildFromTemplate([
    { label: 'Open Nexo Ahks', click: showWin }, { type: 'separator' },
    ...(items.length ? items : [{ label: 'No scripts yet', enabled: false }]), { type: 'separator' },
    { label: 'Stop all scripts', enabled: procs.size > 0, click: () => stopAll() },
    { label: 'Quit', click: () => { quitting = true; app.quit(); } }
  ]);
}
function updateTray() { if (!tray) return; try { tray.setContextMenu(trayMenu()); tray.setToolTip('Nexo Ahks · ' + procs.size + ' running'); } catch (e) {} }
function showWin() { if (!win) return; if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
function stopOne(id) {
  const c = procs.get(id); if (!c) return false;
  procs.delete(id); try { c.kill(); } catch (e) {}
  send('script-state', { id, running: false, code: 0 }); updateTray(); return true;
}
function stopAll() { [...procs.keys()].forEach(stopOne); }

handle('run-script', async o => {
  const exe = await ensureAhk(); if (!exe) return NOAHK;
  if (procs.has(o.id)) stopOne(o.id);
  const file = isAhkFile(o.file) ? o.file : tmpFile(o.code || '', 's_' + String(o.id).replace(/\W/g, '') + '.ahk');
  const keep = prefs().keepRunning;
  const dbg = o.debug ? String(o.debug) : '';
  const child = dbg
    ? spawn(exe, [file], { cwd: path.dirname(file), detached: false, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NEXO_DEBUG: dbg } })
    : spawn(exe, [file], { cwd: path.dirname(file), detached: keep, stdio: 'ignore' });
  if (keep && !dbg) child.unref();
  if (dbg) {
    let buf = '';
    const feed = d => { buf += d.toString('utf8'); const L = buf.split(/\r?\n/); buf = L.pop(); L.forEach(line => send('script-out', { id: o.id, line })); };
    child.stdout.on('data', feed); child.stderr.on('data', feed);
    child.on('exit', () => { if (buf) send('script-out', { id: o.id, line: buf }); buf = ''; });
  }
  procs.set(o.id, child);
  const gone = code => { if (procs.get(o.id) === child) { procs.delete(o.id); send('script-state', { id: o.id, running: false, code: code || 0 }); updateTray(); } };
  child.on('exit', gone); child.on('error', () => gone(1));
  send('script-state', { id: o.id, running: true }); updateTray();
  return 'Started ' + (o.name || 'script');
}, ES);
handle('stop-script', id => (stopOne(id) ? 'Stopped' : 'That script is not running'), ES);
handle('stop-all', () => { stopAll(); return 'Stopped everything'; }, ES);
handle('running', () => [...procs.keys()], () => []);
const libFile = () => path.join(app.getPath('userData'), 'library.json');
handle('lib-load', () => { try { return JSON.parse(fs.readFileSync(libFile(), 'utf8')); } catch (e) { return null; } }, () => null);
handle('lib-save', d => { const f = libFile(), t = f + '.tmp'; fs.writeFileSync(t, JSON.stringify(d)); fs.renameSync(t, f); return true; }, E);
handle('lib-sync', l => { libList = Array.isArray(l) ? l : []; updateTray(); return true; }, E);
handle('read-file', p => { if (!isScriptPath(p)) throw new Error('Only .ahk and .ahkb files can be opened'); if (fs.statSync(p).size > 5e6) throw new Error('That file is too big'); return readText(p); }, E);
handle('reveal', p => { if (isScriptPath(p) || (typeof p === 'string' && /\.(exe|lnk)$/i.test(p) && path.isAbsolute(p))) shell.showItemInFolder(p); return true; }, E);
// ---------- Help > Program locations ----------
handle('tool-paths', () => ({ ahk: findAhk() || null, compiler: findCompiler() || null, ahkSaved: !!(cfg().ahk && COMP.looksLikeAhk(cfg().ahk)), compilerSaved: !!(cfg().compiler && COMP.looksLikeCompiler(cfg().compiler)), downloaded: !!ownRuntime().ahk }), E);
handle('tool-set', async kind => {
  if (kind !== 'ahk' && kind !== 'compiler') return { err: 'Unknown program' };
  const isA = kind === 'ahk';
  const r = await dialog.showOpenDialog(win, { title: isA ? 'Find AutoHotkey v2 (AutoHotkey64.exe)' : 'Find Ahk2Exe.exe (the AutoHotkey compiler)', filters: [{ name: 'Program', extensions: ['exe'] }], properties: ['openFile'] });
  if (r.canceled || !r.filePaths.length) return { cancelled: true };
  const f = r.filePaths[0];
  if (isA) {
    if (!COMP.looksLikeAhk(f)) return { err: 'That is not an AutoHotkey v2 program. Pick AutoHotkey64.exe (names like AutoHotkeyU64.exe are version 1).' };
    const v = process.platform === 'win32' ? ahkVersionOf(f) : '';
    if (v && !COMP.isAhkV2(v)) return { err: 'That is AutoHotkey version ' + v + ', but version 2 is needed.' };
  } else if (!COMP.looksLikeCompiler(f)) return { err: 'That is not Ahk2Exe.exe. Pick the file called Ahk2Exe.exe.' };
  setCfg(isA ? { ahk: f } : { compiler: f }); return { ok: true, path: f };
}, E);
handle('tool-reset', kind => { if (kind === 'ahk') setCfg({ ahk: null }); else if (kind === 'compiler') setCfg({ compiler: null }); else return { err: 'Unknown program' }; return { ok: true }; }, E);
// Downloads the official AutoHotkey v2 zip from GitHub (only when the user clicks), checks its hash and keeps it in the app's own folder
let dlBusy = false;
handle('tool-download', async () => {
  if (process.platform !== 'win32') return { err: 'AutoHotkey only runs on Windows.' };
  if (dlBusy) return { err: 'Already downloading.' };
  dlBusy = true;
  try {
    const step = t => send('tool-download-progress', t);
    step('Looking up the latest AutoHotkey v2…');
    const rr = await net.fetch(RT.RELEASES, { headers: { 'User-Agent': 'Nexo-Ahks', Accept: 'application/vnd.github+json' } });
    if (!rr.ok) return { err: 'Could not reach GitHub (' + rr.status + ').' };
    const asset = RT.pickAsset(await rr.json());
    if (!asset) return { err: 'Could not find the AutoHotkey v2 download. Install it from autohotkey.com instead.' };
    step('Downloading ' + asset.name + '…');
    const zr = await net.fetch(asset.url, { headers: { 'User-Agent': 'Nexo-Ahks' } });
    if (!zr.ok) return { err: 'Download failed (' + zr.status + ').' };
    const buf = Buffer.from(await zr.arrayBuffer());
    if (buf.length > RT.MAX_BYTES || buf.length < 1e5) return { err: 'The downloaded file looks wrong, so it was not used.' };
    const v = RT.verifyDigest(buf, asset.digest);
    if (!v.ok) return { err: 'The download did not match its checksum, so it was not used.' };
    step('Unpacking…');
    const dir = runtimeDir(), zip = path.join(tmpDir(), asset.name), stage = path.join(tmpDir(), 'ahk-stage');
    fs.writeFileSync(zip, buf); fs.rmSync(stage, { recursive: true, force: true }); fs.mkdirSync(stage, { recursive: true });
    const ps = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:NX_ZIP -DestinationPath $env:NX_OUT -Force'], { env: { ...process.env, NX_ZIP: zip, NX_OUT: stage }, timeout: 120000, windowsHide: true, encoding: 'utf8' });
    if (ps.status !== 0) return { err: 'Could not unpack the download: ' + String(ps.stderr || ps.error || '').slice(0, 200) };
    if (!RT.locate(stage).ahk) return { err: 'The download did not contain AutoHotkey64.exe.' };
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(path.dirname(dir), { recursive: true }); fs.cpSync(stage, dir, { recursive: true });
    const now = ownRuntime();
    return { ok: true, ahk: now.ahk || null, compiler: now.compiler || null, checked: v.checked, note: now.compiler ? '' : 'This download has no compiler, so Compile to EXE still needs Ahk2Exe.exe from the full installer.' };
  } finally { dlBusy = false; }
}, E);
// self-update (installed builds)
handle('update-download', async () => { const u = getUpdater(); if (!u) return { err: 'Updates are managed by the installer in this build.' }; await u.downloadUpdate(); return { ok: true }; }, E);
handle('update-install', () => { const u = getUpdater(); if (!u) return { err: 'Not available.' }; quitting = true; u.quitAndInstall(false, true); return { ok: true }; }, E);
handle('get-prefs', () => prefs(), () => ({}));
handle('set-prefs', p => { setCfg({ closeToTray: !!p.closeToTray, keepRunning: !!p.keepRunning }); return prefs(); }, E);
handle('scan-folder', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Pick a folder with .ahk scripts', properties: ['openDirectory'] });
  if (r.canceled) return null;
  const out = [], walk = (d, depth) => {
    let es = []; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const e of es) {
      const f = path.join(d, e.name);
      if (e.isDirectory() && depth < 2 && !/^(node_modules|\.git|\$)/i.test(e.name)) walk(f, depth + 1);
      else if (e.isFile() && /\.ahk$/i.test(e.name) && out.length < 300) { try { out.push({ name: path.basename(e.name, '.ahk'), file: f, size: fs.statSync(f).size }); } catch (x) {} }
    }
  };
  walk(r.filePaths[0], 0);
  return { dir: r.filePaths[0], files: out };
}, E);
handle('set-startup', async o => {
  if (process.platform !== 'win32') return { err: 'Run at startup works on Windows only.' };
  const exe = await ensureAhk(); if (!exe) return { err: NOAHK };
  const dir = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
  const safe = String(o.name || 'script').replace(/[\\/:*?"<>|]/g, '_');
  const lnk = path.join(dir, 'Nexo Ahks - ' + safe + '.lnk');
  const mine = path.join(app.getPath('userData'), 'startup', String(o.id).replace(/\W/g, '') + '.ahk');
  if (!o.on) { try { fs.unlinkSync(lnk); } catch (e) {} try { fs.unlinkSync(mine); } catch (e) {} return { ok: true }; }
  let script = isAhkFile(o.file) ? o.file : null;
  if (!script) { fs.mkdirSync(path.dirname(mine), { recursive: true }); fs.writeFileSync(mine, o.code || ''); script = mine; }
  shell.writeShortcutLink(lnk, 'create', { target: exe, args: '"' + script + '"', cwd: path.dirname(script), description: 'Nexo Ahks: ' + safe });
  return { ok: true, path: lnk };
}, E);

handle('compile', async (code, name, opts) => {
  if (process.platform !== 'win32') return 'Compiling needs Windows and AutoHotkey v2.';
  const exe = await ensureAhk(); if (!exe) return NOAHK;
  const comp = await ensureCompiler();
  if (!comp) return 'Ahk2Exe not found. Reinstall AutoHotkey v2 and tick the compiler option, or pick Ahk2Exe.exe when asked.';
  const o = opts || {};
  const r = await dialog.showSaveDialog(win, { defaultPath: COMP.safeExeName(o.name || name) + '.exe', filters: [{ name: 'Executable', extensions: ['exe'] }] });
  if (r.canceled) return null;
  const src = tmpFile(COMP.withDirectives(code, { ...o, name: o.name || name }), 'compile.ahk', true);
  let icon = null;
  if (o.useNexoIcon) { try { icon = path.join(tmpDir(), 'icon.ico'); fs.copyFileSync(path.join(__dirname, 'build', 'icon.ico'), icon); } catch (e) { icon = null; } }
  else if (o.icon && /\.(ico|exe)$/i.test(String(o.icon)) && fs.existsSync(o.icon)) icon = o.icon;
  return new Promise(res => {
    let out = '', done = false;
    const fin = m => { if (done) return; done = true; clearTimeout(tm); res(m); };
    const ps = spawn(comp, COMP.compileArgs({ src, out: r.filePath, base: exe, icon }), { windowsHide: true });
    const tm = setTimeout(() => { try { ps.kill(); } catch (e) {} fin('Compile took too long and was stopped'); }, 120000);
    ps.stdout && ps.stdout.on('data', d => { out += d.toString(); });
    ps.stderr && ps.stderr.on('data', d => { out += d.toString(); });
    ps.on('error', e => fin('Could not start the compiler: ' + e.message));
    ps.on('exit', c => {
      if (c === 0 && fs.existsSync(r.filePath)) fin('Saved ' + path.basename(r.filePath));
      else fin('Compile failed' + (out.trim() ? ': ' + out.trim().slice(0, 300) : ' (code ' + c + ')'));
    });
  });
}, ES);

ipcMain.handle('pick-file', async (ev, o) => { if (!trusted(ev)) return null; const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: (o && o.filters) || [] }); return r.canceled || !r.filePaths.length ? null : r.filePaths[0]; });

// ---------- Help > Self-check: is everything this app needs available? ----------
ipcMain.handle('diagnostics', async () => {
  const out = [], add = (id, label, status, detail, fix) => out.push({ id, label, status, detail: String(detail || ''), fix: fix || '' });
  const safe = async (id, label, f) => { try { await f(); } catch (e) { add(id, label, 'bad', 'The check itself failed: ' + ((e && e.message) || e)); } };
  await safe('app', 'Nexo Ahks', async () => add('app', 'Nexo Ahks', 'ok', 'Version ' + crashInfo().version + ', Electron ' + (process.versions.electron || '?') + ', ' + process.platform + ' ' + process.arch));
  const win32 = process.platform === 'win32';
  await safe('ahk', 'AutoHotkey v2', async () => {
    if (!win32) return add('ahk', 'AutoHotkey v2', 'warn', 'AutoHotkey only runs on Windows, so Run and Compile are unavailable here.', 'Use Try it to test your script instead.');
    const exe = await ensureAhk();
    if (!exe) return add('ahk', 'AutoHotkey v2', 'bad', 'Not found.', 'Install AutoHotkey v2 from autohotkey.com, then press Self-check again.');
    let ver = ''; try { ver = ahkVersionOf(exe); } catch (e) {}
    add('ahk', 'AutoHotkey v2', ver && !/^2\./.test(ver) ? 'bad' : 'ok', exe + (ver ? '  (version ' + ver + ')' : ''), ver && !/^2\./.test(ver) ? 'This is not version 2. Install AutoHotkey v2.' : '');
  });
  await safe('comp', 'Compiler (Ahk2Exe)', async () => {
    if (!win32) return add('comp', 'Compiler (Ahk2Exe)', 'warn', 'Compiling needs Windows.');
    const c = await ensureCompiler();
    add('comp', 'Compiler (Ahk2Exe)', c ? 'ok' : 'warn', c || 'Not found.', c ? '' : 'Reinstall AutoHotkey v2 with the compiler option ticked, or pick Ahk2Exe.exe the first time you compile.');
  });
  await safe('data', 'Your projects folder', async () => { const d = app.getPath('userData'); fs.mkdirSync(d, { recursive: true }); const f = path.join(d, '.selfcheck'); fs.writeFileSync(f, 'ok'); fs.unlinkSync(f); add('data', 'Your projects folder', 'ok', d + ' is writable'); });
  await safe('tmp', 'Temporary folder', async () => { const f = path.join(os.tmpdir(), 'nexo-selfcheck-' + process.pid); fs.writeFileSync(f, 'ok'); fs.unlinkSync(f); add('tmp', 'Temporary folder', 'ok', os.tmpdir() + ' is writable'); });
  await safe('screen', 'Screen capture (📷 🎨 🎯)', async () => {
    const d = screen.getAllDisplays(), s = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 16, height: 16 } });
    const n = (s && s.length) || 0;
    add('screen', 'Screen capture (📷 🎨 🎯)', n > 0 ? 'ok' : 'warn', (d.length || 1) + ' screen(s), ' + n + ' capturable', n > 0 ? '' : 'Allow screen recording for Nexo Ahks in your system privacy settings.');
  });
  await safe('monaco', 'Code editor files', async () => { const f = path.join(__dirname, 'node_modules', 'monaco-editor', 'min', 'vs', 'loader.js'); add('monaco', 'Code editor files', fs.existsSync(f) ? 'ok' : 'warn', fs.existsSync(f) ? 'Found' : 'Not found, the Code view falls back to a plain text box.'); });
  await safe('upd', 'Update check', async () => { let repo = ''; try { repo = (pkg.repository && (pkg.repository.url || pkg.repository)) || ''; } catch (e) {} add('upd', 'Update check', repo ? 'ok' : 'warn', repo ? String(repo) : 'No repository is set in package.json, so the app cannot check for updates.'); });
  await safe('log', 'Problem log', async () => { const f = crashLog(); const has = fs.existsSync(f); add('log', 'Problem log', 'ok', has ? f + '  (' + Math.round(fs.statSync(f).size / 1024) + ' KB)' : 'No problems have been recorded'); });
  return out;
});

// ---------- screen picker (position + pixel color), any monitor ----------
let pickCancel = null;
ipcMain.handle('pick', () => new Promise(res => {
  if (pickCancel) pickCancel();
  let done = false, t;
  const fin = v => { if (done) return; done = true; if (pickCancel) pickCancel = null; clearTimeout(t); globalShortcut.unregister('F8'); globalShortcut.unregister('Escape'); res(v); };
  pickCancel = () => fin(null);
  t = setTimeout(() => fin(null), 30000);
  globalShortcut.register('Escape', () => fin(null));
  const ok = globalShortcut.register('F8', async () => {
    const pt = screen.getCursorScreenPoint(), d = screen.getDisplayNearestPoint(pt), sf = d.scaleFactor;
    const P = q => process.platform === 'win32' ? screen.dipToScreenPoint(q) : { x: q.x * sf, y: q.y * sf };
    const p = P(pt), o = P({ x: d.bounds.x, y: d.bounds.y });
    let c = '0x000000';
    try {
      const src = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: Math.round(d.size.width * sf), height: Math.round(d.size.height * sf) } });
      const s = src.find(z => z.display_id === String(d.id)) || src[0];
      const sz = s.thumbnail.getSize(), bm = s.thumbnail.toBitmap();
      const x = Math.min(Math.max(0, Math.round(p.x - o.x)), sz.width - 1), y = Math.min(Math.max(0, Math.round(p.y - o.y)), sz.height - 1), i = (y * sz.width + x) * 4;
      c = '0x' + [bm[i + 2], bm[i + 1], bm[i]].map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase();
    } catch (e) {}
    fin({ x: Math.round(p.x), y: Math.round(p.y), c });
  });
  if (!ok) fin(null);
}));

// ---------- screen tools: freeze the screen, then drag a box / pick a color / pick a point ----------
let capBusy = false;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function screenTool(mode) {
  if (capBusy) return null;
  if (!['region', 'color', 'point'].includes(mode)) return { err: 'Unknown screen tool' };
  capBusy = true;
  const wasMin = !!(win && win.isMinimized());
  try {
    if (win && !wasMin) { win.minimize(); await sleep(350); } // so the app itself is not in the picture
    const d = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()), sf = d.scaleFactor || 1;
    const src = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: Math.round(d.size.width * sf), height: Math.round(d.size.height * sf) } });
    const s = src.find(z => z.display_id === String(d.id)) || src[0];
    if (!s) return { err: 'Could not capture the screen' };
    const img = s.thumbnail, size = img.getSize();
    const res = await new Promise(resolve => {
      const ow = new BrowserWindow({ x: d.bounds.x, y: d.bounds.y, width: d.bounds.width, height: d.bounds.height, frame: false, resizable: false, movable: false, skipTaskbar: true, alwaysOnTop: true, fullscreenable: false, enableLargerThanScreen: true, show: false, backgroundColor: '#000000',
        webPreferences: { preload: path.join(__dirname, 'capture-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
      let done = false;
      const fin = v => { if (done) return; done = true; clearTimeout(tm); ipcMain.removeListener('cap-done', onDone); try { ow.destroy(); } catch (e) {} resolve(v); };
      const onDone = (e, v) => { if (e.sender === ow.webContents) fin(v); };
      const tm = setTimeout(() => fin(null), 120000);
      ipcMain.on('cap-done', onDone);
      ow.on('closed', () => fin(null));
      ow.webContents.once('did-finish-load', () => { ow.webContents.send('cap-init', { mode, img: img.toDataURL(), w: size.width, h: size.height }); ow.show(); ow.focus(); });
      ow.loadFile(path.join(__dirname, 'renderer', 'capture.html'));
    });
    if (!res) return null;
    const origin = SU.originOf(d, process.platform === 'win32', q => screen.dipToScreenPoint(q));
    if (mode === 'region') {
      const r = SU.clampRect(res, size.width, size.height), crop = img.crop({ x: r.x, y: r.y, width: r.w, height: r.h });
      const dir = path.join(app.getPath('userData'), 'captures'); fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, 'cap_' + Date.now() + '.png'); fs.writeFileSync(file, crop.toPNG());
      const pv = r.w > 160 ? crop.resize({ width: 160 }) : crop;
      return { path: file, x: origin.x + r.x, y: origin.y + r.y, w: r.w, h: r.h, preview: pv.toDataURL() };
    }
    const bm = img.toBitmap(), x = Math.min(Math.max(0, Math.round(res.x)), size.width - 1), y = Math.min(Math.max(0, Math.round(res.y)), size.height - 1);
    return { x: origin.x + x, y: origin.y + y, c: SU.colorAt(bm, size.width, size.height, x, y) };
  } catch (e) {
    return { err: 'Screen tool failed: ' + String((e && e.message) || e) };
  } finally {
    capBusy = false;
    if (win && !wasMin && !win.isDestroyed()) { win.restore(); win.focus(); }
  }
}
ipcMain.handle('screen-tool', (_, mode) => screenTool(mode));

// ---------- recorder (runs a tiny AutoHotkey script and reads what it logs) ----------
const REC = [
  '#Requires AutoHotkey v2.0', '#SingleInstance Force', 'CoordMode "Mouse", "Screen"', 'global last := A_TickCount',
  'Rec(s) {', '  global last', '  now := A_TickCount', '  FileAppend(now - last "|" s "`n", "*", "UTF-8-RAW")', '  last := now', '}',
  'ToolTip "Recording... press F10 to stop", 10, 10',
  'ih := InputHook("V I1")', 'ih.KeyOpt("{All}", "N")',
  'ih.OnKeyDown := (h, vk, sc) => Rec("KD|" GetKeyName(Format("vk{:X}sc{:03X}", vk, sc)))',
  'ih.OnKeyUp := (h, vk, sc) => Rec("KU|" GetKeyName(Format("vk{:X}sc{:03X}", vk, sc)))',
  'ih.Start()',
  'Btn(b, st) {', '  MouseGetPos &x, &y', '  Rec(st "|" b "|" x "|" y)', '}',
  '~*LButton::Btn("Left", "D")', '~*LButton Up::Btn("Left", "U")', '~*RButton::Btn("Right", "D")', '~*RButton Up::Btn("Right", "U")', '~*MButton::Btn("Middle", "D")', '~*MButton Up::Btn("Middle", "U")',
  '~*WheelUp::Rec("W|Up")', '~*WheelDown::Rec("W|Down")', 'F10::ExitApp'
].join('\r\n');
handle('rec-start', async () => {
  if (rec) return { err: 'Already recording. Press F10 to stop.' };
  const exe = await ensureAhk(); if (!exe) return { err: NOAHK };
  const f = tmpFile(REC, 'rec.ahk', true);
  return new Promise(res => {
    let out = ''; win.minimize();
    rec = spawn(exe, [f]);
    rec.stdout.on('data', d => { out += d.toString('utf8'); });
    rec.on('exit', () => { rec = null; win.restore(); win.focus(); res({ text: out }); });
    rec.on('error', e => { rec = null; win.restore(); res({ err: 'Could not start the recorder: ' + e.message }); });
  });
}, E);
handle('rec-stop', () => { if (rec) { rec.kill(); return 1; } return 0; }, E);

// ---------- window ----------
const openArg = argv => {
  const f = argv.slice(1).find(a => /\.(ahk|ahkb)$/i.test(a) && fs.existsSync(a));
  if (!f || !win) return;
  try { win.webContents.send('open-file', { name: path.basename(f), file: f, text: readText(f) }); } catch (e) {}
};
app.on('second-instance', (_, argv) => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); openArg(argv); } });
app.whenReady().then(() => {
  if (!gotLock) return;
  Menu.setApplicationMenu(null);
  const b = cfg().bounds || {};
  const onScreen = b.x !== undefined && screen.getAllDisplays().some(d => b.x >= d.bounds.x - 50 && b.x < d.bounds.x + d.bounds.width - 100 && b.y >= d.bounds.y - 50 && b.y < d.bounds.y + d.bounds.height - 100);
  win = new BrowserWindow({
    width: Math.max(900, b.width || 1440), height: Math.max(560, b.height || 880), ...(onScreen ? { x: b.x, y: b.y } : {}),
    minWidth: 900, minHeight: 560, backgroundColor: '#0d0f15', autoHideMenuBar: true, title: 'Nexo Ahks', icon: path.join(__dirname, 'renderer', 'logo.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  try { win.webContents.session.setPermissionRequestHandler((wc, perm, cb) => cb(false)); } catch (e) {}
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.on('close', e => {
    try { setCfg({ bounds: win.getBounds() }); } catch (x) {}
    if (!quitting && prefs().closeToTray) { e.preventDefault(); win.hide(); }
  });
  try { let ti = nativeImage.createFromPath(path.join(__dirname, 'renderer', 'tray.png')); if (ti.isEmpty()) ti = nativeImage.createFromDataURL(TRAY_ICON); tray = new Tray(ti.resize({ width: 16, height: 16 })); tray.on('click', showWin); updateTray(); } catch (e) {}
  win.webContents.once('did-finish-load', () => { setTimeout(() => openArg(process.argv), 500); setTimeout(checkUpdate, 4000); });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
});
app.on('before-quit', () => { quitting = true; if (!prefs().keepRunning) procs.forEach(c => { try { c.kill(); } catch (e) {} }); });
app.on('will-quit', () => { globalShortcut.unregisterAll(); cleanTmp(); });
app.on('window-all-closed', () => { if (rec) rec.kill(); app.quit(); });
