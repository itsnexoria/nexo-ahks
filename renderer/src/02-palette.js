/* ---- drag & drop of value blocks ---- */
let lastSlot=null;
function dropInto(h,f,dr){if(!dr)return;let rep=null;
  if(dr.rt)rep=mkR(dr.rt,dr.vals);else if(dr.rep){rep=dr.rep;if(rcontains(rep,h))return;if(dr.from&&dr.from.h&&dr.from.h.v[dr.from.f]===rep)dr.from.h.v[dr.from.f]=defOf(dr.from.h,dr.from.f)}
  if(!rep)return;h.v[f]=rep;DRAG=null;document.body.classList.remove('dragrep');render()}
function slotShell(h,f,inner){const sp=document.createElement('span');sp.className='slot';sp.append(inner);
  sp.ondragover=e=>{if(DRAG&&(DRAG.rt||DRAG.rep)){e.preventDefault();e.stopPropagation();sp.classList.add('over')}};
  sp.ondragleave=()=>sp.classList.remove('over');
  sp.ondrop=e=>{sp.classList.remove('over');if(DRAG&&(DRAG.rt||DRAG.rep)){e.preventDefault();e.stopPropagation();dropInto(h,f,DRAG)}};
  sp.addEventListener('focusin',()=>{lastSlot={h,f};if(PANE!=='values'&&!$('#ps').value)setPane('values')});return sp}
function vlist(){let d=document.getElementById('varlist');if(!d){d=document.createElement('datalist');d.id='varlist';document.body.append(d)}d.replaceChildren();[...vars(root)].sort().forEach(x=>d.append(new Option(x)));return d}
function slotFor(h,k,spec,val){let inner;
  if(isR(val))inner=rpill(val,h,k);
  else if(spec.k==='o'||spec.k==='c'){const el=document.createElement('select');let ops=spec.k==='c'?ctlNames():spec.o;if(!ops.includes(val))ops=[val,...ops];ops.forEach(o=>el.add(new Option(o,o)));el.value=val;el.onchange=()=>{h.v[k]=el.value;code()};el.onclick=e=>e.stopPropagation();inner=el}
  else{const el=document.createElement('input');el.value=val==null?'':val;el.size=1;el.style.width=Math.max(30,spec.w||44)+'px';el.placeholder=spec.k==='t'?'text':spec.k==='v'?'name':'value';if(spec.k==='v'){vlist();el.setAttribute('list','varlist')}
    el.oninput=()=>{h.v[k]=el.value;code()};el.onclick=e=>e.stopPropagation();el.setAttribute('aria-label',k);inner=el}
  return slotShell(h,k,inner)}
function rpill(x,h,f){const d=RB[x.t],s=document.createElement('span');s.className='rp '+d.c+(d.ty==='b'?' bool':'');s.draggable=true;s.title='Drag to another input to move it, or drag it away to delete it';
  s.ondragstart=e=>{e.stopPropagation();DRAG={rep:x,from:{h,f}};e.dataTransfer.setData('text','rep:move');document.body.classList.add('dragrep')};
  s.ondragend=e=>{document.body.classList.remove('dragrep');if(DRAG&&DRAG.rep===x&&e.dataTransfer&&e.dataTransfer.dropEffect==='none'){h.v[f]=defOf(h,f);DRAG=null;render()}else DRAG=null};
  rT(x).split(/(\{\w+\})/).forEach(p=>{const m=p.match(/^\{(\w+)\}$/);if(!m){if(p.trim()){const l=document.createElement('span');l.className='lbl';l.textContent=p.trim();s.append(l)}return}s.append(slotFor(x,m[1],d.f[m[1]],x.v[m[1]]))});
  const rm=document.createElement('button');rm.className='rpx';rm.textContent='×';rm.title='Remove this value';rm.onclick=e=>{e.stopPropagation();h.v[f]=defOf(h,f);render()};s.append(rm);s.onclick=e=>e.stopPropagation();return s}
function rLabel(t,vals){return rT({t,v:vals||{}}).replace(/\{(\w+)\}/g,(m,f)=>vals&&vals[f]?vals[f]:'▢')}
function rBtn(t,vals){const b=document.createElement('button');b.className='pb rp '+RB[t].c+(RB[t].ty==='b'?' bool':'');b.textContent=t==='var'&&vals&&vals.n?vals.n:rLabel(t,vals);b.draggable=true;try{b.title=rexpr(mkR(t,vals))}catch(e){}
  b.ondragstart=e=>{DRAG={rt:t,vals};e.dataTransfer.setData('text','rep:new');document.body.classList.add('dragrep')};b.ondragend=()=>{document.body.classList.remove('dragrep');DRAG=null};
  b.onclick=()=>{if(lastSlot&&lastSlot.h&&document.body.contains(document.activeElement)||lastSlot){dropInto(lastSlot.h,lastSlot.f,{rt:t,vals});lastSlot=null}else st('Drag this into a white input slot, or click an input first and then click this block')};return b}
function palVars(){let c=document.getElementById('palvars');if(!c){c=document.createElement('div');c.id='palvars';const first=$('#pal').querySelector('.grp.val');if(first)first.after(c);else return}c.replaceChildren();
  const d=document.createElement('div');d.className='grp val';d.innerHTML='<h2>Your variables</h2>';const w=document.createElement('div');w.className='pal';const vs=[...vars(root)].sort();
  [...vs,'A_Index'].forEach(n=>w.append(rBtn('var',{n})));if(!vs.length){const h=document.createElement('div');h.className='hint';h.style.cssText='font-size:11.5px;opacity:.7;padding:2px 4px';h.textContent='Variables you create with “Set variable” show up here.';w.append(h)}d.append(w);c.append(d);
  const ty=varTypes(),ls=vs.filter(x=>ty[x]==='list'),ms=vs.filter(x=>ty[x]==='map');
  if(ls.length||ms.length){const g=document.createElement('div');g.className='grp val';g.innerHTML='<h2>Your lists &amp; maps</h2>';const w2=document.createElement('div');w2.className='pal';
    ls.forEach(n=>{w2.append(rBtn('litem',{l:n}),rBtn('llen',{l:n}),rBtn('pick',{l:n}))});ms.forEach(n=>{w2.append(rBtn('mget',{m:n}),rBtn('mhas',{m:n}))});g.append(w2);c.append(g)}}
function palValues(){const head=document.createElement('div');head.className='grp val vhead';head.innerHTML='<h2>VALUE BLOCKS</h2><div class="hint" style="font-size:11.5px;opacity:.75;padding:0 4px 4px">Drag these into any white input slot, even into each other.</div>';$('#pal').append(head);
  RGROUPS.filter(g=>g!=='Variables'&&g!=='My blocks').forEach((g,gi)=>{const d=document.createElement('div');d.className='grp val';d.innerHTML='<h2>'+g+'</h2>';const w=document.createElement('div');w.className='pal';Object.keys(RB).filter(k=>RB[k].g===g).forEach(k=>w.append(rBtn(k)));
    d.firstChild.style.cursor='pointer';d.firstChild.title='Click to collapse';d.firstChild.onclick=()=>{w.hidden=!w.hidden};if(gi>1)w.hidden=true;d.append(w);$('#pal').append(d)})}

/* per-block DOM cache: a block is rebuilt only when it (or anything inside it) or the things it shows (control names, functions) changed */
let BC=new WeakMap();let ENVSIG='';
function envSig(){try{return JSON.stringify([ctlNames(),allFuncs(),real().map(c=>[c.n,c.t,c.anon?1:0]),myDefs()])}catch(e){return String(Math.random())}}
function blk(b){const sg=JSON.stringify(b),c=BC.get(b);let d;
  if(c&&c.sg===sg&&c.env===ENVSIG)d=c.el;else{d=blkBuild(b);BC.set(b,{sg,env:ENVSIG,el:d})}
  d.classList.toggle('sel',sel===b.id||selSet.has(b.id));return d}
