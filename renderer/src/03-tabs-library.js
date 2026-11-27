/* ---- tabs ---- */
function restore(x){const a=JSON.parse(x);root.kids=a[0];GUI=a[1];normGui(GUI);if(a[2]){SET=a[2];if(TABS[cur])TABS[cur].set=SET}sel='root';uSel=null;render();renderUI()}
/* ---- library of scripts (Home) ---- */
const uid=()=>'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
let LIB=[],RUN=new Set();
const snapOf=it=>JSON.stringify([it.kids,it.gui,it.set]);
const PERSIST=['versions','id','name','kids','gui','set','file','proj','pinned','created','edited','lastRun','runs','startup','snap','startSynced'];
function stash(){const t=TABS[cur];if(!t)return;t.kids=root.kids;t.H=H;t.R=R;t.last=last;t.gui=GUI;t.set=SET}
function load(i){cur=i;const t=TABS[i];root.kids=t.kids;H=t.H||[];R=t.R||[];GUI=t.gui||(t.gui=newGui());normGui(GUI);SET=t.set=Object.assign({},DS,t.set||{});last=t.last||snapS();sel='root';uSel=null;uPage={};renderTabs();render();renderUI()}
function addItem(name,kids,x){const it=Object.assign({id:uid(),name:name||'Script '+(LIB.length+1),kids:kids||[],gui:newGui(),created:Date.now(),edited:Date.now(),runs:0},x||{});if(!it.gui)it.gui=newGui();LIB.push(it);saveLibSoon();return it}
function openItem(it){if(view==='code')setView('blocks');stash();let i=TABS.indexOf(it);if(i<0){TABS.push(it);i=TABS.length-1}load(i);if(view==='home')setView('blocks')}
function newTab(name,kids,x){const it=addItem(name,kids,x);openItem(it);return it}
function switchTab(i){openItem(TABS[i])}
function closeTab(i){if(view==='code')setView('blocks');stash();TABS.splice(i,1);saveLibSoon();if(!TABS.length){cur=-1;setView('home');return}load(Math.min(i<cur?cur-1:cur,TABS.length-1))}
function importItem(name,text,file){const emb=unpackBlocks(text);if(emb){const it=addItem(name,emb.kids,{file,gui:emb.gui||undefined,set:emb.set?Object.assign({},DS,emb.set):undefined});normGui(it.gui);it.set=Object.assign({},DS,it.set);it.snap=snapOf(it);it._r={n:cnt({kids:it.kids}),gui:!!(it.gui&&it.gui.ctl&&it.gui.ctl.length),rawN:0};return it}const r=parseAhk(String(text).replace(/^\ufeff/,''));const it=addItem(name,r.kids,{file,gui:r.gui||undefined,set:setFromParse(r.set)});normGui(it.gui);it.set=Object.assign({},DS,it.set);it.snap=r.v1?'v1':snapOf(it);it._r=r;return it}
function withScript(it,fn){const k=root.kids,g=GUI,s=SET,iss=ISS.slice();try{root.kids=it.kids;GUI=it.gui||newGui();normGui(GUI);SET=it.set||{...DS};return fn()}finally{root.kids=k;GUI=g;SET=s;ISS.length=0;ISS.push(...iss)}}
const codeOf=it=>withScript(it,()=>build());
const lintOf=it=>{try{return withScript(it,()=>lint(build()))}catch(e){return[]}};
const isPristine=it=>!!(it.file&&it.snap&&it.snap===snapOf(it));
let _sv=0;
addEventListener('blur',()=>{if(_sv){clearTimeout(_sv);_sv=0;saveLibNow()}});addEventListener('pagehide',()=>{if(_sv){clearTimeout(_sv);_sv=0;saveLibNow()}});
function saveLibSoon(){clearTimeout(_sv);_sv=setTimeout(saveLibNow,500)}
function libData(){return{v:2,lib:LIB.map(it=>{const o={};PERSIST.forEach(k=>{if(it[k]!==undefined)o[k]=it[k]});return o}),open:TABS.map(t=>t.id),cur:TABS[cur]?TABS[cur].id:null}}
async function saveLibNow(){const d=libData();try{if(A)await A.libSave(d);else localStorage.setItem('ahkblib',JSON.stringify(d))}catch(e){}
  if(A){try{A.libSync([...LIB].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(b.lastRun||0)-(a.lastRun||0)).map(x=>({id:x.id,name:x.name})));
    for(const it of LIB)if(it.startup&&(it.edited||0)>(it.startSynced||0)){it.startSynced=Date.now();A.setStartup({id:it.id,name:it.name,code:isPristine(it)?null:codeOf(it),file:isPristine(it)?it.file:null,on:true})}}catch(e){}}}
