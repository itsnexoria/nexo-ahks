// Quick self-test of the block generator, the .ahk importer and the editor interactions.
// Run:  npm install  then  npm test
const path = require('path');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'index.html'), 'utf8');
const errs = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'file:///x/index.html', pretendToBeVisual: true, beforeParse(w) {
  w.matchMedia = () => ({ matches: false, addListener() {}, addEventListener() {} });
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true };
  w.HTMLDialogElement.prototype.close = function () { this.open = false };
  w.addEventListener('error', e => errs.push('page error: ' + e.message));
} });
const w = dom.window, ev = s => w.eval(s), fail = [];
const ok = (c, m) => { if (!c) fail.push(m) };
setTimeout(() => {
  // 1. every block generates clean code
  ev(`Object.keys(T)`).forEach(k => {
    const s = ev(`(()=>{try{return String(T['${k}'].gen(mk('${k}').v))}catch(e){return 'THROW '+e.message}})()`);
    ok(!/undefined|NaN|\[object|^THROW/.test(s), 'block ' + k + ' makes bad code: ' + s);
  });
  // 2. every block survives export -> import -> export, and imports as a real block (not a raw line)
  const rt = ev(`(()=>{const out=[];const norm=s=>s.split('\\n').map(l=>/^\\s*(if|while|else if)\\b/.test(l)?l.replace(/[()]/g,'').replace(/\\s+/g,' '):l).join('\\n').replace(/\\}\\n\\s*else/g,'} else');
    for(const k in T){if(k==='guislot'||k==='guilistset')continue;const b=mk(k);if(T[k].box)b.kids=[mk('wait')];
      root.kids=(T[k].glob||T[k].c==='event')?[b]:[S('hotkey',{key:'F1'},[b])];GUI=newGui();GUI.ctl=[];SET={...DS,panic:false};
      const c1=build(),r=parseAhk(c1);root.kids=r.kids;GUI=r.gui||newGui();SET=setFromParse(r.set);const c2=build();
      if(norm(c1)!==norm(c2))out.push(k+': code changed after import');else if(r.rawN)out.push(k+': imported as raw line')}
    return out})()`);
  rt.forEach(x => ok(false, 'round trip ' + x));
  // 3. templates are error free and round trip
  const tp = ev(`(()=>{const out=[];TPL.forEach(t=>{SET={...DS};GUI=newGui();GUI.ctl=[];root.kids=t.f();if(t.g){GUI=t.g();normGui(GUI)}
    const c=build();const e=lint(c).filter(x=>x.sev==='error');if(e.length)out.push(t.n+': '+e[0].msg);
    const r=parseAhk(c);if(r.rawN>1)out.push(t.n+': '+r.rawN+' raw lines')});return out})()`);
  tp.forEach(x => ok(false, 'template ' + x));
  // 4. importer special cases
  const imp = ev(`(()=>{const r=parseAhk('CapsLock::Ctrl\\nF1::ExitApp\\nClick "Left"\\nClick "Left 2"\\nMyFunc(a, b) {\\n  return a\\n}');return r.kids.map(k=>k.t).join(',')+'|raw:'+r.rawN})()`);
  ok(imp === 'remap,hotkey,click,mclick,funcp|raw:0', 'importer special cases: ' + imp);
  // 5. editor interactions
  ev(`newTab('T')`);
  const pb = n => [...w.document.querySelectorAll('#pal .pb')].find(b => b.textContent === n);
  pb('When key pressed').click(); pb('Click').click(); pb('Wait').click();
  const shape = () => ev(`root.kids.map(k=>k.t+'['+k.kids.map(x=>x.t)+']').join(',')`);
  ok(shape() === 'hotkey[click,wait]', 'click-to-add flow: ' + shape());
  w.document.body.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
  ok(shape() === 'hotkey[click]', 'Delete key: ' + shape());
  w.document.body.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'd', ctrlKey: true, bubbles: true }));
  ok(shape() === 'hotkey[click,click]', 'Ctrl+D: ' + shape());
  const ta = w.document.createElement('textarea'); w.document.body.append(ta); ev(`view='code'`);
  const e = new w.KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true }); ta.dispatchEvent(e);
  ok(!e.defaultPrevented, 'Ctrl+Z must stay with the code editor'); ev(`view='blocks'`);
  // 6. copy / paste blocks
  w.document.body.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));
  w.document.body.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true }));
  ok(shape() === 'hotkey[click,click,click]', 'Ctrl+C / Ctrl+V: ' + shape());
  ok(ev(`new Set(root.kids[0].kids.map(k=>k.id)).size`) === 3, 'pasted block needs its own id');
  // 7. UI designer: multi-select, align, distribute, group drag
  ev(`setView('ui')`);
  ev(`addCtl('Button');addCtl('Button');addCtl('Button')`);
  ev(`(()=>{const r=real();[[10,10,50],[70,40,80],[200,25,60]].forEach((p,i)=>{r[i].x=p[0];r[i].y=p[1];r[i].w=p[2];r[i].h=20});renderUI();uMulti=new Set(r.map(c=>c.id));uSel=r[2].id;markSel();renderProps()})()`);
  ok(ev(`multi().length`) === 3, 'multi select');
  ev(`alignSel('l')`); ok(ev(`real().map(c=>c.x).join()`) === '10,10,10', 'align left: ' + ev(`real().map(c=>c.x).join()`));
  ev(`real()[0].x=10;real()[1].x=70;real()[2].x=200;alignSel('dh')`);
  const gx = ev(`real().map(c=>c.x)`); ok(gx[1] - (gx[0] + 50) === gx[2] - (gx[1] + 80), 'distribute gaps: ' + gx);
  ev(`alignSel('sw')`); ok(ev(`new Set(real().map(c=>c.w)).size`) === 1, 'same width');
  const ids = ev(`real().map(c=>c.id)`), before = ev(`real().map(c=>c.y)`);
  ev(`dragStart({preventDefault(){},clientX:0,clientY:0},real()[0],'m',document.querySelector('.uc[data-id="${ids[0]}"]'))`);
  w.dispatchEvent(new w.MouseEvent('pointermove', { clientX: 0, clientY: 30, altKey: true })); w.dispatchEvent(new w.MouseEvent('pointerup', {}));
  const after = ev(`real().map(c=>c.y)`); ok(after.every((y, i) => y === before[i] + 30), 'group drag moved all: ' + before + ' -> ' + after);
  ev(`delCtl()`); ok(ev(`real().length`) === 0, 'delete group');
  ev(`setView('blocks')`);
  console.log(errs.concat(fail).length ? 'FAILED\n - ' + errs.concat(fail).join('\n - ') : 'All self-tests passed (' + ev('Object.keys(T).length') + ' blocks)');
  process.exit(errs.concat(fail).length ? 1 : 0);
}, 900);