function blkBuild(b){const t=T[b.t],d=document.createElement('div');d.className='blk '+t.c+(sel===b.id||selSet.has(b.id)?' sel':'');d.dataset.id=b.id;if(b.tag)d.dataset.tag=b.tag;
  const r=document.createElement('div');r.className='row';try{r.title=genOf(b)}catch(e){}
  const h=document.createElement('span');h.className='h';h.textContent='⋮⋮';h.title='Drag to move';h.draggable=true;
  h.ondragstart=e=>{DRAG={t:b.t,id:b.id};e.dataTransfer.setData('text','move:'+b.id);e.dataTransfer.setDragImage(d,10,10)};r.append(h);if(t.box)r.append(mb(b.col?'▸':'▾','Collapse or expand',()=>{b.col=!b.col;render()}));if(['hotkey','hkpass','hkup','hotstr'].includes(b.t))r.append(mb('▶','Test just this block once. It starts after 3 seconds so you can switch windows.',()=>testBlock(b)));
  titleT(b).split(/(\{\w+\})/).forEach(s=>{const m=s.match(/^\{(\w+)\}$/);
    if(!m){if(s.trim())r.append(s.trim());return}
    const k=m[1],f=t.f[k];let el;
    if(isR(b.v[k])){r.append(slotShell(b,k,rpill(b.v[k],b,k)));return}
    if(f.o||f.ctl){el=document.createElement('select');let ops=f.ctl?ctlNames():f.o;if(!ops.includes(b.v[k]))ops=[b.v[k],...ops];ops.forEach(o=>el.add(new Option(o,o)));el.value=b.v[k]}
    else{el=document.createElement(f.ta?'textarea':'input');el.value=b.v[k];if(f.ta){el.rows=3;el.style.cssText='width:'+(f.w||260)+'px;resize:vertical;font:inherit'}else{el.size=1;el.style.width=(f.w||80)+'px'}if(f.p)el.placeholder=f.p}
    el.setAttribute('aria-label',k);el.oninput=el.onchange=()=>{b.v[k]=el.value;try{r.title=genOf(b)}catch(e){}code()};
    el.onclick=e=>e.stopPropagation();
    if(canDrop(b,k)){if(el.tagName==='INPUT'&&!el.placeholder)el.placeholder=fieldKind(b.t,k)==='text'?'text':'value';r.append(slotShell(b,k,el))}else r.append(el);
    if(b.t==='ifpix'&&k==='c'){const sw=document.createElement('span');sw.style.cssText='width:16px;height:16px;border-radius:4px;border:1px solid rgba(0,0,0,.4);display:inline-block';const up=()=>{sw.style.background=String(b.v.c).replace(/^0x/i,'#')};up();el.addEventListener('input',up);r.append(sw)}
    if(/^0x[0-9a-f]{6}$/i.test(String(f.d||'')))r.append(mb('🎨','Pick this color from the screen with a magnifier',()=>pickColorField(b,k)));
    if(/\.(png|jpe?g)$/i.test(String(f.d||''))){r.append(mb('📷','Capture part of the screen to use as the picture to look for (drag a box)',()=>captureField(b,k)));if(PREV[b.v[k]]){const im=new Image();im.src=PREV[b.v[k]];im.className='cpv';im.title=String(b.v[k]);r.append(im)}}
    if(f.ctl&&b.v[k])r.append(mb('🖼','Show this control in the UI Designer',()=>jumpCtl(String(b.v[k]))));
    if(f.r)r.append(mb('⌨','Click, then press a key or combo to fill this in',()=>rec(b,k,f.r,el)));
    {const im=(INTERP[b.t]||[]).includes(k)?'i':(EXPRF[b.t]||[]).includes(k)?'x':'';if(im&&el.tagName==='INPUT')r.append(mb('{}',im==='i'?'Insert something the user typed, or a variable, into this text':'Insert what the user typed, or a variable, here',()=>valuesMenu(el,im)))}
    const mm=k.match(/^y(\d?)$/);if(mm&&t.f['x'+mm[1]])r.append(mb('🎯','Pick a screen spot: click it on the frozen screen',()=>pick(b,mm[1])))});
  const x=document.createElement('button');x.className='x';x.textContent='×';x.title='Delete block';x.setAttribute('aria-label','Delete block');
  x.onclick=e=>{e.stopPropagation();const r=findBlock(root,b.id);r.p.kids.splice(r.i,1);if(has(b,sel))sel='root';render()};const dp=document.createElement('button');dp.className='x';dp.textContent='⧉';dp.title='Duplicate block';dp.setAttribute('aria-label','Duplicate block');dp.onclick=e=>{e.stopPropagation();const r=findBlock(root,b.id);r.p.kids.splice(r.i+1,0,cl(b));render()};const of=mb(b.off?'▶':'⏻',b.off?'Enable block':'Disable block (comments it out)',()=>{b.off=!b.off;render()});dp.style.marginLeft='auto';x.style.marginLeft='0';r.append(dp,of,x);if(b.off)d.style.opacity='.45';d.append(r);r.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();blockMenu(e,b)};if(b.cmt){const cm=document.createElement('div');cm.className='cmtline';cm.textContent='💬 '+b.cmt;cm.title='Right-click the block to edit this comment';d.append(cm)}
  d.onclick=e=>{e.stopPropagation();if(e.ctrlKey||e.metaKey||e.shiftKey){if(!selSet.size&&sel!=='root')selSet.add(sel);if(selSet.has(b.id))selSet.delete(b.id);else selSet.add(b.id);sel=b.id;if(selSet.size<2){selSet.clear()}else st(selSet.size+' blocks selected. Delete, Ctrl+D, Ctrl+C and Alt+↑/↓ work on all of them.')}else selSet.clear(),sel=b.id;render()};d.tabIndex=-1;if(t.box){const k=document.createElement('div');k.className='kids';k.append(list(b));if(b.col)k.style.display='none';d.append(k);const sm=document.createElement('div');sm.className='sum';sm.textContent=(b.t==='hotkey'?'':'')+fillT(b)+': '+plain(b);d.append(sm);if(b.col)d.classList.add('col')}
  return d}
const TAGS={red:'#e5484d',orange:'#f08a24',yellow:'#e5c13a',green:'#30a46c',blue:'#4a86f0',purple:'#8e4ec6'};
function blockMenu(e,b){const old=document.getElementById('bmenu');if(old)old.remove();const m=document.createElement('div');m.id='bmenu';m.className='bmenu';
  const close=()=>{m.remove();document.removeEventListener('pointerdown',away,true);document.removeEventListener('keydown',esc,true)};
  const away=ev=>{if(!m.contains(ev.target))close()},esc=ev=>{if(ev.key==='Escape')close()};
  const h=document.createElement('div');h.className='bm-h';h.textContent='Colour tag';m.append(h);
  const sw=document.createElement('div');sw.className='bm-sw';
  [['',' none']].concat(Object.keys(TAGS).map(k=>[k,k])).forEach(([k,l])=>{const x=document.createElement('button');x.className='bm-c'+((b.tag||'')===k?' on':'');x.title=k?k[0].toUpperCase()+k.slice(1):'No tag';x.style.background=k?TAGS[k]:'transparent';x.textContent=k?'':'∅';x.onclick=()=>{if(k)b.tag=k;else delete b.tag;close();render()};sw.append(x)});m.append(sw);
  const h2=document.createElement('div');h2.className='bm-h';h2.textContent='Comment (saved in the script as “; …”)';m.append(h2);
  const ta=document.createElement('textarea');ta.rows=2;ta.value=b.cmt||'';ta.placeholder='Why does this block exist?';m.append(ta);
  const row=document.createElement('div');row.className='bm-r';
  const sv=document.createElement('button');sv.className='pri';sv.textContent='Save comment';sv.onclick=()=>{const v=ta.value.trim();if(v)b.cmt=v;else delete b.cmt;close();render()};row.append(sv);
  if(b.cmt){const rm=document.createElement('button');rm.textContent='Remove';rm.onclick=()=>{delete b.cmt;close();render()};row.append(rm)}m.append(row);
  document.body.append(m);const W=innerWidth,H=innerHeight;m.style.left=Math.max(6,Math.min(e.clientX||20,W-250))+'px';m.style.top=Math.max(6,Math.min(e.clientY||20,H-230))+'px';
  setTimeout(()=>{document.addEventListener('pointerdown',away,true);document.addEventListener('keydown',esc,true)},0);return m}