const ago=t=>{if(!t)return'never';const s=(Date.now()-t)/1000;return s<60?'just now':s<3600?Math.floor(s/60)+' min ago':s<86400?Math.floor(s/3600)+' h ago':Math.floor(s/86400)+' d ago'};
async function runItem(it,dbgMode){if(!A)return st('Running scripts works in the desktop app');
  const isCur=TABS[cur]===it&&view!=='home';if(isCur)stash();
  const errs=(isCur?ISS:lintOf(it)).filter(x=>x.sev==='error');
  if(errs.length&&!confirm('This script has '+errs.length+' error'+(errs.length>1?'s':'')+' and AutoHotkey probably won’t start it.\n\n• '+errs[0].msg+'\n  '+errs[0].why+'\n\nRun it anyway?'))return;
  const live=isCur&&view==='code'&&EDV&&EDV.get()!==codeBase;
  const file=!live&&isPristine(it)?it.file:null,code=file?null:(isCur?src():codeOf(it));
  const dcode=dbgMode&&isCur?buildDebug(dbgMode):null;const r=await A.runScript({id:it.id,name:it.name,code:dcode||code,file:dcode?null:file,debug:dcode?dbgMode:undefined});if(bad(r))return;st(String(r));it.lastRun=Date.now();it.runs=(it.runs||0)+1;saveLibSoon()}
const toggleRun=it=>RUN.has(it.id)?A&&A.stopScript(it.id):runItem(it);
function dupItem(it){const d=addItem(it.name+' copy',JSON.parse(JSON.stringify(it.kids)),{gui:JSON.parse(JSON.stringify(it.gui)),set:{...it.set}});return d}
async function removeItem(it){const msg=it.file?'Remove “'+it.name+'” from Nexo Ahks?\n\nThe .ahk file on your disk is not deleted.':'Delete “'+it.name+'”?\n\nIt only exists inside Nexo Ahks. Export it as .ahk first if you want a copy.';if(!confirm(msg))return;
  if(RUN.has(it.id)&&A)await A.stopScript(it.id);if(it.startup&&A)A.setStartup({id:it.id,name:it.name,on:false});
  const ti=TABS.indexOf(it);if(ti>=0){if(ti===cur){TABS.splice(ti,1);if(!TABS.length){cur=-1}else load(Math.min(ti,TABS.length-1))}else{TABS.splice(ti,1);if(ti<cur)cur--}}
  LIB.splice(LIB.indexOf(it),1);saveLibSoon();renderTabs();renderHome()}
function renderHome(){const box=$('#hm-list');if(!box)return;const q=($('#hm-q').value||'').toLowerCase(),sort=$('#hm-sort').value;
  const L=LIB.filter(it=>!q||it.name.toLowerCase().includes(q)||String(it.file||'').toLowerCase().includes(q)).sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(sort==='name'?a.name.localeCompare(b.name):sort==='run'?(b.lastRun||0)-(a.lastRun||0):(b.edited||0)-(a.edited||0)));
  const nr=LIB.filter(i=>RUN.has(i.id)).length;$('#hm-sub').textContent=LIB.length+' script'+(LIB.length===1?'':'s')+' · '+nr+' running';$('#hm-stop').disabled=!nr;
  box.replaceChildren();
  if(!L.length){const e=document.createElement('div');e.className='hm-empty';e.innerHTML=LIB.length?'<h2>No scripts match “'+esc(q)+'”</h2>':'<img class="hm-logo" src="logo.png" alt=""><h2>Welcome to Nexo Ahks</h2><p>Make your first script with blocks, start from a template, or bring in .ahk files you already have. Drop an .ahk file anywhere on this window to import it.</p>';box.append(e);return}
  L.forEach(it=>box.append(card(it)))}
