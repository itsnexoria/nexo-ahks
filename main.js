const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage, shell, globalShortcut, screen, desktopCapturer } = require('electron');
const fs = require('fs'), os = require('os'), path = require('path');
const { spawn, spawnSync } = require('child_process');
let win, rec = null, tray = null, libList = [], quitting = false;
const procs = new Map(); // script id -> running AutoHotkey process
const TRAY_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABIElEQVR42sXXW08CMRAF4POHFQQRBBEEEUQIxmgkRGP8g9zkJhePgQRSlnRpu8vOSb6XdjLTxw6gSaxJhgmmiT/98ZS0gxP1FaN08IDk44pR2hueqi0pYfeAdHVJCZvhmYcFJSFbWVAScvdzSkK+PKerbYL0QKH0SxfeuPZB8W5GW7q49EKpOKMNNX5nplAuTGlKjc2dH1RupzShJkiNF6r5CY9RE2btGmo3Ex6jJszaNdRzY5pQE6TGC43smKbU2Nz5QfN6RBtq/M5MoZUZ0ZYuLr3wnP6hC29c++DlakhX2wTpgdfUkJLwdjmgJLwnB5S0+Re2E31K2P2KOxd9StjbDT7iPUbpYDP6jPUYJe2O+HXe5SkZb8nfZ12GSTfnH7M8b3rr+yReAAAAAElFTkSuQmCC';

// keep existing projects/settings from the old "AHK Blocks" folder
try { const ad = app.getPath('appData'), oldD = path.join(ad, 'AHK Blocks'), newD = path.join(ad, 'Nexo Ahks'); app.setPath('userData', fs.existsSync(oldD) && !fs.existsSync(newD) ? oldD : newD); } catch (e) {}
app.setName('Nexo Ahks');
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

// ---------- config + AutoHotkey discovery ----------
const cfgFile = () => path.join(app.getPath('userData'), 'config.json');
const cfg = () => { try { return JSON.parse(fs.readFileSync(cfgFile(), 'utf8')); } catch (e) { return {}; } };
const setCfg = o => { try { fs.writeFileSync(cfgFile(), JSON.stringify({ ...cfg(), ...o })); } catch (e) {} };
const bases = [process.env['ProgramFiles'], process.env['ProgramFiles(x86)'], path.join(os.homedir(), 'AppData', 'Local', 'Programs')].filter(Boolean);
const first = l => l.find(p => fs.existsSync(p));
const onPath = name => {
  if (process.platform !== 'win32') return null;
  try { const r = spawnSync('where', [name], { encoding: 'utf8', windowsHide: true }); const p = (r.stdout || '').split(/\r?\n/).find(Boolean); return p && fs.existsSync(p) ? p : null; } catch (e) { return null; }
};
const findAhk = () => {
  const c = cfg().ahk; if (c && fs.existsSync(c)) return c;
  return first(bases.flatMap(b => ['AutoHotkey64.exe', 'AutoHotkey32.exe', 'AutoHotkey.exe'].map(n => path.join(b, 'AutoHotkey', 'v2', n)))) || onPath('AutoHotkey64.exe');
};
const findCompiler = () => {
  const c = cfg().compiler; if (c && fs.existsSync(c)) return c;
  const near = []; const a = findAhk();
  if (a) { near.push(path.join(path.dirname(a), 'Compiler', 'Ahk2Exe.exe'), path.join(path.dirname(path.dirname(a)), 'Compiler', 'Ahk2Exe.exe')); }
  return first([...near, ...bases.flatMap(b => [path.join(b, 'AutoHotkey', 'Compiler', 'Ahk2Exe.exe'), path.join(b, 'AutoHotkey', 'v2', 'Compiler', 'Ahk2Exe.exe')])]) || onPath('Ahk2Exe.exe');
};
async function ensureCompiler() {
  const p = findCompiler(); if (p) return p;
  const r = await dialog.showOpenDialog(win, { title: 'Find Ahk2Exe.exe (the AutoHotkey compiler)', filters: [{ name: 'Ahk2Exe', extensions: ['exe'] }], properties: ['openFile'] });
  if (r.canceled) return null;
  setCfg({ compiler: r.filePaths[0] }); return r.filePaths[0];
}
async function ensureAhk() {
  const p = findAhk(); if (p) return p;
  const r = await dialog.showOpenDialog(win, { title: 'Find AutoHotkey v2 (AutoHotkey64.exe)', filters: [{ name: 'Program', extensions: ['exe'] }], properties: ['openFile'] });
  if (r.canceled) return null;
  setCfg({ ahk: r.filePaths[0] }); return r.filePaths[0];
}
const tmpFile = (code, name = 'run.ahk') => {
  const d = path.join(os.tmpdir(), 'nexo-ahks'); fs.mkdirSync(d, { recursive: true });
  const f = path.join(d, name); fs.writeFileSync(f, code); return f;
};
const NOAHK = 'AutoHotkey v2 not found. Install it from autohotkey.com (Windows only).';
const readText = f => { const b = fs.readFileSync(f); if (b[0] === 0xFF && b[1] === 0xFE) return b.slice(2).toString('utf16le'); return b.toString('utf8').replace(/^\ufeff/, ''); };