function render(){try{palVars()}catch(e){}try{palMine()}catch(e){}if(sel==='root')selSet.clear();else selSet.forEach(i=>{if(!findBlock(root,i))selSet.delete(i)});snap();const c=$('#canvas');ENVSIG=envSig();vlist();c.replaceChildren(list(root));c.querySelectorAll('.blk').forEach(e=>e.classList.toggle('sel',e.dataset.id===sel||selSet.has(e.dataset.id)));c.onclick=()=>{sel='root';render()};code()}
const VT={arrnew:'list',strsplit:'list',mapnew:'map',sett:'text',setbool:'yes/no',tog:'yes/no',math:'number',rnd:'number',round:'number',absv:'number',minmax:'number',modv:'number',tonum:'number',strlen:'number',instrv:'number',arrlen:'number',mapcount:'number',time:'text',join:'text',strcase:'text',strrep:'text',substr:'text',trimv:'text',pad:'text',fmt:'text',capf:'text',repeat:'text',rclip:'text',fread:'text',wintitle:'text',inbox:'text',askpw:'text',copysel:'text',arrjoin:'text'};
function exprType(val){if(isR(val)){const d=RB[val.t];if(!d)return'';if(d.ty==='t'||d.ty==='d')return'text';if(d.ty==='b')return'yes/no';if(d.ty==='l')return'list';return d.ty==='n'&&!['Variables','Lists','My blocks'].includes(d.g)?'number':''}
  const z=String(val==null?'':val).trim();if(/^-?\d+(\.\d+)?$/.test(z))return'number';if(/^"[^"]*"$/.test(z))return'text';if(/^\[/.test(z))return'list';if(/^Map\(/i.test(z))return'map';if(/^(true|false)$/i.test(z))return'yes/no';return''}
/* what kind of thing each variable holds, worked out from the blocks that set it (the Variables panel can override) */
function varTypes(){const ty={};(function w(n){n.kids.forEach(b=>{if(!b.off){const t=b.t==='set'?exprType(b.v.v):VT[b.t]||'';const nm=b.v&&b.v.n?vn(b.v.n):'';
      if(t&&nm){if(ty[nm]===undefined)ty[nm]=t;else if(ty[nm]!==t)ty[nm]='mixed'}}w(b)})})(root);
  const o=(SET&&SET.vtypes)||{};for(const k in o)if(o[k])ty[k]=o[k];return ty}
const TNEED={arradd:{n:'list'},arrget:{l:'list'},arrlen:{l:'list'},arrpop:{l:'list'},arrrand:{l:'list'},arrjoin:{l:'list'},arrdel:{l:'list'},arrset:{l:'list'},arrclear:{l:'list'},forlist:{v:'list'},forarr:{l:'list'},mapset:{m:'map'},mapget:{m:'map'},ifmaphas:{m:'map'},mapdel:{m:'map'},mapcount:{m:'map'},formap:{m:'map'}};
const RNEED={litem:{l:'list'},llen:{l:'list'},pick:{l:'list'},joinl:{l:'list'},mhas:{m:'map'},mget:{m:'map'}};
/* does a loop body ever pause or leave? (looks into nested blocks and raw code too) */
function hasPause(b){const RE=/\b(Sleep|KeyWait|WinWait\w*|ClipWait|ProcessWait\w*|MsgBox|InputBox|break|return|ExitApp|Exit|RunWait|until|Reload|throw)\b/i;
  return(b.kids||[]).some(k=>{if(['wait','rwait','kwait','wwait','waitc','brkif','brk','ret','exit','ask3','askpw','inbox','ifyes'].includes(k.t))return true;let t='';try{t=String(genOf(k))}catch(e){}if(k.t==='rawl'||!k.box){if(RE.test(t))return true}return hasPause(k)})}
function typeIssues(){const ty=varTypes(),out=[];
  const cps=new Set(real().filter(c=>c.t==='Button'&&c.colorpick&&c.n).map(c=>vn(c.n)));
  (function w(n){n.kids.forEach(b=>{if(!b.off)for(const f in b.v)if(isR(b.v[f]))rwalk(b.v[f],x=>{if(x.t==='colorof'){const z=String(isR(x.v.c)?'':x.v.c).trim();if(z&&!cps.has(vn(z)))out.push({b,msg:'“'+z+'” is not a color picker button',why:'“picked color of” only works on a Button that has “Color picker button” ticked in the UI Designer.'})}});w(b)})})(root);const chk=(b,nm,need,where)=>{const z=String(nm==null?'':nm).trim();if(!/^[A-Za-z_]\w*$/.test(z))return;const have=ty[z];if(have&&have!=='mixed'&&have!==need)out.push({b,msg:'“'+z+'” holds '+(have==='yes/no'?'a yes/no value':'a '+have)+', but '+where+' needs a '+need,why:'This block works on a '+need+'. Use a variable that you made with a '+(need==='list'?'“Make list”':'“Make a lookup table”')+' block, or fix the variable’s type in the Variables panel.'})};
  (function w(n){n.kids.forEach(b=>{if(!b.off){const nd=TNEED[b.t];if(nd)for(const f in nd)chk(b,b.v[f],nd[f],'“'+(LBL[b.t]||b.t)+'”');
      for(const f in b.v)if(isR(b.v[f]))rwalk(b.v[f],x=>{const rn=RNEED[x.t];if(rn)for(const g in rn)chk(b,isR(x.v[g])?'':x.v[g],rn[g],'“'+rtext(x).replace(/[⟨⟩]/g,'')+'”')})}w(b)})})(root);return out}
function vars(n,s=new Set()){n.kids.forEach(b=>{if(b.off)return;if(VARB.includes(b.t)&&!/^A_/i.test(String(b.v.n)))s.add(vn(b.v.n));if(b.t==='getpos'){s.add(vn(b.v.vx));s.add(vn(b.v.vy))}if(b.t==='wgetpos')['x','y','w','h'].forEach(k=>s.add(vn(b.v[k])));vars(b,s)});return s}
function gen(n,ind,V){let o=[];n.kids.forEach(b=>{const t=T[b.t],p='  '.repeat(ind);let l=b.t==='guislot'?genGui().map(x=>p+x):genOf(b).split('\n').map(x=>p+x);
  const _tr=DBG&&!b.off&&!t.glob&&t.c!=='event'&&!noTrace.has(b.t);
  if(_tr){const vs=[...V].slice(0,10);l.unshift(p+'NexoT('+q(b.id)+', '+q(vs.join(','))+(vs.length?', '+vs.join(', '):'')+')')}
  if(b.cmt)l.unshift(...String(b.cmt).split(/\r?\n/).map(x=>p+'; '+x));
  if(t.box){const kn=SET&&SET.known?new Set(SET.known):null,ld=localDecl(b),gl0=Array.isArray(b.gl)?[...new Set([...b.gl,...[...V].filter(x=>!(kn&&kn.has(x)))])]:[...V],gl=gl0.filter(x=>!ld.has(x)&&!(b.t==='funcp'&&String(b.v.p).split(',').some(z=>z.trim().replace(/^[&*]+|\?$|\s*:?=.*$/g,'')===x)));if(t.glob&&gl.length)l.push(p+'  global '+gl.join(', '));l.push(...gen(b,ind+1,V),p+'}',...(t.tail?t.tail(resolveVals(b).vals).map(x=>p+x):[]))}
  if(b.off)l=l.map(x=>p+'; '+x.slice(p.length));o.push(...l)});return o}
function build(){const V=vars(root),h=['#Requires AutoHotkey v2.0'];VARSET.clear();V.forEach(x=>VARSET.add(x));
  if(SET.si)h.push('#SingleInstance '+SET.si);
  if(SET.notray)h.push('#NoTrayIcon');
  if(SET.prio)h.push('ProcessSetPriority "'+SET.prio+'"');
  if(+SET.mt>1)h.push('#MaxThreadsPerHotkey '+(+SET.mt));
  if(SET.sm)h.push('SendMode '+q(SET.sm));
  if(SET.admin)h.push('if !A_IsAdmin {',"  Run '*RunAs \"' A_ScriptFullPath '\"'",'  ExitApp','}');
  if(SET.wd)h.push('SetWorkingDir A_ScriptDir');
  if(SET.cm)h.push('CoordMode "Mouse", "Screen"');if(SET.cp)h.push('CoordMode "Pixel", "Screen"');
  if(SET.dh)h.push('DetectHiddenWindows true');
  if(SET.kd!==''&&SET.kd!=null)h.push('SetKeyDelay '+SET.kd);if(SET.md!==''&&SET.md!=null)h.push('SetMouseDelay '+SET.md);
  if(SET.pers||hasType(root,'trayitem'))h.push('Persistent true');
  h.push(...((SET.inits&&SET.known)?[...SET.inits,...[...V].filter(v=>!SET.inits.includes(v)&&!SET.known.includes(v))]:[...V]).map(v=>v+' := 0'),...(hasSlot(root)?[]:genGui()));const body=gen(root,0,V);
  if(SET.panic&&SET.pk)body.push('',...(hasType(root,'hotif')?['#HotIf']:[]),'; Emergency stop: '+SET.pk,SET.pk+'::ExitApp');
  return addHelpers([...h,'',...body].join('\n')+'\n')}
const cnt=n=>n.kids.reduce((a,b)=>a+1+cnt(b),0);
function applyFix(x){if(!x||!x.fix)return;x.fix.fn();render();snap();code();st('Fixed: '+x.msg)}
function fixAll(){let n=0;for(;n<30;n++){const x=lint(build()).find(i=>i.fix);if(!x)break;x.fix.fn()}render();snap();code();st(n?'Fixed '+n+' problem'+(n>1?'s':''):'Nothing to fix automatically')}
function fixBtn(x){const fb=document.createElement('button');fb.className='fixbtn';fb.textContent='🔧 '+x.fix.label;fb.onclick=e=>{e.stopPropagation();applyFix(x)};return fb}
function paintIssues(w){const L=$('#lint'),by={};w.forEach(x=>{if(x.id)(by[x.id]=by[x.id]||[]).push(x)});L.replaceChildren();
  if(!w.length){const li=document.createElement('li');li.className='ok';li.textContent='✓ No problems found';L.append(li)}
  const nf=w.filter(x=>x.fix).length;if(nf>1){const li=document.createElement('li');const b=document.createElement('button');b.className='fixbtn all';b.textContent='🔧 Fix all '+nf+' automatically';b.onclick=fixAll;li.append(b);L.append(li)}
  w.forEach(x=>{const li=document.createElement('li');li.className='iss '+x.sev;const b=document.createElement('b'),sm=document.createElement('small');b.textContent=({error:'⛔ ',warn:'⚠ ',info:'ℹ '})[x.sev]+x.msg;sm.textContent=x.why||'';li.append(b,sm);if(x.fix)li.append(fixBtn(x));if(x.id)li.onclick=()=>goBlock(x.id);L.append(li)});
  document.querySelectorAll('.blk').forEach(e=>{const is=by[e.dataset.id]||[],er=is.some(x=>x.sev==='error'),wa=is.some(x=>x.sev==='warn');
    e.classList.toggle('err',er);e.classList.toggle('warn',!er&&wa);e.classList.toggle('inf',!er&&!wa&&is.length>0);
    const old=[...e.children].find(c=>c.classList.contains('issues'));if(old)old.remove();
    if(is.length){const bx=document.createElement('div');bx.className='issues';is.forEach(x=>{const d=document.createElement('div');d.className='isl '+x.sev;const b=document.createElement('b'),sp=document.createElement('span');b.textContent=({error:'⛔ ',warn:'⚠ ',info:'ℹ '})[x.sev]+x.msg;sp.textContent=x.why||'';d.append(b,sp);if(x.fix)d.append(fixBtn(x));bx.append(d)});e.children[0].after(bx)}})}
function goBlock(id){if(view!=='blocks')setView('blocks');const e=document.querySelector('.blk[data-id="'+id+'"]');if(!e)return;if(e.scrollIntoView)e.scrollIntoView({block:'center',behavior:'smooth'});e.classList.remove('flash');void e.offsetWidth;e.classList.add('flash')}
function code(){const c=build();$('#code').innerHTML=hl(c);const w=lint(c);paintIssues(w);
  const er=w.filter(x=>x.sev==='error').length,wa=w.filter(x=>x.sev==='warn').length;
  $('#info').innerHTML=(c.split('\n').length-1)+' lines · '+cnt(root)+' blocks · '+(er?'<b class="e">'+er+' error'+(er>1?'s':'')+'</b>':'')+(er&&wa?' · ':'')+(wa?'<b class="w">'+wa+' warning'+(wa>1?'s':'')+'</b>':'')+(!er&&!wa?'no problems':'')+(TABS[cur]&&TABS[cur].file?' · '+esc(TABS[cur].file):'');
  document.title=(TABS[cur]?TABS[cur].name+' — ':'')+'Nexo Ahks';
  try{stash()}catch(e){}saveLibSoon()}

/* ---- favorites (right-click a block) and recently used ---- */
const lsGet=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}},lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let FAVS=lsGet('nexoFav',[]),RECENT=lsGet('nexoRecent',[]);
function useRecent(k){RECENT=[k,...RECENT.filter(x=>x!==k)].slice(0,8);lsSet('nexoRecent',RECENT);palTop()}
function toggleFav(k){FAVS=FAVS.includes(k)?FAVS.filter(x=>x!==k):[...FAVS,k];lsSet('nexoFav',FAVS);palTop()}
function palBtnFor(k){const b=document.createElement('button');b.className='pb '+T[k].c+(FAVS.includes(k)?' fav':'');b.textContent=LBL[k];b.draggable=true;try{const dv={};for(const f in T[k].f)dv[f]=T[k].f[f].d;b.title=String(T[k].gen(dv))}catch(e){}
  b.ondragstart=e=>{DRAG={t:k};e.dataTransfer.setData('text','new:'+k)};b.onclick=()=>{addBlock(mk(k))};b.oncontextmenu=e=>{e.preventDefault();toggleFav(k)};return b}
