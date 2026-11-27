/* ---- using what people typed: {name} in text, and the {} helper ---- */
const VARSET=new Set();
const INTERP={msg:['s'],tip:['s'],tray:['s'],text:['s'],pastet:['s'],clip:['s'],settxt:['v'],setctl:['v'],ttip2:['s'],speak:['s'],fapp:['s'],guititle:['s'],sett:['s'],ifyes:['s'],typeline:['s'],fwrite:['s'],ask3:['s'],lvadd:['a','b'],sbtext:['s']};
const EXPRF={set:['v'],if:['c'],elif:['c'],while:['c'],ifcmp:['a','b'],math:['a','b'],join:['a','b'],typev:['v'],showv:['v'],settxtx:['e'],incr:['v'],brkif:['c'],waitc:['c'],retv:['v'],callp:['a'],strlen:['v'],strcase:['v'],strrep:['v'],strsplit:['v'],forlist:['v'],iftext:['v'],setctlv:['v'],round:['v'],absv:['v'],minmax:['a','b'],modv:['a','b'],pad:['v'],trimv:['v'],substr:['v'],instrv:['v'],ifstarts:['v'],arrnew:['v'],arradd:['v'],arrget:['i'],mapset:['k','v'],mapget:['k','d'],ifmaphas:['k'],regex:['v'],regrep:['v'],ifregex:['v'],loopparse:['v'],waitrand:['a','b'],clickrand:['x1','x2','y1','y2'],fmt:['a'],ifnum:['v'],tonum:['v'],capf:['v'],arrset:['i','v'],arrdel:['i'],mapdel:['k'],webgo:['u']};
const defProp=c=>(LISTT.has(c.t)&&c.t!=='ListView')||isTab(c.t)||['Text','Button','Link','StatusBar'].includes(c.t)?'Text':'Value';
function resolveName(nm){if(/^A_\w+$/.test(nm))return nm;const m=nm.match(/^(\w+)(?:\.(\w+))?$/);if(!m)return null;const c=real().find(x=>!x.anon&&x.n===m[1]);if(c)return vn(c.n)+'.'+(m[2]||defProp(c));return VARSET.has(m[1])&&!m[2]?m[1]:null}
function qi(s){s=String(s);if(!/\{[\w.]+\}/.test(s))return q(s);const parts=[];let last=0;
  s.replace(/\{([\w.]+)\}/g,(m,nm,off)=>{const ex=resolveName(nm);if(ex===null)return m;if(off>last)parts.push(q(s.slice(last,off)));parts.push(ex);last=off+m.length;return m});
  if(last<s.length)parts.push(q(s.slice(last)));return parts.length?parts.join(' '):q(s)}
function valueChoices(){const out=[],G='From your window';
  real().forEach(c=>{if(c.anon||!c.n)return;const n=c.n,t=c.t;
    if(t==='Edit'||t==='Hotkey')out.push({l:'Text typed in '+n,e:vn(n)+'.Value',k:n,g:G});
    else if(t==='Checkbox'||t==='Radio')out.push({l:n+' is ticked (1) or not (0)',e:vn(n)+'.Value',k:n,g:G});
    else if(['DropDownList','ComboBox','ListBox'].includes(t)){out.push({l:'Chosen text in '+n,e:vn(n)+'.Text',k:n,g:G});out.push({l:'Chosen item number in '+n,e:vn(n)+'.Value',k:n+'.Value',g:G})}
    else if(isTab(t))out.push({l:'Current page name of '+n,e:vn(n)+'.Text',k:n,g:G});
    else if(['Slider','Progress','DateTime','MonthCal'].includes(t))out.push({l:'Value of '+n,e:vn(n)+'.Value',k:n,g:G});
    else if(['Text','Button','Link'].includes(t))out.push({l:'Text shown on '+n,e:vn(n)+'.Text',k:n,g:G})});
  vars(root).forEach(v=>out.push({l:'Variable '+v,e:v,k:v,g:'Your variables'}));
  [['A_Clipboard','Clipboard text'],['A_UserName','Windows user name'],['A_ComputerName','Computer name'],['A_Now','Date and time right now'],['A_ScriptDir','Folder of this script'],['A_ScreenWidth','Screen width'],['A_ScreenHeight','Screen height']].forEach(([e,l])=>out.push({l,e,k:e,g:'Built in'}));return out}
