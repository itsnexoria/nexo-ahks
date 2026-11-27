// Unit tests for the screen tools: the pure helpers and the overlay page (drag, point, cancel) without Electron.
const fs = require('fs'), path = require('path');
const SU = require('../screen-util');
const { JSDOM } = require('jsdom');
const fail = []; const ok = (c, m) => { if (!c) fail.push(m); };
// --- helpers
ok(JSON.stringify(SU.clampRect({ x: -5, y: 10, w: 9999, h: 0 }, 200, 100)) === '{"x":0,"y":10,"w":200,"h":1}', 'clampRect clamps to the image and keeps at least 1px');
ok(JSON.stringify(SU.clampRect({ x: 190, y: 90, w: 50, h: 50 }, 200, 100)) === '{"x":190,"y":90,"w":10,"h":10}', 'clampRect never leaves the image');
const bm = Buffer.alloc(2 * 2 * 4); bm.set([0x33, 0x22, 0x11, 255], 4); // pixel (1,0) = B33 G22 R11
ok(SU.colorAt(bm, 2, 2, 1, 0) === '0x112233', 'colorAt converts BGRA to 0xRRGGBB');
ok(SU.colorAt(bm, 2, 2, 99, 99) === '0x000000', 'colorAt clamps out-of-range points');
ok(JSON.stringify(SU.originOf({ bounds: { x: 100, y: 50 }, scaleFactor: 1.5 }, false)) === '{"x":150,"y":75}', 'origin scales on non-Windows');
ok(JSON.stringify(SU.originOf({ bounds: { x: 100, y: 50 }, scaleFactor: 2 }, true, q => ({ x: q.x * 2, y: q.y * 2 }))) === '{"x":200,"y":100}', 'origin uses dipToScreenPoint on Windows');
// --- overlay page
const html = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'capture.html'), 'utf8');
function page() {
  const out = { res: undefined, init: null };
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => null; w.cap = { onInit(f) { out.init = f; }, done(r) { out.res = r; } }; } });
  out.w = dom.window; return out;
}
const mouse = (w, type, x, y, button = 0) => w.dispatchEvent(new w.MouseEvent(type, { clientX: x, clientY: y, button, bubbles: true, cancelable: true }));
{ const p = page(), w = p.w; p.init({ mode: 'region', w: w.innerWidth * 2, h: w.innerHeight * 2, img: '' });
  mouse(w, 'mousedown', 10, 20); mouse(w, 'mousemove', 60, 70); mouse(w, 'mouseup', 60, 70);
  ok(JSON.stringify(p.res) === '{"x":20,"y":40,"w":100,"h":100}', 'region drag returns the box in screenshot pixels (2x scale): ' + JSON.stringify(p.res)); }
{ const p = page(), w = p.w; p.init({ mode: 'region', w: w.innerWidth, h: w.innerHeight, img: '' });
  mouse(w, 'mousedown', 70, 70); mouse(w, 'mousemove', 72, 71); mouse(w, 'mouseup', 72, 71);
  ok(p.res === undefined, 'a tiny drag is ignored');
  mouse(w, 'mousedown', 100, 100); mouse(w, 'mousemove', 40, 30); mouse(w, 'mouseup', 40, 30);
  ok(JSON.stringify(p.res) === '{"x":40,"y":30,"w":60,"h":70}', 'dragging up-left still gives a normal box: ' + JSON.stringify(p.res)); }
{ const p = page(), w = p.w; p.init({ mode: 'point', w: w.innerWidth, h: w.innerHeight, img: '' });
  mouse(w, 'mousemove', 33, 44); mouse(w, 'mousedown', 33, 44); mouse(w, 'mouseup', 33, 44);
  ok(p.res && p.res.x === 33 && p.res.y === 44, 'point mode returns the clicked pixel'); }
{ const p = page(), w = p.w; p.init({ mode: 'color', w: w.innerWidth, h: w.innerHeight, img: '' });
  w.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  ok(p.res === null, 'Esc cancels'); }
{ const p = page(), w = p.w; p.init({ mode: 'point', w: w.innerWidth, h: w.innerHeight, img: '' });
  w.dispatchEvent(new w.MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
  ok(p.res === null, 'right-click cancels'); }
// --- renderer buttons (with a stubbed desktop api)
(async () => {
  const calls = [];
  const shots = { region: { path: 'C:\\caps\\cap.png', x: 5, y: 6, w: 30, h: 20, preview: 'data:image/png;base64,AA==' }, color: { x: 1, y: 2, c: '0x112233' }, point: { x: 321, y: 654, c: '0xABCDEF' } };
  const noop = () => Promise.resolve(null);
  const compileCalls = [], reported = [];
  const screenTool = async m => { calls.push(m); return shots[m]; };
  const diag = async () => [{ id: 'ahk', label: 'AutoHotkey v2', status: 'ok', detail: 'found' }, { id: 'comp', label: 'Compiler', status: 'warn', detail: 'missing', fix: 'Reinstall with the compiler' }, { id: 'screen', label: 'Screen capture', status: 'bad', detail: 'blocked', fix: 'Allow screen recording' }];
  const named = { screenTool, compile: async (c, n, o) => { compileCalls.push([c, n, o]); return 'Saved x.exe'; }, pickFile: async () => 'C:\\icons\\my.ico', diagnostics: diag, reportError: t => reported.push(t) };
  const api = new Proxy({}, { get: (_, k) => named[k] || noop });
  const dom = new JSDOM(require('./page-util').pageHtml(), { runScripts: 'dangerously', url: 'http://localhost/index.html', pretendToBeVisual: true,
    beforeParse(w) { w.api = api; w.matchMedia = () => ({ matches: false, addListener() {}, addEventListener() {} }); w.HTMLDialogElement.prototype.showModal = function () { this.open = true; }; w.HTMLDialogElement.prototype.close = function () { this.open = false; }; w.HTMLElement.prototype.scrollIntoView = function () {}; } });
  const w = dom.window, ev = s => w.eval(s), wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(900);
  ev(`tutEnd();newTab('S');root.kids=[S('hotkey',{key:'F1'},[S('ifimg',{}),S('ifcolor',{}),S('ifpix',{}),S('move',{})])];render()`);
  const btn = (id, ic) => [...w.document.querySelectorAll('.blk[data-id="' + id + '"] > .row button.x')].find(b => b.textContent === ic);
  const ids = ev(`root.kids[0].kids.map(b=>b.id)`);
  ok(btn(ids[0], '📷') && btn(ids[1], '🎨') && btn(ids[2], '🎨') && btn(ids[3], '🎯'), 'blocks show the camera, color and target buttons');
  btn(ids[0], '📷').click(); await wait(50);
  ok(ev(`root.kids[0].kids[0].v.${'f'}`) === 'C:\\caps\\cap.png' || ev(`Object.values(root.kids[0].kids[0].v).includes('C:\\\\caps\\\\cap.png')`), 'camera button stores the saved picture path');
  ok(!!w.document.querySelector('.blk[data-id="' + ids[0] + '"] img.cpv'), 'a small preview of the capture is shown');
  btn(ids[1], '🎨').click(); await wait(50);
  ok(ev(`Object.values(root.kids[0].kids[1].v).includes('0x112233')`), 'color button stores the picked color');
  btn(ids[3], '🎯').click(); await wait(50);
  ok(ev(`root.kids[0].kids[3].v.x`) === '321' && ev(`root.kids[0].kids[3].v.y`) === '654', 'target button stores the picked point');
  ok(calls.join() === 'region,color,point', 'buttons ask for the right tool: ' + calls.join());
  ok(ev(`lint(build()).filter(x=>x.sev==='error').length`) === 0, 'blocks with captured values lint clean');
  // compile dialog
  ev(`tutEnd();newTab('Clicker');root.kids=[S('hotkey',{key:'F1'},[S('click',{})])];render();setView('blocks')`);
  ev(`localStorage.removeItem('nexoCompile');compileDlg()`);
  ok(ev(`document.getElementById('cdlg').open`) && ev(`document.getElementById('cd-name').value`) === 'Clicker' && ev(`document.getElementById('cd-ver').value`) === '1.0.0.0' && ev(`document.getElementById('cd-nx').checked`) === true, 'compile dialog opens with the script name, a default version and the Nexo icon ticked');
  ev(`(()=>{const q=i=>document.querySelector(i);q('#cd-name').value='Auto Clicker';q('#cd-ver').value='2.5';q('#cd-co').value='Nexoria';q('#cd-desc').value='Clicks things';q('#cd-cp').value='(c) 2026';q('#cd-ad').checked=true;q('#cd-ok').click()})()`);
  await wait(30);
  const cc = compileCalls[0];
  ok(cc && /^#Requires AutoHotkey v2\.0/.test(cc[0]) && /Click/.test(cc[0]) && cc[1] === 'Clicker' && cc[2].name === 'Auto Clicker' && cc[2].version === '2.5' && cc[2].company === 'Nexoria' && cc[2].description === 'Clicks things' && cc[2].copyright === '(c) 2026' && cc[2].admin === true && cc[2].useNexoIcon === true, 'OK sends the code and all the program details to the compiler: ' + JSON.stringify(cc && cc[2]));
  ok(ev(`document.getElementById('st').textContent`) === 'Saved x.exe', 'the compile result is shown in the status bar: ' + ev(`document.getElementById('st').textContent`));
  ev(`compileDlg()`);
  ok(ev(`document.getElementById('cd-co').value`) === 'Nexoria' && ev(`document.getElementById('cd-cp').value`) === '(c) 2026', 'company and copyright are remembered for next time');
  ev(`document.getElementById('cd-ic').click()`); await wait(30);
  ev(`document.getElementById('cd-ok').click()`); await wait(30);
  ok(compileCalls[1] && compileCalls[1][2].icon === 'C:\\icons\\my.ico' && compileCalls[1][2].useNexoIcon === false, 'choosing your own icon file replaces the Nexo icon: ' + JSON.stringify(compileCalls[1] && compileCalls[1][2]));
  // self-check
  ev(`document.getElementById('sc-go').click()`); await wait(50);
  const scRows = ev(`document.querySelectorAll('#sc-out tr').length`), scText = ev(`document.getElementById('sc-out').textContent`);
  ok(scRows >= 7 && /AutoHotkey v2/.test(scText) && /Compiler/.test(scText) && /How to fix: Reinstall with the compiler/.test(scText) && /How to fix: Allow screen recording/.test(scText) && /Try it \(simulator\)/.test(scText), 'self-check lists every item with fix hints for the problems: ' + scRows);
  ok(!/How to fix: found/.test(scText) && !ev(`document.getElementById('sc-copy').hidden`) && /❌ Screen capture/.test(ev(`document.getElementById('sc-out').dataset.report`)), 'working items show no fix, and a report is ready to copy');
  // error card
  ev(`window.dispatchEvent(new ErrorEvent('error',{message:'x is not defined',error:new Error('x is not defined')}))`);
  ok(ev(`!!document.getElementById('errc')`) && /x is not defined/.test(ev(`document.getElementById('errc').textContent`)) && reported.length === 1, 'an editor error shows a friendly card and is reported to the crash log');
  ev(`window.dispatchEvent(new ErrorEvent('error',{message:'x is not defined',error:new Error('x is not defined')}))`);
  ok(ev(`document.querySelectorAll('#errc').length`) === 1 && /2 times/.test(ev(`document.getElementById('errc').textContent`)), 'the same error is not stacked, it is counted');
  ev(`document.querySelector('#errc .pri').click()`);
  ok(ev(`!document.getElementById('errc')`), 'the card can be dismissed');
  ev(`window.dispatchEvent(new ErrorEvent('error',{message:'ResizeObserver loop limit exceeded'}))`);
  ok(ev(`!document.getElementById('errc')`), 'harmless browser noise does not trigger the card');
  console.log(fail.length ? 'SCREEN TOOLS FAILED\n - ' + fail.join('\n - ') : 'screen tools ok');
  process.exit(fail.length ? 1 : 0);
})();