function palTop(){let c=$('#paltop');if(!c){c=document.createElement('div');c.id='paltop';$('#pal').prepend(c)}c.replaceChildren();
  const grp=(title,keys,hint)=>{const d=document.createElement('div');d.className='grp top';d.innerHTML='<h2>'+title+'</h2>';const w=document.createElement('div');w.className='pal';
    if(keys.length)keys.filter(k=>T[k]).forEach(k=>w.append(palBtnFor(k)));else{const h=document.createElement('div');h.className='hint';h.textContent=hint;w.append(h)}d.append(w);c.append(d)};
  grp('★ Favorites',FAVS,'Right-click any block to pin it here.');if(RECENT.length)grp('🕘 Recently used',RECENT.filter(k=>!FAVS.includes(k)).slice(0,6),'')}
function pal(){const g={};palValues();Object.keys(T).forEach(k=>(g[T[k].g]=g[T[k].g]||[]).push(k));
  const GORD=['Event','Control','Keyboard','Mouse','Screen','Window','Window UI','Tray','Variables','Text','Time','Files','System','Games','Background','My blocks','Debug','Other'];
  Object.keys(g).sort((a,b)=>GORD.indexOf(a)-GORD.indexOf(b)).forEach(n=>{const d=document.createElement('div');d.className='grp';d.innerHTML='<h2>'+n+'</h2>';
    const w=document.createElement('div');w.className='pal';
    g[n].forEach(k=>{const b=document.createElement('button');b.className='pb '+T[k].c;b.textContent=LBL[k];b.draggable=true;try{const dv={};for(const f in T[k].f)dv[f]=T[k].f[f].d;b.title=String(T[k].gen(dv))}catch(e){}
      b.ondragstart=e=>{DRAG={t:k};e.dataTransfer.setData('text','new:'+k)};
      b.onclick=()=>{addBlock(mk(k))};b.oncontextmenu=e=>{e.preventDefault();toggleFav(k)};b.dataset.k=k;w.append(b)});
    d.firstChild.style.cursor='pointer';d.firstChild.title='Click to collapse';d.firstChild.onclick=()=>{w.hidden=!w.hidden};d.append(w);$('#pal').append(d)});palTop();palVars()}
function palMine(){let c=document.getElementById('palmine');if(!c){c=document.createElement('div');c.id='palmine';const top=document.getElementById('paltop');if(top)top.after(c);else return}c.replaceChildren();
  const defs=myDefs();const d=document.createElement('div');d.className='grp';d.innerHTML='<h2>★ My blocks</h2>';const w=document.createElement('div');w.className='pal';
  defs.forEach(df=>{const b=document.createElement('button');b.className='pb ctrl';b.textContent=niceName(df.n)+(df.params.length?' …':'');b.draggable=true;b.title='Use my block '+df.n;b.dataset.k='ucall';
    b.ondragstart=e=>{DRAG={t:'ucall'};e.dataTransfer.setData('text','new:ucall|'+df.n)};b.onclick=()=>{addBlock(mk('ucall',{n:df.n}))};w.append(b)});
  const mkb=document.createElement('button');mkb.className='pb pri';mkb.textContent='＋ Make a block';mkb.title='Create your own block from a name and inputs';mkb.onclick=makeBlockDlg;w.append(mkb);
  if(!defs.length){const h=document.createElement('div');h.className='hint';h.textContent='Group steps you repeat into your own block, then use it anywhere.';w.append(h)}
  d.append(w);c.append(d);
  const rv=defs.filter(x=>x.ret);if(rv.length){const g=document.createElement('div');g.className='grp val';g.innerHTML='<h2>My value blocks</h2>';const w2=document.createElement('div');w2.className='pal';rv.forEach(df=>w2.append(rBtn('ucallr',{n:df.n})));g.append(w2);c.append(g)}}