function card(it){const run=RUN.has(it.id),c=document.createElement('div');c.className='hc'+(run?' on':'');
  const mkb=(t,tip,fn,cls)=>{const b=document.createElement('button');b.textContent=t;b.title=tip;if(cls)b.className=cls;b.onclick=e=>{e.stopPropagation();fn()};return b};
  const top=document.createElement('div');top.className='hc-top';
  const nm=document.createElement('div');nm.className='hc-name';nm.textContent=it.name;nm.title='Double-click to rename';
  nm.ondblclick=()=>{const inp=document.createElement('input');inp.value=it.name;let d=0;const ok=()=>{if(d)return;d=1;it.name=inp.value.trim()||it.name;saveLibSoon();renderHome();renderTabs()};inp.onblur=ok;inp.onkeydown=e=>{if(e.key==='Enter')ok()};nm.replaceWith(inp);inp.focus();inp.select()};
  top.append(nm,mkb(it.pinned?'★':'☆','Pin to the top',()=>{it.pinned=!it.pinned;saveLibSoon();renderHome()},'ic'));
  const chips=document.createElement('div');chips.className='chips';
  const chip=(t,cls)=>{const s=document.createElement('span');s.className='chip '+(cls||'');s.textContent=t;chips.append(s)};
  if(run)chip('● Running','ok');chip(it.file?(isPristine(it)?'File · original':'File · edited in blocks'):'Blocks');
  const nerr=lintOf(it).filter(x=>x.sev==='error').length;if(nerr)chip('⛔ '+nerr+' error'+(nerr>1?'s':''),'bad');if(it.startup)chip('⏻ Starts with Windows');
  const meta=document.createElement('div');meta.className='hc-meta';meta.textContent='Edited '+ago(it.edited)+' · Ran '+ago(it.lastRun)+(it.runs?' ('+it.runs+'×)':'');
  const path=document.createElement('div');path.className='hc-path';path.textContent=it.file||'Stored in Nexo Ahks';path.title=it.file||'';
  const acts=document.createElement('div');acts.className='hc-acts';
  acts.append(mkb(run?'■ Stop':'▶ Run',run?'Stop this script':'Run this script now',()=>toggleRun(it),run?'':'pri'),mkb('✎ Edit','Open in the editor',()=>openItem(it)));
  const more=document.createElement('div');more.className='hc-more';
  more.append(mkb('⎘','Duplicate',()=>{dupItem(it);renderHome()},'ic'),mkb('⏻','Start with Windows (on/off)',async()=>{if(!A)return st('Only in the desktop app');const on=!it.startup;const r=await A.setStartup({id:it.id,name:it.name,code:on&&!isPristine(it)?codeOf(it):null,file:on&&isPristine(it)?it.file:null,on});if(bad(r))return;it.startup=on;it.startSynced=Date.now();saveLibSoon();st(on?'“'+it.name+'” will start with Windows':'Removed from startup');renderHome()},'ic'+(it.startup?' on':'')),
    mkb('💾','Save as .ahk file',async()=>{if(!A)return;const r=await A.exportAhk(isPristine(it)?it.file&&codeOf(it):codeOf(it),it.file||it.name+'.ahk');if(bad(r)||!r)return;it.file=r;it.snap=null;saveLibSoon();st('Saved '+r.split(/[\\/]/).pop());renderHome()},'ic'));
  if(it.file)more.append(mkb('📂','Show the file in its folder',()=>A&&A.reveal(it.file),'ic'));
  more.append(mkb('🗑','Remove',()=>removeItem(it),'ic'));acts.append(more);
  c.append(top,chips,path,meta,acts);c.ondblclick=e=>{if(e.target===c)openItem(it)};return c}
$('#hm-new').onclick=()=>newTab();
$('#hm-tpl').onclick=()=>$('#tpl').showModal();
$('#hm-imp').onclick=()=>$('#imp').click();
$('#hm-stop').onclick=()=>A&&A.stopAll();
$('#hm-q').oninput=renderHome;$('#hm-sort').onchange=renderHome;
const savePrefs=()=>A&&A.setPrefs({closeToTray:$('#hm-tray').checked,keepRunning:$('#hm-keep').checked});
$('#hm-tray').onchange=savePrefs;$('#hm-keep').onchange=savePrefs;
$('#hm-fold').onclick=async()=>{if(!A)return st('Folders work in the desktop app');const r=await A.scanFolder();if(bad(r)||!r)return;
  $('#scan-dir').textContent=r.dir+' · '+r.files.length+' .ahk file'+(r.files.length===1?'':'s')+' found';const L=$('#scan-list');L.replaceChildren();
  r.files.forEach(f=>{const had=LIB.some(x=>x.file&&x.file.toLowerCase()===f.file.toLowerCase());const lb=document.createElement('label');lb.className='srow';const cb=document.createElement('input');cb.type='checkbox';cb.checked=!had;cb.dataset.file=f.file;cb.dataset.name=f.name;const sp=document.createElement('span');sp.textContent=f.name+(had?'  (already added)':'')+'  ·  '+Math.max(1,Math.round(f.size/1024))+' KB';lb.append(cb,sp);L.append(lb)});
  if(!r.files.length)L.textContent='No .ahk files in that folder.';$('#scan').showModal()};
