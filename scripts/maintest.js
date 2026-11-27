// Loads main.js with a fake "electron" so start-up mistakes (use-before-define, missing names) are caught without Windows.
const Module = require('module'), path = require('path'), os = require('os'), fs = require('fs');
const calls = { handlers: new Set(), fns: {}, ready: [], windows: 0, boxes: [], clip: [] };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nexo-main-'));
const mkProxy = (name) => new Proxy(function () {}, { get: (t, k) => k === 'then' ? undefined : k === Symbol.toPrimitive ? () => name : mkProxy(name + '.' + String(k)), apply: () => mkProxy(name + '()'), construct: () => mkProxy('new ' + name) });
class FakeWin { constructor() { calls.windows++; this.webContents = { on() {}, once(e, f) { if (e === 'did-finish-load') setTimeout(f, 0); }, send() {}, setWindowOpenHandler() {}, openDevTools() {}, getURL: () => '' }; }
  loadFile() {} on() {} once() {} show() {} hide() {} focus() {} restore() {} minimize() {} isMinimized() { return false; } isDestroyed() { return false; } isVisible() { return true; } setTitle() {} setIcon() {} static getAllWindows() { return []; } }
const app = { requestSingleInstanceLock: () => true, setPath() {}, setName() {}, getPath: n => n === 'appData' ? tmp : path.join(tmp, n), getVersion: () => '1.0.0', whenReady: () => ({ then: f => { calls.ready.push(f); return Promise.resolve(); } }), on() {}, once() {}, quit() {}, exit() {}, isPackaged: false, setLoginItemSettings() {}, dock: { hide() {} } };
const electron = { app, BrowserWindow: FakeWin, ipcMain: { handle: (n, f) => { calls.handlers.add(n); calls.fns[n] = f; }, on: (n, f) => { calls.handlers.add(n); calls.fns[n] = f; }, removeListener() {} }, clipboard: { writeText: s => calls.clip.push(s) }, dialog: new Proxy(mkProxy('dialog'), { get: (t0, k) => k === 'showMessageBoxSync' ? (...a) => { calls.boxes.push(a); return 0; } : t0[k] }), Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({}) }, Tray: class { setToolTip() {} setContextMenu() {} on() {} destroy() {} }, nativeImage: { createFromPath: () => ({ isEmpty: () => false, resize() { return this; } }), createFromDataURL: () => ({ isEmpty: () => false, resize() { return this; } }), createEmpty: () => ({}) }, shell: mkProxy('shell'), globalShortcut: { register: () => true, unregister() {}, unregisterAll() {} }, screen: mkProxy('screen'), desktopCapturer: mkProxy('desktopCapturer'), net: { fetch: async () => ({ ok: false }) }, contextBridge: { exposeInMainWorld() {} }, ipcRenderer: mkProxy('ipcRenderer') };
const orig = Module._load;
Module._load = function (req, ...r) { return req === 'electron' ? electron : orig.call(this, req, ...r); };
let fail = [];
try { require(path.join(__dirname, '..', 'main.js')); } catch (e) { fail.push('main.js crashed while loading: ' + e.message); }
try { for (const f of calls.ready) f(); } catch (e) { fail.push('main.js crashed in app.whenReady: ' + e.message); }
try { require(path.join(__dirname, '..', 'preload.js')); } catch (e) { fail.push('preload.js crashed: ' + e.message); }
const need = ['open-url', 'compile', 'run-script', 'rec-start', 'pick', 'screen-tool', 'pick-file', 'diagnostics', 'renderer-error', 'save-project', 'lib-save', 'tool-paths', 'tool-set', 'tool-reset', 'tool-download', 'update-download', 'update-install', 'read-file', 'set-prefs'];
const missing = need.filter(n => !calls.handlers.has(n));
if (missing.length) fail.push('IPC handlers missing: ' + missing.join(', '));
// the friendly crash dialog: shows once, writes a log, and the app keeps running
const crashFile = path.join(tmp, 'userData', 'crash.log');
try { process.emit('uncaughtException', new Error('test boom')); process.emit('uncaughtException', new Error('test boom')); } catch (e) { fail.push('crash handler threw: ' + e.message); }
if (calls.boxes.length !== 1) fail.push('crash dialog should show exactly once for a repeated error, shown ' + calls.boxes.length);
else { const o = calls.boxes[0][1] || calls.boxes[0][0]; if (!o || !/keep going/i.test((o.buttons || []).join())) fail.push('crash dialog has no "Keep going" button'); }
if (!fs.existsSync(crashFile) || !/test boom/.test(fs.readFileSync(crashFile, 'utf8'))) fail.push('crash was not written to crash.log');
try { calls.fns['renderer-error']({}, 'editor said oops'); if (!/editor said oops/.test(fs.readFileSync(crashFile, 'utf8'))) fail.push('renderer errors are not logged'); } catch (e) { fail.push('renderer-error handler threw: ' + e.message); }
// the self-check returns a readable report even when pieces are missing
Promise.resolve().then(() => calls.fns['diagnostics']({})).then(r => { if (!Array.isArray(r) || r.length < 5 || !r.every(x => x.id && x.label && ['ok', 'warn', 'bad'].includes(x.status))) fail.push('self-check did not return a proper report: ' + JSON.stringify(r).slice(0, 200)); else { const bad = r.filter(x => /The check itself failed/.test(x.detail)); if (bad.length) fail.push('self-check items crashed: ' + bad.map(x => x.id + ' ' + x.detail).join('; ')); } }).catch(e => fail.push('self-check threw: ' + e.message)).then(() => {
// ---- program locations, file lockdown, config recovery (all without Windows) ----
const userData = path.join(tmp, 'userData');
Promise.resolve().then(async () => {
  const tp = await calls.fns['tool-paths']({});
  if (!tp || !('ahk' in tp) || !('compiler' in tp) || !('ahkSaved' in tp) || !('compilerSaved' in tp)) fail.push('tool-paths returns the wrong shape: ' + JSON.stringify(tp));
  const bad = await calls.fns['tool-reset']({}, 'nonsense'); if (!bad || !bad.err) fail.push('tool-reset accepts an unknown program');
  const ok1 = await calls.fns['tool-reset']({}, 'ahk'); if (!ok1 || !ok1.ok) fail.push('tool-reset ahk failed');
  const badSet = await calls.fns['tool-set']({}, 'nonsense'); if (!badSet || !badSet.err) fail.push('tool-set accepts an unknown program');
  // only script files can be read, and only with absolute paths
  const secret = path.join(tmp, 'secret.txt'); fs.writeFileSync(secret, 'top secret');
  const r1 = await calls.fns['read-file']({}, secret); if (!r1 || !r1.err) fail.push('read-file will read a .txt file');
  const r2 = await calls.fns['read-file']({}, 'relative.ahk'); if (!r2 || !r2.err) fail.push('read-file accepts a relative path');
  const good = path.join(tmp, 'ok.ahk'); fs.writeFileSync(good, 'F1::ExitApp');
  const r3 = await calls.fns['read-file']({}, good); if (r3 !== 'F1::ExitApp') fail.push('read-file cannot read a normal .ahk file: ' + JSON.stringify(r3));
  // a page that is not the app (not file://) is turned away
  const r4 = await calls.fns['read-file']({ senderFrame: { url: 'https://evil.example/' } }, good); if (!r4 || !r4.err) fail.push('IPC accepts a call from a web page');
  // config: written atomically, and a damaged file is kept as config.json.bad instead of being wiped
  fs.mkdirSync(userData, { recursive: true });
  await calls.fns['set-prefs']({}, { closeToTray: true, keepRunning: false });
  const cf = path.join(userData, 'config.json');
  if (!fs.existsSync(cf) || JSON.parse(fs.readFileSync(cf, 'utf8')).closeToTray !== true) fail.push('config.json was not written');
  if (fs.existsSync(cf + '.tmp')) fail.push('config.json.tmp left behind');
  fs.writeFileSync(cf, '{ this is not json');
  await calls.fns['set-prefs']({}, { closeToTray: false, keepRunning: true });
  if (!fs.existsSync(cf + '.bad') || !/not json/.test(fs.readFileSync(cf + '.bad', 'utf8'))) fail.push('a damaged config.json was not kept as config.json.bad');
  try { JSON.parse(fs.readFileSync(cf, 'utf8')); } catch (e) { fail.push('config.json is not valid after recovery'); }
}).catch(e => fail.push('program-location checks crashed: ' + e.message));
setTimeout(() => { console.log(fail.length ? 'FAILED\n - ' + fail.join('\n - ') : 'main.js loads fine (' + calls.handlers.size + ' IPC handlers, ' + calls.windows + ' window)'); process.exit(fail.length ? 1 : 0); }, 50); });