function makeBlockDlg(){let dl=document.getElementById('mkb');if(!dl){dl=document.createElement('dialog');dl.id='mkb';dl.style.cssText='border:1px solid var(--line,#3a4160);border-radius:14px;padding:18px;background:var(--side,#171a24);color:var(--fg,#eef0ff);min-width:340px';
    dl.innerHTML='<h3 style="margin:0 0 10px">Make a block</h3><label>Name<br><input id="mkb-n" value="My block" style="width:100%"></label><p><label>Inputs (optional, separated by commas)<br><input id="mkb-p" placeholder="amount, delay" style="width:100%"></label></p><p><label><input type="checkbox" id="mkb-r"> It gives back a value (usable inside other blocks)</label></p><div style="display:flex;gap:8px;justify-content:flex-end"><button id="mkb-x">Cancel</button><button class="pri" id="mkb-ok">Create</button></div>';document.body.append(dl);
    dl.querySelector('#mkb-x').onclick=()=>dl.close();
    dl.querySelector('#mkb-ok').onclick=()=>{const nm=vn(dl.querySelector('#mkb-n').value.trim().replace(/\s+/g,'_')),ps=dl.querySelector('#mkb-p').value.split(',').map(z=>vn(z.trim().replace(/\s+/g,'_'))).filter(Boolean).join(', ');
      if(!nm||/^\d/.test(nm)||RES.has(nm.toLowerCase()))return st('Pick another name: it is empty, starts with a number, or is reserved');
      if(myDef(nm)||BIL.has(nm.toLowerCase()))return st('A block or AutoHotkey function called “'+nm+'” already exists');
      const body=[S('note',{s:'Put what this block should do here'})];if(dl.querySelector('#mkb-r').checked)body.push(S('retv',{v:'0'}));
      const def=S(ps?'funcp':'func',ps?{n:nm,p:ps}:{n:nm},body);root.kids.push(def);sel=def.id;dl.close();render();st('Made “'+nm+'”. Fill it in, then find it under My blocks.')}}
  dl.querySelector('#mkb-n').value='My block';dl.querySelector('#mkb-p').value='';dl.querySelector('#mkb-r').checked=false;dl.showModal()}
const S=(t,v,k)=>{const b=mk(t,v);if(k)b.kids=k;return b};
function addBlock(b){useRecent(b.t);const f=sel==='root'?null:findBlock(root,sel);
  if(!f)root.kids.push(b);else if(T[f.n.t].box)f.n.kids.push(b);else f.p.kids.splice(f.i+1,0,b);
  sel=b.id;render();const e=document.querySelector('.blk[data-id="'+b.id+'"]');if(e&&e.scrollIntoView)e.scrollIntoView({block:'nearest'});return b}
let BCLIP='';
function selBlock(){return selBlocks()[0]||null}
function selBlocks(){const ids=selSet.size>1?[...selSet]:(sel==='root'?[]:[sel]);let fs=ids.map(i=>findBlock(root,i)).filter(Boolean);fs=fs.filter(f=>!fs.some(o=>o!==f&&has(o.n,f.n.id)));
  const order=[];(function w(n){n.kids.forEach(k=>{order.push(k.id);w(k)})})(root);return fs.sort((a,b)=>order.indexOf(a.n.id)-order.indexOf(b.n.id))}
function moveSel(d){const fs=selBlocks();if(!fs.length)return;const S0=new Set(fs.map(f=>f.n.id));
  (d<0?fs:[...fs].reverse()).forEach(f=>{const k=f.p.kids,i=k.indexOf(f.n),j=i+d;if(j<0||j>=k.length||S0.has(k[j].id))return;k.splice(i,1);k.splice(j,0,f.n)});render()}
function delSel(){const fs=selBlocks();if(!fs.length)return;let nx=null;fs.forEach(f=>{const k=f.p.kids,i=k.indexOf(f.n);k.splice(i,1);nx=k[i-1]||k[i]||(f.p.id==='root'?null:f.p)});selSet.clear();sel=nx?nx.id:'root';render()}
function dupSel(){const fs=selBlocks();if(!fs.length)return;const made=[];[...fs].reverse().forEach(f=>{const c=cl(f.n);f.p.kids.splice(f.p.kids.indexOf(f.n)+1,0,c);made.push(c)});
  if(made.length>1){selSet=new Set(made.map(c=>c.id));sel=made[0].id}else{selSet.clear();sel=made[0].id}render()}
addEventListener('keydown',e=>{if(view!=='blocks'||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||document.querySelector('dialog[open]'))return;
  const c=e.ctrlKey||e.metaKey;
  if(e.key==='Delete'||e.key==='Backspace'){if(selBlock()){e.preventDefault();delSel()}}
  else if(c&&e.key.toLowerCase()==='d'){if(selBlock()){e.preventDefault();dupSel()}}
  else if(c&&e.key.toLowerCase()==='c'&&selBlock()&&!String(getSelection()||'')){e.preventDefault();const fs=selBlocks();BCLIP=JSON.stringify(fs.map(f=>f.n));st((fs.length>1?fs.length+' blocks':'Block')+' copied. Ctrl+V pastes '+(fs.length>1?'them':'it')+', even in another tab.')}
  else if(c&&e.key.toLowerCase()==='v'&&BCLIP){e.preventDefault();const a=JSON.parse(BCLIP);(Array.isArray(a)?a:[a]).forEach(x=>addBlock(cl(x)))}
  else if(c&&e.key.toLowerCase()==='a'){e.preventDefault();const f=selBlock(),kids=f?f.p.kids:root.kids;if(kids.length){selSet=new Set(kids.map(k=>k.id));sel=kids[kids.length-1].id;render();st(kids.length+' blocks selected')}}
  else if(e.altKey&&e.key==='ArrowUp'){e.preventDefault();moveSel(-1)}
  else if(e.altKey&&e.key==='ArrowDown'){e.preventDefault();moveSel(1)}
  else if(e.key==='Escape'&&sel!=='root'){sel='root';render()}});
$('#ps').onkeydown=e=>{if(e.key==='Enter'){const b=[...document.querySelectorAll('#pal .pb')].find(x=>x.style.display!=='none'&&x.closest('.grp').style.display!=='none');if(b){e.preventDefault();b.click()}}
  else if(e.key==='Escape'){e.target.value='';e.target.oninput({target:e.target});e.target.blur()}};
$('#clr').onclick=()=>{root.kids=[];sel='root';render()};
$('#cp').onclick=async()=>{try{await navigator.clipboard.writeText(src());$('#cp').textContent='Copied'}catch(e){const r=document.createRange();r.selectNodeContents($('#code'));getSelection().removeAllRanges();getSelection().addRange(r);$('#cp').textContent='Selected, press Ctrl+C'}
  setTimeout(()=>$('#cp').textContent='Copy',1600)};

const A=window.api;
const st=m=>{if(!m)return;$('#st').textContent=m;clearTimeout(st.t);st.t=setTimeout(()=>$('#st').textContent='',4500)};
$('#dl').onclick=async()=>{if(A){const r=await A.exportAhk(src(),TABS[cur].file);if(bad(r))return;if(r){TABS[cur].file=r;st('Exported '+r.split(/[\\/]/).pop());code()}return}const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([src()],{type:'text/plain'}));a.download='script.ahk';a.click()};
$('#sv').onclick=async(e,as)=>{if(!A)return st('Saving projects works in the desktop app');if(!TABS[cur]||view==='home')return;syncCode();const r=await A.saveProject(JSON.stringify({v:4,name:TABS[cur].name,kids:root.kids,gui:GUI,set:SET},null,1),TABS[cur].proj,!!as);if(bad(r)||!r)return;TABS[cur].proj=r;st('Saved '+r.split(/[\\/]/).pop());code()};
$('#op').onclick=async()=>{if(!A)return;const r=await A.openProject();if(bad(r)||!r)return;openText(r.name,r.text,r.file)};
$('#run').onclick=()=>{const it=TABS[cur];if(it&&view!=='home')runItem(it)};
function dbgOpen(on){$('#dbg').hidden=!on;$('#center').classList.toggle('dbgopen',on)}
function dbgRun(){const it=TABS[cur];if(!it||view==='home')return;if(view!=='blocks')setView('blocks');dbgOpen(true);$('#dbg-log').textContent='';$('#dbg-v').replaceChildren();runItem(it,$('#dbg-m').value)}
$('#dbgb').onclick=dbgRun;$('#dbg-go').onclick=dbgRun;$('#dbg-x').onclick=()=>{dbgOpen(false);dbgMark(null)};$('#dbg-clr').onclick=()=>{$('#dbg-log').textContent='';$('#dbg-v').replaceChildren()};
function dbgMark(id,step){document.querySelectorAll('.blk.running').forEach(e=>e.classList.remove('running'));if(!id)return;const e=document.querySelector('.blk[data-id="'+id+'"]');if(e){e.classList.add('running');if(step&&e.scrollIntoView)e.scrollIntoView({block:'center'})}}
function dbgLine(l){if(l.startsWith('@@T|')){const p=l.split('|');dbgMark(p[1],$('#dbg-m').value!=='fast');const box=$('#dbg-v');p.slice(2).forEach(kv=>{const i=kv.indexOf('='),k=kv.slice(0,i),v=kv.slice(i+1);let row=[...box.children].find(r=>r.dataset.k===k);if(!row){row=document.createElement('div');row.dataset.k=k;row.append(document.createElement('span'),document.createElement('i'));box.append(row)}row.children[0].textContent=k;row.children[1].textContent=v});return}
  const lg=$('#dbg-log');lg.textContent+=l+'\n';lg.scrollTop=lg.scrollHeight}