function valuesMenu(el,mode){document.querySelectorAll('.vmenu').forEach(x=>x.remove());const m=document.createElement('div');m.className='vmenu';const r=el.getBoundingClientRect();m.style.left=Math.max(8,Math.min(r.left,innerWidth-300))+'px';m.style.top=Math.max(8,Math.min(r.bottom+4,innerHeight-330))+'px';
  const hd=document.createElement('p');hd.className='tip';hd.textContent=mode==='i'?'Click one to put it into this text. It shows up as {name} and is swapped for the real value when the script runs.':'Click one to put its value into this box.';m.append(hd);
  if(!real().length&&!vars(root).size){const p=document.createElement('p');p.className='tip';p.textContent='Tip: add controls in the UI Designer, or use “Set variable” blocks, and they will show up here.';m.append(p)}
  let lg='';valueChoices().forEach(x=>{if(x.g!==lg){lg=x.g;m.append(mkE('h4',null,x.g))}const it=mkE('div',null,x.l);it.className='vi';it.onclick=()=>{const ins=mode==='i'?'{'+x.k+'}':x.e;el.focus();const s0=el.selectionStart==null?el.value.length:el.selectionStart,e0=el.selectionEnd==null?el.value.length:el.selectionEnd;el.setRangeText(ins,s0,e0,'end');el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));m.remove()};m.append(it)});
  document.body.append(m);setTimeout(()=>addEventListener('pointerdown',function f(ev){if(!m.contains(ev.target)){m.remove();removeEventListener('pointerdown',f,true)}},true),0)}
const bad=r=>r&&typeof r==='object'&&r.err?(st('Error: '+r.err),true):false;
const safePath=f=>{try{return A&&A.pathOf?A.pathOf(f):undefined}catch(e){return undefined}};

/* ---- variables panel: list + rename everywhere ---- */
let _EF=null;
function exprFields(){if(_EF)return _EF;_EF={};for(const k in T){const t=T[k],set=new Set();for(const f in t.f){if(t.f[f].o)continue;const v={};for(const g in t.f)v[g]=t.f[g].d;v[f]='QZVQ';let g;try{g=String(t.gen(v))}catch(e){continue}
  let inq=false;for(let i=0;i<g.length;i++){const ch=g[i];if(ch==='`'){i++;continue}if(ch==='"'){inq=!inq;continue}if(!inq&&g.startsWith('QZVQ',i)){set.add(f);break}}}_EF[k]=set}return _EF}
function reOut(str,o,n){const re=new RegExp('(?<![\\w.])'+o.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?!\\w)','g');let out='',buf='',inq=false;
  for(let i=0;i<str.length;i++){const ch=str[i];if(ch==='`'&&i+1<str.length){buf+=ch+str[++i];continue}if(ch==='"'){out+=inq?buf:buf.replace(re,n);buf='';out+='"';inq=!inq;continue}buf+=ch}
  return out+(inq?buf:buf.replace(re,n))}