// errors become values the UI can show instead of silent failures
const handle = (name, fn, onErr) => ipcMain.handle(name, async (_, ...a) => { try { return await fn(...a); } catch (e) { return onErr(e); } });
const E = e => ({ err: String((e && e.message) || e) });
const ES = e => 'Error: ' + String((e && e.message) || e);

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
  const file = (o.file && fs.existsSync(o.file)) ? o.file : tmpFile(o.code || '', 's_' + String(o.id).replace(/\W/g, '') + '.ahk');
  const keep = prefs().keepRunning;
  const child = spawn(exe, [file], { cwd: path.dirname(file), detached: keep, stdio: 'ignore' });
  if (keep) child.unref();
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
handle('read-file', p => { if (fs.statSync(p).size > 5e6) throw new Error('That file is too big'); return readText(p); }, E);
handle('reveal', p => { shell.showItemInFolder(p); return true; }, E);
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
  let script = o.file;
  if (!script) { fs.mkdirSync(path.dirname(mine), { recursive: true }); fs.writeFileSync(mine, o.code || ''); script = mine; }
  shell.writeShortcutLink(lnk, 'create', { target: exe, args: '"' + script + '"', cwd: path.dirname(script), description: 'Nexo Ahks: ' + safe });
  return { ok: true, path: lnk };
}, E);

handle('compile', async (code, name) => {
  if (process.platform !== 'win32') return 'Compiling needs Windows and AutoHotkey v2.';
  const exe = await ensureAhk(); if (!exe) return NOAHK;
  const comp = await ensureCompiler();
  if (!comp) return 'Ahk2Exe not found. Reinstall AutoHotkey v2 and tick the compiler option, or pick Ahk2Exe.exe when asked.';
  const r = await dialog.showSaveDialog(win, { defaultPath: (name || 'script').replace(/[\\/:*?"<>|]/g, '_') + '.exe', filters: [{ name: 'Executable', extensions: ['exe'] }] });
  if (r.canceled) return null;
  const src = tmpFile(code, 'compile.ahk');
  return new Promise(res => {
    let out = '', done = false;
    const fin = m => { if (done) return; done = true; clearTimeout(tm); res(m); };
    const ps = spawn(comp, ['/in', src, '/out', r.filePath, '/base', exe, '/silent', 'verbose'], { windowsHide: true });
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
  const f = tmpFile(REC, 'rec.ahk');
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
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.on('close', e => {
    try { setCfg({ bounds: win.getBounds() }); } catch (x) {}
    if (!quitting && prefs().closeToTray) { e.preventDefault(); win.hide(); }
  });
  try { let ti = nativeImage.createFromPath(path.join(__dirname, 'renderer', 'tray.png')); if (ti.isEmpty()) ti = nativeImage.createFromDataURL(TRAY_ICON); tray = new Tray(ti.resize({ width: 16, height: 16 })); tray.on('click', showWin); updateTray(); } catch (e) {}
  win.webContents.once('did-finish-load', () => setTimeout(() => openArg(process.argv), 500));
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
});
app.on('before-quit', () => { quitting = true; if (!prefs().keepRunning) procs.forEach(c => { try { c.kill(); } catch (e) {} }); });
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { if (rec) rec.kill(); app.quit(); });