A&&A.onScriptOut&&A.onScriptOut(d=>{if(d&&TABS[cur]&&d.id===TABS[cur].id)dbgLine(d.line)});
$('#stp').onclick=async()=>{const it=TABS[cur];if(it&&A&&view!=='home')st(await A.stopScript(it.id))};
$('#cmp').onclick=compileDlg;
A&&A.onScriptState(d=>{if(d.running)RUN.add(d.id);else{RUN.delete(d.id);if(typeof dbgMark==='function')dbgMark(null)}const it=LIB.find(x=>x.id===d.id);if(!d.running)st((it?'“'+it.name+'”':'Script')+(d.code?' ended with an error (code '+d.code+')':' stopped'));renderTabs();if(view==='home')renderHome()});
// update toast: installed builds download and install by themselves, other builds just link to the release page
function updBox(){let d=$('#upd');if(d)return d;d=document.createElement('div');d.id='upd';d.style.cssText='position:fixed;left:16px;bottom:16px;z-index:9998;background:#171a24;color:#eef0ff;border:1px solid #3a4160;border-radius:12px;padding:10px 14px;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,.45);display:flex;gap:10px;align-items:center';document.body.append(d);return d}
function updSet(msg,btns){const d=updBox();d.replaceChildren();const sp=document.createElement('span');sp.innerHTML=msg;d.append(sp);(btns||[]).forEach(b=>d.append(b));const x=document.createElement('button');x.textContent='×';x.title='Dismiss';x.onclick=()=>d.remove();d.append(x)}
const updBtn=(t,f,pri)=>{const b=document.createElement('button');b.textContent=t;if(pri)b.className='pri';b.onclick=f;return b};
A&&A.onUpdate&&A.onUpdate(u=>{if($('#upd'))return;
  const msg='🎉 Nexo Ahks <b>'+esc(u.version)+'</b> is out.';
  if(u.auto&&A.updateDownload)updSet(msg,[updBtn('Update now',async()=>{updSet('Downloading Nexo Ahks <b>'+esc(u.version)+'</b>… <b id="upd-p">0%</b>');const r=await A.updateDownload();if(r&&r.err)updSet('Could not update: '+esc(r.err),[updBtn('Open the page',()=>A.openUrl(u.url))])},1),updBtn('What’s new',()=>A.openUrl(u.url))]);
  else updSet(msg,[updBtn('Download',()=>{A.openUrl(u.url);$('#upd')&&$('#upd').remove()},1)])});
A&&A.onUpdateProgress&&A.onUpdateProgress(p=>{const e=$('#upd-p');if(e)e.textContent=(p&&p.percent||0)+'%'});
A&&A.onUpdateReady&&A.onUpdateReady(u=>updSet('Nexo Ahks <b>'+esc(u&&u.version)+'</b> is ready. Your scripts keep running while it restarts.',[updBtn('Restart now',()=>A.updateInstall(),1),updBtn('Later',()=>{const d=$('#upd');d&&d.remove()})]));
A&&A.onUpdateError&&A.onUpdateError(m=>{if($('#upd'))updSet('The update did not work: '+esc(m),[])});
A&&A.onTray(c=>{if(c.cmd==='toggle'){const it=LIB.find(x=>x.id===c.id);if(it)toggleRun(it)}});
A&&A.onOpen&&A.onOpen(d=>openText(d.name,d.text,d.file));
$('#un').onclick=()=>{snap();if(!H.length)return;R.push(last);last=H.pop();restore(last)};
$('#re').onclick=()=>{if(!R.length)return;H.push(last);last=R.pop();restore(last)};
let PANE='actions';function setPane(p){PANE=p;$('#side').dataset.pane=$('#ps').value?'all':p;document.querySelectorAll('#palsw button').forEach(b=>b.classList.toggle('on',b.dataset.p===p))}
document.querySelectorAll('#palsw button').forEach(b=>b.onclick=()=>setPane(b.dataset.p));
$('#ps').oninput=e=>{const v=e.target.value.toLowerCase();$('#side').dataset.pane=v?'all':PANE;document.querySelectorAll('#pal .grp').forEach(g=>{let n=0;g.querySelectorAll('.pb').forEach(b=>{const m=(b.textContent+' '+(b.title||'')).toLowerCase().includes(v);b.style.display=m?'':'none';n+=m});g.style.display=n?'':'none'});document.querySelectorAll('#pal .grp.top').forEach(g=>{g.style.display=v?'none':''})};
addEventListener('keydown',e=>{const k=e.key.toLowerCase(),c=e.ctrlKey||e.metaKey,inCode=view==='code'||!!(e.target.closest&&e.target.closest('#mon')),ed=/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||inCode;
 if(c&&k==='k'){e.preventDefault();qkOpen()}else if(c&&k==='f'&&!inCode){e.preventDefault();(view==='home'?$('#hm-q'):$('#ps')).focus()}else if(c&&k==='s'){e.preventDefault();e.shiftKey?$('#sv').onclick(null,true):$('#sv').click()}else if(c&&k==='o'){e.preventDefault();$('#op').click()}
 else if(c&&k==='z'&&!e.shiftKey&&!ed){e.preventDefault();$('#un').click()}
 else if(c&&(k==='y'||(k==='z'&&e.shiftKey))&&!ed){e.preventDefault();$('#re').click()}
 else if(e.key==='F5'){e.preventDefault();(e.ctrlKey?$('#dbgb'):$('#run')).click()}else if(e.key==='F1'){e.preventDefault();$('#help').click()}});