function varRefs(o,n,apply){let count=0,first=null;const ef=exprFields();
  (function w(node){node.kids.forEach(b=>{const v=b.v||{};let hit=false;for(const f in v){const val=v[f];if(isR(val)){rwalk(val,y=>{const dd=RB[y.t];for(const g in y.v){const z=y.v[g];if(typeof z!=='string'||!z)continue;const kk=dd.f[g]&&dd.f[g].k;let nx=z;if(kk==='v'){if(z===o)nx=n}else if(kk==='n')nx=reOut(z,o,n);if(nx!==z){hit=true;if(apply)y.v[g]=nx}}});continue}if(typeof val!=='string'||!val)continue;let x=val;
      x=x.replace(new RegExp('\\{'+o.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\}','g'),'{'+n+'}');
      if(ef[b.t]&&ef[b.t].has(f))x=reOut(x,o,n);
      if(x!==val){hit=true;if(apply)v[f]=x}}
    if(hit){count++;if(!first)first=b.id}w(b)})})(root);return{count,first}}
const VNAME=/^[A-Za-z_]\w*$/;
function renameVar(o,n){n=String(n).trim();if(!VNAME.test(n))return st('A name can only use letters, numbers and _, and cannot start with a number');
  if(RES.has(n.toLowerCase())||/^A_/i.test(n))return st('“'+n+'” is reserved. Pick another name');
  if(n===o)return;if([...vars(root)].some(x=>x.toLowerCase()===n.toLowerCase()))return st('You already have a variable called “'+n+'”');
  const r=varRefs(o,n,true);render();snap();code();if(SET.vtypes&&SET.vtypes[o]){SET.vtypes=Object.assign({},SET.vtypes);SET.vtypes[n]=SET.vtypes[o];delete SET.vtypes[o]}renderVars();st('Renamed '+o+' to '+n+' in '+r.count+' block'+(r.count===1?'':'s'))}
function renderVars(){const L=$('#varl');L.replaceChildren();const vs=[...vars(root)].sort((a,b)=>a.localeCompare(b));
  if(!vs.length){const p=document.createElement('p');p.className='tip';p.textContent='No variables yet. Add a “Set variable” block and it will show up here.';L.append(p);return}
  vs.forEach(o=>{const r=varRefs(o,o+'__x',false),row=document.createElement('div');row.className='vrow';
    const VTY=varTypes(),tsel=document.createElement('select');tsel.title='What this variable holds. Auto works it out from your blocks.';[['','Auto'+(VTY[o]&&!(SET.vtypes||{})[o]?' ('+VTY[o]+')':'')],['number','number'],['text','text'],['list','list'],['map','map'],['yes/no','yes/no']].forEach(([v,l])=>tsel.add(new Option(l,v)));tsel.value=(SET.vtypes||{})[o]||'';tsel.onchange=()=>{SET.vtypes=Object.assign({},SET.vtypes);if(tsel.value)SET.vtypes[o]=tsel.value;else delete SET.vtypes[o];render();renderVars()};
    const nm=document.createElement('code');nm.textContent=o;const u=document.createElement('small');u.textContent=r.count+' block'+(r.count===1?'':'s');
    const inp=document.createElement('input');inp.placeholder='New name';inp.onkeydown=e=>{if(e.key==='Enter')go.click()};
    const go=document.createElement('button');go.textContent='Rename';go.onclick=()=>{if(inp.value.trim())renameVar(o,inp.value)};
    const jm=document.createElement('button');jm.textContent='Show';jm.title='Jump to the first block that uses it';jm.onclick=()=>{$('#vard').close();if(r.first)goBlock(r.first)};
    row.append(nm,tsel,u,inp,go,jm);L.append(row)})}
$('#vbtn').onclick=()=>{if(!TABS[cur]||view==='home')return st('Open a script first');if(view==='code')syncCode();renderVars();$('#vard').showModal()};
$('#varx').onclick=()=>$('#vard').close();

/* ---- versions ---- */
function takeVersion(label,auto){const t=TABS[cur];if(!t||view==='home')return;stash();const d=JSON.stringify([root.kids,GUI,SET]);t.versions=t.versions||[];const lv=t.versions[t.versions.length-1];
  if(lv&&lv.d===d){if(label&&!auto){lv.l=label;lv.a=false;saveLibSoon()}return}
  t.versions.push({t:Date.now(),l:label||'',a:!!auto,d});while(t.versions.length>30){const i=t.versions.findIndex(v=>v.a);t.versions.splice(i<0?0:i,1)}saveLibSoon()}
function renderVersions(){const L=$('#verl');L.replaceChildren();const t=TABS[cur],vs=(t&&t.versions)||[];
  if(!vs.length){const p=document.createElement('p');p.className='tip';p.textContent='No versions yet.';L.append(p);return}
  [...vs].reverse().forEach(v=>{const row=document.createElement('div');row.className='verrow';let n=0;try{n=cnt({kids:JSON.parse(v.d)[0]})}catch(e){}
    const sp=document.createElement('span');sp.textContent=(v.l||(v.a?'Automatic':'Saved by you'));const sm=document.createElement('small');sm.textContent=ago(v.t)+' · '+n+' blocks';sp.append(sm);
    const rn=document.createElement('button');rn.textContent='Name';rn.onclick=()=>{const x=prompt('Name this version',v.l||'');if(x!==null){v.l=x.trim();v.a=false;saveLibSoon();renderVersions()}};
    const rs=document.createElement('button');rs.className='pri';rs.textContent='Restore';rs.onclick=()=>{takeVersion('Before restore',true);restore(v.d);stash();snap();code();$('#verd').close();st('Restored the version from '+ago(v.t))};
    const dl=document.createElement('button');dl.textContent='×';dl.title='Delete this version';dl.onclick=()=>{t.versions.splice(t.versions.indexOf(v),1);saveLibSoon();renderVersions()};
    row.append(sp,rn,rs,dl);L.append(row)})}
$('#verbtn').onclick=()=>{if(!TABS[cur]||view==='home')return st('Open a script first');if(view==='code')syncCode();takeVersion('',true);renderVersions();$('#verd').showModal()};
$('#vernew').onclick=()=>{const x=prompt('Name this version (optional)','');if(x===null)return;takeVersion(x.trim()||'Saved by you',false);renderVersions()};
$('#verx').onclick=()=>$('#verd').close();
['#run','#cmp'].forEach(id=>{const b=$(id),o=b.onclick;b.onclick=function(...a){if(TABS[cur]&&view!=='home'){if(view==='code')syncCode();takeVersion('',true)}return o.apply(this,a)}});
{const o=$('#sv').onclick;$('#sv').onclick=function(...a){if(TABS[cur]&&view!=='home'){syncCode();takeVersion('',true)}return o.apply(this,a)}}

/* ---- share: .ahk that also carries the blocks ---- */
const SHARE_RE=/;\s*===NEXO-AHKS-BLOCKS[^\n]*\n((?:;[ \t]*[A-Za-z0-9+\/=]+[ \t]*\r?\n)+);\s*===END===/;
function unpackBlocks(text){const m=SHARE_RE.exec(String(text));if(!m)return null;try{const b64=m[1].split(/\r?\n/).map(l=>l.replace(/^;\s*/,'').trim()).join('');const o=JSON.parse(decodeURIComponent(escape(atob(b64))));if(!o||!Array.isArray(o.kids))return null;fix(o);return o}catch(e){return null}}
$('#shr').onclick=async()=>{if(!TABS[cur]||view==='home')return st('Open a script first');syncCode();
  const pack=JSON.stringify({v:1,name:TABS[cur].name,kids:root.kids,gui:GUI,set:SET}),b64=btoa(unescape(encodeURIComponent(pack))),lines=b64.match(/.{1,110}/g)||[];
  const txt=src().replace(/\s*$/,'')+'\n\n; ===NEXO-AHKS-BLOCKS v1 (open this file in Nexo Ahks to edit it as blocks)===\n'+lines.map(l=>'; '+l).join('\n')+'\n; ===END===\n';
  const nm=(TABS[cur].name||'script').replace(/[\\/:*?"<>|]/g,'_')+'.ahk';
  if(A){const r=await A.exportAhk(txt,nm);if(bad(r)||!r)return;st('Shared as '+r.split(/[\\/]/).pop()+'. Anyone with Nexo Ahks can open it as blocks.')}
  else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));a.download=nm;a.click()}};

