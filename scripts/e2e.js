// End-to-end smoke test: starts the REAL app (main.js + preload + window) in Electron and drives it through the real
// IPC bridge. Run:  npx electron scripts/e2e.js     (on Linux: xvfb-run -a npx electron --no-sandbox scripts/e2e.js)
const { app, BrowserWindow } = require('electron');
const fs = require('fs'), os = require('os'), path = require('path');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nexo-e2e-'));
process.env.NEXO_USER_DATA = path.join(tmp, 'userData'); // never touch the real profile
require('../main.js');
const fail = [], ok = (c, m) => { if (!c) fail.push(m); };
const wait = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(async () => {
  await wait(2500);
  const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
  if (!win) { console.log('E2E FAILED: the app opened no window'); return app.exit(1); }
  const errors = []; win.webContents.on('console-message', (e, level, msg) => { if (level >= 3) errors.push(msg); });
  const run = js => win.webContents.executeJavaScript(js);
  try {
    win.webContents.reload(); await wait(2500);
    await run("try{localStorage.setItem('nexoTutSeen','1')}catch(e){}");
    ok(await run("typeof window.api === 'object'"), 'the preload bridge (window.api) exists');
    const names = await run("Object.keys(window.api)");
    for (const n of ['runScript', 'compile', 'screenTool', 'pickFile', 'diagnostics', 'reportError', 'libLoad', 'libSave']) ok(names.includes(n), 'window.api.' + n + ' is exposed');
    // self-check through the real IPC
    const diag = await run("window.api.diagnostics()");
    ok(Array.isArray(diag) && diag.length >= 7 && diag.every(x => x.id && x.label && ['ok', 'warn', 'bad'].includes(x.status)), 'diagnostics returns a proper report over IPC: ' + JSON.stringify(diag).slice(0, 160));
    ok(!diag.some(x => /The check itself failed/.test(x.detail)), 'no self-check item crashed: ' + diag.filter(x => /itself failed/.test(x.detail)).map(x => x.id + ':' + x.detail).join(';'));
    const byId = Object.fromEntries(diag.map(x => [x.id, x]));
    ok(byId.data && byId.data.status === 'ok' && byId.tmp && byId.tmp.status === 'ok', 'data and temp folders are writable');
    ok(byId.screen && byId.screen.status === 'ok', 'screen capture works in the real app: ' + (byId.screen && byId.screen.detail));
    // editor errors reach the crash log
    await run("window.api.reportError('e2e editor error ' + 42)"); await wait(400);
    const log = path.join(tmp, 'userData', 'crash.log');
    ok(fs.existsSync(log) && /e2e editor error 42/.test(fs.readFileSync(log, 'utf8')), 'an editor error is written to crash.log (userData has: ' + (fs.existsSync(path.join(tmp, 'userData')) ? fs.readdirSync(path.join(tmp, 'userData')).join(',') : 'nothing') + '; app says ' + app.getPath('userData') + ')');
    // library round trip through the real handlers
    const libSaved = await run("(async()=>{await window.api.libSave([{id:'e2e1',name:'E2E',kind:'blocks',data:{x:1}}]);return JSON.stringify(await window.api.libLoad())})()");
    ok(/E2E/.test(libSaved) && /e2e1/.test(libSaved), 'the library saves and loads through IPC: ' + String(libSaved).slice(0, 120));
    // the page really works: build a script, open Try it, click its button
    await run("(()=>{tutEnd();newTab('E2E');GUI=newGui();GUI.ctl=[];SET={...DS};root.kids=[S('func',{n:'Hi'},[S('msg',{s:'hello e2e'})]),S('guishow',{})];addCtl('Button');real()[0].fn='Hi';render();liveOpen()})()");
    await wait(300);
    ok(await run("!document.getElementById('live').hidden && !!document.querySelector('#lv-cl button')"), 'Try it opens with the button in the real app');
    await run("document.querySelector('#lv-cl button').click()"); await wait(200);
    ok(/hello e2e/.test(await run("document.getElementById('lv-log').textContent")), 'clicking the button runs its handler in Try it');
    await run('liveClose()');
    // compile dialog opens with the script name
    await run("setView('blocks');document.getElementById('cmp').click()"); await wait(200);
    ok(await run("document.getElementById('cdlg').open && document.getElementById('cd-name').value === 'E2E'"), 'the compile dialog opens in the real app');
    await run("document.getElementById('cd-x').click()");
    ok(errors.length === 0, 'the page logged no errors: ' + errors.slice(0, 3).join(' | '));
  } catch (e) { fail.push('e2e threw: ' + (e && e.message)); }
  console.log(fail.length ? 'E2E FAILED\n - ' + fail.join('\n - ') : 'e2e ok');
  app.exit(fail.length ? 1 : 0);
});
