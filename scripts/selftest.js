// Quick self-test of the block generator, the .ahk importer and the editor interactions.
// Run:  npm install  then  npm test
const path = require('path');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'index.html'), 'utf8');
const errs = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/index.html', pretendToBeVisual: true, beforeParse(w) { w.eval(require('fs').readFileSync(require('path').join(__dirname, '..', 'renderer', 'sim.js'), 'utf8'));
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
  // 15. text with quotes / new lines survives export -> import; new UI presets; new blocks
  ev(`root.kids=[S('hotkey',{key:'F1'},[S('msg',{s:'a\\nb\\tc "q"'})])]`);
  ok(ev(`(()=>{const r=parseAhk(build());return r.kids[0].kids[0].t==='msg'&&r.kids[0].kids[0].v.s==='a\\nb\\tc "q"'})()`), 'new lines and quotes round trip');
  ok(ev(`(()=>{GUI=newGui();GUI.ctl=[];root.kids=[S('guislot')];GUI.title='Say "hi"\\nnow';addCtl('Text');real()[0].text='x"y\\nz';real()[0].arg=ctlArg(real()[0]);return !/\\n\\s*now/.test(build())})()`), 'window and control text with new lines stays on one line');
  ev(`newTab('Q');setView('ui');PAL.forEach(p=>addCtl(p[1],p[2]))`);
  ok(ev(`real().length`) >= 30 && !/undefined|NaN/.test(ev(`build()`)), 'every UI element can be added');
  ev(`setView('blocks')`);
  ok(ev(`['regex','arrnew','mapset','loopfiles','clickrand','onexit','cmdout'].every(k=>T[k]&&LBL[k])`), 'new blocks are registered');
  // 16. the new window templates keep their styling in the generated code
  const dk = ev(`(()=>{newTab('D');const t=TPL.find(x=>x.n==='Window: Dark sign-in form');SET={...DS};root.kids=t.f();GUI=t.g();normGui(GUI);return build()})()`);
  ok(/ed2 := myGui\.Add\("Edit", "[^"]*Password/.test(dk) && /BackColor := "1c1d23"/.test(dk) && /Background2FAE78/.test(dk), 'dark sign-in template keeps its options');
  // 17. select several blocks at once
  ev(`tutEnd();newTab('M');addBlock(mk('hotkey'));addBlock(mk('click'));addBlock(mk('wait'));addBlock(mk('beep'))`);
  const sh2 = () => ev(`root.kids.map(k=>k.t+'['+k.kids.map(x=>x.t)+']').join(',')`);
  const bel = t => w.document.querySelector('.blk[data-id="' + ev(`root.kids[0].kids.find(k=>k.t==='${t}').id`) + '"]');
  const clk = (e, ctrl) => e.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: ctrl }));
  const key = (k, o = {}) => w.document.body.dispatchEvent(new w.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, o)));
  clk(bel('click'), false); clk(bel('wait'), true); ok(ev(`selSet.size`) === 2, 'Ctrl-click selects two blocks');
  key('ArrowDown', { altKey: true }); ok(sh2() === 'hotkey[beep,click,wait]', 'move both: ' + sh2());
  key('d', { ctrlKey: true }); ok(sh2() === 'hotkey[beep,click,click,wait,wait]', 'duplicate both: ' + sh2());
  key('c', { ctrlKey: true }); key('v', { ctrlKey: true }); ok(ev(`root.kids[0].kids.length`) === 7, 'paste both');
  key('Delete'); ok(ev(`root.kids[0].kids.length`) === 5, 'delete both');
  ev(`document.querySelector('#colall').click()`); ok(ev(`root.kids[0].col`) === true, 'fold all'); ev(`document.querySelector('#colall').click()`);
  // 18. find a block, copy/paste controls between tabs
  ev(`tutEnd();newTab('Z');addBlock(mk('hotkey'));addBlock(mk('wait',{ms:'777'}))`);
  key('f', { ctrlKey: true, shiftKey: true }); const fb = w.document.querySelector('#bfind'); ok(!!fb, 'find bar opens');
  const fi = fb.querySelector('input'); fi.value = '777'; fi.dispatchEvent(new w.Event('input')); ok(/777/.test(fb.textContent), 'find by value');
  fi.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' })); ok(!w.document.querySelector('#bfind'), 'Esc closes find');
  ev(`newTab('U1');setView('ui');addCtl('Edit');addCtl('Button');uMulti=new Set(real().map(c=>c.id));uSel=real()[1].id`);
  key('c', { ctrlKey: true }); ev(`newTab('U2');setView('ui')`); key('v', { ctrlKey: true }); key('v', { ctrlKey: true });
  ok(ev(`real().length`) === 4 && new Set(ev(`real().map(c=>c.n)`)).size === 4, 'paste controls twice keeps unique names');
  ev(`setView('blocks')`);
  // 19. new window options, tree/web views, tooltips: generate, import, no duplicates
  ev(`tutEnd();newTab('W');setView('ui');addCtl('Edit');addCtl('TreeView');addCtl('ActiveX','web');addCtl('Slider');addCtl('Progress')`);
  ev(`(()=>{const r=real();r[0].n='ed1';r[0].tip='Type your name "here"';r[1].n='tv1';r[1].text='Fruits|Veg';r[2].n='wb1';r[2].nav='https://example.com';r[3].n='sl1';setTok(r[3],'Vertical',true);r[4].n='pg1';setTok(r[4],'-Smooth',true);GUI.pos='custom';GUI.px=40;GUI.py=60;GUI.alpha=180;gSetOpt(/^\\+?MinSize/i,'+MinSize300x200');dwmSet(33,'2');dwmSet(35,toBGR('1c1d23'));renderUI();code()})()`);
  let wc = ev(`build()`);
  ok(/Show\("w\d+ h\d+ x40 y60"\)/.test(wc) && /WinSetTransparent\(180/.test(wc) && /\+MinSize300x200/.test(wc) && /"int", 33, "int\*", 2/.test(wc) && /"int", 35, "int\*", 0x231d1c/.test(wc), 'window position, opacity, size limit, Windows 11 lines');
  ok(/tv1\.Add\("Fruits"\)/.test(wc) && /wb1\.Value\.Navigate\("https:\/\/example\.com"\)/.test(wc) && /Nexo_Tips\[ed1\.Hwnd\]/.test(wc) && /Vertical/.test(wc) && /-Smooth/.test(wc), 'tree, web view, tooltip, slider/progress options');
  ev(`(()=>{const r=parseAhk(build());root.kids=r.kids;GUI=r.gui;normGui(GUI);SET=setFromParse(r.set)})()`); wc = ev(`build()`);
  ok((wc.match(/Nexo_Hover\(wParam/g) || []).length === 1 && (wc.match(/Navigate/g) || []).length === 1 && (wc.match(/WinSetTransparent/g) || []).length === 1 && (wc.match(/"int", 33,/g) || []).length === 1, 'import does not duplicate generated lines');
  ok(ev(`real().find(x=>x.n==='ed1').tip`) === 'Type your name "here"', 'tooltip text survives import');
  ev(`applyTheme('dark');applyTheme('')`); ok(/"int", 33, "int\*", 2/.test(ev(`build()`)), 'changing theme keeps the corner setting');
  // click every option on every control type's panel: nothing throws, code stays balanced
  const types = ev(`Object.keys(CT)`); let bad2 = '';
  for (const ty of types) {
    ev(`GUI=newGui();GUI.ctl=[];root.kids=[S('guislot')];setView('ui');addCtl('${ty}');uSel=real()[0].id;renderUI();renderProps()`);
    for (let pass = 0; pass < 2; pass++) [...w.document.querySelector('#ui-props').querySelectorAll('input,select,textarea')].forEach((el, i) => {
      try { if (el.type === 'checkbox') { el.checked = !el.checked; el.dispatchEvent(new w.Event('change', { bubbles: true })); } else if (el.tagName === 'SELECT') { if (el.options.length) { el.selectedIndex = (pass + i) % el.options.length; el.dispatchEvent(new w.Event('change', { bubbles: true })); } } else if (el.type !== 'color') { el.value = ['7', 'abc', 'Say "hi"', 'a|b'][(i + pass) % 4]; el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); } } catch (e) { bad2 += ty + ': ' + e.message + ' '; }
    });
    try { const cc = ev(`build()`); let inq = false; for (const ln of cc.split('\\n')) { inq = false; for (let i = 0; i < ln.length; i++) { if (ln[i] === '`') { i++; continue; } if (ln[i] === '"') inq = !inq; } if (inq) { bad2 += ty + ': unbalanced quote in ' + ln + ' '; break; } } } catch (e) { bad2 += ty + ' build: ' + e.message + ' '; }
  }
  ok(!bad2, 'property panels: ' + bad2);
  ev(`setView('blocks')`);
  // 20. value blocks (Scratch/Sketchware style): nesting, drag & drop, rename, lint, fuzz
  const dragEv = tp => { const e = new w.Event(tp, { bubbles: true, cancelable: true }); e.dataTransfer = { setData() {}, getData: () => '', setDragImage() {}, dropEffect: 'move' }; return e; };
  ev(`tutEnd();newTab('V');root.kids=[S('hotkey',{key:'F1'},[S('set',{n:'score',v:'5'}),S('set',{n:'total',v:mkR('mul',{a:mkR('add',{a:mkR('var',{n:'score'}),b:'5'}),b:'2'})}),S('if',{c:mkR('cmp',{a:mkR('var',{n:'total'}),op:'>',b:'10'})},[S('msg',{s:mkR('join',{a:'Total: ',b:mkR('var',{n:'total'})})})])])]`);
  const vc = ev(`build()`);
  ok(vc.includes('total := ((score + 5) * 2)') && vc.includes('if ((total > 10)) {') && vc.includes('MsgBox String(("Total: " . total))'), 'nested value blocks generate the right code');
  ev(`root.kids=[S('hotkey',{key:'F1'},[S('set',{n:'x',v:'1'})])];render()`);
  const addBtn = [...w.document.querySelectorAll('#pal .pb.rp')].find(b => b.textContent === '▢ + ▢'); addBtn.dispatchEvent(dragEv('dragstart'));
  const sl = [...w.document.querySelectorAll('.blk.misc .slot')]; const tgt = sl[sl.length - 1];
  const ov = dragEv('dragover'); tgt.dispatchEvent(ov); ok(ov.defaultPrevented, 'input slots accept value blocks'); tgt.dispatchEvent(dragEv('drop'));
  ok(ev(`isR(root.kids[0].kids[0].v.v)&&root.kids[0].kids[0].v.v.t==='add'`), 'dropping a value block fills the slot');
  [...w.document.querySelectorAll('#pal .pb.rp')].find(b => b.textContent === 'A_Index').dispatchEvent(dragEv('dragstart'));
  w.document.querySelector('.blk.misc .rp .slot').dispatchEvent(dragEv('drop')); ok(ev(`root.kids[0].kids[0].v.v.v.a.t==='var'`), 'value blocks nest inside value blocks');
  const outerRp=[...w.document.querySelectorAll('.blk.misc .rp')].find(r=>!r.parentElement.closest('.rp'));[...outerRp.children].find(c=>c.classList.contains('rpx')).click(); ok(!ev(`isR(root.kids[0].kids[0].v.v)`), 'x removes a value block');
  ev(`root.kids=[S('hotkey',{key:'F1'},[S('set',{n:'count',v:'0'}),S('set',{n:'other',v:mkR('add',{a:mkR('var',{n:'count'}),b:'count + 1'})})])];renameVar('count','clicks')`);
  const rj2 = ev(`JSON.stringify(root.kids)`); ok(rj2.includes('"n":"clicks"') && !rj2.includes('"n":"count"') && rj2.includes('clicks + 1'), 'rename variable also renames inside value blocks');
  ev(`root.kids=[S('hotkey',{key:'F1'},[S('set',{n:'a',v:mkR('var',{n:'neverset'})})])]`); ok(ev(`lint(build()).some(x=>/ever sets it/.test(x.msg))`), 'lint explains an unset variable value block');
  const dz = ev(`(()=>{const out=[];const scan=code=>{let d=0;for(const ln of code.split('\\n')){let inq=false,p=0;for(let i=0;i<ln.length;i++){const ch=ln[i];if(ch==='\`'){i++;continue}if(ch==='"'){inq=!inq;continue}if(inq)continue;if(ch===';'&&(i===0||/\\s/.test(ln[i-1])))break;if(ch==='(')p++;if(ch===')')p--;if(ch==='{')d++;if(ch==='}')d--}if(inq||p)return ln}return d?'braces':''};
    for(const k in T){if(k==='guislot')continue;for(const f in T[k].f){if(!canDrop({t:k},f))continue;for(const rt of ['join','add','cmp','var','text']){const b=mk(k);if(T[k].box)b.kids=[mk('wait')];b.v[f]=mkR(rt);if(rt==='text')b.v[f].v.t='He said "hi"\\nok';if(rt==='join')b.v[f].v.a='a"b\`c';
      root.kids=(T[k].glob||T[k].c==='event')?[b]:[S('hotkey',{key:'F1'},[b])];GUI=newGui();GUI.ctl=[];SET={...DS};try{const p=scan(build());if(p)out.push(k+'.'+f+' <- '+rt)}catch(e){out.push(k+'.'+f+' threw')}}}}return out.slice(0,5)})()`);
  ok(dz.length === 0, 'value blocks in every input of every block keep the code valid: ' + dz.join(', '));
  ev(`root.kids=[S('hotkey',{key:'F1'},Object.keys(RB).map(k=>S('set',{n:'v'+k,v:mkR(k)})))];render();build()`);
  // 21. debug: tracer lines, helpers, importer ignores helpers
  ev(`tutEnd();newTab('D');root.kids=[S('hotkey',{key:'F1'},[S('set',{n:'n',v:'0'}),S('if',{c:'n = 0'},[S('logv',{s:'zero {n}'})]),S('else',{},[S('wait',{ms:'5'})]),S('pausehere',{})])]`);
  const dn = ev(`build()`), dd = ev(`buildDebug('slow:300')`);
  ok(!/NexoT/.test(dn) && /NexoLog\(/.test(dn) && (dn.match(/^NexoLog\(/gm) || []).length === 1, 'normal build has no tracer and defines the log helper once');
  ok((dd.match(/^NexoT\(/gm) || []).length === 1 && /NexoT\("b\d+", "n", n\)/.test(dd), 'debug build adds the tracer helper and calls');
  ok(!/NexoT\([^\n]*\n\s*else/.test(dd) && !/\}\n\s*NexoT/.test(dd.split('else')[0].slice(-40)), 'no tracer line between } and else');
  ok(ev(`lint(buildDebug('step')).filter(x=>x.sev==='error').length`) === 0, 'debug build has no lint errors');
  const ri = ev(`(()=>{const r=parseAhk(build());return JSON.stringify({raw:r.rawN,hasHelper:JSON.stringify(r.kids).includes('FileAppend')||JSON.stringify(r.kids).includes('KeyWait')})})()`);
  ok(ri === '{"raw":0,"hasHelper":false}', 'importing a build with helper functions makes no raw blocks: ' + ri);
  // 22. audit regressions: static vs auto-global, built-in calls, v1 If* commands
  w.__t1 = 'F4::{\n  static n := 0\n  n += 1\n}\nF5::{\n  n += 1\n}\nOnExit((r, c) => MsgBox("bye"))\nmsgbox("x")\nSetTimer(Later, 100)\nlater() {\n  Sleep 1\n}\nF6::FileCopy("a", "b")';
  const sg = ev(`(()=>{const r=parseAhk(__t1);root.kids=r.kids;GUI=r.gui||newGui();SET=setFromParse(r.set);const c=build();return JSON.stringify({c,err:lint(c).filter(x=>x.sev==='error').map(x=>x.msg)})})()`);
  const sgj = JSON.parse(sg);
  ok(/F4::\{\n  static n := 0/.test(sgj.c) && !/F4::\{\n  global[^\n]*\bn\b/.test(sgj.c), 'static variable is not also declared global: ' + sgj.c);
  ok(!/F5::\{\n  global/.test(sgj.c), 'an imported function keeps its own scoping: no global is invented for it');
  ok(sgj.err.length === 0, 'built-ins and case-insensitive function names give no false errors: ' + sgj.err.join('; '));
  const v1 = ev(`(()=>{const r=v1to2('F1::\\n  IfWinActive, ahk_class Notepad\\n    MsgBox, hi\\n  IfNotExist, C:\\\\a.txt\\n    MsgBox, no\\n  IfInString, v, abc\\n    MsgBox, in\\nreturn');return r.text+'|todo:'+r.todo})()`);
  ok(/if WinActive\("ahk_class Notepad"\)/.test(v1) && /if !FileExist\("C:\\a\.txt"\)/.test(v1) && /if InStr\(v, "abc"\)/.test(v1) && /todo:0$/.test(v1), 'v1 If commands convert: ' + v1);
  // 23. render cache: edits show up, selection moves inside an unchanged container, cached == cold render
  ev(`tutEnd();newTab('C');root.kids=[S('hotkey',{key:'F1'},[S('msg',{s:'one'}),S('wait',{ms:'5'})])];render()`);
  ev(`root.kids[0].kids[0].v.s='two';render()`);
  ok(ev(`[...document.querySelectorAll('#canvas .blk input')].some(i=>i.value==='two')`), 'cached render shows an edited field');
  const kid = ev(`root.kids[0].kids[1].id`); ev(`sel='${kid}';render()`);
  ok(ev(`document.querySelector('.blk[data-id="${kid}"]').classList.contains('sel')`) && ev(`document.querySelectorAll('#canvas .blk.sel').length`) === 1, 'selection moves into an unchanged container');
  const strip = `f.querySelectorAll('.issues,.iss').forEach(e=>e.remove());f.querySelectorAll('.blk').forEach(e=>e.className=e.className.replace(/ (sel|err|warn|inf|flash|bad)/g,''));return f.innerHTML.replace(/data-id="[^"]*"/g,'')`;
  const hot = ev(`(()=>{const f=$('#canvas').cloneNode(true);${strip}})()`), cold = ev(`(()=>{const k=BC;BC=new WeakMap();ENVSIG='';const f=document.createElement('div');f.append(list(root));BC=k;${strip}})()`);
  ok(hot === cold, 'cached render equals a cold render');
  // 24. My Blocks
  ev(`tutEnd();newTab('B');render();makeBlockDlg();document.querySelector('#mkb-n').value='Click Many';document.querySelector('#mkb-p').value='times, delay';document.querySelector('#mkb-r').checked=true;document.querySelector('#mkb-ok').click()`);
  ok(ev(`JSON.stringify(myDefs())`) === '[{"n":"Click_Many","params":["times","delay"],"ret":true}]', 'Make a block creates a definition with inputs');
  ev(`root.kids.push(S('hotkey',{key:'F1'},[]));sel=root.kids[1].id;document.querySelector('#palmine .pb.ctrl').click()`);
  ev(`const u=root.kids[1].kids[0];u.v.a1='5';u.v.a2='100';root.kids[1].kids.push(S('set',{n:'r',v:mkR('ucallr',{n:'Click_Many',a1:'2',a2:'3'})}));render()`);
  const mbc = ev(`build()`);
  ok(/Click_Many\(5, 100\)/.test(mbc) && /r := Click_Many\(2, 3\)/.test(mbc), 'my block and my value block generate calls');
  ok(/Click Many times/.test(ev(`document.querySelector('.blk[data-id="'+root.kids[1].kids[0].id+'"] .row').textContent`)), 'block title shows its inputs');
  ok(ev(`lint(build()).filter(x=>x.sev==='error').length`) === 0, 'defined my block lints clean');
  ev(`root.kids[0].v.p='times, delay, extra';render()`);
  ok(/Click Many times.*extra/.test(ev(`document.querySelector('.blk[data-id="'+root.kids[1].kids[0].id+'"] .row').textContent`)), 'editing the definition updates the cached call block');
  ev(`root.kids=[S('hotkey',{key:'F2'},[S('ucall',{n:'Nope'})])]`);
  ok(ev(`lint(build()).some(x=>x.sev==='error'&&/does not exist/.test(x.msg))`), 'undefined my block is flagged');
  const up = ev(`(()=>{const r=parseAhk('Foo(a, b := 2) {\\n  MsgBox(a)\\n}\\nBar() {\\n}\\nF1::{\\n  Foo(1)\\n  Foo(1, 2)\\n  Bar()\\n}');const t=[];(function w(n){n.forEach(b=>{t.push(b.t);w(b.kids||[])})})(r.kids);return t.join(',')})()`);
  ok(up === 'funcp,callp,func,hotkey,callp,ucall,ucall', 'import upgrades calls to my blocks only when the input count matches: ' + up);
  ok(ev(`fieldKind('ucall','a1')`) === 'expr', 'my block inputs take values');
  // 25. new value blocks, variable types
  ev(`tutEnd();newTab('V');root.kids=[S('hotkey',{key:'F1'},[
    S('arrnew',{n:'items',v:'"a", "b"'}),S('set',{n:'num',v:'5'}),S('set',{n:'d',v:mkR('dateadd',{d:'A_Now',n:'2',u:'Hours'})}),
    S('set',{n:'j',v:mkR('joinl',{l:'items',s:', '})}),S('set',{n:'k',v:mkR('justpressed',{k:'a'})}),S('if',{c:mkR('mousein',{x:'0',y:'0',w:'50',h:'50'})},[S('set',{n:'p',v:mkR('pick',{l:'items'})})]),
    S('set',{n:'df',v:mkR('datediff',{a:'A_Now',b:'A_Now',u:'Days'})}),S('set',{n:'fm',v:mkR('datefmt',{d:'A_Now',f:'yyyy-MM-dd'})}),S('set',{n:'sp',v:mkR('split',{a:'a,b',b:','})})])];render()`);
  const vcode = ev(`build()`);
  ok(/DateAdd\(A_Now, 2, "Hours"\)/.test(vcode) && /NexoJoin\(items, ", "\)/.test(vcode) && /NexoJustPressed\("a"\)/.test(vcode) && /NexoMouseIn\(0, 0, 50, 50\)/.test(vcode) && /items\[Random\(1, items\.Length\)\]/.test(vcode) && /DateDiff\(A_Now, A_Now, "Days"\)/.test(vcode) && /FormatTime\(A_Now, "yyyy-MM-dd"\)/.test(vcode) && /StrSplit\("a,b", ","\)/.test(vcode), 'new value blocks generate correct code');
  ok(['NexoJoin', 'NexoJustPressed', 'NexoMouseIn'].every(h => (vcode.match(new RegExp('^' + h + '\\(', 'gm')) || []).length === 1), 'their helper functions are added exactly once');
  ok(ev(`lint(build()).filter(x=>x.sev==='error').length`) === 0, 'new value blocks lint clean');
  const vt = ev(`JSON.stringify(varTypes())`);
  ok(/"items":"list"/.test(vt) && /"num":"number"/.test(vt) && /"j":"text"/.test(vt) && /"k":"yes\/no"/.test(vt) && /"sp":"list"/.test(vt), 'variable types are inferred: ' + vt);
  ev(`root.kids[0].kids.push(S('arradd',{v:'"c"',n:'num'}))`);
  ok(ev(`typeIssues().some(t=>/“num” holds a number, but .* needs a list/.test(t.msg))`) && ev(`lint(build()).some(x=>/needs a list/.test(x.msg))`), 'using a number variable as a list is flagged');
  ev(`SET.vtypes={num:'list'};`);
  ok(ev(`typeIssues().length`) === 0, 'type override in the Variables panel is respected');
  ev(`SET.vtypes={};root.kids[0].kids.pop();render();renderVars()`);
  ok(ev(`[...document.querySelectorAll('#varl .vrow select')].length`) >= 3, 'Variables panel shows a type picker per variable');
  ok(ev(`[...document.querySelectorAll('#palvars,#palmine')].length>=1 && [...document.querySelectorAll('#pal h2')].some(h=>/lists & maps/i.test(h.textContent))`), 'palette has a lists & maps group');
  // 26. sticky notes, colour tags, block comments
  ev(`tutEnd();newTab('N');root.kids=[S('sticky',{s:'line one\\nline two'}),S('hotkey',{key:'F1'},[S('msg',{s:'hi'}),S('wait',{ms:'5'})])];root.kids[1].kids[0].cmt='say hello\\nthen wait';root.kids[1].kids[0].tag='green';render()`);
  const nc = ev(`build()`);
  ok(/; line one\n; line two\n/.test(nc) && /; say hello\n  ; then wait\n  MsgBox "hi"/.test(nc), 'sticky and block comments are written as ; lines: ' + JSON.stringify(nc.slice(nc.indexOf('; line'))));
  ok(ev(`document.querySelector('.blk[data-id="'+root.kids[1].kids[0].id+'"]').dataset.tag`) === 'green' && ev(`!!document.querySelector('#canvas .cmtline')`) && ev(`document.querySelector('#canvas textarea')!==null`), 'tag stripe, comment line and sticky textarea render');
  const bm = ev(`(()=>{const m=blockMenu({clientX:50,clientY:50},root.kids[1].kids[1]);m.querySelector('.bm-c[title=Red]').click();return root.kids[1].kids[1].tag})()`);
  ok(bm === 'red' && ev(`!document.getElementById('bmenu')`), 'right-click menu sets a tag');
  ev(`(()=>{const m=blockMenu({clientX:50,clientY:50},root.kids[1].kids[1]);m.querySelector('textarea').value='short pause';[...m.querySelectorAll('button')].find(x=>/Save comment/.test(x.textContent)).click()})()`);
  ok(/; short pause\n  Sleep 5/.test(ev(`build()`)), 'right-click menu saves a comment');
  ok(ev(`lint(build()).filter(x=>x.sev==='error').length`) === 0, 'comments and tags lint clean');
  ev(`(()=>{const c=cl(root.kids[1].kids[0]);root.kids[1].kids.push(c)})()`);
  ok(ev(`root.kids[1].kids[2].cmt`) === 'say hello\nthen wait' && ev(`root.kids[1].kids[2].tag`) === 'green', 'duplicate keeps tag and comment');
  // 27. Try it (live preview)
  ev(`tutEnd();newTab('L');GUI=newGui();GUI.ctl=[];SET={...DS};root.kids=[S('func',{n:'Greet'},[S('msg',{s:'Hi {ed1}'})]),S('guishow',{}),S('hotkey',{key:'F2'},[S('tip',{s:'pressed'})])];
    ['Text','Edit','Button','Checkbox','DropDownList','Slider','ListView'].forEach(t=>addCtl(t));real().forEach(c=>{if(c.t==='Button')c.fn='Greet';c.ar=1});render()`);
  ev(`liveOpen()`);
  const q = s => ev(`document.querySelector(${JSON.stringify(s)})`), qa = s => ev(`document.querySelectorAll(${JSON.stringify(s)}).length`);
  ok(!ev(`document.getElementById('live').hidden`) && !ev(`document.getElementById('lv-win').hidden`), 'Try it opens and shows the window');
  ok(qa('#lv-cl .lv-c') === 7 && qa('#lv-cl button') >= 1 && qa('#lv-cl input[type=checkbox]') === 1 && qa('#lv-cl select') === 1 && qa('#lv-cl input[type=range]') === 1 && qa('#lv-cl table') === 1, 'every control becomes a live widget: ' + qa('#lv-cl .lv-c'));
  ev(`(()=>{const i=document.querySelector('#lv-cl .lv-edit input');i.value='Bob';i.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#lv-cl .lv-button button').click()})()`);
  ok(/Hi Bob/.test(ev(`document.getElementById('lv-log').textContent`)) && qa('#lv-msgs .lv-msg') === 1, 'typing then clicking the button runs the handler, logs it and shows the message');
  const w0 = ev(`LIVE.sim.guis[0].w`), bx = ev(`LIVE.sim.guis[0].ctls[1].x`);
  ev(`(()=>{const r=document.getElementById('lv-w');r.value=${w0}+120;r.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  ok(ev(`LIVE.sim.guis[0].w`) === w0 + 120 && ev(`LIVE.sim.guis[0].ctls[1].x`) === bx + 120 && ev(`document.getElementById('lv-cl').style.width`) === (w0 + 120) + 'px', 'width slider resizes the window and right-anchored controls move with it');
  ev(`(()=>{const d=document.querySelector('#lv-cl .lv-dropdownlist select');d.selectedIndex=0;const c=document.querySelector('#lv-cl .lv-checkbox input');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))})()`);
  ok(ev(`LIVE.sim.guis[0].ctls[3].value`) === 1, 'ticking a checkbox updates the simulated control');
  ev(`document.querySelector('.lv-tabs button[data-t=lv-vars]').click()`);
  ok(/ed1|btn1|myGui/i.test(ev(`document.getElementById('lv-vars').textContent`)), 'Variables tab lists the variables');
  ev(`document.querySelector('.lv-tabs button[data-t=lv-hk]').click()`);
  ok(/F2/.test(ev(`[...document.querySelectorAll('#lv-hk button')].map(b=>b.textContent).join()`)), 'Hotkeys tab lists the hotkey');
  ev(`[...document.querySelectorAll('#lv-hk button')].find(b=>b.textContent==='F2').click()`);
  ok(/pressed/.test(ev(`document.getElementById('lv-log').textContent`)) && !ev(`document.getElementById('lv-tip').hidden`), 'pressing a hotkey chip runs it and shows its tooltip');
  ev(`document.getElementById('lv-close').click()`);
  ok(ev(`document.getElementById('lv-win').hidden`) && /exited/.test(ev(`document.getElementById('lv-nogui').textContent`)), 'closing the window runs its Close handler (ExitApp) and the preview says the script exited');
  ev(`liveClose()`);
  ok(ev(`document.getElementById('live').hidden`) && ev(`LIVE===null`), 'Try it closes and stops its timer');
  // no window, timers, and runaway code
  ev(`tutEnd();newTab('L2');root.kids=[S('set',{n:'n',v:'0'}),S('every',{ms:'100'},[S('incr',{n:'n'})])];render();liveOpen()`);
  ev(`LIVE.sim.advance(450);liveSync()`);
  ok(!ev(`document.getElementById('lv-nogui').hidden`), 'a script without a window explains that');
  ev(`document.querySelector('.lv-tabs button[data-t=lv-vars]').click()`);
  ok(/n4/.test(ev(`document.getElementById('lv-vars').textContent`)), 'timers advance while Try it runs: ' + ev(`document.getElementById('lv-vars').textContent`));
  ev(`liveClose();tutEnd();newTab('L3');root.kids=[S('hotkey',{key:'F1'},[S('forever',{},[S('set',{n:'q',v:'1'})])])];render();liveOpen();LIVE.sim.runHotkey(0)`);
  ok(/endless loop/.test(ev(`document.getElementById('lv-log').textContent`)) && qa('#lv-log .err') >= 1, 'an endless loop is stopped and reported in red');
  ev(`liveClose()`);
  // 28. the simulator can read the code of every block (orphan else/elif/catch/finally are only valid after their parent)
  const simBad = ev(`(()=>{const bad=[];for(const k in T){if(['guislot','rawl','else','elif','catch','finally'].includes(k))continue;tutEnd();newTab('X');GUI=newGui();GUI.ctl=[];SET={...DS};const b=mk(k);if(T[k].box)b.kids=[mk('wait')];root.kids=(T[k].glob||T[k].c==='event')?[b]:[S('hotkey',{key:'F1'},[b])];const r=Sim.create(build(),{});if(r.error)bad.push(k+': '+r.error)}return bad})()`);
  ok(simBad.length === 0, 'Try it can read every block: ' + simBad.join('; '));
  // 29. importing hand-written windows
  const impWin = src => { w.__src = src; return JSON.parse(ev(`(()=>{const r=parseAhk(__src);root.kids=r.kids;GUI=r.gui||newGui();SET=setFromParse(r.set);const c=build();return JSON.stringify({c,ctl:r.gui?r.gui.ctl.filter(x=>!x.k).map(x=>({t:x.t,n:x.n,x:x.x,y:x.y,w:x.w,h:x.h,text:x.text,fn:x.fn})):null,title:r.gui&&r.gui.title,errs:lint(c).filter(x=>x.sev==='error').map(x=>x.msg),raw:r.rawN})})()`)); };
  { const r = impWin('#Requires AutoHotkey v2.0\nMyGui := Gui()\nMyGui.Title := "Shorthand"\nMyGui.AddText(, "Name:")\ned := MyGui.AddEdit("w200")\nMyGui.AddCheckbox("vOpt", "Option")\nMyGui.AddButton("Default w80", "OK").OnEvent("Click", Done)\nMyGui.Add("Text",, "Plain")\nMyGui.Show()\nDone(*) {\n  MsgBox("done")\n}');
    ok(r.ctl && r.ctl.length === 5 && r.title === 'Shorthand' && r.ctl.map(c => c.t).join() === 'Text,Edit,Checkbox,Button,Text', 'AddText/AddEdit/... shorthand and Title := import as controls: ' + JSON.stringify(r.ctl));
    ok(/ctl1 := MyGui\.Add\("Button"/.test(r.c) && /ctl1\.OnEvent\("Click", Done\)/.test(r.c) && /Gui\(, "Shorthand"\)/.test(r.c) && r.errs.length === 0, 'chained OnEvent is split, title kept, lint clean');
    ok(r.ctl[1].y > r.ctl[0].y && r.ctl[2].y > r.ctl[1].y && r.ctl.every(c => c.x === 10), 'controls without x/y get automatic layout positions: ' + JSON.stringify(r.ctl.map(c => [c.x, c.y]))); }
  { const r = impWin('G := Gui()\nG.Add("Text", "x10 y10 w100", "A")\nG.Add("Edit", "x+10 yp w100")\nG.Add("Text", "xm y+20", "B")\nG.Add("Button", "Section x20 y200 w60", "S")\nG.Add("Edit", "xs ys+30 w60")\nG.Show()');
    ok(r.ctl[1].x === 120 && r.ctl[1].y === 10 && r.ctl[2].x === 10 && r.ctl[2].y > 10 && r.ctl[4].x === 20 && r.ctl[4].y === 230, 'x+N, yp, xm, y+N, Section/xs/ys follow AutoHotkey layout rules: ' + JSON.stringify(r.ctl.map(c => [c.x, c.y]))); }
  { const r = impWin('ShowMain() {\n    g := Gui("+Resize", "Func GUI")\n    g.AddText("x10 y10", "Hello")\n    e := g.AddEdit("x10 y30 w150")\n    b := g.AddButton("x10 y60 w80", "Go")\n    b.OnEvent("Click", (*) => MsgBox(e.Value))\n    g.Show("w200 h120")\n}\nF2::ShowMain()');
    ok(r.ctl && r.ctl.length === 3 && r.errs.length === 0 && /ShowMain\(\) \{\n  ; --- UI/.test(r.c) && r.raw === 0, 'a window built inside a function imports its controls in place: ' + r.errs.join(';') + r.raw); }
  { const r = impWin('count := 0\nG := Gui(, "Mixed")\nG.Add("Text", "x10 y10", "One")\nlimit := 5\nG.Add("Edit", "x10 y40 w100")\nname := "x"\nG.Add("Button", "x10 y70", "B")\nG.Show("w200 h120")\nMsgBox("up")');
    ok(r.ctl && r.ctl.length === 3 && /limit := 5/.test(r.c) && /name := "x"/.test(r.c) && r.errs.length === 0, 'code between controls does not end the window early and is kept in order'); }
  { const r = impWin('Gui, Add, Text, x10 y10, Name:\nGui, Add, Edit, x10 y30 w200 vName\nGui, Add, DropDownList, x10 y60 vPick, Red||Green|Blue\nGui, Add, Button, x10 y90 gOk, OK\nGui, Show, w300 h140, Old Style\nreturn\nOk:\n  Gui, Submit\n  MsgBox, Hello %Name% you chose %Pick%\nreturn\nGuiClose:\nExitApp');
    ok(r.ctl && r.ctl.map(c => c.t).join() === 'Text,Edit,DropDownList,Button' && r.title === 'Old Style' && r.errs.length === 0, 'old v1 Gui, Add... scripts become Designer controls: ' + JSON.stringify(r.ctl && r.ctl.map(c => c.t)) + r.errs.join(';'));
    ok(/Ok\(\*\) \{/.test(r.c) && /GuiClose\(\*\) \{/.test(r.c) && /OnEvent\("Close", GuiClose\)/.test(r.c) && /Name := Nexo_s\.Name/.test(r.c), 'labels become functions and Gui, Submit assigns the v-variables');
    w.__code = r.c; const flow = ev(`(()=>{const s=Sim.create(__code,{});s.run();const g=s.guis[0];g.ctls[1].value=g.ctls[1].text='Bob';g.ctls[2].value=2;g.ctls[2].text='Green';s.fire(g.ctls[3],'Click');return s.log.filter(l=>l.k==='msg').map(l=>l.text).join('|')})()`);
    ok(flow === 'Hello Bob you chose Green', 'the converted v1 window works when run: ' + flow); }
  { const r = impWin('myGui := Gui()\nmyGui.Add("Text", "x10 y10", "t")\nmyGui.Show()'); const again = impWin(r.c), third = impWin(again.c);
    ok(again.c.replace(/\n+/g, '\n') === r.c.replace(/\n+/g, '\n') && third.c === again.c, 'an imported window re-imports to the same code and then stays stable'); }
  // 30. UI extras: ListView column types, color picker button + colorof, saved looks
  const gm = ev(`(()=>{tutEnd();newTab('X');GUI=newGui();GUI.ctl=[];SET={...DS};root.kids=[S('guishow',{})];addCtl('ListView');addCtl('Button');const lv=real()[0],bt=real()[1];lv.text='Name|Age|Score';lv.ct=['','Integer','Float'];lv.autohdr=1;bt.colorpick=1;root.kids.push(S('hotkey',{key:'F5'},[S('set',{n:'c',v:mkR('colorof',{c:bt.n})})]));return JSON.stringify({c:build(),lv:lv.n,bt:bt.n})})()`);
  const gmj = JSON.parse(gm);
  ok(new RegExp(gmj.lv + '\\.ModifyCol\\(2, "Integer"\\)').test(gmj.c) && new RegExp(gmj.lv + '\\.ModifyCol\\(3, "Float"\\)').test(gmj.c) && !new RegExp(gmj.lv + '\\.ModifyCol\\(1, "(Integer|Float)"\\)').test(gmj.c) && (gmj.c.match(/ModifyCol\(\d, "AutoHdr"\)/g) || []).length === 3, 'ListView column types and fit-columns are generated');
  ok(new RegExp(gmj.bt + '_color := 0xFFFFFF').test(gmj.c) && new RegExp(gmj.bt + '\\.OnEvent\\("Click", ' + gmj.bt + '_Pick\\)').test(gmj.c) && /; nexo-colorpick/.test(gmj.c) && (gmj.c.match(/^Nexo_PickColor\(\) \{/gm) || []).length === 1 && new RegExp('c := ' + gmj.bt + '_color').test(gmj.c), 'color picker button, its function, the helper (once) and the colorof reporter are generated');
  ok(ev(`lint(build()).filter(x=>x.sev==='error').length`) === 0 && ev(`typeIssues().length`) === 0, 'they lint clean');
  w.__gm = gmj.c;
  const gmr = JSON.parse(ev(`(()=>{const r=parseAhk(__gm);root.kids=r.kids;GUI=r.gui;SET=setFromParse(r.set);const c=build();const lv=r.gui.ctl.find(x=>x.t==='ListView'),bt=r.gui.ctl.find(x=>x.t==='Button');return JSON.stringify({same:c.replace(/\\n+/g,'\\n')===__gm.replace(/\\n+/g,'\\n'),ct:lv.ct,ah:lv.autohdr,cp:bt.colorpick,raw:r.rawN,lines:r.gui.ctl.filter(x=>x.k).length,evs:bt.evs.length})})()`));
  ok(gmr.same && gmr.ct.join() === ',Integer,Float' && gmr.ah === 1 && gmr.cp === 1 && gmr.raw === 0 && gmr.lines <= 1 && gmr.evs === 0, 'these settings survive import and export without duplicated lines: ' + JSON.stringify(gmr));
  const flow2 = ev(`(()=>{const s=Sim.create(__gm,{});s.run();const g=s.guis[0];const b=g.ctls.find(x=>x.type==='Button');s.fire(b,'Click');return b.text+'|'+s.vars().filter(v=>/_color/.test(v[0])).map(v=>v[1]).join()+'|'+s.log.some(l=>/Color picker \\(pretend\\)/.test(l.text))})()`);
  ok(/^Color 0x[0-9A-F]{6}\|"0x[0-9A-F]{6}"\|true$/i.test(flow2), 'in Try it the color picker button picks a (pretend) color: ' + flow2);
  ev(`tutEnd();newTab('X2');GUI=newGui();GUI.ctl=[];SET={...DS};addCtl('Button');root.kids=[S('guishow',{}),S('hotkey',{key:'F5'},[S('set',{n:'c',v:mkR('colorof',{c:real()[0].n})})])];render()`);
  ok(ev(`lint(build()).some(x=>/not a color picker button/.test(x.msg))`), 'colorof on a normal button is flagged');
  // saved looks
  ev(`localStorage.removeItem('nexoLooks');tutEnd();newTab('Lk');GUI=newGui();GUI.ctl=[];SET={...DS};addCtl('Text');addCtl('Edit');GUI.bgc='1A1A2E';GUI.font=true;GUI.fs=12;GUI.face='Consolas';real()[1].opt='Background222244 cFFFFFF';`);
  ev(`(()=>{const L=captureLook('Night');looksSave([L])})()`);
  ev(`GUI.bgc=undefined;GUI.font=false;real()[1].opt='';`);
  ok(ev(`looksLoad().length`) === 1 && ev(`looksLoad()[0].name`) === 'Night', 'a look is saved to local storage');
  ev(`applyLook(looksLoad()[0])`);
  ok(ev(`GUI.bgc`) === '1A1A2E' && ev(`GUI.font`) === true && ev(`GUI.fs`) === 12 && ev(`GUI.face`) === 'Consolas' && /Background222244/.test(ev(`real()[1].opt`)) && /cFFFFFF/.test(ev(`real()[1].opt`)), 'applying a look restores colors, font and per-control colors');
  ev(`tutEnd();newTab('Lk2');GUI=newGui();GUI.ctl=[];SET={...DS};addCtl('Text');addCtl('Edit');applyLook(looksLoad()[0])`);
  ok(/Background222244/.test(ev(`real()[1].opt`)) && ev(`GUI.bgc`) === '1A1A2E', 'a saved look can be applied to a different window');
  ev(`localStorage.removeItem('nexoLooks')`);
  { const r = impWin('G := Gui()\ntabs := G.Add("Tab3", "w400 h260", ["One", "Two"])\ntabs.UseTab(1)\nG.Add("Text", "w100", "a")\nG.Add("Edit", "w100 r3")\nG.Add("Button", "w60", "b")\ntabs.UseTab(2)\nG.Add("Text", "w100", "c")\ntabs.UseTab()\nG.Add("Button", "w60", "out")\nG.Show()');
    const c = r.ctl; ok(c[1].x === 22 && c[1].y === 42 && c[2].y === c[1].y + 24 + 8 || c[2].y > c[1].y, 'controls on a tab page are placed inside the tab: ' + JSON.stringify(c.map(z => [z.t, z.x, z.y])));
    ok(c[4].y === 42 && c[5].y >= 10 + 260, 'a second tab page starts at the top of the tab, and controls after UseTab() go below it: ' + JSON.stringify(c.map(z => [z.x, z.y])));
    ok(c[3].y - c[2].y >= 3 * 20, 'r3 gives a taller control so the next one does not overlap'); }
  // 31. importing real-world scripts: classes, global/Global, brace-less bodies, method calls, scoping fidelity
  const REAL = '#Requires AutoHotkey v2.0\nGlobal Mode   := "fast"\nglobal Items := []\nclass Engine {\n    static Attach(pid) {\n        this.p := pid\n        if (pid)\n            return 1\n    }\n}\ncount := 0\nShow(*) {\n    global count, Items\n    i := 0\n    loop {\n        i++\n        count++\n        Items.Push(i)\n        if (i > 3)\n            break\n    }\n    for item in Items\n        out .= item ","\n    try FileOpen("a.txt", "w").Write(out)\n    catch as e {\n        MsgBox(e.Message)\n    }\n    if (!count)\n        MsgBox "none"\n    else\n        MsgBox "some"\n}\nF3::Show()';
  const rr = impWin(REAL);
  w.__real = REAL; const rk = JSON.parse(ev(`(()=>{const r=parseAhk(__real);const k={};let raws=[];(function w(n){n.forEach(b=>{k[b.t]=(k[b.t]||0)+1;if(b.t==='rawl')raws.push(b.v.s.split('\\n').length);w(b.kids||[])})})(r.kids);return JSON.stringify({k,raws,rawN:r.rawN,known:r.set.known,inits:r.set.inits})})()`));
  ok(rk.raws.length === 1 && rk.raws[0] >= 6 && /class Engine/.test(rr.c), 'a whole class stays together as ONE raw block, not one block per line: ' + JSON.stringify(rk.raws));
  ok(rk.k.set >= 2 && rk.k.appendv === 1 && rk.k.callo === 1 && rk.k.arradd === 1 && rk.k.incr === 2 && rk.k.catch === 1 && rk.k.forever === 1 && rk.k.rawl === 1, 'Global X :=, x++, .=, obj.Method(), chained call, catch as e, lowercase loop all become blocks: ' + JSON.stringify(rk.k));
  ok(/catch as e \{/.test(rr.c) && /FileOpen\("a\.txt", "w"\)\.Write\(out\)/.test(rr.c) && /Items\.Push\(i\)/.test(rr.c) && /out \.= item "," /.test(rr.c) || /out \.= item ","/.test(rr.c), 'those blocks regenerate the original statements: ' + rr.c.slice(rr.c.indexOf('Show(')));
  ok(/Show\(\*\) \{\n  global count, Items\n/.test(rr.c) && !/global[^\n]*\bi\b/.test(rr.c) && !/global[^\n]*\bout\b/.test(rr.c), 'only the variables the original declared global are declared global (i and out stay local): ' + (rr.c.match(/global[^\n]*/g) || []).join(' | '));
  ok(!/^(i|out|e|item) := 0$/m.test(rr.c), 'no invented "x := 0" lines for local variables');
  ok(rr.errs.length === 0, 'the imported script lints clean: ' + rr.errs.join(';'));
  { const q = impWin('Open() {\n    if (x)\n        for k, v in Map()\n            total += v\n    else if (y)\n        z := 1\n    else\n        z := 2\n    while a < 3\n        a++\n}'); const nb = (q.c.match(/\{/g) || []).length;
    ok(/if \(x\) \{/.test(q.c) && /else if \(y\) \{/.test(q.c) && /else \{/.test(q.c) && nb >= 5, 'brace-less if / else if / else / for / while get braces: ' + q.c.slice(q.c.indexOf('Open')).slice(0, 200)); }
  { const q = impWin('s := "a"\n    . "b"\n    . "c"\nt := Format("{1}-{2}",\n    1, 2)\nMsgBox s t'); ok(/s := "a" \. "b" \. "c"|s := "a" "b" "c"|"a" \. "b"/.test(q.c.replace(/\s+/g, ' ')) && /Format\("\{1\}-\{2\}", 1, 2\)/.test(q.c.replace(/\s+/g, ' ')), 'expressions continued on the next line are joined: ' + JSON.stringify(q.c.slice(40, 140))); }
  { const q = impWin('MyGui := Gui("-Caption")\nMyGui.AddText("x0 y0 w300 h40 Background" Bar, "Title")\nMyGui.AddButton("x10 y60 w80 Hidden " Extra, "Page2")\nMyGui.Show("w400 h300")');
    ok(q.ctl && q.ctl.length === 2 && q.ctl[0].w === 300 && q.ctl[0].h === 40, 'controls whose options mix text and variables still import with their size and position: ' + JSON.stringify(q.ctl));
    ok(/Background" Bar/.test(q.c) && /Hidden " Extra/.test(q.c), 'and keep the variable part of their options when exported: ' + q.c.slice(q.c.indexOf('myGui') > 0 ? 0 : 0, 400).replace(/\n/g, '|')); }
  { const q = impWin('global MyGui := Gui()\nglobal ed := MyGui.Add("Edit", "x10 y10 w100")\nMyGui.Show("w200 h100")'); ok(q.ctl && q.ctl.length === 1 && q.title !== undefined, 'a window declared with the global keyword imports: ' + JSON.stringify(q.ctl)); }
  { const q = impWin('Run() {\n    A_Clipboard := "x"\n    ctrl.Visible := false\n    for ctrl in items\n        ctrl.Enabled := true\n}'); ok(q.errs.length === 0 && /A_Clipboard := "x"/.test(q.c) && /ctrl\.Visible := false/.test(q.c), 'built-in variables and loop-variable properties stay as plain code, no false lint errors: ' + q.errs.join(';')); }
  ev(`document.getElementById('lv-x')&&0`);
  // 32. the "no wait inside" warning only fires for loops that really can run forever
  const loopWarn = src => { w.__src = src; return ev(`(()=>{const r=parseAhk(__src);root.kids=r.kids;GUI=r.gui||newGui();SET=setFromParse(r.set);return lint(build()).filter(x=>/no wait inside/.test(x.msg)).length})()`); };
  ok(loopWarn('F1::{\n  loop {\n    x := 1\n  }\n}') === 1, 'an endless loop with nothing in it is still warned about');
  ok(loopWarn('F1::{\n  loop {\n    Sleep 10\n  }\n}') === 0 && loopWarn('F1::{\n  loop {\n    if (x)\n        break\n    y := 1\n  }\n}') === 0, 'a loop with a Sleep, or a way out (break), is not');
  ok(loopWarn('F1::{\n  loop {\n    if (x) {\n        FileExist("a")\n        Sleep(5)\n    }\n  }\n}') === 0, 'a Sleep nested deeper or inside raw code counts');
  ok(loopWarn('F1::{\n  while (row := LV.GetNext(row)) {\n    items.Push(row)\n  }\n}') === 0, 'a while loop that walks a list is not an endless loop');
  ok(loopWarn('F1::{\n  while (on) {\n    x := 1\n  }\n}') === 1, 'while (variable) with nothing inside still is');
  { const q = impWin('; My tool\n; by me\n#Requires AutoHotkey v2.0\n#SingleInstance Force\nF1::MsgBox "x"'); ok((q.c.match(/#Requires/g) || []).length === 1, 'a #Requires line that comes after comments is not duplicated: ' + (q.c.match(/#Requires/g) || []).length); }
  console.log(errs.concat(fail).length ? 'FAILED\n - ' + errs.concat(fail).join('\n - ') : 'All self-tests passed (' + ev('Object.keys(T).length') + ' blocks)');
  process.exit(errs.concat(fail).length ? 1 : 0);
}, 900);