$('#scan-x').onclick=()=>$('#scan').close();
$('#scan-go').onclick=async()=>{const picks=[...document.querySelectorAll('#scan-list input:checked')];let n=0;for(const cb of picks){const t=await A.readFile(cb.dataset.file);if(bad(t))continue;importItem(cb.dataset.name,t,cb.dataset.file);n++}$('#scan').close();st('Added '+n+' script'+(n===1?'':'s')+' to Home');saveLibSoon();renderHome()};
/* ---- quick launcher (Ctrl+K) ---- */
let qkSel=0;const fuzzy=(s,q)=>{let i=0;for(const ch of s){if(ch===q[i])i++;if(i===q.length)return true}return!q};
const qkItems=()=>{const q=$('#qk-in').value.toLowerCase().trim();return LIB.filter(it=>fuzzy(it.name.toLowerCase(),q)).sort((a,b)=>(RUN.has(b.id)?1:0)-(RUN.has(a.id)?1:0)||(b.pinned?1:0)-(a.pinned?1:0)||(b.lastRun||0)-(a.lastRun||0)).slice(0,12)};
function qkRender(){const L=qkItems(),box=$('#qk-list');box.replaceChildren();qkSel=Math.min(qkSel,Math.max(0,L.length-1));
  if(!L.length){box.innerHTML='<p class="tip" style="padding:8px">No scripts match.</p>';return}
  L.forEach((it,i)=>{const d=document.createElement('div');d.className='qi'+(i===qkSel?' on':'');d.innerHTML='<span></span><small></small>';d.firstChild.textContent=it.name;d.lastChild.textContent=RUN.has(it.id)?'● running — Enter stops':'Enter runs';d.onclick=()=>{qkSel=i;qkGo(false)};box.append(d)})}
function qkGo(edit){const it=qkItems()[qkSel];if(!it)return;$('#qk').close();edit?openItem(it):toggleRun(it)}
function qkOpen(){if(!LIB.length)return st('No scripts yet. Make one first.');qkSel=0;$('#qk-in').value='';qkRender();$('#qk').showModal();$('#qk-in').focus()}
$('#qk-in').oninput=()=>{qkSel=0;qkRender()};
$('#qk-in').onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();qkSel++;qkRender()}else if(e.key==='ArrowUp'){e.preventDefault();qkSel=Math.max(0,qkSel-1);qkRender()}else if(e.key==='Enter'){e.preventDefault();qkGo(e.ctrlKey||e.metaKey)}};
function renderTabs(){const t=$('#tabs');t.replaceChildren();
  const h=document.createElement('div');h.className='tab home'+(view==='home'?' on':'');h.textContent='⌂ Home';h.onclick=()=>setView('home');t.append(h);
  TABS.forEach((x,i)=>{const e=document.createElement('div');e.className='tab'+(view!=='home'&&i===cur?' on':'')+(RUN.has(x.id)?' run':'');e.setAttribute('role','tab');
    const nm=document.createElement('span');nm.textContent=x.name;nm.title='Double-click to rename';
    nm.ondblclick=()=>{const inp=document.createElement('input');inp.value=x.name;let d=0;const ok=()=>{if(d)return;d=1;x.name=inp.value.trim()||x.name;renderTabs();saveLibSoon()};inp.onblur=ok;inp.onkeydown=ev=>{if(ev.key==='Enter')ok()};inp.onclick=ev=>ev.stopPropagation();nm.replaceWith(inp);inp.focus();inp.select()};
    const cx=document.createElement('button');cx.textContent='×';cx.title='Close tab (the script stays on Home)';cx.onclick=ev=>{ev.stopPropagation();closeTab(i)};
    e.ondragover=ev=>{if(DRAG&&DRAG.id&&i!==cur){ev.preventDefault();e.classList.add('dropt')}};e.ondragleave=()=>e.classList.remove('dropt');
    e.ondrop=ev=>{e.classList.remove('dropt');const d=ev.dataTransfer.getData('text');if(!d.startsWith('move:')||i===cur||view==='home')return;ev.preventDefault();
      const f=findBlock(root,d.slice(5));if(!f)return;const copy=ev.ctrlKey||ev.altKey,c=cl(f.n);if(!copy)f.p.kids.splice(f.i,1);
      TABS[i].kids.push(c);TABS[i].edited=Date.now();DRAG=null;sel='root';render();snap();code();saveLibSoon();st((copy?'Copied':'Moved')+' the block to “'+TABS[i].name+'”')};
    e.onclick=()=>{if(i!==cur||view==='home')switchTab(i)};e.append(nm,cx);t.append(e)});
  const p=document.createElement('button');p.id='newtab';p.textContent='+';p.title='New script';p.onclick=()=>newTab();t.append(p)}
