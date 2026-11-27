/* ---- tabs inside the window ---- */
function autoParent(c){const cx=c.x+c.w/2,cy=c.y+Math.min(c.h,20)/2,tb=[...real()].reverse().find(t=>isTab(t.t)&&t.id!==c.id&&cx>=t.x&&cx<=t.x+t.w&&cy>=t.y+26&&cy<=t.y+t.h);
  if(tb){if(c.tabOf!==tb.id){c.tabOf=tb.id;c.pg=uPage[tb.id]||1}}else{delete c.tabOf;delete c.pg}fixTabOrder(GUI)}
function clampPages(c){const n=String(c.text).split('|').length;let ch=false;real().forEach(k=>{if(k.tabOf===c.id&&(k.pg||1)>n){k.pg=n;ch=true}});if((uPage[c.id]||1)>n)uPage[c.id]=n;return ch}
let uSnap=(()=>{try{const v=localStorage.getItem('ahkbsnap');return v===null?5:(+v||0)}catch(e){return 5}})();
function uClearGuides(){document.querySelectorAll('.ui-guide').forEach(x=>x.remove())}
function uAlign(c,mode,off,ch){uClearGuides();if(off||c.t==='StatusBar')return;
  const box=$('#ui-win-box'),TH=5,others=real().filter(o=>o!==c&&o.t!=='StatusBar'&&!(ch&&ch.some(k=>k.x===o)));
  const X=[0,GUI.w/2,GUI.w],Y=[0,GUI.h/2,GUI.h];others.forEach(o=>{X.push(o.x,o.x+o.w/2,o.x+o.w);Y.push(o.y,o.y+o.h/2,o.y+o.h)});
  const best=(mine,tg)=>{let b=null;for(const m of mine)for(const t of tg){const d=t-m;if(Math.abs(d)<=TH&&(!b||Math.abs(d)<Math.abs(b.d)))b={d,t}}return b};
  const line=(v,h)=>{const g=document.createElement('div');g.className='ui-guide';g.style.cssText='position:absolute;pointer-events:none;background:#ff4fa3;z-index:50;'+(h?'left:0;right:0;height:1px;top:'+Math.round(v)+'px':'top:0;bottom:0;width:1px;left:'+Math.round(v)+'px');box.append(g)};
  if(mode==='m'){const bx=best([c.x,c.x+c.w/2,c.x+c.w],X),by=best([c.y,c.y+c.h/2,c.y+c.h],Y);
    if(bx){c.x=Math.max(0,Math.round(c.x+bx.d));line(bx.t,false)}if(by){c.y=Math.max(0,Math.round(c.y+by.d));line(by.t,true)}}
  else{const bx=best([c.x+c.w],X),by=best([c.y+c.h],Y);if(bx){c.w=Math.max(1,Math.round(c.w+bx.d));line(bx.t,false)}if(by){c.h=Math.max(1,Math.round(c.h+by.d));line(by.t,true)}}}
function dragStart(ev,c,mode,el){ev.preventDefault();if(c.t==='StatusBar')return;const sx=ev.clientX,sy=ev.clientY,ox=c.x,oy=c.y,ow=c.w,oh=c.h,sn=v=>uSnap?Math.round(v/uSnap)*uSnap:Math.round(v);let moved=false;
  const grp=mode==='m'&&uMulti.has(c.id)?multi():[];
  const chl=grp.length?[...new Set([...grp,...grp.flatMap(g=>isTab(g.t)?real().filter(k=>k.tabOf===g.id):[])])].filter(x=>x!==c):(mode==='m'&&isTab(c.t)?real().filter(x=>x.tabOf===c.id):[]);
  const ch=chl.map(x=>({x,ox:x.x,oy:x.y}));
  const mv=e=>{const dx=e.clientX-sx,dy=e.clientY-sy;moved=true;
    if(mode==='m'){c.x=Math.max(0,sn(ox+dx));c.y=Math.max(0,sn(oy+dy));uAlign(c,'m',e.altKey,ch);ch.forEach(k=>{k.x.x=Math.max(0,k.ox+c.x-ox);k.x.y=Math.max(0,k.oy+c.y-oy);const ke=document.querySelector('.uc[data-id="'+k.x.id+'"]');if(ke)elStyle(ke,k.x)})}
    else{c.w=Math.max(1,sn(ow+dx));c.h=Math.max(1,sn(oh+dy));c.hw=c.hh=1;uAlign(c,'r',e.altKey)}elStyle(el,c)};
  const up=()=>{uClearGuides();removeEventListener('pointermove',mv);removeEventListener('pointerup',up);if(moved&&mode==='m'&&!isTab(c.t)&&!grp.length){const was=c.tabOf;autoParent(c);if(was!==c.tabOf)renderUI()}renderProps();snap();code()};addEventListener('pointermove',mv);addEventListener('pointerup',up)}
function fld(lbl,val,on,type){const w=document.createElement('label');w.className='fld';const s=document.createElement('span');s.textContent=lbl;const i=document.createElement('input');if(type)i.type=type;
  if(type==='checkbox')i.checked=!!val;else i.value=val;i.oninput=()=>on(type==='checkbox'?i.checked:type==='number'?+i.value:i.value);w.append(s,i);return w}
function selFld(lbl,opts,val,on){const w=document.createElement('label');w.className='fld';const s=document.createElement('span');s.textContent=lbl;const sel=document.createElement('select');opts.forEach(([v,t])=>sel.add(new Option(t,v)));sel.value=val;sel.onchange=()=>on(sel.value);w.append(s,sel);return w}
function dupCtl(){const c=real().find(x=>x.id===uSel);if(!c)return;const nid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6),nm=new Set(real().map(z=>z.n));
  const uniq=b0=>{let i=1;const base=b0.replace(/\d+$/,'');while(nm.has(base+i))i++;nm.add(base+i);return base+i};
  const cp=x=>{const n=JSON.parse(JSON.stringify(x));n.id=nid();n.x+=20;n.y+=20;if(!x.anon)n.n=uniq(x.n);return n};
  const n=cp(c),kids=isTab(c.t)?real().filter(x=>x.tabOf===c.id).map(k=>{const z=cp(k);z.tabOf=n.id;return z}):[];
  GUI.ctl.splice(GUI.ctl.indexOf(c)+1,0,n,...kids);uSel=n.id;renderUI();snap();code()}
function reorder(c,dir){const a=GUI.ctl,i=a.indexOf(c);a.splice(i,1);dir>0?a.push(c):a.unshift(c);fixTabOrder(GUI);renderUI();snap();code()}
function delCtl(){const ids=new Set(selList().map(c=>c.id));if(!ids.size)return;real().forEach(x=>{if(ids.has(x.tabOf)){delete x.tabOf;delete x.pg}});GUI.ctl=GUI.ctl.filter(x=>x.k||!ids.has(x.id));uSel=null;uMulti=new Set();renderUI();snap();code()}
{const UG=[['Basics',['Text','Button','Flat button','Heading','Helper text','Badge','Line','Vertical line']],['Type in',['Edit box','Text area','Password','Number box','Read-only box','Log box','Hotkey box','Date picker','Calendar']],['Choose',['Checkbox','Radio','Toggle button','Dropdown','Combo box','List box','Slider','Vertical slider']],['Show data',['List view','Tree view','Progress','Vertical progress','Picture','Link','Web view (old IE engine)','Status bar']],['Layout',['Group box','Tab','Card']],['Styled buttons',['Green button','Red button','Purple button']]];
  const UI_IC={Text:'T',Button:'▭',Edit:'✎',Checkbox:'☑',Radio:'◉',DropDownList:'▾',ComboBox:'▾',ListBox:'☰',ListView:'▦',Slider:'◐',Progress:'▰',GroupBox:'▢',Tab3:'🗂',Link:'🔗',Picture:'🖼',DateTime:'📅',MonthCal:'🗓',Hotkey:'⌨',StatusBar:'▁',TreeView:'🌲',ActiveX:'🌐'};
  const seen=new Set();UG.forEach(([g,ls])=>{const h=document.createElement('h4');h.className='ugrp';h.textContent=g;$('#ui-add').append(h);ls.forEach(l=>{const e=PAL.find(x=>x[0]===l);if(!e)return;seen.add(l);const b=document.createElement('button');const ic=document.createElement('span');ic.className='ic2';ic.textContent=UI_IC[e[1]]||'＋';const tx=document.createElement('span');tx.textContent=l.replace(' (old IE engine)','');b.append(ic,tx);b.title='Add: '+l;b.onclick=()=>addCtl(e[1],e[2]);$('#ui-add').append(b)})});
  PAL.filter(x=>!seen.has(x[0])).forEach(([l,t,p])=>{const b=document.createElement('button');b.textContent='+ '+l;b.onclick=()=>addCtl(t,p);$('#ui-add').append(b)})}
