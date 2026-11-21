// Layout test in a real Electron (Chromium) window, offscreen. Run:  npx electron scripts/uitest.js
// Checks the toolbar/header stay on one row, nothing scrolls sideways, no button text is cut off, in light and dark,
// at 1500px and 1100px wide, in every view. Saves screenshots to ui-shots/ and exits 1 if anything is wrong.
const { app, BrowserWindow } = require('electron');
const fs = require('fs'), path = require('path');
const layoutChecks = require('./layout-checks.js');
app.disableHardwareAcceleration();
const wait = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(async () => {
  const out = path.join(__dirname, '..', 'ui-shots'); fs.mkdirSync(out, { recursive: true });
  const win = new BrowserWindow({ show: false, width: 1500, height: 900, useContentSize: true, webPreferences: { offscreen: true, contextIsolation: true, sandbox: true } });
  const run = js => win.webContents.executeJavaScript(js);
  let total = 0; const bad = [];
  try {
    await win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html')); await wait(1200);
    await run("try{localStorage.setItem('nexoTutSeen','1')}catch(e){}");
    if (process.argv.includes('--break')) await run("(()=>{const c=document.createElement('style');c.textContent='#bar .lb,#bar .lb2{display:inline!important}#bar button{padding:6px 30px!important}';document.head.append(c)})()"); // proves the test can fail
    for (const width of [1500, 1100]) {
      win.setContentSize(width, 900); await wait(500);
      for (const theme of ['dark', 'light']) {
        await run(`document.documentElement.dataset.theme='${theme}'`);
        for (const view of ['home', 'blocks', 'ui', 'code']) {
          if (view === 'home') await run("(()=>{const t=document.querySelector('#tabs .tab');if(t)t.click()})()");
          else await run(`document.querySelector('#views button[data-v="${view}"]').click()`);
          await wait(700);
          const cur = await run("document.getElementById('main').dataset.v");
          const probs = await run('(' + layoutChecks.toString() + ')()');
          if (cur !== view) probs.unshift('The view did not switch (wanted ' + view + ', got ' + cur + ')');
          const key = `${width}px ${theme} ${view}`; total++;
          const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(out, `${width}_${theme}_${view}.png`), img.toPNG());
          if (probs.length) bad.push(key + ': ' + probs.join(' | '));
        }
      }
    }
  } catch (e) { bad.push('The layout test itself failed: ' + (e && e.message)); }
  console.log(bad.length ? 'LAYOUT PROBLEMS (' + bad.length + ' of ' + total + ')\n - ' + bad.join('\n - ') : 'layout ok (' + total + ' combinations)');
  app.exit(bad.length ? 1 : 0);
});