/* ---- views + Monaco ---- */
let view='home',ed=null,EDV=null,codeBase='';
function loadMonaco(){return new Promise(res=>{if(ed)return res(ed);const s=document.createElement('script');s.src='../node_modules/monaco-editor/min/vs/loader.js';s.onerror=()=>res(null);
  s.onload=()=>{try{window.require.config({paths:{vs:'../node_modules/monaco-editor/min/vs'}});window.require(['vs/editor/editor.main'],()=>{initMonaco();res(ed)},()=>res(null))}catch(e){res(null)}};document.head.append(s);setTimeout(()=>res(ed),8000)})}
function initMonaco(){const m=window.monaco;m.languages.register({id:'ahk'});
  m.languages.setMonarchTokensProvider('ahk',{ignoreCase:true,tokenizer:{root:[[/;.*$/,'comment'],[/"(?:[^"`]|`.)*"/,'string'],[/^#\w+/,'keyword'],[/^\S+?::/,'type'],[/\b\d+(\.\d+)?\b/,'number'],[/\b(loop|while|if|else|break|return|global|static|for|in|try|catch|throw|class|continue|until|switch|case)\b/,'keyword'],[/\b(send|sendtext|click|sleep|msgbox|run|mousemove|winactivate|exitapp|settimer|tooltip|keywait|gui)\b/,'predefined']]}});
  m.languages.registerCompletionItemProvider('ahk',{provideCompletionItems:(model,pos)=>{const w=model.getWordUntilPosition(pos),range={startLineNumber:pos.lineNumber,endLineNumber:pos.lineNumber,startColumn:w.startColumn,endColumn:w.endColumn};return{suggestions:AHKW.map(x=>({label:x,kind:m.languages.CompletionItemKind.Function,insertText:x,range}))}}});
  m.editor.defineTheme('ahkd',{base:'vs-dark',inherit:true,rules:[],colors:{'editor.background':'#0a0c11'}});
  ed=m.editor.create($('#mon'),{value:'',language:'ahk',theme:dk()?'ahkd':'vs',minimap:{enabled:false},fontSize:13,automaticLayout:true,scrollBeyondLastLine:false,tabSize:2,padding:{top:10}})}
async function getEd(){if(EDV)return EDV;const m=await loadMonaco();if(m)EDV={get:()=>ed.getValue(),set:v=>ed.setValue(v)};
  else{const ta=document.createElement('textarea');ta.id='fb';ta.spellcheck=false;$('#mon').append(ta);EDV={get:()=>ta.value,set:v=>{ta.value=v}}}return EDV}
function syncCode(){if(view!=='code'||!EDV)return;const t=EDV.get();if(t===codeBase)return;const r=parseAhk(t);root.kids=r.kids;GUI=r.gui||newGui();normGui(GUI);SET=TABS[cur].set=setFromParse(r.set);codeBase=t;sel='root';stash();snap()}
async function enterCode(){const e=await getEd();codeBase=build();e.set(codeBase)}
function leaveCode(){if(!EDV)return;const t=EDV.get();if(t!==codeBase){const r=parseAhk(t);root.kids=r.kids;GUI=r.gui||newGui();normGui(GUI);SET=TABS[cur].set=setFromParse(r.set);sel='root';render();renderUI();st('Code applied: '+r.n+' blocks'+(r.rawN?' ('+r.rawN+' raw lines)':''))}}
async function setView(v){if(v!=='home'&&!TABS.length){newTab();return}
  if(view==='code'&&v!=='code')leaveCode();view=v;$('#main').dataset.v=v;document.body.dataset.v=v;
  ['home','blocks','ui','code'].forEach(x=>$('#v-'+x).hidden=x!==v);
  document.querySelectorAll('#views button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  renderTabs();if(v==='home')renderHome();if(v==='ui')renderUI();if(v==='blocks')render();if(v==='code')await enterCode()}