const GC=(t,n,x,y,w,h,text,fn)=>({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),t,n,x,y,w,h,text,fn:fn||''});
const GG=(title,w,h,ctl)=>Object.assign(newGui(),{title,w,h,ctl});
const GO=(c,opt,font)=>{Object.assign(c,{hw:1,hh:1,imp:0,evs:[],opt});if(font)c.font=font;c.arg=ctlArg(c);return c};
const DK=g=>{g.bgc='1c1d23';g.fc='e9eaf0';g.font=true;g.theme='dark';g.ctl.forEach(c=>{if(['Edit','ComboBox','DropDownList','ListBox'].includes(c.t)){GO(c,((DOPT[c.t]||'')+' Background2a2c35 cf2f3f8').trim());c.pp='Background2a2c35 cf2f3f8'}});g.ctl.unshift({k:'line',s:'DllCall("dwmapi\\DwmSetWindowAttribute", "ptr", myGui.Hwnd, "int", 20, "int*", true, "int", 4)'});return g};
const TPL=[
{n:'Minecraft / Roblox: turn the camera',d:'F2 and F3 turn left and right, F4 spins until you press it again. Works when the game locks the mouse.',f:()=>[S('hotkey',{key:'F2'},[S('glook',{x:'-400',y:'0',n:'12'})]),S('hotkey',{key:'F3'},[S('glook',{x:'400',y:'0',n:'12'})]),S('hotkey',{key:'F4'},[S('tog',{n:'spinning'}),S('while',{c:'spinning'},[S('glook',{x:'60',y:'0',n:'6'}),S('wait',{ms:'10'})])])]},
{n:'Roblox: toggle shift lock',d:'F7 taps Shift slowly enough for Roblox to notice',f:()=>[S('hotkey',{key:'F7'},[S('holdms',{k:'LShift',ms:'60'})])]},
{n:'Auto clicker for games',d:'F6 starts and stops clicking in a way games accept',f:()=>[S('hotkey',{key:'F6'},[S('tog',{n:'clicking'}),S('while',{c:'clicking'},[S('gclick',{b:'Left',ms:'30'}),S('rwait',{a:'40',b:'80'})])])]},
{n:'Click a window in the background',d:'F6 clicks inside another window over and over, without moving your mouse or focusing it',f:()=>[S('hotkey',{key:'F6'},[S('tog',{n:'clicking'}),S('while',{c:'clicking'},[S('msgclick',{w:'ahk_exe game.exe',x:'300',y:'300'}),S('rwait',{a:'80',b:'160'})])])]},
{n:'Reminder every 30 minutes',d:'A function plus a timer that pops a notification',f:()=>[S('func',{n:'Remind'},[S('tray',{s:'Time to stretch!'})]),S('timer',{ms:'1800000',n:'Remind'})]},
{n:'Auto clicker (toggle)',d:'F6 starts and stops clicking, Esc quits',f:()=>[S('hotkey',{key:'F6'},[S('tog',{n:'clicking'}),S('while',{c:'clicking'},[S('click'),S('rwait',{a:'40',b:'70'})])]),S('hotkey',{key:'Esc'},[S('exit')])]},
{n:'Hold to auto-click',d:'Hold the mouse side button and it clicks fast',f:()=>[S('hotkey',{key:'$XButton1'},[S('while',{c:'GetKeyState("XButton1","P")'},[S('click'),S('wait',{ms:'30'})])])]},
{n:'Spam a key',d:'F7 presses E twenty times',f:()=>[S('hotkey',{key:'F7'},[S('loop',{n:'20'},[S('send',{k:'e'}),S('wait',{ms:'100'})])])]},
{n:'Anti-AFK',d:'F8 toggles a tiny key press every 30 seconds',f:()=>[S('hotkey',{key:'F8'},[S('tog',{n:'afk'}),S('while',{c:'afk'},[S('send',{k:'{Shift}'}),S('wait',{ms:'30000'})])])]},
{n:'Auto-walk toggle',d:'F9 holds W down, press again to release',f:()=>[S('hotkey',{key:'F9'},[S('tog',{n:'walking'}),S('if',{c:'walking'},[S('hold',{m:'down',k:'w'})]),S('else',{},[S('hold',{m:'up',k:'w'})])])]},
{n:'Text expander',d:'Type a short code and get the full text',f:()=>[S('abbr',{a:'btw',b:'by the way'}),S('abbr',{a:'omw',b:'on my way!'}),S('abbr',{a:'sig',b:'Best regards,'})]},
{n:'Quick paste snippets',d:'Ctrl+Alt+1/2/3 paste a ready-made reply',f:()=>[S('hotkey',{key:'^!1'},[S('pastet',{s:'Thanks for reaching out!'})]),S('hotkey',{key:'^!2'},[S('pastet',{s:'Best regards,'})]),S('hotkey',{key:'^!3'},[S('pastet',{s:'I will get back to you soon.'})])]},
{n:'Volume hotkeys',d:'Ctrl+Alt+Up/Down changes volume, Ctrl+Alt+M mutes',f:()=>[S('hotkey',{key:'^!Up'},[S('vol',{n:'+5'})]),S('hotkey',{key:'^!Down'},[S('vol',{n:'-5'})]),S('hotkey',{key:'^!m'},[S('mute')])]},
{n:'Always-on-top toggle',d:'Ctrl+Alt+T pins the active window above everything',f:()=>[S('hotkey',{key:'^!t'},[S('wtop',{s:'A'})])]},
{n:'Color watcher',d:'F11 beeps when the pixel at 500,500 turns red (change it with 🎯)',f:()=>[S('hotkey',{key:'F11'},[S('tog',{n:'watching'}),S('while',{c:'watching'},[S('ifpix',{x:'500',y:'500',c:'0xFF0000'},[S('beep'),S('tog',{n:'watching'})]),S('wait',{ms:'50'})])])]},
{n:'Hold a key for 2 seconds',d:'F12 holds W for two seconds, then lets go',f:()=>[S('hotkey',{key:'F12'},[S('holdms',{k:'w',ms:'2000'})])]},
{n:'Middle click = double click',d:'Turns the middle mouse button into a double click',f:()=>[S('hotkey',{key:'MButton'},[S('mclick',{b:'Left',n:'2'})])]},
{n:'Tray: Quick actions',d:'A tray menu with your own items, a separator and Quit',f:()=>[S('trayclear'),S('trayitem',{t:'Open Notepad'},[S('run',{p:'notepad.exe'})]),S('trayitem',{t:'Say hello'},[S('tray',{s:'Hello from the tray!'})]),S('traysep'),S('trayitem',{t:'Quit'},[S('exit')]),S('traydef',{t:'Open Notepad'})]},
{n:'Tray: Pause switch',d:'A tray item with a tick that pauses F6 auto-clicking',f:()=>[S('trayitem',{t:'Paused'},[S('tog',{n:'paused'}),S('traycheck',{m:'ToggleCheck',t:'Paused'})]),S('hotkey',{key:'F6'},[S('if',{c:'!paused'},[S('click')])])]},
{n:'Window: Tabbed settings',d:'A window with two tabs and a Save button (UI Designer)',f:()=>[S('func',{n:'Save'},[S('msg',{s:'Saved!'})])],g:()=>{const tb=GC('Tab3','tab1',10,10,300,200,'General|Options'),k=(t,n,x,y,w,h,text,pg)=>Object.assign(GC(t,n,x,y,w,h,text),{tabOf:tb.id,pg});return GG('Settings',330,270,[tb,k('Checkbox','chk1',30,50,220,24,'Start with Windows',1),k('Edit','ed1',30,85,240,26,'',1),k('Checkbox','chk2',30,50,220,24,'Dark mode',2),k('Checkbox','chk3',30,80,220,24,'Play sounds',2),GC('Button','btn1',10,222,100,30,'Save','Save')])}},
{n:'Form: use what people type',d:'Name box, dropdown and checkbox. The button reads them all. Press {} on a block to insert a value',f:()=>[S('onctl',{c:'btn1',ev:'Click'},[S('if',{c:'!chk1.Value'},[S('msg',{s:'Please tick the box first.'}),S('ret')]),S('msg',{s:'Hello {ed1}! You picked {dd1}.'}),S('fapp',{s:'{ed1},{dd1}',f:'answers.txt'})])],g:()=>GG('Quick form',300,250,[GF('Text','txt1',20,16,200,22,'Your name:'),GF('Edit','ed1',20,40,250,26,'',{ph:'Type your name here',focus:true}),GF('Text','txt2',20,80,200,22,'Favorite color:'),GF('DropDownList','dd1',20,104,250,26,'Red|Green|Blue'),GF('Checkbox','chk1',20,144,250,24,'I agree'),GF('Button','btn1',20,180,110,32,'Submit',{opt:'Default'})])},
{n:'Window: Styled launcher',d:'Dark window with colored flat buttons and a status bar (UI Designer)',f:()=>[S('func',{n:'OpenNotepad'},[S('run',{p:'notepad.exe'}),S('sbtext',{c:'sb1',s:'Opened Notepad'})]),S('func',{n:'OpenCalc'},[S('run',{p:'calc.exe'}),S('sbtext',{c:'sb1',s:'Opened Calculator'})])],g:()=>{const g=GG('My launcher',300,230,[GF('Text','txt1',20,16,260,30,'My launcher',{font:{fs:16,b:true,c:'4F7CFF'}}),GF('Text','btn1',20,64,260,36,'Notepad',{opt:'+0x200 +0x100 Center Background2A2F4A cFFFFFF',fn:'OpenNotepad'}),GF('Text','btn2',20,110,260,36,'Calculator',{opt:'+0x200 +0x100 Center Background2A2F4A cFFFFFF',fn:'OpenCalc'}),GF('StatusBar','sb1',0,0,300,22,'Ready')]);g.bgc='1A1A2E';g.fc='E6E6F0';g.font=true;g.fs=11;return g}},
{n:'Window: Name greeter',d:'Type a name, click the button, the window answers (reads an input)',f:()=>[S('onctl',{c:'btn1',ev:'Click'},[S('getctl',{p:'Value',c:'ed1',n:'person'}),S('settxtx',{c:'txt2',e:'"Hello, " person "!"'})])],g:()=>GG('Greeter',280,180,[GC('Text','txt1',20,20,200,22,'Your name:'),GC('Edit','ed1',20,45,220,26,''),GC('Button','btn1',20,85,100,30,'Greet'),GC('Text','txt2',20,130,240,24,'')])},
{n:'Window: App picker',d:'Pick from a dropdown and open it (reads the selected text)',f:()=>[S('onctl',{c:'btn1',ev:'Click'},[S('getctl',{p:'Text',c:'dd1',n:'choice'}),S('if',{c:'choice = "Notepad"'},[S('run',{p:'notepad.exe'})]),S('if',{c:'choice = "Calculator"'},[S('run',{p:'calc.exe'})]),S('if',{c:'choice = "Paint"'},[S('run',{p:'mspaint.exe'})])])],g:()=>GG('App picker',260,130,[GC('DropDownList','dd1',20,20,200,26,'Notepad|Calculator|Paint'),GC('Button','btn1',20,60,100,30,'Open')])},
{n:'Window: Adder',d:'Two number boxes and a Plus button that shows the sum',f:()=>[S('onctl',{c:'btn1',ev:'Click'},[S('getctl',{p:'Value',c:'ed1',n:'x'}),S('getctl',{p:'Value',c:'ed2',n:'y'}),S('math',{n:'total',a:'x',op:'+',b:'y'}),S('settxtx',{c:'txt1',e:'"Sum: " total'})])],g:()=>GG('Adder',260,170,[GC('Edit','ed1',20,20,100,26,'1'),GC('Edit','ed2',140,20,100,26,'2'),GC('Button','btn1',20,60,100,30,'Plus'),GC('Text','txt1',20,105,220,24,'Sum: ')])},
{n:'Window: Quick launcher',d:'A small window with buttons that open apps (UI Designer)',f:()=>[S('func',{n:'OpenNotepad'},[S('run',{p:'notepad.exe'})]),S('func',{n:'OpenCalc'},[S('run',{p:'calc.exe'})])],g:()=>GG('Quick Launcher',260,130,[GC('Text','txt1',20,15,200,22,'Pick an app'),GC('Button','btn1',20,50,100,30,'Notepad','OpenNotepad'),GC('Button','btn2',140,50,100,30,'Calculator','OpenCalc')])},
{n:'Window: Click counter',d:'A window with a button that counts clicks (UI Designer)',f:()=>[S('func',{n:'AddOne'},[S('incr',{v:'1',n:'count'}),S('settxtx',{c:'txt1',e:'"Clicks: " count'})])],g:()=>GG('Counter',240,130,[GC('Text','txt1',20,20,200,24,'Clicks: 0'),GC('Button','btn1',20,60,100,32,'+1','AddOne')])},
{n:'Random-spot clicker',d:'F6 starts/stops clicking a random spot in a small box, with random pauses',f:()=>[S('hotkey',{key:'F6'},[S('tog',{n:'on'}),S('while',{c:'on'},[S('clickrand',{}),S('waitrand',{a:'60',b:'140'})])]),S('hotkey',{key:'Esc'},[S('exit')])]},
{n:'Paste clipboard as clean text',d:'Ctrl+Shift+V pastes the clipboard with extra spaces and line breaks squashed',f:()=>[S('hotkey',{key:'^+v'},[S('rclip',{n:'t'}),S('regrep',{n:'t',v:'t',p:'\\s+',r:' '}),S('typev',{v:'t'})])]},
{n:'Pick a random item from a list',d:'F2 shows a random choice from a list (lists + random item)',f:()=>[S('hotkey',{key:'F2'},[S('arrnew',{n:'choices',v:'"Pizza", "Burger", "Sushi", "Tacos"'}),S('arrrand',{n:'pick',l:'choices'}),S('showv',{v:'pick'})])]},
{n:'Click-through window (F9 on, F10 off)',d:'Make the active window ignore mouse clicks, like an overlay',f:()=>[S('hotkey',{key:'F9'},[S('wclickthru',{m:'+',s:'A'})]),S('hotkey',{key:'F10'},[S('wclickthru',{m:'-',s:'A'})])]},
{n:'Run a command and show the result',d:'F3 runs ipconfig and shows what it printed',f:()=>[S('hotkey',{key:'F3'},[S('cmdout',{c:'ipconfig',n:'out'}),S('showv',{v:'out'})])]},
{n:'Count files in a folder',d:'F4 counts the .txt files (for each file + counter)',f:()=>[S('hotkey',{key:'F4'},[S('set',{n:'total',v:'0'}),S('loopfiles',{m:'F',p:'C:\\Users\\*.txt'},[S('incr',{n:'total'})]),S('msg',{s:'Found {total} files'})])]},
{n:'Show my screen size',d:'F5 tells you the screen width and height',f:()=>[S('hotkey',{key:'F5'},[S('scrsz',{n:'sw',k:'A_ScreenWidth'}),S('scrsz',{n:'sh',k:'A_ScreenHeight'}),S('msg',{s:'Your screen is {sw} x {sh}'})])]},
{n:'Stopwatch (F1 start, F2 show)',d:'Time anything with two keys',f:()=>[S('hotkey',{key:'F1'},[S('stopstart',{n:'t0'}),S('tray',{s:'Stopwatch started'})]),S('hotkey',{key:'F2'},[S('stopread',{n:'ms',s:'t0'}),S('msg',{s:'{ms} ms have passed'})])]},
{n:'Say goodbye when the script closes',d:'Shows a notification when the script exits (Esc quits)',f:()=>[S('onexit',{},[S('tray',{s:'Script closed. Bye!'})]),S('hotkey',{key:'Esc'},[S('exit')])]},
{n:'Window: Dark sign-in form',d:'A dark themed window with a heading, two boxes and a green button',f:()=>[S('onctl',{c:'ok1',ev:'Click'},[S('getctl',{p:'Value',c:'ed1',n:'user'}),S('msg',{s:'Welcome, {user}!'})])],g:()=>{const g=DK(GG('Sign in',300,230,[GC('Text','title1',20,16,260,32,'Sign in'),GC('Text','txt1',20,60,260,20,'Name'),GC('Edit','ed1',20,82,260,26,''),GC('Text','txt2',20,116,260,20,'Password'),GC('Edit','ed2',20,138,260,26,''),GC('Text','ok1',20,178,260,32,'Continue','')]));const t=g.ctl.find(c=>c.n==='title1');t.font={fs:18,b:true};const ok=g.ctl.find(c=>c.n==='ok1');GO(ok,'+0x200 +0x100 Center Background2FAE78 cFFFFFF');const pw=g.ctl.find(c=>c.n==='ed2');GO(pw,pw.opt+' Password');return g}},
{n:'Window: Log box',d:'A button that adds a time stamped line to a log box',f:()=>[S('onctl',{c:'btn1',ev:'Click'},[S('settxtx',{c:'log1',e:'log1.Value "Clicked at " A_Hour ":" A_Min ":" A_Sec "`n"'})])],g:()=>{const lg=GO(GC('Edit','log1',20,20,300,140,''),'Multi ReadOnly VScroll',{face:'Consolas'});return GG('Log',340,230,[lg,GC('Button','btn1',20,175,120,32,'Add a line')])}},
{n:'Window-only hotkey',d:'A hotkey that only works inside Notepad',f:()=>[S('hotif',{s:'ahk_exe notepad.exe'}),S('hotkey',{key:'F2'},[S('text',{s:'Hello from Nexo Ahks'})]),S('hotall')]},
{n:'Click an image when it appears',d:'F10 watches the screen for button.png and clicks it',f:()=>[S('hotkey',{key:'F10'},[S('tog',{n:'watching'}),S('while',{c:'watching'},[S('ifimg',{p:'button.png'},[S('clkimg'),S('wait',{ms:'500'})]),S('wait',{ms:'200'})])])]}
];
function tplLoad(i){SET=TABS[cur].set={...DS};root.kids=TPL[i].f();if(TPL[i].g){GUI=TPL[i].g();normGui(GUI)}sel='root';fix(root);render();renderUI()}
TPL.forEach((t,i)=>{const b=document.createElement('button');b.className='tpl';b.innerHTML='<b></b><small></small>';b.firstChild.textContent=t.n;b.lastChild.textContent=t.d;
  b.onclick=()=>{view==='home'||!TABS.length||root.kids.length||real().length?newTab(t.n,t.f(),t.g?{gui:t.g()}:undefined):tplLoad(i);$('#tpl').close()};$('#tl').append(b)});
