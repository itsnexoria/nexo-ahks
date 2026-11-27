/* ---- AutoHotkey v1 -> v2 (common commands) ---- */
function looksV1(t){if(/#Requires\s+AutoHotkey\s+v?2/i.test(t))return false;return /^\s*Gosub\b\s*,?\s*[A-Za-z_]/im.test(t)||/^\s*#NoEnv|^\s*#Persistent|^\s*SetWorkingDir\b|^\s*#SingleInstance\s*,|^\s*Gui\s*,|^\s*#If(Win)?(Not)?(Active|Exist)?\b|^\s*(Send|SendInput|SendRaw|SendEvent|Sleep|MsgBox|Run|ToolTip|MouseMove|MouseClick|Click|SoundBeep|Loop|WinActivate|WinWait|WinClose)\s*,|%[A-Za-z_]\w*%/im.test(t)}
/* v1 "Gosub, Label" and "SetTimer, Label": the label's lines become a v2 function (v2 has no Gosub). */
function v1Subs(L){
  const isLabel=l=>{const m=String(l).match(/^([A-Za-z_]\w*):\s*(?:;.*)?$/);return m&&!/^(default|case)$/i.test(m[1])?m[1]:null};
  const targets=new Set();
  L.forEach(l=>{let m=String(l).match(/^\s*Gosub\b\s*,?\s*([A-Za-z_]\w*)\s*(?:;.*)?$/i);if(m)targets.add(m[1].toLowerCase());
    m=String(l).match(/^\s*SetTimer\b\s*,?\s*([A-Za-z_]\w*)\s*(?:,.*)?$/i);if(m&&!/^(on|off)$/i.test(m[1]))targets.add(m[1].toLowerCase())});
  if(!targets.size)return L;
  const depthOf=l=>{const t=String(l).replace(/"[^"]*"/g,'').replace(/;.*$/,'');return(t.match(/\{/g)||[]).length-(t.match(/\}/g)||[]).length};
  const done=new Map(),out=[];
  for(let i=0;i<L.length;i++){
    const nm=isLabel(L[i]);
    if(nm&&targets.has(nm.toLowerCase())&&!done.has(nm.toLowerCase())){
      let d=0,j=i+1,ok=false;const body=[];
      for(;j<L.length;j++){const l=String(L[j]);
        if(d===0&&/^\s*return\s*(?:;.*)?$/i.test(l)){ok=true;break}
        if(isLabel(l)||/^\S+::/.test(l)||/^\s*Goto\b/i.test(l)||/^\s*(Return|Exit)\s*,/i.test(l))break;
        d+=depthOf(l);if(d<0)break;body.push(l)}
      if(ok){
        const vars=new Set();
        body.forEach(l=>{let m=String(l).match(/^\s*([A-Za-z_]\w*)\s*(?::=|\+=|-=|\*=|\/=|\.=|=(?!=))/);if(m&&!/^(if|else|while|loop|return|A_\w*)$/i.test(m[1]))vars.add(m[1]);
          const r=/(?:^|[^\w.])([A-Za-z_]\w*)(?:\+\+|--)|(?:\+\+|--)([A-Za-z_]\w*)/g;let x;while((x=r.exec(l)))vars.add(x[1]||x[2])});
        out.push(nm+'() {');if(vars.size)out.push('  global '+[...vars].join(', '));
        body.forEach(l=>out.push('  '+l));out.push('}');done.set(nm.toLowerCase(),nm);i=j;continue}
    }
    out.push(L[i])}
  if(!done.size)return L;
  return out.map(l=>{let m=String(l).match(/^(\s*)Gosub\b\s*,?\s*([A-Za-z_]\w*)\s*(?:;.*)?$/i);
    if(m&&done.has(m[2].toLowerCase()))return m[1]+done.get(m[2].toLowerCase())+'()';
    m=String(l).match(/^(\s*)SetTimer\b\s*,?\s*([A-Za-z_]\w*)\s*(?:,\s*([^;]*?))?\s*(?:;.*)?$/i);
    if(m&&done.has(m[2].toLowerCase())){const f=done.get(m[2].toLowerCase()),a=(m[3]||'').trim();
      const per=!a?'':/^off$/i.test(a)?', 0':/^on$/i.test(a)?'':', '+a.replace(/%([A-Za-z_]\w*)%/g,'$1');
      return m[1]+'SetTimer('+f+per+')'}
    return l});
}
function v1to2(text){
  const qv=x=>{const parts=[];let last=0,m;const re=/%([A-Za-z_]\w*)%/g;const q=z=>'"'+z.replace(/`,/g,',').replace(/`%/g,'%').replace(/"/g,'`"')+'"';
    while((m=re.exec(x))){if(m.index>last)parts.push(q(x.slice(last,m.index)));parts.push(m[1]);last=m.index+m[0].length}
    if(last<x.length||!parts.length)parts.push(q(x.slice(last)));return parts.join(' ')};
  const ex=x=>x.trim().replace(/^%\s+/,'').replace(/%([A-Za-z_]\w*)%/g,'$1');
  const split=a=>{const o=[];let cur='';for(let i=0;i<a.length;i++){const c=a[i];if(c==='`'&&i+1<a.length){cur+=c+a[++i];continue}if(c===','){o.push(cur);cur='';continue}cur+=c}o.push(cur);return o.map(x=>x.trim())};
  const TB={send:['Send',['t']],sendinput:['SendInput',['t']],sendevent:['SendEvent',['t']],sendplay:['SendPlay',['t']],sendraw:['SendText',['t']],sleep:['Sleep',['e']],run:['Run',['t','t','t']],tooltip:['ToolTip',['t','e','e']],mousemove:['MouseMove',['e','e','e','t']],soundbeep:['SoundBeep',['e','e']],
    winactivate:['WinActivate',['t']],winclose:['WinClose',['t']],winwait:['WinWait',['t']],winwaitactive:['WinWaitActive',['t']],winminimize:['WinMinimize',['t']],winmaximize:['WinMaximize',['t']],winrestore:['WinRestore',['t']],blockinput:['BlockInput',['t']],clipwait:['ClipWait',['e']],mouseclick:['MouseClick',['t','e','e','e','e','t','t']]};
  const conv=(ind,name,rest)=>{const k=name.toLowerCase();
    if(k==='msgbox'){const a=split(rest);if(a.length>=3&&/^\d+$/.test(a[0]))return ind+'MsgBox '+qv(a.slice(2).join(', '))+', '+qv(a[1])+', '+a[0];return ind+'MsgBox '+qv(rest.trim())}
    if(k==='click'){const a=split(rest).filter(Boolean);if(!a.length)return ind+'Click';return ind+'Click '+qv(a.join(' '))}
    if(k==='loop'){if(/^(parse|read|files|reg)\b/i.test(rest.trim()))return null;return ind+'Loop'+(rest.trim()?' '+ex(rest):'')}
    const d=TB[k];if(!d)return null;const a=split(rest);const out=a.map((x,i)=>x===''?'':(d[1][i]==='e'?ex(x):qv(x)));while(out.length&&out[out.length-1]==='')out.pop();
    return ind+d[0]+(out.length?' '+out.join(', '):'')};
  /* old-style windows: Gui, Add, ... + label subroutines  ->  myGui := Gui() ... + functions */
  const v1Gui=L0=>{
    if(!L0.some(x=>/^\s*Gui\s*,/i.test(x)))return L0;
    const G='myGui',out=[],vnames=[],vtext=new Set();let made=false,ctr=0;const TYPE={ddl:'DropDownList',pic:'Picture'},refd=new Set();
    const splitN=(t,n)=>{const o=[];let cur='';for(let i=0;i<t.length;i++){const c=t[i];if(c==='`'&&i+1<t.length){cur+=c+t[++i];continue}if(c===','&&o.length<n-1){o.push(cur.trim());cur='';continue}cur+=c}o.push(cur.trim());return o};
    const ev=ty=>/^(Button|Checkbox|Radio|Text|Link|Picture|GroupBox)$/.test(ty)?'Click':ty==='ListView'?'DoubleClick':'Change';
    const Q=z=>'"'+String(z).replace(/"/g,'`"')+'"';
    const hasLabel=n=>L0.some(x=>new RegExp('^\\s*'+n+':\\s*$','i').test(x));
    const ensure=()=>{if(!made){out.push(G+' := Gui()');made=true}};
    L0.forEach(x=>{const m=x.match(/^\s*Gui\s*,\s*(?:\d+:)?Add\s*,.*?(?:^|\s)g(\w+)/i);if(m)refd.add(m[1])});
    ['GuiClose','GuiEscape'].forEach(n=>{if(hasLabel(n))refd.add(n)});
    const val=x=>/^%\s+/.test(x)?ex(x):qv(x);
    for(const raw of L0){
      const ind=(raw.match(/^\s*/)||[''])[0];let m;
      if((m=raw.match(/^\s*Gui\s*,\s*(?:\d+:)?([+\-]\S.*)$/i))){ensure();out.push(ind+G+'.Opt('+Q(m[1].trim())+')');continue}
      if((m=raw.match(/^\s*Gui\s*,\s*(?:\d+:)?(\w+)\s*(?:,\s*(.*))?$/i))){
        const cmd=m[1].toLowerCase(),args=(m[2]||'').replace(/\s+;.*$/,'');
        if(cmd==='add'){ensure();const a=splitN(args,3),ty=TYPE[(a[0]||'').toLowerCase()]||a[0];let opts=a[1]||'',lab=null,txt=a[2]||'';
          opts=opts.replace(/(^|\s)g(\w+)/,(z,sp,l)=>{lab=l;return sp});opts.replace(/(^|\s)v(\w+)/,(z,sp,v)=>{vnames.push(v);if(/^(DropDownList|ComboBox|ListBox|Tab3|Tab2|Tab)$/.test(ty)&&!/AltSubmit/i.test(opts))vtext.add(v);return z});
          let targ='';
          if(/^(DropDownList|ComboBox|ListBox|ListView|Tab3|Tab2|Tab)$/.test(ty)&&txt){const parts=txt.split('|'),items=[];let ch=0;parts.forEach(pt=>{if(pt===''&&items.length&&!ch)ch=items.length;else if(pt!=='')items.push(pt)});if(ch&&!/Choose/i.test(opts))opts=(opts+' Choose'+ch).trim();targ=', ['+items.map(qv).join(', ')+']'}
          else if(txt)targ=', '+qv(txt);
          const call=G+'.Add('+Q(ty)+', '+Q(opts.trim())+targ+')';
          if(lab){const nm='ctl'+(++ctr);out.push(ind+nm+' := '+call,ind+nm+'.OnEvent('+Q(ev(ty))+', '+lab+')')}else out.push(ind+call);continue}
        if(cmd==='new'){const a=splitN(args,2);out.push(ind+G+' := Gui('+(a[0]||a[1]?Q(a[0]||'')+(a[1]?', '+qv(a[1]):''):'')+')');made=true;continue}
        if(cmd==='font'){ensure();const a=splitN(args,2);out.push(ind+G+'.SetFont('+Q(a[0]||'')+(a[1]?', '+Q(a[1]):'')+')');continue}
        if(cmd==='color'){ensure();const a=splitN(args,2);out.push(ind+G+'.BackColor := '+Q(a[0]||'White'));continue}
        if(cmd==='show'){ensure();const a=splitN(args,2);if(a[1])out.push(ind+G+'.Title := '+qv(a[1]));if(hasLabel('GuiClose')&&!made.cl){out.push(ind+G+'.OnEvent("Close", GuiClose)');made.cl=1}if(hasLabel('GuiEscape')&&!made.es){out.push(ind+G+'.OnEvent("Escape", GuiEscape)');made.es=1}out.push(ind+G+'.Show('+(a[0]?Q(a[0]):'')+')');continue}
        if(cmd==='submit'){ensure();out.push(ind+'Nexo_s := '+G+'.Submit('+(/nohide/i.test(args)?'0':'')+')');[...new Set(vnames)].forEach(v=>out.push(ind+v+' := '+(vtext.has(v)?G+'['+Q(v)+'].Text':'Nexo_s.'+v)));continue}
        if(cmd==='destroy'){out.push(ind+G+'.Destroy()');continue}
        if(cmd==='cancel'||cmd==='hide'){out.push(ind+G+'.Hide()');continue}
        if(cmd==='minimize'||cmd==='maximize'||cmd==='restore'){out.push(ind+G+'.'+cmd[0].toUpperCase()+cmd.slice(1)+'()');continue}
      }
      if((m=raw.match(/^\s*GuiControl\s*,\s*,\s*(\w+)\s*,\s*(.*)$/i))){out.push(ind+G+'['+Q(m[1])+'].Value := '+val(m[2].replace(/\s+;.*$/,'').trim()));continue}
      if((m=raw.match(/^\s*GuiControl\s*,\s*(Enable|Disable|Show|Hide|Focus)\s*,\s*(\w+)\s*$/i))){const c=m[1].toLowerCase(),t=G+'['+Q(m[2])+']';out.push(ind+(c==='enable'?t+'.Enabled := true':c==='disable'?t+'.Enabled := false':c==='show'?t+'.Visible := true':c==='hide'?t+'.Visible := false':t+'.Focus()'));continue}
      if((m=raw.match(/^\s*GuiControlGet\s*,\s*(\w+)\s*,\s*,\s*(\w+)\s*$/i))){out.push(ind+m[1]+' := '+G+'['+Q(m[2])+'].Value');continue}
      out.push(raw)}
    const o2=[];let open=null;
    for(const raw of out){const t=raw.trim(),lm=t.match(/^(\w+):\s*$/);
      if(lm&&refd.has(lm[1])){if(open)o2.push('}');o2.push(lm[1]+'(*) {');open=lm[1];continue}
      if(open&&/^return\s*$/i.test(t)){o2.push('}');open=null;continue}
      if(open&&lm&&!refd.has(lm[1])){o2.push('}');open=null}
      o2.push(raw)}
    if(open)o2.push('}');return o2};
  const lines=v1Subs(v1Gui(String(text).split(/\r?\n/))),out=['#Requires AutoHotkey v2.0'];let inHK=false,todo=0;
  const closeHK=()=>{if(inHK){out.push('}');inHK=false}};
  for(let raw of lines){const ln=raw,t=ln.trim();let m;
    if(/^#(NoEnv|Persistent|KeyHistory)\b/i.test(t)||/^(SendMode|SetBatchLines|SetWorkingDir|ListLines|SetTitleMatchMode\s*,?\s*(fast|slow))\b/i.test(t)||/^#Requires/i.test(t))continue;
    if((m=t.match(/^#SingleInstance\s*,?\s*(\w*)/i))){out.push('#SingleInstance '+(m[1]?m[1][0].toUpperCase()+m[1].slice(1).toLowerCase():'Force'));continue}
    if((m=t.match(/^#If(Win)(Not)?(Active|Exist)\s*,?\s*(.*)$/i))){closeHK();out.push(m[4]?'#HotIf '+(m[2]?'!':'')+'Win'+m[3]+'('+qv(m[4])+')':'#HotIf');continue}
    if((m=t.match(/^(\S+?)::\s*$/))&&!/^:/.test(t)){closeHK();out.push(m[1]+'::{');inHK=true;continue}
    if(inHK&&/^return\s*$/i.test(t)){closeHK();continue}
    if((m=ln.match(/^(\s*)If(Not)?(WinActive|WinExist)\s*,\s*(.*)$/i))){const a=split(m[4].replace(/\s+;.*$/,''));out.push(m[1]+'if '+(m[2]?'!':'')+'Win'+(/active/i.test(m[3])?'Active':'Exist')+'('+qv(a[0])+(a[1]?', '+qv(a[1]):'')+')');continue}
    if((m=ln.match(/^(\s*)If(Not)?Exist\s*,\s*(.*)$/i))){out.push(m[1]+'if '+(m[2]?'!':'')+'FileExist('+qv(m[3].replace(/\s+;.*$/,'').trim())+')');continue}
    if((m=ln.match(/^(\s*)If(Not)?InString\s*,\s*([A-Za-z_]\w*)\s*,\s*(.*)$/i))){out.push(m[1]+'if '+(m[2]?'!':'')+'InStr('+m[3]+', '+qv(m[4].replace(/\s+;.*$/,'').trim())+')');continue}
    if((m=ln.match(/^(\s*)If(Not)?Equal\s*,\s*([A-Za-z_]\w*)\s*,\s*(.*)$/i))){const val=m[4].replace(/\s+;.*$/,'').trim();out.push(m[1]+'if ('+m[3]+(m[2]?' != ':' = ')+(/^-?\d+(\.\d+)?$/.test(val)?val:qv(val))+')');continue}
    if((m=t.match(/^(\S+?::)\s*(\w+)\s*,\s*(.*)$/))&&!/^:/.test(t)){const c=conv('',m[2],m[3]);if(c){out.push(m[1]+c);continue}}
    if((m=ln.match(/^(\s*)(\w+)\s*(?:,\s*|\s+|$)(.*)$/))&&(TB[m[2].toLowerCase()]||/^(msgbox|click|loop)$/i.test(m[2]))&&!/^\s*:?=/.test(m[3])&&!/^\w+\s*[:+\-*\/.|&^]?=/.test(m[2]+' '+m[3])){const c=conv(m[1],m[2],m[3].replace(/\s+;.*$/,'').replace(/\s*\{\s*$/,''));if(c){out.push(c+(/\{\s*$/.test(m[3])?' {':''));continue}}
    if((m=ln.match(/^(\s*)([A-Za-z_]\w*)\s*=\s*(.*)$/))&&!/^(if|while|else|loop)$/i.test(m[2])){out.push(m[1]+m[2]+' := '+(/^-?\d+(\.\d+)?$/.test(m[3].trim())?m[3].trim():qv(m[3].trim())));continue}
    if(/^\s*return\s*$/i.test(ln)){out.push(ln.replace(/return/i,'return'));continue}
    out.push(ln.replace(/^(\s*)(Loop)\s*,\s*/i,'$1$2 '));
    if(/^\s*\w+\s*,/.test(ln)||/^\s*\w+:\s*$/.test(ln)||/^\s*(StringReplace|StringLeft|StringRight|IfEqual|IfNotEqual|IfInString|Gosub|Goto|SetTimer\s*,)/i.test(ln))todo++}
  closeHK();return{text:out.join('\n'),todo}}

function openText(name,text,file){text=String(text).replace(/^\ufeff/,'');
  if(/\.ahkb$/i.test(name)){try{const o=JSON.parse(text);o.kids=o.kids||[];fix(o);newTab(o.name||name.replace(/\.ahkb$/i,''),o.kids,{gui:o.gui,proj:file,set:o.set?Object.assign({},DS,o.set):undefined});return st('Opened '+name)}catch(e){return st('Not a valid project file')}}
  const it=importItem(name.replace(/\.ahk$/i,''),text,file);openItem(it);const r=it._r;
  st('Imported '+r.n+' blocks'+(r.gui?' and a UI':'')+(r.v1?' · converted from AutoHotkey v1'+(r.v1.todo?' ('+r.v1.todo+' line'+(r.v1.todo>1?'s':'')+' need a look)':''):'')+(r.rawN?' · '+r.rawN+' raw lines':''))}
addEventListener('dragover',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files'))e.preventDefault()});
addEventListener('drop',async e=>{const fl=[...(e.dataTransfer?e.dataTransfer.files:[])];if(!fl.length)return;e.preventDefault();for(const f of fl)if(/\.(ahk|ahkb)$/i.test(f.name))openText(f.name,await f.text(),safePath(f))});
async function pickC(b){if(!A)return st('Picking works in the desktop app');st('Move the mouse over the color, then press F8 (Esc cancels)');const r=await A.pick();if(!r)return st('Pick cancelled');b.v.c=r.c;render();st('Picked '+r.c)}
$('#help').onclick=()=>{$('#hlp').showModal();renderTools()};$('#hc').onclick=()=>$('#hlp').close();
pal();
(async function(){let d=null;
  try{d=A?await A.libLoad():JSON.parse(localStorage.getItem('ahkblib'))}catch(e){}
  if(!d||!d.lib){let o=null;try{o=JSON.parse(localStorage.getItem('ahkbtabs'))}catch(e){}
    if(o&&o.tabs&&o.tabs.length){LIB=o.tabs.map(t=>({id:uid(),name:t.name||'Script',kids:t.kids||[],gui:t.gui||newGui(),file:t.file,proj:t.proj,set:t.set,created:Date.now(),edited:Date.now(),runs:0}));LIB.forEach(t=>{fix(t);if(!t.set)t.set=migrate()});TABS=LIB.slice();load(Math.min(o.cur||0,TABS.length-1))}}
  else{LIB=d.lib.map(t=>Object.assign({runs:0},t));LIB.forEach(t=>{fix(t);if(!t.gui)t.gui=newGui();normGui(t.gui);t.set=Object.assign({},DS,t.set||{})});
    TABS=(d.open||[]).map(id=>LIB.find(x=>x.id===id)).filter(Boolean);if(TABS.length)load(Math.max(0,TABS.findIndex(t=>t.id===d.cur)));else cur=-1}
  if(!TABS.length)cur=-1;
  if(A){try{RUN=new Set(await A.running()||[]);const pf=await A.getPrefs();$('#hm-tray').checked=!!pf.closeToTray;$('#hm-keep').checked=!!pf.keepRunning}catch(e){}}
  renderTabs();setView('home');saveLibSoon();
  try{if(!localStorage.getItem('nexoTutSeen')&&!LIB.length)setTimeout(startTutorial,700)}catch(e){}})();
/* ---- Try it: runs the generated script in the simulator (renderer/sim.js) and shows the window ---- */
let LIVE=null;
function ensureLive(){let d=document.getElementById('live');if(d)return d;d=document.createElement('div');d.id='live';d.className='live';d.hidden=true;
  d.innerHTML='<div class="lv-card"><div class="lv-h"><b>🧪 Try it</b><span class="lv-note">Runs your script here with a pretend keyboard, mouse and files. Nothing is really sent, clicked or changed.</span><label>Yes/No boxes answer <select id="lv-ans"><option>Yes</option><option>No</option></select></label><label>Text boxes answer <input type="text" id="lv-in" placeholder="(default)"></label><button id="lv-re" title="Run the script again from the start">↻ Restart</button><button id="lv-x" title="Close">×</button></div>'
   +'<div class="lv-b"><div class="lv-stage" id="lv-stage"><div id="lv-win" class="lv-win" hidden><div class="lv-tb"><span id="lv-title"></span><button id="lv-close" title="Close the window (runs its Close handler)">×</button></div><div id="lv-cl" class="lv-cl"></div></div>'
   +'<div id="lv-nogui" class="lv-empty">No window yet. This script has no window showing, so use the <b>Hotkeys</b> tab to press its hotkeys and watch the <b>Log</b>.</div>'
   +'<div class="lv-size" id="lv-size" hidden>Window width <input type="range" id="lv-w" min="160" max="1600"><span id="lv-wv"></span> height <input type="range" id="lv-hh" min="100" max="1200"><span id="lv-hv"></span> <span>(drag to test how it resizes)</span></div><div id="lv-msgs"></div><div id="lv-tip" hidden></div></div>'
   +'<div class="lv-side"><div class="lv-tabs"><button data-t="lv-log" class="on">Log</button><button data-t="lv-vars">Variables</button><button data-t="lv-hk">Hotkeys</button></div><div id="lv-log"></div><div id="lv-vars" hidden></div><div id="lv-hk" hidden></div></div></div></div>';
  document.body.append(d);
  d.querySelector('#lv-x').onclick=liveClose;d.querySelector('#lv-re').onclick=liveOpen;
  d.addEventListener('pointerdown',e=>{if(e.target===d)liveClose()});
  d.querySelector('#lv-ans').onchange=e=>{if(LIVE)LIVE.sim.answer=e.target.value};d.querySelector('#lv-in').oninput=e=>{if(LIVE)LIVE.sim.inputAnswer=e.target.value||undefined};
  d.querySelectorAll('.lv-tabs button').forEach(b=>b.onclick=()=>{d.querySelectorAll('.lv-tabs button').forEach(x=>x.classList.toggle('on',x===b));['lv-log','lv-vars','lv-hk'].forEach(i=>d.querySelector('#'+i).hidden=i!==b.dataset.t);liveSync()});
  d.querySelector('#lv-close').onclick=()=>{if(LIVE&&LIVE.gui)LIVE.sim.fireGui(LIVE.gui,'Close')};
  const rs=()=>{if(LIVE&&LIVE.gui)LIVE.sim.resize(LIVE.gui,+d.querySelector('#lv-w').value,+d.querySelector('#lv-hh').value)};d.querySelector('#lv-w').oninput=rs;d.querySelector('#lv-hh').oninput=rs;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!d.hidden&&!document.getElementById('bmenu'))liveClose()});
  return d}
function liveStop(){if(LIVE&&LIVE.tick)clearInterval(LIVE.tick);LIVE=null}
function liveClose(){liveStop();const d=document.getElementById('live');if(d)d.hidden=true}
function liveLine(e){const lg=document.getElementById('lv-log');if(!lg)return;const ic={msg:'💬',tip:'💡',send:'⌨',click:'🖱',do:'⚙',warn:'⚠',err:'⛔',info:'ℹ'}[e.k]||'•';const r=document.createElement('div');r.className=e.k;r.textContent=ic+' '+e.text;lg.append(r);while(lg.children.length>400)lg.firstChild.remove();lg.scrollTop=lg.scrollHeight}
function liveMsg(m){const box=document.getElementById('lv-msgs');if(!box)return;const c=document.createElement('div');c.className='lv-msg';const t=document.createElement('b');t.textContent=m.title;const x=document.createElement('div');x.textContent=m.text;const b=document.createElement('button');b.textContent='OK';b.onclick=()=>c.remove();c.append(t,x,b);box.append(c);while(box.children.length>4)box.firstChild.remove()}
function liveTip(t){const e=document.getElementById('lv-tip');if(!e)return;e.textContent=t;e.hidden=!t}
function lvFont(opts,name){let css='';const o=String(opts||'');let m;if((m=/(?:^|\s)s(\d+(?:\.\d+)?)/.exec(o)))css+='font-size:'+(+m[1]*96/72).toFixed(1)+'px;';if(/\bbold\b/i.test(o))css+='font-weight:700;';if(/\bitalic\b/i.test(o))css+='font-style:italic;';if(/\bunderline\b/i.test(o))css+='text-decoration:underline;';if((m=/(?:^|\s)c([0-9a-f]{6}|[a-z]+)/i.exec(o)))css+='color:'+(/^[0-9a-f]{6}$/i.test(m[1])?'#'+m[1]:m[1])+';';if(name)css+='font-family:"'+String(name).replace(/"/g,'')+'",Segoe UI,system-ui,sans-serif;';return css}
function mkWidget(c){
  const sim=LIVE.sim,el=document.createElement('div');el.className='lv-c lv-'+c.type.toLowerCase();let last='';
  const place=()=>{const st=el.style;st.left=c.x+'px';st.top=c.y+'px';st.width=c.w+'px';st.height=c.h+'px';st.display=c.visible?'':'none';el.classList.toggle('dis',!c.enabled);const f=lvFont(c.fontOpts,c.fontName);if(f!==last){last=f;st.cssText+=f}};
  const same=(a,b)=>String(a)===String(b);
  const mkI=(tag,type)=>{const i=document.createElement(tag);if(type)i.type=type;return i};
  let o;
  switch(c.type){
    case 'Button':{const b=mkI('button');b.onclick=()=>sim.fire(c,'Click');el.append(b);o=()=>{b.textContent=c.text;b.disabled=!c.enabled};break}
    case 'Text':{el.style.whiteSpace='pre-wrap';o=()=>{el.textContent=c.text;el.style.textAlign=/Center/i.test(c.opts)?'center':/Right/i.test(c.opts)?'right':''}; break}
    case 'Edit':{const i=c.multi||c.h>40?mkI('textarea'):mkI('input',c.password?'password':'text');i.oninput=()=>{c.value=c.text=i.value;sim.fire(c,'Change')};el.append(i);o=()=>{if(!same(i.value,c.value))i.value=c.value;i.readOnly=!!c.readonly}; break}
    case 'Checkbox':case 'Radio':{const l=mkI('label'),i=mkI('input',c.type==='Radio'?'radio':'checkbox'),sp=mkI('span');i.onchange=()=>{c.value=i.checked?1:0;if(c.type==='Radio'&&c.value)sim.radioClear(c);sim.fire(c,'Click')};l.append(i,sp);el.append(l);o=()=>{i.checked=c.value===1;i.indeterminate=c.value===-1;sp.textContent=c.text};break}
    case 'DropDownList':case 'ListBox':case 'ComboBox':{
      if(c.type==='ComboBox'){const dl=mkI('datalist');dl.id='lvdl'+c.id;const i=mkI('input','text');i.setAttribute('list',dl.id);i.oninput=()=>{c.text=i.value;const k=c.items.findIndex(x=>x.toLowerCase()===i.value.toLowerCase());c.value=k+1;sim.fire(c,'Change')};el.append(i,dl);let sg='';o=()=>{const g=JSON.stringify(c.items);if(g!==sg){sg=g;dl.replaceChildren(...c.items.map(t=>{const x=mkI('option');x.value=t;return x}))}if(!same(i.value,c.text))i.value=c.text};break}
      const sel=mkI('select');if(c.type==='ListBox')sel.size=Math.max(2,Math.floor(c.h/18));sel.onchange=()=>{c.value=sel.selectedIndex-(c.type==='DropDownList'?0:0);if(c.type==='ListBox')c.value=sel.selectedIndex+1;c.text=c.items[c.value-1]||'';sim.fire(c,'Change')};sel.ondblclick=()=>sim.fire(c,'DoubleClick');el.append(sel);let sg='';
      o=()=>{const g=JSON.stringify(c.items);if(g!==sg){sg=g;const opts=c.items.map(t=>{const x=mkI('option');x.textContent=t;return x});if(c.type==='DropDownList'){const b=mkI('option');b.textContent='';opts.unshift(b)}sel.replaceChildren(...opts)}sel.selectedIndex=c.type==='DropDownList'?c.value:c.value-1};break}
    case 'ListView':{el.append(mkI('table'));let sg='';o=()=>{const g=JSON.stringify([c.cols,c.rows,c.sel]);if(g===sg)return;sg=g;const t=el.firstChild;t.replaceChildren();const h=mkI('tr');c.cols.forEach(x=>{const th=mkI('th');th.textContent=x;h.append(th)});t.append(h);c.rows.forEach((r,ri)=>{const tr=mkI('tr');if(c.sel===ri+1)tr.className='sel';r.forEach(x=>{const td=mkI('td');td.textContent=x;tr.append(td)});tr.onclick=()=>{c.sel=ri+1;c.value=ri+1;sim.fire(c,'ItemSelect',ri+1)};tr.ondblclick=()=>sim.fire(c,'DoubleClick',ri+1);t.append(tr)})};break}
    case 'TreeView':{const u=mkI('ul');el.append(u);o=()=>{u.replaceChildren(...c.rows.map(t=>{const li=mkI('li');li.textContent='▸ '+t;return li}))};break}
    case 'Slider':{const i=mkI('input','range');i.min=c.min;i.max=c.max;i.oninput=()=>{c.value=+i.value;sim.fire(c,'Change')};el.append(i);o=()=>{i.min=c.min;i.max=c.max;if(!same(i.value,c.value))i.value=c.value};break}
    case 'Progress':{const p=mkI('progress');el.append(p);o=()=>{p.max=c.max-c.min||100;p.value=c.value-c.min};break}
    case 'GroupBox':{const sp=mkI('span');el.append(sp);o=()=>{sp.textContent=c.text};break}
    case 'Tab3':case 'Tab2':case 'Tab':{const d=mkI('div');el.append(d);let sg='';o=()=>{const g=JSON.stringify([c.items,c.value]);if(g===sg)return;sg=g;d.replaceChildren(...c.items.map((t,i)=>{const b=mkI('button');b.textContent=t;b.className=c.value===i+1?'on':'';b.onclick=()=>{c.value=i+1;c.text=t;sim.fire(c,'Change')};return b}))};break}
    case 'Link':{o=()=>{el.replaceChildren();String(c.text).split(/(<a\b[^>]*>.*?<\/a>)/i).forEach(part=>{const m=/^<a\b[^>]*>(.*?)<\/a>$/i.exec(part);if(m){const a=mkI('a');a.textContent=m[1];a.onclick=()=>sim.fire(c,'Click');el.append(a)}else if(part)el.append(document.createTextNode(part.replace(/<[^>]+>/g,'')))})};break}
    case 'DateTime':{const i=mkI('input','date');i.onchange=()=>{c.value=i.value.replace(/-/g,'')+'000000';sim.fire(c,'Change')};el.append(i);o=()=>{};break}
    case 'Hotkey':{const i=mkI('input','text');i.readOnly=true;i.placeholder='None';i.onkeydown=e=>{e.preventDefault();c.value=c.text=e.key;i.value=e.key;sim.fire(c,'Change')};el.append(i);o=()=>{};break}
    case 'StatusBar':{o=()=>{el.textContent=c.text};break}
    case 'Picture':{o=()=>{el.textContent='🖼 '+(String(c.text).split(/[\\/]/).pop()||'picture')};break}
    case 'MonthCal':{o=()=>{el.textContent='📅 calendar'};break}
    case 'ActiveX':{o=()=>{el.textContent='🌐 '+(c.text||'embedded control')};break}
    default:{o=()=>{el.textContent=c.text}}
  }
  return {el,sync(){place();o()}};
}
function liveSync(){
  if(!LIVE)return;const sim=LIVE.sim,d=document.getElementById('live');if(!d)return;
  const g=(!sim.exited&&sim.guis.find(x=>x.visible&&!x.destroyed&&x.shown))||null;
  const win=d.querySelector('#lv-win'),cl=d.querySelector('#lv-cl');
  if(LIVE.gui!==g){cl.replaceChildren();LIVE.els.clear();LIVE.gui=g}
  const ng=d.querySelector('#lv-nogui');ng.hidden=!!g;ng.innerHTML=sim.exited?'The script has exited (ExitApp), so its window is gone. Press <b>↻ Restart</b> to run it again.':'No window yet. This script has no window showing, so use the <b>Hotkeys</b> tab to press its hotkeys and watch the <b>Log</b>.';win.hidden=!g;d.querySelector('#lv-size').hidden=!g;
  if(g){
    d.querySelector('#lv-title').textContent=g.title;cl.style.width=g.w+'px';cl.style.height=g.h+'px';cl.style.background=g.back?(/^[0-9a-f]{6}$/i.test(g.back)?'#'+g.back:g.back):'';cl.style.cssText+=lvFont(g.font.opts,g.font.name);
    const alive=new Set();g.ctls.forEach(c=>{let w=LIVE.els.get(c);if(!w){w=mkWidget(c);LIVE.els.set(c,w);cl.append(w.el)}alive.add(c);w.sync()});
    for(const [c,w] of [...LIVE.els])if(!alive.has(c)){w.el.remove();LIVE.els.delete(c)}
    const W=d.querySelector('#lv-w'),H=d.querySelector('#lv-hh');if(document.activeElement!==W)W.value=g.w;if(document.activeElement!==H)H.value=g.h;d.querySelector('#lv-wv').textContent=g.w;d.querySelector('#lv-hv').textContent=g.h}
  const vb=d.querySelector('#lv-vars');if(!vb.hidden){vb.replaceChildren(...sim.vars().map(([k,v])=>{const r=document.createElement('div'),a=document.createElement('span'),b=document.createElement('i');a.textContent=k;b.textContent=v;r.append(a,b);return r}));if(!vb.children.length)vb.textContent='No variables yet.'}
  const hb=d.querySelector('#lv-hk');if(!hb.hidden){const sg=sim.hotkeys.length+'/'+sim.hotstrings.length+'/'+sim.exited;if(hb.dataset.sg!==sg){hb.dataset.sg=sg;hb.replaceChildren();
    if(sim.hotkeys.length){const h=document.createElement('h4');h.textContent='Press a hotkey (click it)';hb.append(h);sim.hotkeys.forEach((k,i)=>{const b=document.createElement('button');b.textContent=k.key;b.title=k.fn?'Set with Hotkey()':'Runs the hotkey’s code';b.onclick=()=>sim.runHotkey(i);hb.append(b)})}
    if(sim.hotstrings.length){const h=document.createElement('h4');h.textContent='Type an abbreviation (click it)';hb.append(h);sim.hotstrings.forEach((k,i)=>{const b=document.createElement('button');b.textContent=k.abbr;b.onclick=()=>sim.runHotstring(i);hb.append(b)})}
    if(!sim.hotkeys.length&&!sim.hotstrings.length)hb.textContent='This script has no hotkeys.'}}
}
function liveOpen(){
  if(typeof Sim==='undefined')return st('Try it is not available in this build');
  if(!TABS.length||view==='home')return st('Open or make a script first');
  liveStop();const d=ensureLive();d.hidden=false;
  d.querySelector('#lv-log').replaceChildren();d.querySelector('#lv-msgs').replaceChildren();d.querySelector('#lv-cl').replaceChildren();d.querySelector('#lv-tip').hidden=true;
  const code=build();
  const sim=Sim.create(code,{changed:()=>liveSync(),log:liveLine,msgbox:liveMsg,tip:liveTip});
  LIVE={sim,els:new Map(),gui:null,tick:null,last:Date.now(),code};
  if(sim.error){liveLine({k:'err',text:'The simulator could not read this script: '+sim.error});liveSync();return}
  sim.answer=d.querySelector('#lv-ans').value;sim.inputAnswer=d.querySelector('#lv-in').value||undefined;
  sim.run();liveSync();
  LIVE.tick=setInterval(()=>{if(!LIVE)return;const n=Date.now(),dt=Math.min(1000,n-LIVE.last);LIVE.last=n;if(LIVE.sim.timers.length&&!LIVE.sim.exited)LIVE.sim.advance(dt)},100);
}
$('#ui-l').onclick=liveOpen;
/* ---- Compile dialog: name, version, company, icon, run as administrator ---- */
function compileDlg(){
  if(!A)return st('Compile works in the desktop app');
  if(!TABS.length||view==='home')return st('Open or make a script first');
  let sv={};try{sv=JSON.parse(localStorage.getItem('nexoCompile'))||{}}catch(e){}
  let dl=document.getElementById('cdlg');
  if(!dl){dl=document.createElement('dialog');dl.id='cdlg';dl.style.cssText='border:1px solid var(--line,#3a4160);border-radius:14px;padding:18px;background:var(--side,#171a24);color:var(--ink,#eef0ff);min-width:380px;max-width:460px';
    dl.innerHTML='<h3 style="margin:0 0 4px">Compile to EXE</h3><p class="tip" style="margin:0 0 6px">Makes a program that runs on any Windows PC, even without AutoHotkey.</p>'
     +'<label>Program name<input type="text" id="cd-name"></label><label>Version (like 1.0.0.0)<input type="text" id="cd-ver"></label><label>Company<input type="text" id="cd-co"></label><label>Description<input type="text" id="cd-desc"></label><label>Copyright<input type="text" id="cd-cp"></label>'
     +'<div class="cr"><label style="margin:0"><input type="checkbox" id="cd-nx"> Use the Nexo Ahks icon</label></div><div class="cr"><button id="cd-ic" title="Pick your own .ico file">📁 Choose icon…</button><span id="cd-icn" class="tip" style="margin:0"></span></div>'
     +'<div class="cr"><label style="margin:0"><input type="checkbox" id="cd-ad"> Always run as administrator</label></div>'
     +'<div class="cr" style="justify-content:flex-end;margin-top:14px"><button id="cd-x">Cancel</button><button class="pri" id="cd-ok">Compile…</button></div>';
    document.body.append(dl);
    dl.querySelector('#cd-x').onclick=()=>dl.close();
    dl.querySelector('#cd-ic').onclick=async()=>{const f=A.pickFile?await A.pickFile({filters:[{name:'Icon',extensions:['ico']}]}):null;if(f){dl.dataset.icon=f;dl.querySelector('#cd-nx').checked=false;dl.querySelector('#cd-icn').textContent=String(f).split(/[\\/]/).pop()}};
    dl.querySelector('#cd-nx').onchange=e=>{if(e.target.checked){dl.dataset.icon='';dl.querySelector('#cd-icn').textContent=''}};
    dl.querySelector('#cd-ok').onclick=async()=>{const q=i=>dl.querySelector(i),o={name:q('#cd-name').value.trim(),version:q('#cd-ver').value.trim(),company:q('#cd-co').value.trim(),description:q('#cd-desc').value.trim(),copyright:q('#cd-cp').value.trim(),useNexoIcon:q('#cd-nx').checked,icon:dl.dataset.icon||'',admin:q('#cd-ad').checked};
      try{localStorage.setItem('nexoCompile',JSON.stringify({company:o.company,copyright:o.copyright,version:o.version,nexoIcon:o.useNexoIcon}))}catch(e){}
      dl.close();st('Compiling…');const m=await A.compile(src(),TABS[cur].name,o);if(m!==null&&m!==undefined)st(m)};
  }
  const q=i=>dl.querySelector(i);q('#cd-name').value=TABS[cur].name;q('#cd-ver').value=sv.version||'1.0.0.0';q('#cd-co').value=sv.company||'';q('#cd-desc').value='';q('#cd-cp').value=sv.copyright||'';q('#cd-nx').checked=sv.nexoIcon!==false;q('#cd-ad').checked=false;dl.dataset.icon='';q('#cd-icn').textContent='';
  dl.showModal();
}
/* ---- Help > Program locations ---- */
async function renderTools(){const out=document.getElementById('tl-out');if(!out)return;
  if(!(A&&A.toolPaths)){out.textContent='Program locations are only available in the desktop app.';return}
  let t;try{t=await A.toolPaths()}catch(e){out.textContent='Could not read the program locations.';return}
  out.replaceChildren();
  const row=(label,kind,path,saved)=>{const r=document.createElement('div');r.className='srow';r.style.cssText='flex-wrap:wrap;gap:6px;align-items:center';
    const nm=document.createElement('b');nm.textContent=label;nm.style.minWidth='130px';const pa=document.createElement('code');pa.style.cssText='flex:1;min-width:200px;word-break:break-all';pa.textContent=path||'Not found yet';if(!path)pa.style.color='var(--mut)';
    const ch=document.createElement('button');ch.textContent='Choose…';ch.title='Pick the file yourself';ch.onclick=async()=>{const r2=await A.toolSet(kind);if(r2&&r2.err)st(r2.err);else if(r2&&!r2.cancelled)st('Saved');renderTools()};
    r.append(nm,pa,ch);
    if(saved){const rs=document.createElement('button');rs.textContent='Reset to automatic';rs.title='Forget the file you picked, so the app looks for it again by itself';rs.onclick=async()=>{await A.toolReset(kind);st('Reset: the app will find it by itself again');renderTools()};r.append(rs);const b=document.createElement('span');b.className='tip';b.style.margin='0';b.textContent='(chosen by you)';r.append(b)}
    out.append(r)};
  row('AutoHotkey v2','ahk',t.ahk,t.ahkSaved);row('Compiler (Ahk2Exe)','compiler',t.compiler,t.compilerSaved);
  if(A.toolDownload){const r=document.createElement('div');r.className='srow';r.style.cssText='flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px';
    const b=document.createElement('button');b.textContent=t.ahk?'Download a fresh copy of AutoHotkey v2':'Download AutoHotkey v2';b.title='Gets the official zip from GitHub, checks it and keeps it inside this app. Nothing is installed on your PC.';
    const m=document.createElement('span');m.className='tip';m.style.margin='0';m.id='tl-dl';
    b.onclick=async()=>{b.disabled=true;m.textContent='Starting…';const res=await A.toolDownload();b.disabled=false;
      if(res&&res.err){m.textContent=res.err;st(res.err)}else{m.textContent=(res&&res.note)||'Done. Run and Compile will use it.';st('AutoHotkey v2 downloaded');renderTools()}};
    r.append(b,m);out.append(r)}}
A&&A.onToolDownload&&A.onToolDownload(t=>{const m=document.getElementById('tl-dl');if(m)m.textContent=t});
/* ---- Help > Self-check ---- */
function rendererChecks(){const r=[],add=(id,label,status,detail,fix)=>r.push({id,label,status,detail,fix:fix||''});
  add('sim','Try it (simulator)',typeof Sim!=='undefined'?'ok':'bad',typeof Sim!=='undefined'?'Loaded':'Not loaded','Reinstall Nexo Ahks: renderer/sim.js is missing.');
  add('monaco','Code view editor',typeof monaco!=='undefined'?'ok':'warn',typeof monaco!=='undefined'?'Loaded':'Not loaded yet (it loads the first time you open the Code view)');
  let ls=true;try{localStorage.setItem('nexoSC','1');localStorage.removeItem('nexoSC')}catch(e){ls=false}
  add('store','Saved settings',ls?'ok':'warn',ls?'Working':'Your settings and looks cannot be saved','Check that the app is allowed to store data.');
  add('blocks','Blocks',Object.keys(T).length>200?'ok':'warn',Object.keys(T).length+' blocks, '+Object.keys(RB).length+' value blocks');return r}
async function selfCheck(){const out=$('#sc-out');out.textContent='Checking…';let r;
  try{r=A&&A.diagnostics?await A.diagnostics():[{id:'web',label:'Desktop app',status:'warn',detail:'You are not running inside the desktop app, so only the editor was checked.'}]}catch(e){r=[{id:'err',label:'Self-check',status:'bad',detail:String((e&&e.message)||e)}]}
  r=(r||[]).concat(rendererChecks());const ic={ok:'✅',warn:'⚠️',bad:'❌'};
  const t=document.createElement('table');r.forEach(x=>{const tr=document.createElement('tr'),a=document.createElement('td'),b=document.createElement('td');a.textContent=(ic[x.status]||'•')+' '+x.label;b.textContent=x.detail;if(x.fix&&x.status!=='ok'){const f=document.createElement('span');f.className='fixr';f.textContent='How to fix: '+x.fix;b.append(f)}tr.append(a,b);t.append(tr)});
  out.replaceChildren(t);out.dataset.report=r.map(x=>(ic[x.status]||'-')+' '+x.label+': '+x.detail+(x.fix&&x.status!=='ok'?'  [fix: '+x.fix+']':'')).join('\n');$('#sc-copy').hidden=false;
  const bad=r.filter(x=>x.status==='bad').length,warn=r.filter(x=>x.status==='warn').length;st(bad?bad+' thing(s) need fixing':warn?'Everything works. '+warn+' note(s)':'Everything works')}
$('#sc-go').onclick=selfCheck;
$('#sc-copy').onclick=()=>{const t=$('#sc-out').dataset.report||'';try{navigator.clipboard.writeText(t);st('Report copied')}catch(e){st('Could not copy: select the text and press Ctrl+C')}};
/* ---- friendly in-app error card (and the same details go to the crash log) ---- */
let ERRC={msg:'',n:0};
function errCard(msg,stack){msg=String(msg||'Unknown error');const full=msg+(stack?'\n'+stack:'');try{A&&A.reportError&&A.reportError(full)}catch(e){}
  if(document.getElementById('errc')&&ERRC.msg===msg){ERRC.n++;const c=document.querySelector('#errc .cnt');if(c)c.textContent=' (happened '+(ERRC.n+1)+' times)';return}
  const old=document.getElementById('errc');if(old)old.remove();ERRC={msg,n:0};
  const c=document.createElement('div');c.id='errc';const b=document.createElement('b');b.textContent='Something went wrong in the editor, but your work is safe';const cnt=document.createElement('span');cnt.className='cnt';b.append(cnt);
  const code=document.createElement('code');code.textContent=msg.slice(0,300);const r=document.createElement('div');r.className='r';
  const cp=document.createElement('button');cp.textContent='Copy details';cp.onclick=()=>{try{navigator.clipboard.writeText(full);st('Details copied')}catch(e){}};
  const dm=document.createElement('button');dm.className='pri';dm.textContent='Dismiss';dm.onclick=()=>c.remove();r.append(cp,dm);c.append(b,code,r);document.body.append(c)}
window.addEventListener('error',e=>{if(e&&e.message&&!/ResizeObserver/i.test(e.message))errCard(e.message,e.error&&e.error.stack)});
window.addEventListener('unhandledrejection',e=>errCard((e.reason&&e.reason.message)||String(e.reason),e.reason&&e.reason.stack));