/* ---- first-run tour: make a clicker in 2 minutes ---- */
const palBtn=n=>[...document.querySelectorAll('#pal .pb')].find(b=>b.textContent===n);
const hkOf=()=>root.kids.find(k=>k.t==='hotkey');
let tutRan=false,tutI=-1,tutT=0;
const TUT=[
 {h:'Welcome to Nexo Ahks',t:'In about two minutes you will build a <b>clicker</b>: press a key and it clicks the mouse for you. You never have to write code. Blocks snap together like Lego.',tg:()=>null},
 {h:'1. Choose the key',t:'Click <b>When key pressed</b> in the block list on the left. This is the trigger: everything you put inside it runs when you press that key.',tg:()=>palBtn('When key pressed'),done:()=>!!hkOf()},
 {h:'2. Add the click',t:'Now click <b>Click</b> in the list. It lands <i>inside</i> your key block, because that one is selected.',tg:()=>palBtn('Click'),done:()=>!!(hkOf()&&hkOf().kids.some(k=>k.t==='click'))},
 {h:'3. Add a short pause',t:'Click <b>Wait</b> so it does not click faster than the game or app can take. Then change the number in the block if you want (100 = a tenth of a second).',tg:()=>palBtn('Wait'),done:()=>!!(hkOf()&&hkOf().kids.some(k=>k.t==='wait'))},
 {h:'4. Pick your key',t:'The block says <b>F1</b> by default. Press the little <b>⌨</b> button next to it and hit any key you like. You can also just keep F1.',tg:()=>document.querySelector('.blk .mb'),},
 {h:'5. Run it',t:'Press <b>▶ Run</b>. Then switch to any window and press your key. Press <b>Ctrl+Alt+Q</b> at any time to stop everything.',tg:()=>$('#run'),done:()=>tutRan},
 {h:'You did it! 🎉',t:'That is a real AutoHotkey script. Peek at it with the <b>Code</b> tab, press <b>Compile to EXE</b> to share it, or try <b>⏺ Record</b> to build blocks just by doing the actions. Open the <b>?</b> help any time to restart this tour.',tg:()=>null,last:1}];
