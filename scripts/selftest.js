// Quick self-test of the block generator, the .ahk importer and the editor interactions.
// Run:  npm install  then  npm test
const path = require('path');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'index.html'), 'utf8');
const errs = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/index.html', pretendToBeVisual: true, beforeParse(w) {
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
  ev(`tutEnd()`);
  // 8. one-click lint fixes
  ev(`newTab('F');root.kids=[S('hotkey',{key:'F1'},[S('wait',{ms:'1'})]),S('hotkey',{key:'F1'},[S('call',{n:'Nope'})]),S('hotkey',{key:''},[S('wait')]),S('hotkey',{key:'Ctrl + J'},[S('wait')]),S('hotkey',{key:'F5'},[]),S('click'),S('func',{n:'A'}),S('func',{n:'A'}),S('set',{n:'1bad',v:'3'}),S('forever',{},[S('click')])];fixAll()`);
  ok(ev(`lint(build()).filter(x=>x.sev==='error').length`) === 0, 'Fix all clears every error');
  // 9. variables: rename everywhere (text in quotes stays)
  ev(`root.kids.splice(0,root.kids.length,S('hotkey',{key:'F1'},[S('set',{n:'count',v:'0'}),S('incr',{n:'count'}),S('msg',{s:'Total {count} of count'}),S('if',{c:'count > 3'},[S('text',{s:'count stays text'})])]));renameVar('count','clicks')`);
  const vj = ev(`JSON.stringify(root.kids)`);
  ok(/"n":"clicks"/.test(vj) && /\{clicks\}/.test(vj) && /clicks > 3/.test(vj) && /count stays text/.test(vj) && /of count/.test(vj), 'rename variable everywhere');
  // 10. versions + share round trip + drag block to another tab
  ev(`takeVersion('v1',false);root.kids.push(S('hotkey',{key:'F2'},[S('wait')]));takeVersion('',true)`);
  ev(`restore(TABS[cur].versions[0].d)`); ok(ev(`root.kids.length`) === 1, 'restore version');
  ok(ev(`(()=>{const p=JSON.stringify({kids:root.kids,gui:GUI,set:SET});const b=btoa(unescape(encodeURIComponent(p)));const t=build()+'\\n; ===NEXO-AHKS-BLOCKS v1 (x)===\\n'+b.match(/.{1,110}/g).map(l=>'; '+l).join('\\n')+'\\n; ===END===\\n';return JSON.stringify(unpackBlocks(t).kids)===JSON.stringify(root.kids)})()`) === true, 'share round trip');
  ev(`newTab('Other');root.kids.splice(0,root.kids.length,S('hotkey',{key:'F9'},[S('wait')]));render();renderTabs()`);
  const bid = ev(`root.kids[0].id`), tabEls = [...w.document.querySelectorAll('#tabs .tab:not(.home)')];
  const de = new w.Event('drop', { bubbles: true, cancelable: true }); de.dataTransfer = { getData: () => 'move:' + bid }; ev(`DRAG={id:'${bid}',t:'hotkey'}`);
  tabEls[ev(`cur`) === 0 ? 1 : 0].dispatchEvent(de);
  ok(ev(`root.kids.length`) === 0 && ev(`TABS.some((t,i)=>i!==cur&&t.kids.some(k=>k.v&&k.v.key==='F9'))`), 'drag block to another tab');
  // 11. recorder: drags become drag blocks, long pauses are trimmed
  const rc = ev(`recToBlocks(['0|D|Left|100|100','30|U|Left|100|100','4000|D|Left|200|200','200|U|Left|420|300'].join('\\n'),{delay:true,cap:2000}).map(b=>b.t+(b.v.ms||'')).join()`);
  ok(rc === 'click,wait2000,drag', 'recorder: ' + rc);
  // 12. UI designer: anchors, themes, layout, resize handles, jumps
  ev(`newTab('U');setView('ui');addCtl('Edit');addCtl('Button');addCtl('Button')`);
  ev(`(()=>{const r=real();r[0].n='name1';r[1].n='go';r[2].n='cancel';r[0].x=20;r[0].y=20;r[0].w=300;r[1].x=220;r[1].y=240;r[2].x=300;r[2].y=100;r[0].aw=true;r[0].hw=1;r[1].ar=true;r[1].ab=true;optToggle(GUI,'+Resize',true);renderUI();code()})()`);
  let ac = ev(`build()`); ok(/name1\.Move\(, , 300 \+ dx\)/.test(ac) && /go\.Move\(220 \+ dx, 240 \+ dy\)/.test(ac), 'anchors generate code');
  ev(`(()=>{const r=parseAhk(build());root.kids=r.kids;GUI=r.gui;normGui(GUI);SET=setFromParse(r.set)})()`);
  ac = ev(`build()`); ok((ac.match(/_Anchor\(g, mm, w, h\)/g) || []).length === 1 && /name1\.Move\(, , 300 \+ dx\)/.test(ac), 'anchors survive import without duplicates');
  ev(`applyTheme('dark');applyTheme('dark')`); ac = ev(`build()`);
  ok(/BackColor := "1c1d23"/.test(ac) && (ac.match(/DwmSetWindowAttribute/g) || []).length === 1, 'dark theme');
  ev(`applyTheme('')`); ok(!/DwmSet|BackColor/.test(ev(`build()`)), 'theme removed'); ev(`applyFontPack('code')`); ok(/Consolas/.test(ev(`build()`)), 'font pack');
  ev(`uMulti=new Set();stackCtls('v',10)`); const sy = ev(`real().map(c=>c.y).sort((a,b)=>a-b)`); ok(sy[1] > sy[0] && sy[2] > sy[1], 'stack vertically');
  ev(`fitWindow(20)`); ok(ev(`Math.min(...real().map(c=>c.x))`) === 20 && ev(`GUI.w`) === ev(`Math.max(...real().map(c=>c.x+c.w))+20`), 'equal padding');
  ev(`GUI.w=400;GUI.h=300;renderUI()`); const hh = w.document.querySelectorAll('.win-rs'); ok(hh.length === 3, 'resize handles');
  hh[2].dispatchEvent(new w.MouseEvent('pointerdown', { clientX: 0, clientY: 0, bubbles: true, cancelable: true }));
  w.dispatchEvent(new w.MouseEvent('pointermove', { clientX: 50, clientY: 30 })); w.dispatchEvent(new w.MouseEvent('pointerup', {}));
  ok(ev(`GUI.w`) >= 440 && ev(`GUI.h`) >= 320, 'drag window corner');
  ev(`setView('blocks');root.kids.push(S('setctl',{c:'go'}));render();jumpCtl('go')`); ok(ev(`view`) === 'ui', 'jump block -> control');
  // 13. tour
  ev(`startTutorial()`); const pbt = n => [...w.document.querySelectorAll('#pal .pb')].find(b => b.textContent === n);
  ev(`tutI=1;tutShow()`); pbt('When key pressed').click(); ev(`tutTick()`); pbt('Click').click(); ev(`tutTick()`); pbt('Wait').click(); ev(`tutTick()`);
  ok(ev(`tutI`) === 4, 'tour follows your clicks'); ev(`tutEnd()`);
  // 14. favorites, recent, plain-English summary, test block, v1 import
  ev(`toggleFav('wait')`); ok(ev(`FAVS.includes('wait')`) && w.document.querySelector('#paltop .pb.fav'), 'favorite pinned');
  ev(`toggleFav('wait')`); ok(!ev(`FAVS.includes('wait')`), 'favorite removed');
  ev(`newTab('P');root.kids.splice(0,root.kids.length,S('hotkey',{key:'F4'},[S('click'),S('wait',{ms:'50'})]));render()`);
  ok(/F4/.test(ev(`plain(root.kids[0])`)) === false && /Wait 50 ms/.test(ev(`plain(root.kids[0])`)), 'plain English: ' + ev(`plain(root.kids[0])`));
  ok(/Sleep 3000/.test(ev(`testCode(root.kids[0])`)) && !/F4::/.test(ev(`testCode(root.kids[0])`)) && ev(`root.kids.length`) === 1, 'test block code');
  const v1c = ev(`v1to2('#NoEnv\\nF1::\\n  Send, Hello\\n  Sleep, 100\\nreturn\\n').text`);
  ok(/F1::\{\n  Send "Hello"\n  Sleep 100\n\}/.test(v1c), 'v1 -> v2: ' + v1c);
  console.log(errs.concat(fail).length ? 'FAILED\n - ' + errs.concat(fail).join('\n - ') : 'All self-tests passed (' + ev('Object.keys(T).length') + ' blocks)');
  process.exit(errs.concat(fail).length ? 1 : 0);
}, 900);