$('#imp').onclick=async()=>{if(!A)return st('Import works in the desktop app');const f=await A.importAhk();if(bad(f)||!f)return;const it=importItem(f.name,f.text,f.file);openItem(it);const r=it._r;
  const nc=r.gui?r.gui.ctl.filter(c=>!c.k).length:0;st('Imported '+r.n+' blocks'+(r.gui?' and a UI with '+nc+' controls (see UI Designer)':'')+(r.rawN?' · '+r.rawN+' raw lines, edit them in the Code view':''))};
$('#tp').onclick=()=>$('#tpl').showModal();$('#tl-q').oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('#tl > *').forEach(x=>{x.style.display=x.textContent.toLowerCase().includes(q)?'':'none'})};
$('#tc').onclick=()=>$('#tpl').close();
const svs=()=>{try{localStorage.setItem('ahkbset',JSON.stringify({theme:APP.theme}))}catch(e){}};
const thm=()=>{const r=document.documentElement;APP.theme==='auto'?r.removeAttribute('data-theme'):r.dataset.theme=APP.theme;$('#th').textContent=({auto:'🌓',dark:'🌙',light:'☀️'})[APP.theme]||'🌓';$('#th').title='Theme: '+APP.theme+' (click to switch)';try{window.monaco&&monaco.editor.setTheme(dk()?'ahkd':'vs')}catch(e){}};
$('#th').onclick=()=>{APP.theme={auto:'dark',dark:'light',light:'auto'}[APP.theme];svs();thm()};thm();

const dk=()=>APP.theme==='dark'||(APP.theme==='auto'&&!matchMedia('(prefers-color-scheme: light)').matches);
const newGui=()=>({v:'myGui',title:'My Window',w:420,h:300,opts:'',close:true,font:true,show:true,ctl:[]});
const evBlocks=(n,o=[])=>{n.kids.forEach(b=>{if(!b.off&&(b.t==='onctl'||b.t==='onwin'))o.push(b);evBlocks(b,o)});return o};
const hasType=(n,t)=>n.kids.some(b=>!b.off&&(b.t===t||hasType(b,t)));
const hasSlot=n=>n.kids.some(b=>!b.off&&(b.t==='guislot'||hasSlot(b)));
const src=()=>view==='code'&&EDV?EDV.get():build();