function tutClear(){document.querySelectorAll('.tut-hl').forEach(e=>e.classList.remove('tut-hl'))}
function tutShow(){let c=$('#tut');if(!c){c=document.createElement('div');c.id='tut';document.body.append(c)}
  const st0=TUT[tutI];tutClear();const tg=st0.tg();if(tg){tg.classList.add('tut-hl');if(tg.scrollIntoView)tg.scrollIntoView({block:'nearest'})}
  c.innerHTML='<div class="ts">Tour · step '+(tutI+1)+' of '+TUT.length+'</div><h3 style="margin:0 0 4px;font-size:15px;text-transform:none;letter-spacing:0">'+st0.h+'</h3><div>'+st0.t+'</div><div class="dots">'+TUT.map((_,i)=>'<i class="'+(i<=tutI?'on':'')+'"></i>').join('')+'</div><div class="tb"></div>';
  const tb=c.querySelector('.tb'),mk2=(l,f,p)=>{const b=document.createElement('button');b.textContent=l;if(p)b.className='pri';b.onclick=f;tb.append(b)};
  if(!st0.last)mk2('Skip tour',tutEnd);if(tutI>0&&!st0.last)mk2('Back',()=>{tutI--;tutShow()});
  mk2(st0.last?'Finish':(st0.done?'Next':'Next'),()=>{if(st0.last)tutEnd();else{tutI++;tutShow()}},1)}
function tutEnd(){tutI=-1;clearInterval(tutT);tutT=0;tutClear();const c=$('#tut');if(c)c.remove()}
function tutTick(){if(tutI<0)return;const st0=TUT[tutI];if(st0.done&&st0.done()){tutI++;tutShow()}else if(st0.tg){const t=st0.tg();if(t&&!t.classList.contains('tut-hl')){tutClear();t.classList.add('tut-hl')}}}
function startTutorial(){try{localStorage.setItem('nexoTutSeen','1')}catch(e){}setPane('actions');tutRan=false;if($('#hlp').open)$('#hlp').close();newTab('My first clicker');setView('blocks');root.kids.length=0;sel='root';render();code();tutI=0;tutShow();clearInterval(tutT);tutT=setInterval(tutTick,300)}
$('#run').addEventListener('click',()=>{if(tutI>=0)tutRan=true});
$('#tut-go').onclick=startTutorial;

/* ---- plain-English summary and "test this block" ---- */
const fillT=b=>String(titleT(b)||b.t).replace(/\{(\w+)\}/g,(m,f)=>{const x=b.v&&b.v[f];return isR(x)?'⟨'+rtext(x)+'⟩':x===undefined||x===''?'…':x});
function plain(b){const k=b.kids||[];return k.length?k.map(x=>fillT(x)+(x.kids&&x.kids.length?' ('+plain(x)+')':'')).join(' → '):'nothing yet'}
function testCode(b){const keep=root.kids;try{root.kids=[S('rawl',{s:'ToolTip "Nexo Ahks test: starting in 3 seconds…"'}),S('rawl',{s:'Sleep 3000'}),S('rawl',{s:'ToolTip()'}),...b.kids,S('rawl',{s:'ExitApp'})];return build()}finally{root.kids=keep}}
async function testBlock(b){if(!A)return st('Testing works in the desktop app');
  const code=testCode(b);const r=await A.runScript({id:'test_'+b.id,name:'Test: '+fillT(b),code,file:null});if(bad(r))return;st('Testing “'+fillT(b)+'” once. It starts in 3 seconds, so switch to your window. Ctrl+Alt+Q stops it.')}
$('#colall').onclick=()=>{let any=false;(function w(n){n.kids.forEach(k=>{if(T[k.t].box&&!k.col)any=true;w(k)})})(root);(function w(n){n.kids.forEach(k=>{if(T[k.t].box)k.col=any;w(k)})})(root);render()};
$('#expl').onclick=()=>{document.body.classList.toggle('explain');lsSet('nexoExplain',document.body.classList.contains('explain'))};
if(lsGet('nexoExplain',false))document.body.classList.add('explain');