addEventListener('keydown',e=>{if(view==='ui'&&uSel&&e.key==='Delete'&&!/INPUT|SELECT/.test(e.target.tagName))delCtl()});
document.querySelectorAll('#views button').forEach(b=>b.onclick=()=>setView(b.dataset.v));
const _sn=$('#ui-snap');_sn.value=String(uSnap);_sn.onchange=()=>{uSnap=+_sn.value;try{localStorage.setItem('ahkbsnap',String(uSnap))}catch(e){}};
$('#ui-d').onclick=()=>setPrev(false);$('#ui-p').onclick=()=>setPrev(true);$('#ui-d').classList.toggle('on',!uPrev);$('#ui-p').classList.toggle('on',uPrev);
function genGui(){const g=GUI;if(!g||(!g.ctl.length&&!g.imp&&!g.bgc))return[];fixTabOrder(g);const V=g.v||'myGui';
  const o=['; --- UI (edit this in the UI Designer view) ---',V+' := Gui('+(g.ctor!==undefined?g.ctor:(g.opts?q(g.opts):'')+', '+q(g.title))+')'];
  if(g.bgc)o.push(V+'.BackColor := '+q(g.bgc));
  if(g.font)o.push(V+'.SetFont('+q('s'+(g.fs||10)+(g.fc?' c'+g.fc:''))+', '+q(g.face||'Segoe UI')+')');
  let cur=null,focus=null;const tabN=id=>{const t=g.ctl.find(x=>x.id===id);return t&&t.n?vn(t.n):null};
  g.ctl.forEach(c=>{if(c.k==='line'){o.push(c.s);return}
    const tn=c.tabOf?tabN(c.tabOf):null,want=tn?{n:tn,pg:c.pg||1}:null;
    if(cur&&(!want||want.n!==cur.n)){o.push(cur.n+'.UseTab()');cur=null}
    if(want&&(!cur||cur.pg!==want.pg)){o.push(want.n+'.UseTab('+want.pg+')');cur=want}
    const sb=c.t==='StatusBar',n=c.n&&!c.anon?vn(c.n):'',pos=sb?[]:['x'+c.x,'y'+c.y];if(!sb){if(c.hw)pos.push('w'+c.w);if(c.hh)pos.push('h'+c.h)}
    const os=pos.join(' ')+(c.opt?(pos.length?' ':'')+c.opt:''),hasArg=c.arg!==undefined&&c.arg!=='';
    const call=V+'.Add('+q(c.t)+(os||hasArg?', '+(os?q(c.optx&&c.optsp?os+' ':os)+(c.optx?' '+c.optx:''):''):'')+(hasArg?', '+c.arg:'')+')';
    o.push(n?n+' := '+call:call);
    if(n){if(c.font)o.push(n+'.SetFont('+fontSpec(c.font)+')');if(c.ph)o.push('SendMessage(0x1501, 1, StrPtr('+q(c.ph)+'), '+n+')')}
    if(c.spin)o.push(V+'.Add("UpDown", '+q('Range'+c.spin)+(c.val!==undefined&&c.val!==''?', '+(+c.val||0):'')+')');
    if(n&&c.t==='TreeView')String(c.text||'').split('|').map(x=>x.trim()).filter(Boolean).forEach(x=>o.push(n+'.Add('+q(x)+')'));
    if(n&&c.t==='ActiveX'&&c.nav)o.push(n+'.Value.Navigate('+q(c.nav)+')');
    if(n&&c.t==='ListView'&&c.rows)String(c.rows).split('\n').filter(x=>x.trim()).forEach(r=>o.push(n+'.Add("", '+r.split('|').map(x=>q(x.trim())).join(', ')+')'));
    if(c.focus&&n&&!focus)focus=n;
    if(c.fn&&n)o.push(n+'.OnEvent("'+evOf(c)+'", (*) => '+vn(c.fn)+'())');(c.evs||[]).forEach(e=>o.push(e))});
  if(cur&&!g.noClose)o.push(cur.n+'.UseTab()');
  g.ctl.forEach(c=>{if(c.k||!c.n||c.anon)return;const n=vn(c.n);
    if(c.t==='ListView'){const cols=Math.max(1,String(c.text||'').split('|').length);(c.ct||[]).forEach((x,i)=>{if(x==='Integer'||x==='Float')o.push(n+'.ModifyCol('+(i+1)+', "'+x+'")')});if(c.autohdr)for(let i=1;i<=cols;i++)o.push(n+'.ModifyCol('+i+', "AutoHdr")')}
    if(c.t==='Button'&&c.colorpick){o.push(n+'_color := 0xFFFFFF');o.push(n+'.OnEvent("Click", '+n+'_Pick)')}});
  if(focus)o.push(focus+'.Focus()');
  const eb=evBlocks(root);eb.forEach(b=>o.push(b.t==='onctl'?vn(b.v.c)+'.OnEvent("'+b.v.ev+'", '+vn(b.v.c)+'_'+b.v.ev+')':V+'.OnEvent("'+b.v.ev+'", '+V+'_'+b.v.ev+')'));
  if(g.close&&!eb.some(b=>b.t==='onwin'&&b.v.ev==='Close'))o.push(V+'.OnEvent("Close", (*) => ExitApp())');
  const anc=g.ctl.filter(c=>!c.k&&c.n&&!c.anon&&c.t!=='StatusBar'&&(c.aw||c.ah||c.ar||c.ab));
  if(anc.length)o.push(V+'.OnEvent("Size", '+V+'_Anchor)');
  const tipc=g.ctl.filter(c=>!c.k&&c.tip&&c.n&&!c.anon);
  if(tipc.length){o.push('Nexo_Tips := Map()');tipc.forEach(c=>o.push('Nexo_Tips['+vn(c.n)+'.Hwnd] := '+q(c.tip)));o.push('OnMessage(0x200, Nexo_Hover)')}
  const showArg=g.showr!==undefined?g.showr:g.pos==='custom'?q('w'+g.w+' h'+g.h+' x'+(+g.px||0)+' y'+(+g.py||0)):g.pos==='br'?'"w'+g.w+' h'+g.h+' x" (A_ScreenWidth - '+(g.w+30)+') " y" (A_ScreenHeight - '+(g.h+90)+')':q('w'+g.w+' h'+g.h);
  if(g.show!==false)o.push(V+'.Show('+showArg+')');
  if(g.alpha!==undefined&&g.alpha!==''&&+g.alpha<255)o.push('WinSetTransparent('+Math.max(0,Math.min(255,+g.alpha||0))+', "ahk_id " '+V+'.Hwnd)');
  g.ctl.filter(c=>!c.k&&c.t==='Button'&&c.colorpick&&c.n&&!c.anon).forEach(c=>{const n=vn(c.n);o.push(n+'_Pick(*) {','  ; nexo-colorpick','  global '+n+'_color','  c := Nexo_PickColor()','  if c = ""','    return','  '+n+'_color := c','  '+n+'.Text := "Color " c','}')});
  if(tipc.length)o.push('Nexo_Hover(wParam, lParam, msg, hwnd) {','  ; nexo-tips','  static last := 0','  if (hwnd = last)','    return','  last := hwnd','  ToolTip(Nexo_Tips.Get(hwnd, ""))','  SetTimer(() => ToolTip(), -4000)','}');
  if(anc.length){const meta={};anc.forEach(c=>{const m={};['aw','ah','ar','ab'].forEach(k=>{if(c[k])m[k]=true});meta[c.n]=m});
    o.push(V+'_Anchor(g, mm, w, h) {','  ; nexo-anchors '+JSON.stringify(meta),'  if mm = -1','    return','  dx := w - '+g.w,'  dy := h - '+g.h);
    anc.forEach(c=>{const a=[c.ar?c.x+' + dx':'',c.ab?c.y+' + dy':'',c.aw?c.w+' + dx':'',c.ah?c.h+' + dy':''];while(a.length&&!a[a.length-1])a.pop();o.push('  '+vn(c.n)+'.Move('+a.join(', ')+')')});o.push('}')}
  o.push('; --- end UI ---');return o}
