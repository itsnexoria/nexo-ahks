/* ---- generic importer: turns the generator of each block around ---- */
const GENBOX=new Set(['forarr','formap','ifnum','loopfiles','loopparse','ifkey','ifwin','ifyes','ifclip','iftext','forlist','foreach','forlines','ifexist','ifwex','ifproc','ifstarts','ifhour','ifday','ifimgv','ifcolor','ifpixn','whiletime']);
const GENSKIP=new Set(['appendv','callo','setprop','ucall','guislot','rawl','note','holdwhile','hotkey','hkpass','hkup','hotstr','abbr','remap','func','funcp','onctl','onwin','trayitem','every','after','if','while','elif','else','loop','forever','try','catch','finally','hotif','hotall']);
const _GC={};
function genTemplates(gv){if(_GC[gv])return _GC[gv];const sv=GUI;GUI=Object.assign({},sv,{v:gv});const out=[];
  try{for(const k in T){if(GENSKIP.has(k))continue;const t=T[k],fk=Object.keys(t.f);
    const opts=fk.filter(f=>t.f[f].o);let combos=[{}];
    for(const f of opts){const nx=[];combos.forEach(c=>t.f[f].o.forEach(o=>nx.push(Object.assign({},c,{[f]:o}))));combos=nx;if(combos.length>40){combos=[];break}}
    for(const fx of combos){const free=fk.filter(f=>!(f in fx)),v={};fk.forEach(f=>{v[f]=f in fx?fx[f]:'QZ'+fk.indexOf(f)+'XQ'});
      let g;try{g=String(t.gen(v))}catch(e){continue}
      if(!free.every(f=>g.includes('QZ'+fk.indexOf(f)+'XQ')))continue;
      const lines=g.split('\n').map(x=>x.trim());
      const box=!!t.box;if(box&&(t.tail||!GENBOX.has(k)||!/\{$/.test(lines[lines.length-1])))continue;
      if(!box&&lines.length<2&&GENBOX.has(k))continue;
      const segs=lines.map(ln=>{const parts=ln.split(/(QZ\d+XQ)/),o=[];let inq=false;
        for(const p of parts){const m=p.match(/^QZ(\d+)XQ$/);if(m)o.push({tok:fk[+m[1]],inq});else{o.push(p);for(let i=0;i<p.length;i++){if(p[i]==='`'){i++;continue}if(p[i]==='"')inq=!inq}}}return o});
      const lit=segs.reduce((a,l)=>a+l.reduce((b,p)=>b+(typeof p==='string'?p.length:0),0),0);
      if(lit<4)continue;
      out.push({t:k,segs,fx,box,n:lines.length,lit})}}}finally{GUI=sv}
  out.sort((a,b)=>b.n-a.n||b.lit-a.lit);return _GC[gv]=out}
const rxe=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function genFind(L,li,gv,mode){const tp=genTemplates(gv);
  for(const tpl of tp){if(mode===1?!(tpl.n>1||tpl.box):(tpl.n>1||tpl.box))continue;
    const vals={};let ok=true;
    for(let j=0;j<tpl.n&&ok;j++){const ln=(L[li+j]||'').trim();if(!ln){ok=false;break}
      const caps=[];let rs='^';
      for(const p of tpl.segs[j]){if(typeof p==='string')rs+=rxe(p);
        else if(p.tok in vals){rs+=rxe(p.inq?q(vals[p.tok]).slice(1,-1):vals[p.tok])}
        else{caps.push(p);rs+=p.inq?'((?:[^"`]|`.)*)':'(.+?)'}}
      let m;try{m=new RegExp(rs+'$').exec(ln)}catch(e){m=null}
      if(!m){ok=false;break}
      caps.forEach((p,i)=>{vals[p.tok]=p.inq?unq(m[i+1]):m[i+1].trim()})}
    if(!ok)continue;
    const v=Object.assign({},tpl.fx);for(const f in T[tpl.t].f)if(!(f in v))v[f]=(f in vals)?vals[f]:T[tpl.t].f[f].d;
    let back;const sv=GUI;try{GUI=Object.assign({},sv,{v:gv});back=String(T[tpl.t].gen(v)).split('\n').map(x=>x.trim())}catch(e){back=null}finally{GUI=sv}
    if(!back||back.length!==tpl.n||back.some((x,j)=>x!==(L[li+j]||'').trim()))continue;
    return{t:tpl.t,v,box:tpl.box,n:tpl.n}}
  return null}

/* ---- UI designer ---- */
const CT={Text:{w:120,h:22,t:'Label'},Button:{w:110,h:30,t:'Click me'},Edit:{w:200,h:26,t:''},Checkbox:{w:150,h:24,t:'Check me'},Radio:{w:150,h:24,t:'Option'},DropDownList:{w:160,h:26,t:'One|Two|Three'},ComboBox:{w:160,h:26,t:'One|Two|Three'},ListBox:{w:160,h:90,t:'One|Two|Three'},ListView:{w:280,h:120,t:'Name|Size|Date'},Slider:{w:200,h:28,t:''},Progress:{w:200,h:20,t:''},GroupBox:{w:220,h:110,t:'Group'},Tab3:{w:300,h:200,t:'General|Options'},Link:{w:240,h:22,t:'Visit <a href="https://www.autohotkey.com">AutoHotkey</a>'},Picture:{w:120,h:90,t:'logo.png'},DateTime:{w:150,h:26,t:'yyyy-MM-dd'},MonthCal:{w:230,h:170,t:''},Hotkey:{w:150,h:26,t:''},TreeView:{w:200,h:160,t:'Fruits|Vegetables|Drinks'},ActiveX:{w:360,h:240,t:'Shell.Explorer'},StatusBar:{w:0,h:22,t:'Ready'}};
const NOARG=new Set(['MonthCal']),TABT=new Set(['Tab3','Tab2','Tab']),LISTT=new Set(['DropDownList','ComboBox','ListBox','ListView','Tab3','Tab2','Tab']),DOPT={DropDownList:'Choose1',ComboBox:'Choose1',ListBox:'Choose1',Slider:'Range0-100',Progress:'Range0-100'};
const CP={TreeView:'tv',ActiveX:'wb',Text:'txt',Button:'btn',Edit:'ed',Checkbox:'chk',Radio:'rad',DropDownList:'dd',ComboBox:'cb',ListBox:'lb',ListView:'lv',Slider:'sl',Progress:'pg',GroupBox:'grp',Tab3:'tab',Link:'lnk',Picture:'pic',DateTime:'dt',MonthCal:'cal',Hotkey:'hk',StatusBar:'sb'};
const PRESET={flat:{t:'Text',opt:'+0x200 +0x100 Center Background4F7CFF cFFFFFF',w:110,h:30,text:'Click me',pre:'btn'},area:{t:'Edit',opt:'Multi VScroll',w:240,h:90,text:'',pre:'ed'},pw:{t:'Edit',opt:'Password',w:200,h:26,text:'',pre:'pw'},num:{t:'Edit',opt:'Number',w:100,h:26,text:'0',pre:'num'},line:{t:'Text',opt:'+0x10',w:200,h:2,text:'',pre:'ln'},
  title:{t:'Text',opt:'',w:260,h:32,text:'Heading',pre:'title',font:{fs:18,b:true}},sub:{t:'Text',opt:'',w:260,h:20,text:'Helper text goes here',pre:'hint',font:{fs:9,c:'808080'}},
  badge:{t:'Text',opt:'+0x200 Center Background4F7CFF cFFFFFF',w:60,h:20,text:'NEW',pre:'badge',font:{fs:8,b:true}},card:{t:'Text',opt:'+Border BackgroundF2F3F7',w:240,h:100,text:'',pre:'card'},
  okb:{t:'Text',opt:'+0x200 +0x100 Center Background2FAE78 cFFFFFF',w:110,h:30,text:'Save',pre:'ok'},dangerb:{t:'Text',opt:'+0x200 +0x100 Center BackgroundE5484D cFFFFFF',w:110,h:30,text:'Delete',pre:'del'},accb:{t:'Text',opt:'+0x200 +0x100 Center Background7B5CFF cFFFFFF',w:110,h:30,text:'Go',pre:'acc'},
  toggle:{t:'Checkbox',opt:'+0x1000',w:110,h:30,text:'Toggle',pre:'tg'},ro:{t:'Edit',opt:'ReadOnly',w:200,h:26,text:'',pre:'ro'},log:{t:'Edit',opt:'Multi ReadOnly VScroll',w:300,h:120,text:'',pre:'log',font:{face:'Consolas'}},
  vline:{t:'Text',opt:'+0x11',w:2,h:120,text:'',pre:'vl'},vslider:{t:'Slider',opt:'Vertical Range0-100',w:28,h:140,text:'',pre:'vsl'},vprog:{t:'Progress',opt:'Vertical Range0-100',w:20,h:140,text:'',pre:'vpg'},web:{t:'ActiveX',opt:'',w:360,h:240,text:'Shell.Explorer',pre:'wb',nav:'https://www.autohotkey.com'}};
const PAL=[['Text','Text'],['Button','Button'],['Flat button','Text','flat'],['Edit box','Edit'],['Text area','Edit','area'],['Password','Edit','pw'],['Number box','Edit','num'],['Checkbox','Checkbox'],['Radio','Radio'],['Dropdown','DropDownList'],['Combo box','ComboBox'],['List box','ListBox'],['List view','ListView'],['Slider','Slider'],['Progress','Progress'],['Group box','GroupBox'],['Tab','Tab3'],['Link','Link'],['Picture','Picture'],['Date picker','DateTime'],['Calendar','MonthCal'],['Hotkey box','Hotkey'],['Line','Text','line'],['Heading','Text','title'],['Helper text','Text','sub'],['Badge','Text','badge'],['Card','Text','card'],['Green button','Text','okb'],['Red button','Text','dangerb'],['Purple button','Text','accb'],['Toggle button','Checkbox','toggle'],['Read-only box','Edit','ro'],['Log box','Edit','log'],['Vertical line','Text','vline'],['Vertical slider','Slider','vslider'],['Vertical progress','Progress','vprog'],['Tree view','TreeView'],['Web view (old IE engine)','ActiveX','web'],['Status bar','StatusBar']];
const FONTS=['Segoe UI','Arial','Calibri','Cambria','Consolas','Courier New','Georgia','Impact','Lucida Console','Tahoma','Times New Roman','Trebuchet MS','Verdana','Comic Sans MS'];
const OPTS=[['+AlwaysOnTop','Always on top'],['+Resize','User can resize the window'],['-Caption','Hide the title bar'],['+ToolWindow','Small title bar (tool window)'],['-MinimizeBox','No minimize button'],['-MaximizeBox','No maximize button']];
const optHas=(g,t)=>(g.opts||'').split(/\s+/).some(x=>x.toLowerCase()===t.toLowerCase());
function optToggle(g,t,on){const b=t.slice(1).toLowerCase();const o=(g.opts||'').split(/\s+/).filter(Boolean).filter(x=>x.slice(1).toLowerCase()!==b);if(on)o.push(t);g.opts=o.join(' ');g.ctor=undefined}
const tokOn=(c,t)=>(c.opt||'').split(/\s+/).some(x=>x.replace(/^\+/,'').toLowerCase()===t.toLowerCase());
function setTok(c,t,on){c.opt=(c.opt||'').split(/\s+/).filter(Boolean).filter(x=>x.replace(/^\+/,'').toLowerCase()!==t.toLowerCase()).concat(on?[t]:[]).join(' ')}
const tokVal=(c,re)=>{for(const x of(c.opt||'').split(/\s+/)){const m=x.match(re);if(m)return m[1]}return''};
function setPre(c,pre,re,v){c.opt=(c.opt||'').split(/\s+/).filter(Boolean).filter(x=>!re.test(x)).concat(v!==''&&v!==undefined?[pre+v]:[]).join(' ')}
const evOf=c=>(c.t==='Button'||c.t==='Checkbox'||c.t==='Radio'||c.t==='Link'||(c.t==='Text'&&/0x100/.test(c.opt||'')))?'Click':c.t==='ListView'?'DoubleClick':'Change';
const ctlArg=c=>c.t==='MonthCal'||c.t==='TreeView'?undefined:(c.t==='Slider'||c.t==='Progress')?(c.val!==undefined&&c.val!==''?String(+c.val||0):undefined):LISTT.has(c.t)?ARR(c.text):q(c.text);
const fontSpec=f=>q((!f.b&&!f.i&&!f.u?'norm ':'')+'s'+(f.fs||10)+(f.b?' bold':'')+(f.i?' italic':'')+(f.u?' underline':'')+(f.c?' c'+f.c:''))+(f.face?', '+q(f.face):'');
const GF=(t,n,x,y,w,h,text,o)=>{const c=Object.assign({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),t,n,x,y,w,h,text,fn:'',evs:[],imp:0,hw:1,hh:1,opt:DOPT[t]||''},o||{});c.arg=ctlArg(c);return c};
const isTab=t=>TABT.has(t);
let uSel=null,uPrev=false,uPage={},uMulti=new Set();
try{uPrev=localStorage.getItem('ahkbprev')==='1'}catch(e){}
const ARR=t=>'['+String(t).split('|').map(q).join(', ')+']';
function norm(c){if(c.k==='line'||c.hw!==undefined)return;c.hw=c.hh=1;c.imp=0;c.evs=[];c.opt=DOPT[c.t]||(c.on?'Checked':'');c.arg=ctlArg(c)}
function fixTabOrder(g){for(let guard=0;guard<60;guard++){let mv=false;for(let i=0;i<g.ctl.length;i++){const c=g.ctl[i];if(c.k||!c.tabOf)continue;const ti=g.ctl.findIndex(x=>x.id===c.tabOf);if(ti<0){delete c.tabOf;delete c.pg}else if(ti>i){g.ctl.splice(i,1);g.ctl.splice(ti,0,c);mv=true;break}}if(!mv)break}}
function normGui(g){g.v=g.v||'myGui';if(g.top){g.opts=((g.opts||'')+' +AlwaysOnTop').trim();delete g.top}if(g.font===undefined)g.font=true;if(g.show===undefined)g.show=true;g.ctl.forEach(norm);fixTabOrder(g)}
function allFuncs(){const s=new Set();(function w(n){n.kids.forEach(b=>{if(b.off)return;if(b.t==='func'||b.t==='funcp')s.add(vn(b.v.n));if(b.t==='rawl'){String(b.v.s).split('\n').forEach(l=>{const m=l.match(/^(\w+)\(.*\)\s*(\{|=>)/)||l.match(/^\s*class\s+(\w+)/i);if(m)s.add(m[1])})}w(b)})})(root);return[...s]}
function rawAny(re){let f=false;(function w(n){n.kids.forEach(b=>{if(b.off)return;if(b.t==='rawl'&&String(b.v.s).split('\n').some(l=>re.test(l)))f=true;w(b)})})(root);return f}
function localDecl(n,s=new Set()){n.kids.forEach(b=>{if(b.t==='rawl')String(b.v.s).split('\n').forEach(l=>{const m=l.match(/^\s*(?:static|local)\s+(.+)$/i);if(m)m[1].split(',').forEach(z=>{const k=z.match(/^\s*([A-Za-z_]\w*)/);if(k)s.add(k[1])})});localDecl(b,s)});return s}
const funcNames=allFuncs;
const real=()=>GUI.ctl.filter(c=>!c.k);
const ctlNames=()=>real().filter(c=>!c.anon&&c.n).map(c=>c.n);
/* ---- rendering: Design skin and Preview skin ---- */
const PX=pt=>Math.round(pt*96/72*10)/10;
const mkE=(tag,st,txt)=>{const e=document.createElement(tag);if(st)Object.assign(e.style,st);if(txt!==undefined)e.textContent=txt;return e};
const hexOf=(o,re)=>(o.match(re)||[])[1];
const boxSize=()=>paintBox();
function setSize(){boxSize();if(GUI.showr!==undefined){const u=UQ(GUI.showr);if(u!==null)GUI.showr=q(u.replace(/\bw\d+/,'w'+GUI.w).replace(/\bh\d+/,'h'+GUI.h))}code()}
function paintTab(e,c,b,light){const pg=String(c.text).split('|'),act=Math.min(uPage[c.id]||1,pg.length),f=effFont(c),hh=Math.round(PX(f.fs)*1.9),L=(a,d)=>light?a:d;
  b.style.cssText='position:absolute;inset:0;display:block;pointer-events:none';
  b.append(mkE('div',{position:'absolute',left:0,right:0,top:hh+'px',bottom:0,border:'1px solid '+L('#d9d9d9','var(--line)'),background:L('#fff','var(--side)')}));
  const hdr=mkE('div',{position:'absolute',left:0,top:0,height:(hh+1)+'px',display:'flex',alignItems:'flex-end',pointerEvents:'auto',fontFamily:L('"'+f.face+'",sans-serif',''),fontSize:L(PX(f.fs)+'px','13px'),color:L('#000','var(--ink)')});
  pg.forEach((p,i)=>{const on=i+1===act,t=mkE('div',{padding:'0 12px',display:'flex',alignItems:'center',border:'1px solid '+L('#d9d9d9','var(--line)'),borderBottom:on?'0':'',background:on?L('#fff','var(--side)'):L('#f0f0f0','var(--raise)'),marginRight:'-1px',cursor:'pointer',position:'relative',zIndex:on?2:1,height:(on?hh+1:hh-3)+'px',whiteSpace:'nowrap'},p);
    t.onpointerdown=ev=>{ev.stopPropagation();uPage[c.id]=i+1;uMulti=new Set();uSel=c.id;refreshAll();markSel();renderProps()};hdr.append(t)});b.append(hdr)}
function refreshAll(){real().forEach(k=>{const e=document.querySelector('.uc[data-id="'+k.id+'"]');if(e)elStyle(e,k)})}
function markSel(){document.querySelectorAll('.uc').forEach(x=>x.classList.toggle('sel',x.dataset.id===uSel||uMulti.has(x.dataset.id)))}
const multi=()=>{const a=real().filter(c=>uMulti.has(c.id)&&c.t!=='StatusBar');return a.length>1?a:[]};
const selList=()=>{const m=multi();if(m.length)return m;const c=real().find(x=>x.id===uSel);return c?[c]:[]};
function alignSel(kind){const m=multi();if(m.length<2)return;const S0=new Set(m),ref=real().find(c=>c.id===uSel)||m[m.length-1];
  const L=Math.min(...m.map(c=>c.x)),R=Math.max(...m.map(c=>c.x+c.w)),Tp=Math.min(...m.map(c=>c.y)),B=Math.max(...m.map(c=>c.y+c.h));
  const put=(c,x,y)=>{x=Math.max(0,Math.round(x));y=Math.max(0,Math.round(y));const dx=x-c.x,dy=y-c.y;c.x=x;c.y=y;if(isTab(c.t))real().forEach(k=>{if(k.tabOf===c.id&&!S0.has(k)){k.x=Math.max(0,k.x+dx);k.y=Math.max(0,k.y+dy)}})};
  if(kind==='l')m.forEach(c=>put(c,L,c.y));else if(kind==='r')m.forEach(c=>put(c,R-c.w,c.y));else if(kind==='hc')m.forEach(c=>put(c,(L+R)/2-c.w/2,c.y));
  else if(kind==='t')m.forEach(c=>put(c,c.x,Tp));else if(kind==='b')m.forEach(c=>put(c,c.x,B-c.h));else if(kind==='vc')m.forEach(c=>put(c,c.x,(Tp+B)/2-c.h/2));
  else if(kind==='dh'&&m.length>2){const o=[...m].sort((a,b)=>a.x-b.x),gap=(R-L-o.reduce((a,c)=>a+c.w,0))/(o.length-1);let x=L;o.forEach(c=>{put(c,x,c.y);x+=c.w+gap})}
  else if(kind==='dv'&&m.length>2){const o=[...m].sort((a,b)=>a.y-b.y),gap=(B-Tp-o.reduce((a,c)=>a+c.h,0))/(o.length-1);let y=Tp;o.forEach(c=>{put(c,c.x,y);y+=c.h+gap})}
  else if(kind==='sw')m.forEach(c=>{c.w=ref.w;c.hw=1});else if(kind==='sh')m.forEach(c=>{c.h=ref.h;c.hh=1});
  renderUI();snap();code()}
const isHidCtl=c=>/\bHidden\b/i.test((c.opt||'')+' '+(c.optx||''));
let UI_SHOWHID=false;
function renderUI(){fixTabOrder(GUI);{const hb=$('#ui-hid'),nh=real().filter(isHidCtl).length;if(hb){hb.hidden=!nh;hb.textContent=(UI_SHOWHID?'🙈 Hide ':'👁 Show ')+nh+' hidden control'+(nh===1?'':'s');hb.onclick=()=>{UI_SHOWHID=!UI_SHOWHID;renderUI()}}$('#ui-win-box').classList.toggle('showhid',UI_SHOWHID&&!uPrev)}const b=$('#ui-win-box');paintBox();b.replaceChildren();
  real().forEach(c=>{const e=document.createElement('div');e.className='uc '+(uPrev?'pvc':'c-'+(CT[c.t]?c.t:'Other'))+(isHidCtl(c)?' uhid':'');e.dataset.id=c.id;const pv=document.createElement('span');pv.className='pv';e.append(pv);
    e.onpointerdown=ev=>{ev.stopPropagation();
      if(ev.shiftKey||ev.ctrlKey||ev.metaKey){ev.preventDefault();const w=new Set(uMulti);if(!w.size&&uSel)w.add(uSel);if(w.has(c.id))w.delete(c.id);else w.add(c.id);
        if(w.size<2){uSel=[...w][0]||null;uMulti=new Set()}else{uMulti=w;uSel=c.id}markSel();renderProps();return}
      if(!(uMulti.size>1&&uMulti.has(c.id)))uMulti=new Set();
      uSel=c.id;markSel();renderProps();dragStart(ev,c,'m',e)};
    const hd=document.createElement('i');hd.className='rs';hd.onpointerdown=ev=>{ev.stopPropagation();uMulti=new Set();uSel=c.id;markSel();dragStart(ev,c,'r',e)};e.append(hd);b.append(e);elStyle(e,c)});
  if(!real().length&&!uPrev){const em=document.createElement('div');em.className='ui-guide';em.style.cssText='position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;pointer-events:none;opacity:.6;font-size:13px';em.textContent='Your window is empty. Click a control on the left (Button, Edit box…) to add it, then drag it where you want.';b.append(em)}
  if(!uPrev)addWinHandles(b);
  b.onpointerdown=ev=>{uMulti=new Set();uSel=null;markSel();renderProps();if(uPrev)return;
    const r=b.getBoundingClientRect(),x0=ev.clientX-r.left,y0=ev.clientY-r.top;let m=null,moved=false;
    const mv=e=>{const x=e.clientX-r.left,y=e.clientY-r.top;if(!moved&&Math.abs(x-x0)+Math.abs(y-y0)<4)return;moved=true;
      if(!m){m=document.createElement('div');m.className='ui-guide';m.style.cssText='position:absolute;pointer-events:none;border:1px dashed #ff4fa3;background:rgba(255,79,163,.12);z-index:60';b.append(m)}
      const L=Math.min(x,x0),T=Math.min(y,y0),W=Math.abs(x-x0),Hh=Math.abs(y-y0);m.style.left=L+'px';m.style.top=T+'px';m.style.width=W+'px';m.style.height=Hh+'px';
      const hit=real().filter(c=>c.t!=='StatusBar'&&c.x<L+W&&c.x+c.w>L&&c.y<T+Hh&&c.y+c.h>T);
      if(hit.length>1){uMulti=new Set(hit.map(c=>c.id));uSel=hit[hit.length-1].id}else{uMulti=new Set();uSel=hit[0]?hit[0].id:null}markSel()};
    const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);if(m)m.remove();renderProps()};
    addEventListener('pointermove',mv);addEventListener('pointerup',up)};markSel();renderProps()}
function setPrev(v){uPrev=v;try{localStorage.setItem('ahkbprev',v?'1':'')}catch(e){}$('#ui-d').classList.toggle('on',!v);$('#ui-p').classList.toggle('on',v);renderUI()}