function effFont(c){const f=Object.assign({},c.fp||{},c.font||{});return{fs:f.fs||(GUI.font?(GUI.fs||10):9),b:f.b,i:f.i,u:f.u,st:f.st,face:f.face||(GUI.font&&GUI.face)||'Segoe UI',c:f.c||(GUI.font&&GUI.fc)||null}}
function paintBox(){const b=$('#ui-win-box'),w=$('#ui-wrap'),ch=$('#ui-chrome');b.style.width=GUI.w+'px';b.style.height=GUI.h+'px';b.style.background=GUI.bgc?'#'+GUI.bgc:GUI.bg?'#'+GUI.bg:(uPrev?'#f0f0f0':'');w.classList.toggle('prev',uPrev);
  const o=GUI.opts||'',nocap=/-Caption/i.test(o),tool=/\+ToolWindow/i.test(o);ch.style.display=uPrev&&!nocap?'flex':'none';ch.replaceChildren(mkE('div',{flex:1,paddingLeft:'10px',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'},GUI.title||'AutoHotkey'));
  if(!tool){const bt=(t,d)=>mkE('div',{width:'46px',height:'31px',display:'grid',placeItems:'center',color:d?'#bbb':'#000'},t);ch.append(bt('─',/-MinimizeBox/i.test(o)),bt('☐',/-MaximizeBox/i.test(o)))}
  ch.append(mkE('div',{width:'46px',height:'31px',display:'grid',placeItems:'center'},'✕'));b.style.fontFamily=uPrev?'"Segoe UI",system-ui,sans-serif':''}
function paintDesign(e,c,b){const o=c.opt||'',s=e.style,bg=hexOf(o,/\bBackground([0-9a-f]{6})\b/i),f=effFont(c),col=hexOf(o,/\bc([0-9a-f]{6})\b/i)||f.c;
  if(bg)s.background='#'+bg;if(col)s.color='#'+col;if(c.font&&c.font.fs||c.fp&&c.fp.fs)s.fontSize=PX(f.fs)+'px';if(f.b)s.fontWeight='700';if(f.i)s.fontStyle='italic';if(/\bCenter\b/i.test(o))b.style.justifyContent='center';
  if(/\bDisabled\b|\bHidden\b/i.test(o))s.opacity='.5';
  if(isTab(c.t))return paintTab(e,c,b,false);
  const T=String(c.text===undefined?'':c.text);
  b.textContent=({MonthCal:'📅 Calendar',Picture:'🖼 '+T,ListView:T.split('|').join(' │ '),Hotkey:'⌨ '+(T||'hotkey box'),DateTime:'📅 '+T,Link:T.replace(/<[^>]+>/g,''),StatusBar:T,Progress:'',Slider:''})[c.t]??(LISTT.has(c.t)?T.split('|')[0]:(T||(CT[c.t]?'':c.t)))}
function paintPrev(e,c,b){const s=e.style,o=c.opt||'',f=effFont(c),px=PX(f.fs),t=c.t,txt=c.text===undefined?'':String(c.text);
  const bg=hexOf(o,/\bBackground([0-9a-f]{6})\b/i),col=hexOf(o,/\bc([0-9a-f]{6})\b/i)||f.c,dis=/\bDisabled\b/i.test(o),hid=/\bHidden\b/i.test(o),ro=/\bReadOnly\b/i.test(o),pw=/\bPassword\b/i.test(o),ctr=/\bCenter\b/i.test(o),rt=/\bRight\b/i.test(o),vc=/0x200\b/i.test(o),bd=/(^|\s)\+?Border\b/i.test(o),chk=/\bChecked1?\b/i.test(o),mult=/\bMulti\b/i.test(o)||/\br([2-9]|\d{2,})\b/i.test(o)||c.h>px*2.6,ch=+((o.match(/\bChoose(\d+)\b/i)||[])[1]||0);
  const rg=o.match(/\bRange(-?\d+)-(-?\d+)\b/i),mn=rg?+rg[1]:0,mx=rg?+rg[2]:100,val=c.val!==undefined&&c.val!==''?+c.val:(/^-?\d+$/.test(String(c.arg||''))?+c.arg:mn),pc=Math.max(0,Math.min(100,(val-mn)/((mx-mn)||1)*100));
  Object.assign(s,{fontFamily:'"'+f.face+'","Segoe UI",system-ui,sans-serif',fontSize:px+'px',fontWeight:f.b?'700':'400',fontStyle:f.i?'italic':'normal',textDecoration:[f.u?'underline':'',f.st?'line-through':''].join(' ').trim()||'none',color:dis?'#a0a0a0':(col?'#'+col:'#000'),opacity:hid?'.35':'',lineHeight:'1.25',boxSizing:'border-box'});
  b.style.cssText='position:absolute;inset:0;display:flex;pointer-events:none;overflow:hidden';
  const arrow=mkE('div',{width:'17px',height:'100%',background:'#e5e5e5',display:'grid',placeItems:'center',fontSize:'9px',borderLeft:'1px solid #d0d0d0',flex:'none'},'▾');
  switch(t){
    case'Text':if(/\+?0x10\b/.test(o)){Object.assign(s,{borderTop:'1px solid #a0a0a0',borderBottom:'1px solid #fff'});break}
      if(bg)s.background='#'+bg;if(bd)s.border='1px solid #646464';Object.assign(b.style,{alignItems:vc?'center':'flex-start',justifyContent:ctr?'center':rt?'flex-end':'flex-start',padding:'0 2px',whiteSpace:'pre-wrap',textAlign:ctr?'center':rt?'right':'left'});b.textContent=txt;break;
    case'Button':Object.assign(s,{background:dis?'#cccccc':'#e1e1e1',border:'1px solid '+(/\bDefault\b/i.test(o)?'#0078d7':'#adadad')});Object.assign(b.style,{alignItems:'center',justifyContent:'center'});b.textContent=txt;break;
    case'Edit':{Object.assign(s,{background:bg?'#'+bg:ro?'#f0f0f0':'#fff',border:'1px solid #7a7a7a'});Object.assign(b.style,{alignItems:mult?'flex-start':'center',padding:'0 3px',whiteSpace:mult?'pre-wrap':'nowrap',justifyContent:ctr?'center':rt?'flex-end':'flex-start'});
      if(!txt&&c.ph){b.textContent=c.ph;b.style.color='#8a8a8a'}else b.textContent=pw?'•'.repeat(txt.length):txt;
      if(c.spin)b.append(mkE('div',{position:'absolute',right:0,top:0,bottom:0,width:'17px',borderLeft:'1px solid #c0c0c0',background:'#e5e5e5',display:'grid',placeItems:'center',fontSize:'8px',lineHeight:'1',whiteSpace:'pre'},'▴\n▾'));break}
    case'Checkbox':case'Radio':{const r=t==='Radio';b.style.alignItems='center';b.append(mkE('div',{width:'13px',height:'13px',border:'1px solid '+(dis?'#bcbcbc':'#333'),background:'#fff',borderRadius:r?'50%':'1px',flex:'none',marginRight:'6px',display:'grid',placeItems:'center',fontSize:'10px',lineHeight:'1'},chk?(r?'●':'✔'):''),mkE('div',{},txt));break}
    case'DropDownList':case'ComboBox':{const it=txt.split('|');Object.assign(s,{background:bg?'#'+bg:'#fff',border:'1px solid #7a7a7a'});Object.assign(b.style,{alignItems:'center',justifyContent:'space-between',paddingLeft:'3px'});b.append(mkE('div',{},ch?it[ch-1]||'':''),arrow);break}
    case'ListBox':{Object.assign(s,{background:bg?'#'+bg:'#fff',border:'1px solid #7a7a7a'});Object.assign(b.style,{flexDirection:'column',alignItems:'stretch',padding:'1px'});txt.split('|').forEach((x,i)=>b.append(mkE('div',{padding:'0 2px',background:i+1===ch?'#0078d7':'',color:i+1===ch?'#fff':'',whiteSpace:'nowrap'},x)));break}
    case'ListView':{Object.assign(s,{background:bg?'#'+bg:'#fff',border:'1px solid #828790'});b.style.flexDirection='column';const row=(cells,hd)=>{const r=mkE('div',{display:'flex',flex:'none',height:Math.round(px*1.7)+'px',alignItems:'center',borderBottom:'1px solid #ececec',background:hd?'#fff':''});cells.forEach(x=>r.append(mkE('div',{flex:1,padding:'0 6px',borderRight:hd?'1px solid #e5e5e5':'',overflow:'hidden',whiteSpace:'nowrap',color:hd?'#444':''},x)));return r};b.append(row(txt.split('|'),true));String(c.rows||'').split('\n').filter(x=>x.trim()).forEach(r=>b.append(row(r.split('|').map(x=>x.trim()),false)));break}
    case'Slider':{const vt=/\bVertical\b/i.test(o);if(vt){b.style.justifyContent='center';b.style.padding='8px 0';const tr=mkE('div',{width:'4px',flex:1,background:'#d6d6d6',border:'1px solid #bcbcbc',position:'relative'});tr.append(mkE('div',{position:'absolute',top:'calc('+(100-pc)+'% - 5px)',left:'-8px',height:'11px',width:'20px',background:'#0078d7',borderRadius:'2px'}));b.append(tr);break}
      b.style.alignItems='center';b.style.padding='0 8px';const tr=mkE('div',{flex:1,height:'4px',background:'#d6d6d6',border:'1px solid #bcbcbc',position:'relative'});tr.append(mkE('div',{position:'absolute',left:'calc('+pc+'% - 5px)',top:'-8px',width:'11px',height:'20px',background:'#0078d7',borderRadius:'2px'}));b.append(tr);break}
    case'Progress':{Object.assign(s,{background:bg?'#'+bg:'#e6e6e6',border:'1px solid #bcbcbc'});if(/\bVertical\b/i.test(o)){Object.assign(b.style,{alignItems:'flex-end'});b.append(mkE('div',{height:pc+'%',width:'100%',background:col?'#'+col:'#06b025'}));break}b.style.alignItems='stretch';b.append(mkE('div',{width:pc+'%',background:col?'#'+col:'#06b025'}));break}
    case'TreeView':{Object.assign(s,{background:bg?'#'+bg:'#fff',border:'1px solid #828790'});Object.assign(b.style,{flexDirection:'column',alignItems:'stretch',padding:'2px'});String(c.text||'').split('|').filter(Boolean).forEach((x,i)=>b.append(mkE('div',{padding:'0 2px',whiteSpace:'nowrap'},(i%2?'▸ ':'▾ ')+x)));break}
    case'ActiveX':{Object.assign(s,{background:'#f4f6fb',border:'1px solid #98a2c8',color:'#4a5588'});Object.assign(b.style,{flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'4px'});b.append(mkE('div',{fontSize:'26px'},'🌐'),mkE('div',{fontSize:'11px',maxWidth:'90%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},c.nav||txt));break}
    case'GroupBox':{b.style.overflow='visible';s.overflow='visible';b.append(mkE('div',{position:'absolute',left:0,right:0,top:Math.round(px*.7)+'px',bottom:0,border:'1px solid #dcdcdc',borderRadius:'3px',boxShadow:'1px 1px 0 #fff,inset 1px 1px 0 #fff'}),mkE('div',{position:'absolute',left:'9px',top:0,padding:'0 3px',background:GUI.bgc?'#'+GUI.bgc:GUI.bg?'#'+GUI.bg:'#f0f0f0',whiteSpace:'nowrap'},txt));break}
    case'Tab3':case'Tab2':case'Tab':paintTab(e,c,b,true);break;
    case'Link':{b.style.alignItems='center';txt.split(/(<a[^>]*>.*?<\/a>)/i).forEach(p=>{const m=p.match(/^<a[^>]*>(.*?)<\/a>$/i);b.append(m?mkE('span',{color:'#0066cc',textDecoration:'underline'},m[1]):mkE('span',{},p))});break}
    case'Picture':Object.assign(s,{background:'#e8e8e8',border:'1px dashed #999',color:'#666'});Object.assign(b.style,{alignItems:'center',justifyContent:'center',flexDirection:'column'});b.append(mkE('div',{fontSize:'22px'},'🖼'),mkE('div',{fontSize:'11px'},txt));break;
    case'DateTime':{const d=new Date(),pad=n=>String(n).padStart(2,'0'),shown=/yy/i.test(txt)?txt.replace(/yyyy/g,d.getFullYear()).replace(/MM/g,pad(d.getMonth()+1)).replace(/dd/g,pad(d.getDate())).replace(/HH/g,pad(d.getHours())).replace(/mm/g,pad(d.getMinutes())):d.toLocaleDateString();Object.assign(s,{background:'#fff',border:'1px solid #7a7a7a'});Object.assign(b.style,{alignItems:'center',justifyContent:'space-between',paddingLeft:'3px'});b.append(mkE('div',{},shown),arrow);break}
    case'MonthCal':{Object.assign(s,{background:'#fff',border:'1px solid #bcbcbc'});b.style.flexDirection='column';const d=new Date(),y=d.getFullYear(),m=d.getMonth(),first=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate();b.append(mkE('div',{textAlign:'center',padding:'4px',background:'#0078d7',color:'#fff'},d.toLocaleString('default',{month:'long'})+' '+y));const g=mkE('div',{display:'grid',gridTemplateColumns:'repeat(7,1fr)',flex:1,textAlign:'center',alignContent:'space-around',fontSize:'11px'});for(let i=0;i<first;i++)g.append(mkE('div',{}));for(let i=1;i<=dim;i++)g.append(mkE('div',{background:i===d.getDate()?'#0078d7':'',color:i===d.getDate()?'#fff':''},String(i)));b.append(g);break}
    case'Hotkey':Object.assign(s,{background:'#fff',border:'1px solid #7a7a7a'});Object.assign(b.style,{alignItems:'center',padding:'0 3px'});b.textContent=txt||'None';break;
    case'StatusBar':Object.assign(s,{background:'#f0f0f0',borderTop:'1px solid #d0d0d0'});Object.assign(b.style,{alignItems:'center',padding:'0 6px'});b.textContent=txt;break;
    default:Object.assign(s,{background:'#fff',border:'1px dashed #999',color:'#666'});Object.assign(b.style,{alignItems:'center',justifyContent:'center'});b.textContent=t+(txt?' · '+txt:'')}}
function elStyle(e,c){const s=e.style,b=e.querySelector('.pv');['background','color','fontSize','fontWeight','fontStyle','textDecoration','fontFamily','border','borderTop','borderBottom','opacity','lineHeight','overflow','boxSizing'].forEach(k=>s[k]='');
  Object.assign(s,{left:c.x+'px',top:c.y+'px',width:c.w+'px',height:c.h+'px'});
  if(c.t==='StatusBar')Object.assign(s,{left:'0px',top:(GUI.h-(c.h||22))+'px',width:GUI.w+'px'});
  b.replaceChildren();b.removeAttribute('style');s.display=c.tabOf&&(uPage[c.tabOf]||1)!==(c.pg||1)?'none':'';uPrev?paintPrev(e,c,b):paintDesign(e,c,b)}
const textLabel=ty=>ty==='TreeView'?'Items (a|b|c)':ty==='ActiveX'?'Component (ProgID)':isTab(ty)?'Pages (a|b)':ty==='ListView'?'Columns (a|b)':LISTT.has(ty)?'Items (a|b)':ty==='DateTime'?'Format':ty==='Picture'?'Image file':ty==='Link'?'Text (links: <a href="…">…</a>)':'Text';
function colorFld(lbl,hex,on){const w=document.createElement('label');w.className='fld';const s=document.createElement('span');s.textContent=lbl;const box=document.createElement('div');box.style.cssText='display:flex;gap:4px;align-items:center';const i=document.createElement('input');i.type='color';i.value='#'+(hex&&/^[0-9a-f]{6}$/i.test(hex)?hex:'888888');if(!hex)i.style.opacity='.45';const x=document.createElement('button');x.textContent='none';x.title='Use the default';x.style.cssText='padding:0 6px;font-size:11px';i.oninput=()=>{i.style.opacity='1';on(i.value.slice(1).toUpperCase())};x.onclick=()=>{on('');i.value='#888888';i.style.opacity='.45'};box.append(i,x);w.append(s,box);return w}
function setF(c,k,v){c.font=Object.assign({},c.font||{});if(v===''||v===false||v===undefined||v===null)delete c.font[k];else c.font[k]=v;if(!Object.keys(c.font).length)delete c.font}

/* ---- window resize handles, layout helpers, themes, jumps ---- */
let uGap=10,uPad=20;
function winResize(ev,dx,dy){ev.preventDefault();ev.stopPropagation();const sx=ev.clientX,sy=ev.clientY,ow=GUI.w,oh=GUI.h,sn=v=>uSnap?Math.round(v/uSnap)*uSnap:Math.round(v);
  const mv=e=>{if(dx)GUI.w=Math.max(100,sn(ow+e.clientX-sx));if(dy)GUI.h=Math.max(60,sn(oh+e.clientY-sy));paintBox();refreshAll()};
  const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);setSize();renderProps();snap()};addEventListener('pointermove',mv);addEventListener('pointerup',up)}
function addWinHandles(b){[['e',1,0,'right:-7px;top:0;bottom:0;width:9px;cursor:ew-resize'],['s',0,1,'bottom:-7px;left:0;right:0;height:9px;cursor:ns-resize'],['se',1,1,'right:-9px;bottom:-9px;width:16px;height:16px;cursor:nwse-resize;border-radius:3px;background:var(--acc);opacity:.85']].forEach(([n,x,y,css])=>{
  const h=document.createElement('div');h.className='win-rs ui-keep';h.title='Drag to resize the window';h.style.cssText='position:absolute;z-index:70;'+css;h.addEventListener('pointerdown',ev=>winResize(ev,x,y));b.append(h)})}
const kidsOf=(c,skip)=>isTab(c.t)?real().filter(k=>k.tabOf===c.id&&!skip.has(k)):[];
function layoutList(){const m=multi();return m.length?m:real().filter(c=>!c.tabOf&&c.t!=='StatusBar')}
function stackCtls(dir,gap){const L=layoutList().slice();if(L.length<2)return st('Select two or more controls first');const S0=new Set(L);
  L.sort(dir==='v'?(a,b)=>a.y-b.y||a.x-b.x:(a,b)=>a.x-b.x||a.y-b.y);const x0=Math.min(...L.map(c=>c.x)),y0=Math.min(...L.map(c=>c.y));let pos=dir==='v'?y0:x0;
  L.forEach(c=>{const nx=dir==='v'?x0:pos,ny=dir==='v'?pos:y0,dx=nx-c.x,dy=ny-c.y;c.x=nx;c.y=ny;kidsOf(c,S0).forEach(k=>{k.x=Math.max(0,k.x+dx);k.y=Math.max(0,k.y+dy)});pos+=(dir==='v'?c.h:c.w)+gap});
  renderUI();snap();code()}
function fitWindow(pad){const all=real().filter(c=>c.t!=='StatusBar');if(!all.length)return st('Add some controls first');
  const dx=pad-Math.min(...all.map(c=>c.x)),dy=pad-Math.min(...all.map(c=>c.y));all.forEach(c=>{c.x+=dx;c.y+=dy});
  const sb=real().some(c=>c.t==='StatusBar')?24:0;GUI.w=Math.max(100,Math.max(...all.map(c=>c.x+c.w))+pad);GUI.h=Math.max(60,Math.max(...all.map(c=>c.y+c.h))+pad+sb);
  renderUI();setSize();snap();code()}
const THEMES={'':['Windows default (light)',null],dark:['Dark',{bg:'1c1d23',fc:'e9eaf0',ib:'2a2c35',ic:'f2f3f8',title:1}],midnight:['Midnight blue',{bg:'0f172a',fc:'e2e8f0',ib:'1e293b',ic:'f1f5f9',title:1}],nexo:['Nexo purple',{bg:'0d0f15',fc:'eef0ff',ib:'1a1e2c',ic:'ffffff',title:1}],soft:['Soft light',{bg:'f4f5f9',fc:'1f2937',ib:'ffffff',ic:'111827'}],contrast:['High contrast',{bg:'000000',fc:'ffffff',ib:'000000',ic:'ffff00',title:1}]};
const FONTPACKS={modern:['Modern · Segoe UI 10',['Segoe UI',10]],large:['Large · Segoe UI 12',['Segoe UI',12]],code:['Code · Consolas 10',['Consolas',10]],friendly:['Friendly · Calibri 11',['Calibri',11]],classic:['Classic · Verdana 9',['Verdana',9]],compact:['Compact · Segoe UI 9',['Segoe UI',9]]};
const INPUT_T=['Edit','ComboBox','DropDownList','ListBox','ListView','TreeView','DateTime'];
function themeInput(c){const th=GUI.theme&&THEMES[GUI.theme]&&THEMES[GUI.theme][1];if(!th||!INPUT_T.includes(c.t)||c.pp)return;const pp='Background'+th.ib+' c'+th.ic;c.opt=((c.opt||'')+' '+pp).trim();c.pp=pp}
function applyTheme(key){const th=THEMES[key]&&THEMES[key][1];
  GUI.ctl=GUI.ctl.filter(x=>!(x.k&&/"int", 20, "int\*"/.test(x.s||'')));
  real().forEach(c=>{if(c.pp&&c.opt)c.opt=c.opt.replace(c.pp,'').replace(/\s+/g,' ').trim();c.pp=undefined});
  if(!th){GUI.bgc=undefined;GUI.fc=undefined;GUI.theme=undefined}
  else{GUI.bgc=th.bg;GUI.font=true;GUI.fc=th.fc;GUI.theme=key;real().forEach(themeInput);
    if(th.title)GUI.ctl.unshift({k:'line',s:'DllCall("dwmapi\\DwmSetWindowAttribute", "ptr", '+(GUI.v||'myGui')+'.Hwnd, "int", 20, "int*", true, "int", 4)'})}
  paintBox();renderUI();snap();code()}
function applyFontPack(key){const f=FONTPACKS[key];if(!f)return;GUI.font=true;GUI.face=f[0];GUI.fs=f[1];refreshAll();snap();code()}
function jumpCtl(name){const c=real().find(x=>x.n===name);if(!c)return st('There is no control called “'+name+'” in the UI Designer');uMulti=new Set();uSel=c.id;setView('ui');markSel();renderProps()}
function goFunc(name){let b=null;(function w(n){n.kids.forEach(k=>{if((k.t==='func'||k.t==='funcp')&&vn(k.v.n)===vn(name))b=k;w(k)})})(root);if(!b)return st('No “Define function '+name+'” block yet');setView('blocks');setTimeout(()=>goBlock(b.id),60)}
/* ---- find blocks on the canvas (Ctrl+Shift+F) ---- */
function blockText(b){let g='';try{g=genOf(b)}catch(e){}return(fillT(b)+' '+g).toLowerCase()}
function openFind(){let d=$('#bfind');if(d){d.querySelector('input').focus();return}
  d=document.createElement('div');d.id='bfind';d.style.cssText='position:fixed;top:64px;right:22px;width:340px;max-height:60vh;overflow:auto;z-index:9000;background:#171a24;color:#eef0ff;border:1px solid #3a4160;border-radius:12px;padding:10px;box-shadow:0 12px 36px rgba(0,0,0,.5);font-size:13px';
  const inp=document.createElement('input');inp.placeholder='Find a block… (Enter jumps to the first)';inp.style.cssText='width:100%;box-sizing:border-box';const L=document.createElement('div');L.style.marginTop='6px';
  const close=()=>{d.remove()};
  const run=()=>{L.replaceChildren();const q=inp.value.trim().toLowerCase();if(!q)return;const hits=[];(function w(n,path){n.kids.forEach(k=>{if(blockText(k).includes(q))hits.push(k);w(k)})})(root);
    if(!hits.length){L.textContent='No block matches “'+inp.value+'”';return}
    hits.slice(0,40).forEach(k=>{const r=document.createElement('div');r.style.cssText='padding:5px 6px;border-radius:6px;cursor:pointer';r.textContent=fillT(k);r.title='Jump to this block';r.onmouseenter=()=>r.style.background='#242a40';r.onmouseleave=()=>r.style.background='';r.onclick=()=>{sel=k.id;selSet.clear();render();goBlock(k.id)};L.append(r)});
    if(hits.length>40){const m=document.createElement('div');m.style.opacity='.6';m.textContent='…and '+(hits.length-40)+' more';L.append(m)}};
  inp.oninput=run;inp.onkeydown=e=>{if(e.key==='Escape')close();else if(e.key==='Enter'){const f=L.firstChild;if(f&&f.onclick)f.onclick()}};
  d.append(inp,L);document.body.append(d);inp.focus()}
addEventListener('keydown',e=>{if(view==='blocks'&&(e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='f'){e.preventDefault();openFind()}});
/* ---- UI designer: copy / paste controls (also between tabs) ---- */
let UICLIP='';
function copyCtls(){const L=selList();if(!L.length)return false;const all=new Set(L);L.forEach(c=>{if(isTab(c.t))real().forEach(k=>{if(k.tabOf===c.id)all.add(k)})});UICLIP=JSON.stringify([...all]);st((all.size>1?all.size+' controls':'Control')+' copied. Ctrl+V pastes '+(all.size>1?'them':'it')+', even in another tab.');return true}
function pasteCtls(){if(!UICLIP)return;const a=JSON.parse(UICLIP),nid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6),used=new Set(real().map(z=>z.n)),map={},made=[];
  a.forEach(c=>{map[c.id]=nid()});
  a.forEach(c=>{const n=Object.assign({},c,{id:map[c.id],x:c.x+14,y:c.y+14});if(n.tabOf&&map[n.tabOf])n.tabOf=map[n.tabOf];else{delete n.tabOf;delete n.pg}
    if(n.n){const base=String(n.n).replace(/\d+$/,'')||'ctl';let i=2;while(used.has(base+i))i++;n.n=base+i;used.add(n.n)}GUI.ctl.push(n);made.push(n)});
  fixTabOrder(GUI);uMulti=made.length>1?new Set(made.map(c=>c.id)):new Set();uSel=made[made.length-1].id;renderUI();snap();code()}
addEventListener('keydown',e=>{if(view!=='ui'||uPrev||!(e.ctrlKey||e.metaKey)||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||document.querySelector('dialog[open]'))return;const k=e.key.toLowerCase();
  if(k==='c'&&!String(getSelection()||'')){if(copyCtls())e.preventDefault()}else if(k==='v'&&UICLIP){e.preventDefault();pasteCtls()}});

/* ---- window look: Windows 11 title bar / corners / backdrop, opacity, start position ---- */
function dwmSet(attr,val){GUI.ctl=GUI.ctl.filter(x=>!(x.k&&new RegExp('"int", '+attr+', "int\\*"').test(x.s||'')));
  if(val!==null&&val!==undefined&&val!=='')GUI.ctl.unshift({k:'line',s:'DllCall("dwmapi\\DwmSetWindowAttribute", "ptr", '+(GUI.v||'myGui')+'.Hwnd, "int", '+attr+', "int*", '+val+', "int", 4)'});code()}
function dwmGet(attr){const re=new RegExp('"int", '+attr+', "int\\*", ([^,]+),');const l=GUI.ctl.find(x=>x.k&&re.test(x.s||''));return l?l.s.match(re)[1].trim():''}
const toBGR=h=>{h=String(h||'').replace('#','');return/^[0-9a-f]{6}$/i.test(h)?'0x'+h.slice(4,6)+h.slice(2,4)+h.slice(0,2):''};
const fromBGR=v=>{const m=String(v||'').match(/^0x([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);return m?m[3]+m[2]+m[1]:''};
const gOptVal=re=>{for(const x of(GUI.opts||'').split(/\s+/)){const m=x.match(re);if(m)return m[1]}return''};
function gSetOpt(re,tok){GUI.opts=(GUI.opts||'').split(/\s+/).filter(Boolean).filter(x=>!re.test(x)).concat(tok?[tok]:[]).join(' ');GUI.ctor=undefined;code()}

function makeHandler(c){const ev=evOf(c);let b=null;(function f(n){n.kids.forEach(k=>{if(k.t==='onctl'&&k.v.c===c.n&&k.v.ev===ev)b=k;f(k)})})(root);if(!b){b=mk('onctl',{c:c.n,ev});root.kids.push(b);snap()}setView('blocks');setTimeout(()=>goBlock(b.id),60)}
let lookSel='',lookName='';
function looksLoad(){try{const a=JSON.parse(localStorage.getItem('nexoLooks'));return Array.isArray(a)?a:[]}catch(e){return[]}}
function looksSave(a){try{localStorage.setItem('nexoLooks',JSON.stringify(a))}catch(e){}}
function captureLook(name){const g=GUI,L={name,bgc:g.bgc||null,font:!!g.font,fs:g.fs||null,fc:g.fc||null,face:g.face||null,theme:g.theme||null,types:{}};
  real().forEach(c=>{if(L.types[c.t])return;const o=c.opt||'',bg=o.match(/\bBackground([0-9a-f]{6})\b/i),col=o.match(/\bc([0-9a-f]{6})\b/i);L.types[c.t]={bg:bg?bg[1]:null,c:col?col[1]:null,font:c.font?{...c.font}:null}});return L}
function applyLook(L){const g=GUI;g.bgc=L.bgc||undefined;g.theme=L.theme||undefined;if(L.font){g.font=true;g.fs=L.fs||undefined;g.face=L.face||undefined;g.fc=L.fc||undefined}else{g.font=false;g.fs=g.face=g.fc=undefined}
  real().forEach(c=>{const t=L.types&&L.types[c.t];if(!t)return;const o=(c.opt||'').split(/\s+/).filter(z=>z&&!/^Background[0-9a-f]{6}$/i.test(z)&&!/^c[0-9a-f]{6}$/i.test(z));if(t.bg)o.push('Background'+t.bg);if(t.c)o.push('c'+t.c);c.opt=o.join(' ');if(t.font)c.font={...t.font};else delete c.font})}
function renderProps(){const P=$('#ui-props');P.replaceChildren();const c=real().find(x=>x.id===uSel);
  const H3=t=>{const h=document.createElement('h3');h.textContent=t;P.append(h)},tip=t=>{const p=document.createElement('p');p.className='tip';p.textContent=t;P.append(p)},btn=(t,tt,fn)=>{const b=document.createElement('button');b.textContent=t;if(tt)b.title=tt;b.onclick=fn;return b};
  const chk=(l,on,get)=>P.append(fld(l,get,on,'checkbox'));
  let row2;const mm=multi();if(mm.length){H3(mm.length+' controls selected');tip('Shift/Ctrl-click adds or removes one. Drag to move them together, arrow keys nudge them. Drag on empty space to box-select.');
    const row=items=>{const d=document.createElement('div');d.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin:4px 0';items.forEach(([t,tt,k])=>d.append(btn(t,tt,()=>alignSel(k))));P.append(d)};
    row([['⇤ Left','Line up left edges','l'],['↔ Center','Center horizontally','hc'],['⇥ Right','Line up right edges','r']]);
    row([['⤒ Top','Line up top edges','t'],['↕ Middle','Center vertically','vc'],['⤓ Bottom','Line up bottom edges','b']]);
    row([['Space across','Even gaps, left to right (3+ controls)','dh'],['Space down','Even gaps, top to bottom (3+ controls)','dv']]);
    row([['Same width','Match the width of the last one you clicked','sw'],['Same height','Match the height of the last one you clicked','sh']]);
    P.append(fld('Spacing',uGap,v=>{uGap=Math.max(0,v||0)},'number'));
    row2=document.createElement('div');row2.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin:4px 0';row2.append(btn('Stack vertically','One column, even spacing',()=>stackCtls('v',uGap)),btn('Stack horizontally','One row, even spacing',()=>stackCtls('h',uGap)));P.append(row2);
    P.append(btn('Delete all','Remove the selected controls',delCtl));return}
  if(!c){H3('Window');
    P.append(fld('Title',GUI.title,v=>{GUI.title=v;GUI.ctor=undefined;paintBox();code()}),fld('Width',GUI.w,v=>{GUI.w=Math.max(100,v||100);setSize();refreshAll()},'number'),fld('Height',GUI.h,v=>{GUI.h=Math.max(60,v||60);setSize();refreshAll()},'number'),colorFld('Background',GUI.bgc||'',v=>{GUI.bgc=v||undefined;paintBox();refreshAll();code()}));
    H3('Default text');
    P.append(fld('Size',GUI.fs||10,v=>{GUI.font=true;GUI.fs=Math.max(6,v||10);refreshAll();code()},'number'),selFld('Font',FONTS.concat(FONTS.includes(GUI.face||'Segoe UI')?[]:[GUI.face]).map(x=>[x,x]),GUI.face||'Segoe UI',v=>{GUI.font=true;GUI.face=v;refreshAll();code()}),colorFld('Color',GUI.fc||'',v=>{GUI.font=true;GUI.fc=v||undefined;refreshAll();code()}));
    H3('Look');
    {const looks=looksLoad();P.append(selFld('My saved looks',[['',looks.length?'(choose one)':'(none saved yet)'],...looks.map(l=>[l.name,l.name])],lookSel,v=>{lookSel=v;renderProps()}));
      const lr=document.createElement('div');lr.style.cssText='display:flex;gap:4px;margin:4px 0';lr.append(btn('Apply','Give this window that look',()=>{const l=looks.find(x=>x.name===lookSel);if(l){applyLook(l);renderUI();code();snap();renderProps()}}),btn('Delete','Forget this look',()=>{if(lookSel){looksSave(looks.filter(x=>x.name!==lookSel));lookSel='';renderProps()}}));P.append(lr);
      P.append(fld('Save this window’s look as',lookName,v=>{lookName=v}),btn('Save look','Remember the colors, fonts and theme of this window so you can use them on other windows',()=>{const nm=lookName.trim();if(!nm)return st('Type a name for the look first');const l=captureLook(nm),all=looksLoad().filter(x=>x.name!==nm);all.push(l);looksSave(all);lookSel=nm;st('Saved the look “'+nm+'”');renderProps()}))}
    P.append(selFld('Theme',Object.keys(THEMES).map(k=>[k,THEMES[k][0]]),GUI.theme||'',v=>{applyTheme(v);renderProps()}),selFld('Font pack',[['','(keep current)'],...Object.keys(FONTPACKS).map(k=>[k,FONTPACKS[k][0]])],'',v=>{if(v){applyFontPack(v);renderProps()}}));
    tip('Dark themes color the window, text and input boxes, and turn the title bar dark on Windows 10/11. Buttons keep the system look (a Windows limitation).');
    H3('Position and limits');
    P.append(selFld('Opens at',[['','Center of the screen'],['custom','An exact spot (X, Y)'],['br','Bottom-right corner']],GUI.pos||'',v=>{GUI.pos=v||undefined;GUI.showr=undefined;code();renderProps()}));
    if(GUI.pos==='custom')P.append(fld('Opens at X',GUI.px||0,v=>{GUI.px=v||0;GUI.showr=undefined;code()},'number'),fld('Opens at Y',GUI.py||0,v=>{GUI.py=v||0;GUI.showr=undefined;code()},'number'));
    if(GUI.showr!==undefined&&!GUI.pos)tip('This window opens with a custom Show line from your script. Pick a position above to replace it.');
    P.append(fld('Smallest size (like 320x200)',gOptVal(/^\+?MinSize(\d+x\d+)$/i),v=>{gSetOpt(/^\+?MinSize/i,/^\d+x\d+$/.test(v.trim())?'+MinSize'+v.trim():'')}),fld('Largest size (like 800x600)',gOptVal(/^\+?MaxSize(\d+x\d+)$/i),v=>{gSetOpt(/^\+?MaxSize/i,/^\d+x\d+$/.test(v.trim())?'+MaxSize'+v.trim():'');}));
    P.append(fld('See-through (0-255, 255 = solid)',GUI.alpha===undefined?255:GUI.alpha,v=>{GUI.alpha=v>=255||v===undefined||v===''?undefined:Math.max(0,Math.min(255,v||0));code()},'number'));
    H3('Windows 11 extras');
    P.append(selFld('Corners',[['','Windows default'],['2','Rounded'],['1','Square'],['3','Slightly rounded']],dwmGet(33),v=>{dwmSet(33,v)}),selFld('Background material',[['','None'],['2','Mica'],['3','Acrylic'],['4','Mica Alt']],dwmGet(38),v=>{dwmSet(38,v)}));
    P.append(colorFld('Title bar color',fromBGR(dwmGet(35)),v=>{dwmSet(35,toBGR(v))}),colorFld('Title text color',fromBGR(dwmGet(36)),v=>{dwmSet(36,toBGR(v))}),colorFld('Window border color',fromBGR(dwmGet(34)),v=>{dwmSet(34,toBGR(v))}));
    tip('These need Windows 11 (22H2 for the material). On older Windows they are ignored. “Mica” and “Acrylic” look best with a window that has no background color.');
    H3('Layout');
    P.append(fld('Spacing',uGap,v=>{uGap=Math.max(0,v||0)},'number'),fld('Edge padding',uPad,v=>{uPad=Math.max(0,v||0)},'number'));
    P.append(btn('Stack everything vertically','Put all controls in one column using the spacing',()=>{uMulti=new Set();stackCtls('v',uGap);fitWindow(uPad)}),btn('Fit window to controls','Make the margin the same on every side',()=>fitWindow(uPad)));
    H3('Window options');OPTS.forEach(([t,l])=>chk(l,v=>{optToggle(GUI,t,v);paintBox();code()},optHas(GUI,t)));chk('Quit the script when it is closed',v=>{GUI.close=v;code()},GUI.close);
    P.append(btn('Remove all controls','',()=>{if(real().length&&confirm('Remove every control?')){GUI.ctl=GUI.ctl.filter(x=>x.k);renderUI();snap();code()}}));
    tip(GUI.imp?'This UI came from your script. Lines the designer can’t edit are kept exactly as they were.':'The UI code lives in your script. It sits where the “UI window here” block is, or at the top if there is none.');return}
  const ty=c.t,up=()=>{const e=document.querySelector('.uc[data-id="'+c.id+'"]');if(e)elStyle(e,c);code()},F=c.font||{};
  H3(({Tab3:'Tab',DropDownList:'Dropdown',MonthCal:'Calendar',DateTime:'Date picker'})[ty]||ty);
  if(!c.anon)P.append(fld('Name',c.n,v=>{c.n=v.replace(/\W/g,'')||c.n;code()}));
  tip('The name is how blocks refer to it. Use the {} button on a block to put what a person typed into a message.');
  if(ty==='Slider'||ty==='Progress'){P.append(fld('Start value',c.val===undefined?0:c.val,v=>{c.val=String(v);c.arg=ctlArg(c);up()},'number'),fld('Range (min-max)',tokVal(c,/^Range(.+)$/)||'0-100',v=>{setPre(c,'Range',/^Range/i,v);up()}))}
  else if(ty!=='MonthCal')P.append(fld(textLabel(ty),c.text,v=>{c.text=v;c.arg=ctlArg(c);if(isTab(ty)&&clampPages(c))refreshAll();up()}));
  if(ty==='ListView'){const w=document.createElement('label');w.className='fld';const s=document.createElement('span');s.textContent='Starting rows';const ta=document.createElement('textarea');ta.rows=3;ta.value=c.rows||'';ta.placeholder='one row per line, columns split by |';ta.oninput=()=>{c.rows=ta.value;up()};w.append(s,ta);P.append(w)}
  if(isTab(ty)){const pg=String(c.text).split('|');P.append(selFld('Show page',pg.map((p,i)=>[String(i+1),p]),String(Math.min(uPage[c.id]||1,pg.length)),v=>{uPage[c.id]=+v;refreshAll()}));tip('Drag a control onto the tab to put it on the page you are showing. Or select the tab and click an “Add” button.')}
  if(c.tabOf){const tb=real().find(x=>x.id===c.tabOf);if(tb){const pg=String(tb.text).split('|');P.append(selFld('In tab '+tb.n,pg.map((p,i)=>[String(i+1),p]),String(c.pg||1),v=>{c.pg=+v;uPage[tb.id]=+v;refreshAll();code()}));P.append(btn('Take out of the tab','',()=>{delete c.tabOf;delete c.pg;renderUI();snap();code()}))}}
  if(ty!=='StatusBar'){H3('Position and size');[['x','X'],['y','Y'],['w','Width'],['h','Height']].forEach(([k,l])=>P.append(fld(l,c[k],v=>{c[k]=Math.max(0,v||0);if(k==='w')c.hw=1;if(k==='h')c.hh=1;up()},'number')))}
  if(!['Picture','MonthCal','StatusBar'].includes(ty)){H3('Look');
    P.append(fld('Text size',F.fs||'',v=>{setF(c,'fs',v>0?v:'');up()},'number'),selFld('Font',[['','(window default)'],...FONTS.map(x=>[x,x])],F.face||'',v=>{setF(c,'face',v);up()}));
    chk('Bold',v=>{setF(c,'b',v);up()},!!F.b);chk('Italic',v=>{setF(c,'i',v);up()},!!F.i);chk('Underline',v=>{setF(c,'u',v);up()},!!F.u);
    if(!['Button','Slider'].includes(ty))P.append(colorFld(ty==='Progress'?'Bar color':'Text color',tokVal(c,/^c([0-9a-f]{6})$/i),v=>{setPre(c,'c',/^c[0-9a-f]{6}$/i,v);up()}));
    if(['Text','Edit','ListBox','ListView','ComboBox','DropDownList','Progress','Hotkey','DateTime'].includes(ty))P.append(colorFld(ty==='Progress'?'Track color':'Background',tokVal(c,/^Background([0-9a-f]{6})$/i),v=>{setPre(c,'Background',/^Background[0-9a-f]{6}$/i,v);up()}));
    if(ty==='Button')tip('Windows buttons ignore colors. Use “Flat button” from the Add list for a colored one.');
    if(['Text','Edit'].includes(ty)){P.append(selFld('Align text',[['','Left'],['Center','Center'],['Right','Right']],tokOn(c,'Center')?'Center':tokOn(c,'Right')?'Right':'',v=>{setTok(c,'Center',v==='Center');setTok(c,'Right',v==='Right');up()}));chk('Border',v=>{setTok(c,'+Border',v);up()},tokOn(c,'Border'))}
    if(ty==='Text')chk('Center text up-down inside the box',v=>{setTok(c,'+0x200',v);up()},/0x200/.test(c.opt||''))}
  H3('Behavior');
  chk('Disabled (greyed out)',v=>{setTok(c,'Disabled',v);up()},tokOn(c,'Disabled'));chk('Hidden at start',v=>{setTok(c,'Hidden',v);up()},tokOn(c,'Hidden'));
  if(ty==='Checkbox'||ty==='Radio')chk('Ticked at start',v=>{setTok(c,'Checked',v);up()},tokOn(c,'Checked'));
  if(ty==='Button')chk('Default button (Enter presses it)',v=>{setTok(c,'Default',v);up()},tokOn(c,'Default'));
  if(ty==='Edit'){chk('Read only',v=>{setTok(c,'ReadOnly',v);up()},tokOn(c,'ReadOnly'));chk('Password dots',v=>{setTok(c,'Password',v);up()},tokOn(c,'Password'));chk('Numbers only',v=>{setTok(c,'Number',v);up()},tokOn(c,'Number'));chk('Several lines',v=>{setTok(c,'Multi',v);up()},tokOn(c,'Multi'));chk('Force UPPERCASE',v=>{setTok(c,'Uppercase',v);up()},tokOn(c,'Uppercase'));
    P.append(fld('Max length',tokVal(c,/^Limit(\d+)$/)||'',v=>{setPre(c,'Limit',/^Limit\d*$/i,v>0?String(v):'');up()},'number'),fld('Hint text',c.ph||'',v=>{c.ph=v||undefined;up()}),fld('Arrows (min-max)',c.spin||'',v=>{c.spin=v.trim()||undefined;up()}))}
  if(['Text','Checkbox','Radio','GroupBox','Link','Picture','Slider'].includes(ty))chk('See-through background',v=>{setTok(c,'BackgroundTrans',v);up()},tokOn(c,'BackgroundTrans'));
  if(!['Text','GroupBox','Picture','StatusBar','Progress','Link'].includes(ty))chk('Skip this when pressing Tab',v=>{setTok(c,'-Tabstop',v);up()},tokOn(c,'-Tabstop')||tokOn(c,'Tabstop')&&false);
  if(ty==='Edit'){P.append(selFld('Force letters',[['','As typed'],['Uppercase','UPPERCASE'],['Lowercase','lowercase']],tokOn(c,'Uppercase')?'Uppercase':tokOn(c,'Lowercase')?'Lowercase':'',v=>{setTok(c,'Uppercase',v==='Uppercase');setTok(c,'Lowercase',v==='Lowercase');up()}));chk('Do not wrap long lines',v=>{setTok(c,'-Wrap',v);up()},tokOn(c,'-Wrap'))}
  if(ty==='Checkbox'){chk('Three states (ticked / not / greyed)',v=>{setTok(c,'Check3',v);up()},tokOn(c,'Check3'));chk('Put the box on the right',v=>{setTok(c,'+0x20',v);up()},/\+0x20\b/.test(c.opt||''))}
  if(ty==='Slider'){chk('Vertical',v=>{setTok(c,'Vertical',v);up()},tokOn(c,'Vertical'));chk('No tick marks',v=>{setTok(c,'NoTicks',v);up()},tokOn(c,'NoTicks'));chk('Show the value in a bubble',v=>{setTok(c,'ToolTip',v);up()},tokOn(c,'ToolTip'));P.append(fld('Tick every',tokVal(c,/^TickInterval(\d+)$/),v=>{setPre(c,'TickInterval',/^TickInterval/i,v>0?String(v):'');up()},'number'),fld('Arrow key step',tokVal(c,/^Line(\d+)$/),v=>{setPre(c,'Line',/^Line\d*$/i,v>0?String(v):'');up()},'number'))}
  if(ty==='Progress'){chk('Vertical',v=>{setTok(c,'Vertical',v);up()},tokOn(c,'Vertical'));chk('Blocky (classic) bar',v=>{setTok(c,'-Smooth',v);up()},tokOn(c,'-Smooth'))}
  if(ty==='ListView'){const TN={Text:'text',Integer:'number',Float:'decimal'},NT={text:'',number:'Integer',decimal:'Float',integer:'Integer',float:'Float'};
    P.append(fld('Column types (text, number, decimal)',(c.ct||[]).map(x=>TN[x]||'text').join(', '),v=>{const a=v.split(',').map(z=>NT[z.trim().toLowerCase()]||'');while(a.length&&!a[a.length-1])a.pop();if(a.length)c.ct=a;else delete c.ct;up()}));
    chk('Fit column widths to the text',v=>{if(v)c.autohdr=1;else delete c.autohdr;up()},!!c.autohdr)}
  if(ty==='Button')chk('Color picker button: click it, then click any color on screen',v=>{if(v)c.colorpick=1;else delete c.colorpick;up();renderProps()},!!c.colorpick);
  if(ty==='Button'&&c.colorpick)tip('Use the “picked color of '+(c.n||'button')+'” value block to read the color.');
  if(ty==='ListView'){chk('Grid lines',v=>{setTok(c,'Grid',v);up()},tokOn(c,'Grid'));chk('No header row',v=>{setTok(c,'-Hdr',v);up()},tokOn(c,'-Hdr'));chk('Checkbox on every row',v=>{setTok(c,'Checked',v);up()},tokOn(c,'Checked'));chk('Pick one row only',v=>{setTok(c,'-Multi',v);up()},tokOn(c,'-Multi'))}
  if(ty==='ListBox'){chk('Keep sorted A-Z',v=>{setTok(c,'Sort',v);up()},tokOn(c,'Sort'));chk('Pick several',v=>{setTok(c,'Multi',v);up()},tokOn(c,'Multi'))}
  if(ty==='DropDownList'||ty==='ComboBox')chk('Keep sorted A-Z',v=>{setTok(c,'Sort',v);up()},tokOn(c,'Sort'));
  if(isTab(ty)){chk('Button style tabs',v=>{setTok(c,'Buttons',v);up()},tokOn(c,'Buttons'));chk('Tabs at the bottom',v=>{setTok(c,'Bottom',v);up()},tokOn(c,'Bottom'))}
  if(ty==='Picture')chk('Keep the picture’s shape (height follows width)',v=>{c.hh=v?0:1;setTok(c,'h-1',v);up()},tokOn(c,'h-1'));
  if(ty==='ActiveX')P.append(fld('Web address to open',c.nav||'',v=>{c.nav=v||undefined;up()}));
  if(ty!=='StatusBar'&&!c.anon&&c.n)P.append(fld('Hover tip (shows when the mouse rests on it)',c.tip||'',v=>{c.tip=v||undefined;code()}));
  if(!['Text','GroupBox','Picture','StatusBar','Progress','Link'].includes(ty))chk('Has the cursor when the window opens',v=>{real().forEach(x=>{delete x.focus});if(v)c.focus=true;code()},!!c.focus);
  if(ty!=='StatusBar'&&!c.anon&&c.n){H3('When the window is resized');
    const an=()=>{if(c.aw)c.hw=1;if(c.ah)c.hh=1;if(real().some(x=>x.aw||x.ah||x.ar||x.ab))optToggle(GUI,'+Resize',true);paintBox();code();renderProps()};
    chk('Stretch wider',v=>{c.aw=v||undefined;if(v)c.ar=undefined;an()},!!c.aw);chk('Stretch taller',v=>{c.ah=v||undefined;if(v)c.ab=undefined;an()},!!c.ah);
    chk('Stay on the right edge',v=>{c.ar=v||undefined;if(v)c.aw=undefined;an()},!!c.ar);chk('Stay on the bottom edge',v=>{c.ab=v||undefined;if(v)c.ah=undefined;an()},!!c.ab);
    tip('Pick how this control follows the window when the user drags its edge. This also turns on “User can resize the window”.')}
  H3('When used');
  if(ty!=='Text'||/0x100/.test(c.opt||'')){if(!c.anon){const w=document.createElement('label');w.className='fld';const s=document.createElement('span');s.textContent=evOf(c)==='Click'?'On click':'On change';
    const sel=document.createElement('select'),names=['',...allFuncs()];if(c.fn&&!names.includes(c.fn))names.push(c.fn);names.forEach(n=>sel.add(new Option(n||'(nothing)',n)));sel.value=c.fn||'';sel.onchange=()=>{c.fn=sel.value;code()};w.append(s,sel);P.append(w);
    P.append(btn('✨ Make it do something','Adds a “When control event happens” block to your script and takes you there',()=>makeHandler(c)));if(c.fn)P.append(btn('↪ Go to function “'+c.fn+'”','Jump to the Define function block',()=>goFunc(c.fn)));
    tip('This puts a block in your script that runs when it is '+(evOf(c)==='Click'?'clicked':'changed')+'. Inside it, use the {} button on a block to get what the user typed or picked.')}}
  if(c.evs&&c.evs.length)tip('Also has '+c.evs.length+' custom event line(s) kept from your script.');
  const row=document.createElement('div');row.className='bar2';row.style.flexWrap='wrap';row.style.marginTop='8px';
  [['Duplicate','Ctrl+D',()=>dupCtl()],['Center','Center horizontally',()=>{const d=c.x;c.x=Math.max(0,Math.round((GUI.w-c.w)/2/5)*5);real().forEach(k=>{if(k.tabOf===c.id)k.x+=c.x-d});renderUI();snap();code()}],...(c.imp?[]:[['Front','Bring to front',()=>reorder(c,1)],['Back','Send to back',()=>reorder(c,-1)]])].forEach(([t2,tt,f2])=>row.append(btn(t2,tt,f2)));P.append(row);
  tip('Arrow keys nudge the control (hold Shift for bigger steps).');P.append(btn('Delete control','',()=>delCtl()))}
function addCtl(t,pst){const pr=pst?PRESET[pst]:null,ty=pr?pr.t:t,d=pr||CT[ty],pre=pr?pr.pre:CP[ty];
  if(ty==='StatusBar'){const ex=real().find(x=>x.t==='StatusBar');if(ex){uSel=ex.id;markSel();renderProps();return}}
  let i=1;const nm=new Set(real().map(c=>c.n));while(nm.has(pre+i))i++;
  const c={id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),t:ty,n:pre+i,x:20,y:20+((real().length*40)%Math.max(60,GUI.h-60)),w:ty==='StatusBar'?GUI.w:d.w,h:d.h,hw:1,hh:1,text:pr?pr.text:d.t,opt:pr?pr.opt:(DOPT[ty]||''),fn:'',evs:[],imp:0};if(pst)c.preset=pst;if(pr&&pr.font)c.font=Object.assign({},pr.font);if(pr&&pr.nav)c.nav=pr.nav;c.arg=ctlArg(c);
  const sc=real().find(x=>x.id===uSel),tb=sc&&!isTab(ty)&&ty!=='StatusBar'?(isTab(sc.t)?sc:real().find(x=>x.id===sc.tabOf)):null;
  if(tb){const pg=Math.min(uPage[tb.id]||1,String(tb.text).split('|').length),n0=real().filter(x=>x.tabOf===tb.id&&(x.pg||1)===pg).length;c.tabOf=tb.id;c.pg=pg;c.x=tb.x+16;c.y=tb.y+40+((n0*34)%Math.max(40,tb.h-80));c.w=Math.min(c.w,Math.max(40,tb.w-32))}
  themeInput(c);GUI.ctl.push(c);uSel=c.id;uMulti=new Set();renderUI();snap();code()}
/* ---- recorder ---- */
function recToBlocks(txt,o){const out=[],MD={LControl:'^',RControl:'^',Control:'^',LShift:'+',RShift:'+',Shift:'+',LAlt:'!',RAlt:'!',Alt:'!',LWin:'#',RWin:'#'},held=new Map(),down=new Set();let buf='',first=true,pend=null;
  const flush=()=>{if(buf){out.push(mk('send',{k:buf}));buf=''}},esc1=c=>'+^!#{}'.includes(c)?'{'+c+'}':c;
  for(const ln of txt.split(/\r?\n/)){const p=ln.split('|');if(p.length<2)continue;const d=+p[0]||0,t=p[1],k=p[2];
    if(t!=='KU'&&t!=='U'){if(o.delay&&!first&&d>=250&&k!=='F10'){flush();let ms=Math.round(d/50)*50;if(o.cap)ms=Math.min(ms,o.cap);const l=out[out.length-1];if(l&&l.t==='wait')l.v.ms=String(+l.v.ms+ms);else out.push(mk('wait',{ms:String(ms)}))}first=false}
    if(t==='KD'){if(down.has(k))continue;down.add(k);if(MD[k]){held.set(k,MD[k]);continue}if(k==='F10')continue;
      const m=[...new Set(held.values())].join('');
      if(k==='Space'&&!m)buf+=' ';
      else if(k.length===1&&(!m||m==='+')&&/[a-z]/i.test(k))buf+=m?k.toUpperCase():k;
      else if(k.length===1&&!m)buf+=esc1(k);
      else{flush();out.push(mk('send',{k:m+(k.length===1?esc1(k):'{'+k+'}')}))}}
    else if(t==='KU'){down.delete(k);held.delete(k)}
    else if(t==='D'){flush();pend={b:k,x:+p[3],y:+p[4]}}
    else if(t==='U'){if(pend&&pend.b===k){const x=+p[3],y=+p[4];flush();
      if(Math.hypot(x-pend.x,y-pend.y)>8)out.push(mk('drag',{b:k,x1:String(pend.x),y1:String(pend.y),x2:String(x),y2:String(y)}));
      else out.push(mk('click',{b:k,x:String(pend.x),y:String(pend.y)}));pend=null}}
    else if(t==='C'){flush();out.push(mk('click',{b:k,x:p[3],y:p[4]}))}
    else if(t==='W'){flush();const l=out[out.length-1];if(l&&l.t==='scroll'&&l.v.d===k)l.v.n=String(+l.v.n+1);else out.push(mk('scroll',{d:k,n:'1'}))}}
  flush();return out}
$('#rec').onclick=()=>{if(!A)return st('Recording works in the desktop app');$('#recd').showModal()};
$('#rc-x').onclick=()=>$('#recd').close();
$('#rc-go').onclick=async()=>{$('#recd').close();const o={delay:$('#rc-d').checked,wrap:$('#rc-w').checked,cap:+$('#rc-t').value||0};const r=await A.recStart();if(r.err)return st(r.err);
  const out=recToBlocks(r.text||'',o);if(!out.length)return st('Nothing was recorded');
  let add=out;if(o.wrap){const h=mk('hotkey',{key:'F1'});h.kids=out;add=[h]}
  const pr=sel==='root'?root:(findBlock(root,sel)||{}).n||root;pr.kids.push(...add);render();st('Recorded '+out.length+' blocks')};
addEventListener('keydown',e=>{if(view!=='ui'||!uSel||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const c=real().find(x=>x.id===uSel);if(!c)return;
  const k=e.shiftKey?10:1,mv={ArrowLeft:[-k,0],ArrowRight:[k,0],ArrowUp:[0,-k],ArrowDown:[0,k]}[e.key];
  if(mv){e.preventDefault();const L=selList();new Set([...L,...L.flatMap(g=>isTab(g.t)?real().filter(k=>k.tabOf===g.id):[])]).forEach(z=>{z.x=Math.max(0,z.x+mv[0]);z.y=Math.max(0,z.y+mv[1]);const el=document.querySelector('.uc[data-id="'+z.id+'"]');if(el)elStyle(el,z)});renderProps();code()}
  else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();dupCtl()}});
addEventListener('keyup',e=>{if(view==='ui'&&/^Arrow/.test(e.key))snap()});
addEventListener('keydown',e=>{if(view!=='ui'||uPrev||!(e.ctrlKey||e.metaKey)||e.key.toLowerCase()!=='a'||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  e.preventDefault();const a=real().filter(c=>c.t!=='StatusBar');if(a.length>1){uMulti=new Set(a.map(c=>c.id));uSel=a[a.length-1].id}else{uMulti=new Set();uSel=a[0]?a[0].id:null}markSel();renderProps()});
function renderSettings(){const F=$('#sf');F.replaceChildren();
  const sec=t=>{const h=document.createElement('h3');h.textContent=t;F.append(h)};
  const row=(l,el,tip)=>{const w=document.createElement('label');w.className='srow';if(tip)w.title=tip;const sp=document.createElement('span');sp.textContent=l;w.append(el,sp);F.append(w);return el};
  const chk=(k,l,tip)=>{const i=document.createElement('input');i.type='checkbox';i.checked=!!SET[k];i.onchange=()=>{SET[k]=i.checked;code()};return row(l,i,tip)};
  const num=(k,l,tip)=>{const i=document.createElement('input');i.type='number';i.style.width='84px';i.value=SET[k]===undefined?'':SET[k];i.oninput=()=>{SET[k]=i.value===''?'':+i.value;code()};return row(l,i,tip)};
  const sel=(k,l,ops,tip)=>{const x=document.createElement('select');ops.forEach(([v,t])=>x.add(new Option(t,v)));x.value=SET[k]||'';x.onchange=()=>{SET[k]=x.value;code()};return row(l,x,tip)};
  const nm=document.createElement('input');nm.value=TABS[cur].name;nm.oninput=()=>{TABS[cur].name=nm.value.trim()||TABS[cur].name;renderTabs();code()};row('Script name',nm);
  sec('Running');chk('admin','Run as administrator','Needed to control games or apps that run as admin');chk('pers','Keep running even with no hotkeys');chk('notray','Hide the tray icon (runs completely in the background)','The script keeps working but shows no icon near the clock. Use the emergency stop hotkey or Stop all to end it.');sel('prio','Priority',[['','Normal'],['Low','Low (best next to a game)'],['BelowNormal','Below normal'],['AboveNormal','Above normal'],['High','High (faster reactions)']],'How much of the computer this script may use compared with other programs');
  sel('si','If it is already running',[['','Ask me'],['Force','Replace the old copy'],['Ignore','Ignore the new copy'],['Off','Allow several copies']]);chk('wd','Use the script’s folder as its working folder');
  sec('Hotkeys and sending');num('mt','Max threads per hotkey (2 or more lets a hotkey switch its own loop off)');sel('sm','Send mode',[['','Default'],['Input','Input (fast)'],['Event','Event (games)'],['Play','Play']]);num('kd','Key delay in ms (blank = default)');num('md','Mouse delay in ms (blank = default)');
  {const gb=document.createElement('button');gb.textContent='🎮 Use game-friendly input';gb.title='Games often ignore very fast key and mouse input. This sets Event send mode with small delays.';gb.onclick=()=>{Object.assign(SET,{sm:'Event',kd:30,md:10});renderSettings();code();st('Game-friendly input is on')};const gw=document.createElement('div');gw.className='srow';gw.append(gb);F.append(gw)}
  chk('panic','Emergency stop hotkey that quits the script');const pk=document.createElement('input');pk.size=8;pk.value=SET.pk||'';pk.oninput=()=>{SET.pk=pk.value.trim();code()};
  const kb=document.createElement('button');kb.textContent='⌨';kb.title='Press the keys you want';kb.onclick=()=>rec({v:SET},'pk','hot',pk);const pr=document.createElement('div');pr.className='srow';pr.append(pk,kb);F.append(pr);
  sec('Screen and windows');chk('cm','Mouse coordinates are relative to the screen');chk('cp','Pixel and color coordinates are relative to the screen');chk('dh','Find hidden windows');
  sec('Copy from another script');const cs=document.createElement('select');TABS.forEach((t,i)=>{if(i!==cur)cs.add(new Option(t.name,String(i)))});
  if(cs.options.length){const cb=document.createElement('button');cb.textContent='Copy its settings here';cb.onclick=()=>{Object.assign(SET,TABS[+cs.value].set||{});renderSettings();code()};const w=document.createElement('div');w.className='srow';w.append(cs,cb);F.append(w)}
  else{const p=document.createElement('p');p.className='tip';p.textContent='Open a second script to copy settings between them.';F.append(p)}}
$('#sbtn').onclick=()=>{renderSettings();$('#sset').showModal()};$('#sx').onclick=()=>$('#sset').close();$('#sr').onclick=()=>{Object.assign(SET,DS);renderSettings();code()};
