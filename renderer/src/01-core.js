
const $=s=>document.querySelector(s);
const q=s=>'"'+String(s).replace(/`/g,'``').replace(/"/g,'`"').replace(/\r/g,'`r').replace(/\n/g,'`n').replace(/\t/g,'`t')+'"';
const unq=z=>z.replace(/`([`"nrt])/g,(m,c)=>({n:'\n',r:'\r',t:'\t'})[c]||c);
const vn=s=>String(s).replace(/\W/g,'_')||'x';
const MB=['Left','Right','Middle'];
const T={
hotkey:{c:'event',g:'Event',box:1,glob:1,t:'When I press {key}',f:{key:{d:'F1',w:90,r:'hot'}},gen:v=>`${v.key}::{`},
loop:{c:'ctrl',g:'Control',box:1,t:'Repeat {n} times',f:{n:{d:'10',w:60}},gen:v=>`Loop ${v.n||1} {`},
forever:{c:'ctrl',g:'Control',box:1,t:'Repeat forever',f:{},gen:()=>'Loop {'},
while:{c:'ctrl',g:'Control',box:1,t:'while {c}',f:{c:{d:'on',w:140,p:'a variable or condition'}},gen:v=>`while (${v.c}) {`},
if:{c:'ctrl',g:'Control',box:1,t:'if {c} then',f:{c:{d:'on',w:150,p:'a condition'}},gen:v=>`if (${v.c}) {`},
else:{c:'ctrl',g:'Control',box:1,t:'otherwise',f:{},gen:()=>'else {'},
brk:{c:'ctrl',g:'Control',t:'Stop repeating',f:{},gen:()=>'break'},
send:{c:'key',g:'Keyboard',t:'Press keys {k}',f:{k:{d:'{Enter}',w:120,p:'e.g. e or {Enter}',r:'send'}},gen:v=>`Send ${q(v.k)}`},
text:{c:'key',g:'Keyboard',t:'Type text {s}',f:{s:{d:'Hello!',w:150}},gen:v=>`SendText ${qi(v.s)}`},
hold:{c:'key',g:'Keyboard',t:'{m} key {k}',f:{m:{d:'down',o:['down','up']},k:{d:'w',w:70,r:'name'}},gen:v=>`Send ${q(`{${v.k} ${v.m}}`)}`},
click:{c:'mouse',g:'Mouse',t:'Click {b} at x {x} y {y}',f:{b:{d:'Left',o:MB},x:{d:'',w:55,p:'here'},y:{d:'',w:55,p:'here'}},gen:v=>`Click ${q([v.x!==''&&v.y!==''?v.x+' '+v.y:'',v.b].filter(Boolean).join(' '))}`},
move:{c:'mouse',g:'Mouse',t:'Move mouse to x {x} y {y}',f:{x:{d:'500',w:55},y:{d:'500',w:55}},gen:v=>`MouseMove ${v.x||0}, ${v.y||0}`},
wait:{c:'misc',g:'Other',t:'Wait {ms} ms',f:{ms:{d:'100',w:70}},gen:v=>`Sleep ${v.ms||0}`},
msg:{c:'misc',g:'Other',t:'Show message {s}',f:{s:{d:'Hi!',w:150}},gen:v=>`MsgBox ${qi(v.s)}`},
tip:{c:'misc',g:'Other',t:'Show tooltip {s}',f:{s:{d:'Running',w:130}},gen:v=>`ToolTip ${qi(v.s)}`},
run:{c:'misc',g:'Other',t:'Open {p}',f:{p:{d:'notepad.exe',w:170,p:'program, file or website'}},gen:v=>`Run ${q(v.p)}`},
win:{c:'misc',g:'Other',t:'Focus window {s}',f:{s:{d:'ahk_exe notepad.exe',w:170}},gen:v=>`WinActivate ${q(v.s)}`},
set:{c:'misc',g:'Variables',t:'Set {n} to {v}',f:{n:{d:'count',w:70},v:{d:'0',w:70}},gen:v=>`${vn(v.n)} := ${v.v}`},
tog:{c:'misc',g:'Variables',t:'Flip on/off {n}',f:{n:{d:'on',w:70}},gen:v=>`${vn(v.n)} := !${vn(v.n)}`},
hotstr:{c:'event',g:'Event',box:1,glob:1,t:'When I type {s}',f:{s:{d:'btw',w:90}},gen:v=>`:*:${v.s}::{`},
abbr:{c:'event',g:'Event',t:'Auto-replace {a} with {b}',f:{a:{d:'btw',w:70},b:{d:'by the way',w:130}},gen:v=>`:*:${v.a}::${v.b}`},
hotif:{c:'event',g:'Event',t:'Only when window {s} is active',f:{s:{d:'ahk_exe notepad.exe',w:150}},gen:v=>`#HotIf WinActive(${q(v.s)})`},
hotall:{c:'event',g:'Event',t:'Everywhere (end window limit)',f:{},gen:()=>'#HotIf'},
func:{c:'ctrl',g:'Control',box:1,glob:1,t:'Define my block {n}',f:{n:{d:'MyFunc',w:90}},gen:v=>`${vn(v.n)}() {`},
call:{c:'ctrl',g:'Control',t:'Run function {n}',f:{n:{d:'MyFunc',w:90}},gen:v=>`${vn(v.n)}()`},
kwait:{c:'key',g:'Keyboard',t:'Wait until key {k} is released',f:{k:{d:'F1',w:70,r:'name'}},gen:v=>`KeyWait ${q(v.k)}`},
paste:{c:'key',g:'Keyboard',t:'Paste clipboard',f:{},gen:()=>'Send "^v"'},
csend:{c:'key',g:'Keyboard',t:'Send {k} to window {w} (background)',f:{k:{d:'a',w:60,r:'send'},w:{d:'ahk_exe notepad.exe',w:140}},gen:v=>`ControlSend ${q(v.k)}, , ${q(v.w)}`},
drag:{c:'mouse',g:'Mouse',t:'Drag {b} from x {x1} y {y1} to x {x2} y {y2}',f:{b:{d:'Left',o:MB},x1:{d:'100',w:50},y1:{d:'100',w:50},x2:{d:'300',w:50},y2:{d:'300',w:50}},gen:v=>`MouseClickDrag ${q(v.b)}, ${v.x1}, ${v.y1}, ${v.x2}, ${v.y2}`},
scroll:{c:'mouse',g:'Mouse',t:'Scroll {d} {n} times',f:{d:{d:'Up',o:['Up','Down']},n:{d:'3',w:45}},gen:v=>`Send ${q(`{Wheel${v.d} ${v.n}}`)}`},
ifpix:{c:'mouse',g:'Screen',box:1,t:'If pixel x {x} y {y} is color {c}',f:{x:{d:'100',w:50},y:{d:'100',w:50},c:{d:'0xFFFFFF',w:80}},gen:v=>`if (PixelGetColor(${v.x}, ${v.y}) = ${q(v.c)}) {`},
ifimg:{c:'mouse',g:'Screen',box:1,t:'If image {p} is on screen',f:{p:{d:'button.png',w:130}},gen:v=>`if ImageSearch(&FoundX, &FoundY, 0, 0, A_ScreenWidth, A_ScreenHeight, ${q(v.p)}) {`},
clkimg:{c:'mouse',g:'Screen',t:'Click the found image',f:{},gen:()=>'Click FoundX, FoundY'},
rwait:{c:'misc',g:'Other',t:'Wait random {a} to {b} ms',f:{a:{d:'80',w:55},b:{d:'200',w:55}},gen:v=>`Sleep Random(${v.a}, ${v.b})`},
wwait:{c:'misc',g:'Window',t:'Wait for window {s}',f:{s:{d:'ahk_exe notepad.exe',w:150}},gen:v=>`WinWait ${q(v.s)}`},
wctl:{c:'misc',g:'Window',t:'{m} window {s}',f:{m:{d:'Minimize',o:['Minimize','Maximize','Restore','Close']},s:{d:'A',w:130}},gen:v=>`Win${v.m} ${q(v.s)}`},
clip:{c:'misc',g:'Other',t:'Copy to clipboard {s}',f:{s:{d:'text',w:130}},gen:v=>`A_Clipboard := ${qi(v.s)}`},
beep:{c:'misc',g:'Other',t:'Beep {f} Hz for {ms} ms',f:{f:{d:'750',w:55},ms:{d:'200',w:55}},gen:v=>`SoundBeep ${v.f}, ${v.ms}`},
fapp:{c:'misc',g:'Other',t:'Add line {s} to file {f}',f:{s:{d:'log',w:100},f:{d:'log.txt',w:100}},gen:v=>'FileAppend '+qi(v.s)+' . "`n", '+q(v.f)},
susp:{c:'misc',g:'Other',t:'Pause / resume hotkeys',f:{},gen:()=>'Suspend'},
rld:{c:'misc',g:'Other',t:'Reload script',f:{},gen:()=>'Reload'},
rawl:{c:'misc',g:'Other',t:'Raw AHK line {s}',f:{s:{d:'; your code',w:200}},gen:v=>v.s},
elif:{c:'ctrl',g:'Control',box:1,t:'otherwise if {c} then',f:{c:{d:'on',w:150}},gen:v=>`else if (${v.c}) {`},
ifkey:{c:'ctrl',g:'Control',box:1,t:'If key {k} is {m}',f:{k:{d:'w',w:60,r:'name'},m:{d:'held',o:['held','not held']}},gen:v=>`if ${v.m==='held'?'':'!'}GetKeyState(${q(v.k)}, "P") {`},
ifwin:{c:'ctrl',g:'Control',box:1,t:'If window {s} is active',f:{s:{d:'ahk_exe notepad.exe',w:150}},gen:v=>`if WinActive(${q(v.s)}) {`},
timer:{c:'ctrl',g:'Control',t:'Every {ms} ms run function {n}',f:{ms:{d:'1000',w:60},n:{d:'MyFunc',w:90}},gen:v=>`SetTimer ${vn(v.n)}, ${v.ms}`},
timeroff:{c:'ctrl',g:'Control',t:'Stop timer for function {n}',f:{n:{d:'MyFunc',w:90}},gen:v=>`SetTimer ${vn(v.n)}, 0`},
mhold:{c:'mouse',g:'Mouse',t:'Mouse {b} button {m}',f:{b:{d:'Left',o:MB},m:{d:'down',o:['down','up']}},gen:v=>`Click ${q(v.b+' '+v.m)}`},
getpos:{c:'mouse',g:'Mouse',t:'Save mouse position in {vx} and {vy}',f:{vx:{d:'mx',w:45},vy:{d:'my',w:45}},gen:v=>`MouseGetPos &${vn(v.vx)}, &${vn(v.vy)}`},
appendv:{c:'misc',g:'Variables',t:'Add {v} to the end of {n}',f:{v:{d:'"more"',w:90},n:{d:'text',w:70}},gen:v=>`${vn(v.n)} .= ${v.v}`},
incr:{c:'misc',g:'Variables',t:'Add {v} to {n}',f:{v:{d:'1',w:50},n:{d:'count',w:70}},gen:v=>`${vn(v.n)} += ${v.v}`},
rnd:{c:'misc',g:'Variables',t:'Set {n} to random {a} to {b}',f:{n:{d:'roll',w:70},a:{d:'1',w:45},b:{d:'10',w:45}},gen:v=>`${vn(v.n)} := Random(${v.a}, ${v.b})`},
inbox:{c:'misc',g:'Variables',t:'Ask me {p} and save in {n}',f:{p:{d:'Name?',w:100},n:{d:'answer',w:70}},gen:v=>`${vn(v.n)} := InputBox(${q(v.p)}).Value`},
tray:{c:'misc',g:'Other',t:'Show notification {s}',f:{s:{d:'Done!',w:130}},gen:v=>`TrayTip ${qi(v.s)}, "Nexo Ahks"`},
sound:{c:'misc',g:'Other',t:'Play sound file {f}',f:{f:{d:'C:\\Windows\\Media\\tada.wav',w:200}},gen:v=>`SoundPlay ${q(v.f)}`},
guishow:{c:'ui',g:'Window UI',t:'Show my window',f:{},gen:()=>(GUI.v||'myGui')+'.Show()'},
guihide:{c:'ui',g:'Window UI',t:'Hide my window',f:{},gen:()=>(GUI.v||'myGui')+'.Hide()'},
setctl:{c:'ui',g:'Window UI',t:'Set control {c} value to {v}',f:{c:{d:'ed1',w:70,ctl:1},v:{d:'Hello',w:110}},gen:v=>`${vn(v.c)}.Value := ${qi(v.v)}`},
settxt:{c:'ui',g:'Window UI',t:'Set control {c} text to {v}',f:{c:{d:'btn1',w:70,ctl:1},v:{d:'Done',w:110}},gen:v=>`${vn(v.c)}.Text := ${qi(v.v)}`},
getctl:{c:'ui',g:'Window UI',t:'Save {p} of control {c} in {n}',f:{p:{d:'Value',o:['Value','Text']},c:{d:'ed1',w:70,ctl:1},n:{d:'answer',w:70}},gen:v=>`${vn(v.n)} := ${vn(v.c)}.${v.p||'Value'}`},
hkpass:{c:'event',g:'Event',box:1,glob:1,t:'When I press {key} (let it through)',f:{key:{d:'F1',w:90,r:'hot'}},gen:v=>`~${v.key}::{`},
hkup:{c:'event',g:'Event',box:1,glob:1,t:'When I release {key}',f:{key:{d:'F1',w:90,r:'hot'}},gen:v=>`${v.key} up::{`},
remap:{c:'event',g:'Event',t:'Remap key {a} to {b}',f:{a:{d:'CapsLock',w:80,r:'name'},b:{d:'Ctrl',w:80,r:'name'}},gen:v=>`${v.a}::${v.b}`},
try:{c:'ctrl',g:'Control',box:1,t:'try this',f:{},gen:()=>'try {'},
catch:{c:'ctrl',g:'Control',box:1,t:'if it fails',f:{e:{d:'',w:40,p:'error'}},gen:v=>String(v.e||'').trim()?`catch as ${vn(v.e)} {`:'catch {'},
finally:{c:'ctrl',g:'Control',box:1,t:'Always do this after',f:{},gen:()=>'finally {'},
ret:{c:'ctrl',g:'Control',t:'Stop this hotkey or function',f:{},gen:()=>'return'},
ucall:{c:'ctrl',g:'My blocks',t:'{n}',f:{n:{d:'MyBlock',w:100},a1:{d:'',w:60},a2:{d:'',w:60},a3:{d:'',w:60},a4:{d:'',w:60},a5:{d:'',w:60},a6:{d:'',w:60},a7:{d:'',w:60},a8:{d:'',w:60}},gen:v=>{const d=myDef(v.n);let k=d?d.params.length:0;if(!d)for(let i=8;i>0;i--)if(String(v['a'+i]).trim()){k=i;break}return vn(v.n)+'('+Array.from({length:k},(_,i)=>String(v['a'+(i+1)]).trim()||'""').join(', ')+')'}},
retv:{c:'ctrl',g:'Control',t:'Give back value {v}',f:{v:{d:'true',w:80}},gen:v=>`return ${v.v}`},
funcp:{c:'ctrl',g:'Control',box:1,glob:1,t:'Define my block {n} taking {p}',f:{n:{d:'MyFunc',w:90},p:{d:'x',w:70}},gen:v=>`${vn(v.n)}(${v.p}) {`},
callp:{c:'ctrl',g:'Control',t:'Run function {n} with {a}',f:{n:{d:'MyFunc',w:90},a:{d:'1',w:70}},gen:v=>`${vn(v.n)}(${v.a})`},
brkif:{c:'ctrl',g:'Control',t:'Stop repeating if {c}',f:{c:{d:'count >= 10',w:140}},gen:v=>`if (${v.c}) {\n  break\n}`},
waitc:{c:'ctrl',g:'Control',t:'Wait until {c}',f:{c:{d:'done',w:140}},gen:v=>`while !(${v.c}) {\n  Sleep 25\n}`},
ifyes:{c:'ctrl',g:'Control',box:1,t:'If I click Yes on {s}',f:{s:{d:'Continue?',w:130}},gen:v=>`if MsgBox(${qi(v.s)}, "Nexo Ahks", "YesNo") = "Yes" {`},
ifclip:{c:'ctrl',g:'Control',box:1,t:'If clipboard contains {s}',f:{s:{d:'text',w:120}},gen:v=>`if InStr(A_Clipboard, ${q(v.s)}) {`},
foreach:{c:'ctrl',g:'Control',box:1,t:'For each file matching {p}',f:{p:{d:'C:\\Users\\*.txt',w:180}},gen:v=>`Loop Files ${q(v.p)} {`},
sendn:{c:'key',g:'Keyboard',t:'Press {k} {n} times',f:{k:{d:'Enter',w:70,r:'name'},n:{d:'3',w:45}},gen:v=>`Send ${q(`{${v.k} ${v.n}}`)}`},
holdms:{c:'key',g:'Keyboard',t:'Hold {k} for {ms} ms (games ignore very fast taps, 50+ ms is safe)',f:{k:{d:'w',w:60,r:'name'},ms:{d:'500',w:60}},gen:v=>`Send ${q(`{${v.k} down}`)}\nSleep ${v.ms||0}\nSend ${q(`{${v.k} up}`)}`},
pastet:{c:'key',g:'Keyboard',t:'Paste text {s}',f:{s:{d:'Hello!',w:150}},gen:v=>`A_Clipboard := ${qi(v.s)}\nSend "^v"`},
typev:{c:'key',g:'Keyboard',t:'Type value of {v}',f:{v:{d:'name',w:90}},gen:v=>`SendText ${v.v}`},
blockin:{c:'key',g:'Keyboard',t:'Block keyboard and mouse {m}',f:{m:{d:'On',o:['On','Off']}},gen:v=>`BlockInput ${q(v.m)}`},
caps:{c:'key',g:'Keyboard',t:'Set Caps Lock {m}',f:{m:{d:'AlwaysOff',o:['AlwaysOff','AlwaysOn','On','Off']}},gen:v=>`SetCapsLockState ${q(v.m)}`},
speed:{c:'key',g:'Keyboard',t:'Set key delay {k} ms and mouse delay {m} ms',f:{k:{d:'10',w:45},m:{d:'10',w:45}},gen:v=>`SetKeyDelay ${v.k}\nSetMouseDelay ${v.m}`},
mclick:{c:'mouse',g:'Mouse',t:'Click {b} {n} times',f:{b:{d:'Left',o:MB},n:{d:'2',w:40}},gen:v=>`Click ${q(v.b+' '+v.n)}`},
mrel:{c:'mouse',g:'Mouse',t:'Move mouse by x {dx} y {dy}',f:{dx:{d:'10',w:50},dy:{d:'0',w:50}},gen:v=>`MouseMove ${v.dx||0}, ${v.dy||0}, 0, "R"`},
mglide:{c:'mouse',g:'Mouse',t:'Glide mouse to x {x} y {y} speed {s}',f:{x:{d:'500',w:50},y:{d:'500',w:50},s:{d:'20',w:40}},gen:v=>`MouseMove ${v.x||0}, ${v.y||0}, ${v.s||0}`},
clkhold:{c:'mouse',g:'Mouse',t:'Hold {b} click for {ms} ms',f:{b:{d:'Left',o:MB},ms:{d:'500',w:60}},gen:v=>`Click ${q(v.b+' Down')}\nSleep ${v.ms||0}\nClick ${q(v.b+' Up')}`},
getpix:{c:'mouse',g:'Screen',t:'Save color at x {x} y {y} in {n}',f:{x:{d:'100',w:50},y:{d:'100',w:50},n:{d:'color',w:60}},gen:v=>`${vn(v.n)} := PixelGetColor(${v.x||0}, ${v.y||0})`},
waitpix:{c:'mouse',g:'Screen',t:'Wait until pixel x {x} y {y} is {c}',f:{x:{d:'100',w:50},y:{d:'100',w:50},c:{d:'0xFFFFFF',w:80}},gen:v=>`while (PixelGetColor(${v.x||0}, ${v.y||0}) != ${q(v.c)}) {\n  Sleep 20\n}`},
ifpixn:{c:'mouse',g:'Screen',box:1,t:'If pixel x {x} y {y} is NOT {c}',f:{x:{d:'100',w:50},y:{d:'100',w:50},c:{d:'0xFFFFFF',w:80}},gen:v=>`if (PixelGetColor(${v.x||0}, ${v.y||0}) != ${q(v.c)}) {`},
ifcolor:{c:'mouse',g:'Screen',box:1,t:'If color {c} is in area x1 {x1} y1 {y1} to x2 {x2} y2 {y2}',f:{c:{d:'0xFF0000',w:80},x1:{d:'0',w:45},y1:{d:'0',w:45},x2:{d:'800',w:45},y2:{d:'600',w:45}},gen:v=>`if PixelSearch(&FoundX, &FoundY, ${v.x1}, ${v.y1}, ${v.x2}, ${v.y2}, ${v.c}, 10) {`},
ifwex:{c:'misc',g:'Window',box:1,t:'If window {s} exists',f:{s:{d:'ahk_exe notepad.exe',w:150}},gen:v=>`if WinExist(${q(v.s)}) {`},
ifproc:{c:'misc',g:'Window',box:1,t:'If program {s} is running',f:{s:{d:'notepad.exe',w:120}},gen:v=>`if ProcessExist(${q(v.s)}) {`},
wmove:{c:'misc',g:'Window',t:'Move window {s} to x {x} y {y} size {w} by {h}',f:{s:{d:'A',w:90},x:{d:'0',w:45},y:{d:'0',w:45},w:{d:'800',w:50},h:{d:'600',w:50}},gen:v=>`WinMove ${v.x}, ${v.y}, ${v.w}, ${v.h}, ${q(v.s)}`},
wtop:{c:'misc',g:'Window',t:'Toggle always-on-top for {s}',f:{s:{d:'A',w:100}},gen:v=>`WinSetAlwaysOnTop -1, ${q(v.s)}`},
wclosew:{c:'misc',g:'Window',t:'Wait for window {s} to close',f:{s:{d:'ahk_exe notepad.exe',w:150}},gen:v=>`WinWaitClose ${q(v.s)}`},
pkill:{c:'misc',g:'Window',t:'Close program {s}',f:{s:{d:'notepad.exe',w:120}},gen:v=>`ProcessClose ${q(v.s)}`},
pwait:{c:'misc',g:'Window',t:'Wait for program {s}',f:{s:{d:'notepad.exe',w:120}},gen:v=>`ProcessWait ${q(v.s)}`},
runw:{c:'misc',g:'Window',t:'Run {p} and wait for it to finish',f:{p:{d:'notepad.exe',w:150}},gen:v=>`RunWait ${q(v.p)}`},
runh:{c:'misc',g:'Window',t:'Run command {c} (hidden)',f:{c:{d:'echo hi',w:150}},gen:v=>`Run A_ComSpec ${q(' /c '+v.c)}, , "Hide"`},
rclip:{c:'misc',g:'Variables',t:'Read clipboard into {n}',f:{n:{d:'clip',w:70}},gen:v=>`${vn(v.n)} := A_Clipboard`},
time:{c:'misc',g:'Variables',t:'Get time into {n} as {f}',f:{n:{d:'now',w:60},f:{d:'yyyy-MM-dd HH:mm:ss',w:140}},gen:v=>`${vn(v.n)} := FormatTime(, ${q(v.f)})`},
fread:{c:'misc',g:'Variables',t:'Read file {f} into {n}',f:{f:{d:'log.txt',w:110},n:{d:'text',w:60}},gen:v=>`${vn(v.n)} := FileRead(${q(v.f)})`},
iniload:{c:'misc',g:'Variables',t:'Load setting {k} from {f} into {n}',f:{k:{d:'name',w:70},f:{d:'settings.ini',w:100},n:{d:'saved',w:60}},gen:v=>`${vn(v.n)} := IniRead(${q(v.f)}, "Settings", ${q(v.k)}, "")`},
math:{c:'misc',g:'Variables',t:'Set {n} to {a} {op} {b}',f:{n:{d:'total',w:60},a:{d:'1',w:50},op:{d:'+',o:['+','-','*','/','//']},b:{d:'1',w:50}},gen:v=>`${vn(v.n)} := ${v.a} ${v.op} ${v.b}`},
sett:{c:'misc',g:'Variables',t:'Set {n} to text {s}',f:{n:{d:'name',w:70},s:{d:'hello',w:110}},gen:v=>`${vn(v.n)} := ${qi(v.s)}`},
inputkey:{c:'misc',g:'Variables',t:'Wait for a key press and save it in {n}',f:{n:{d:'key',w:60}},gen:v=>`ih := InputHook("L1 V")\nih.Start()\nih.Wait()\n${vn(v.n)} := ih.Input`},
showv:{c:'misc',g:'Variables',t:'Show value of {v}',f:{v:{d:'count',w:90}},gen:v=>`MsgBox ${v.v}`},
fdel:{c:'misc',g:'Other',t:'Delete file {f}',f:{f:{d:'old.txt',w:120}},gen:v=>`FileDelete ${q(v.f)}`},
dl:{c:'misc',g:'Other',t:'Download {u} to {f}',f:{u:{d:'https://example.com/file.zip',w:200},f:{d:'file.zip',w:90}},gen:v=>`Download ${q(v.u)}, ${q(v.f)}`},
inisave:{c:'misc',g:'Other',t:'Save setting {k} = {v} to {f}',f:{k:{d:'name',w:70},v:{d:'value',w:70},f:{d:'settings.ini',w:100}},gen:v=>`IniWrite ${q(v.v)}, ${q(v.f)}, "Settings", ${q(v.k)}`},
vol:{c:'misc',g:'Other',t:'Change volume by {n}',f:{n:{d:'+5',w:50}},gen:v=>`SoundSetVolume ${q(v.n)}`},
mute:{c:'misc',g:'Other',t:'Toggle mute',f:{},gen:()=>'SoundSetMute -1'},
ttip2:{c:'misc',g:'Other',t:'Tooltip {s} for {ms} ms',f:{s:{d:'Hi',w:100},ms:{d:'1500',w:60}},gen:v=>`ToolTip ${qi(v.s)}\nSetTimer () => ToolTip(), -${v.ms||0}`},
tiptray:{c:'misc',g:'Other',t:'Set tray tooltip {s}',f:{s:{d:'My script',w:120}},gen:v=>`A_IconTip := ${q(v.s)}`},
hkon:{c:'misc',g:'Other',t:'Turn hotkey {k} {m}',f:{k:{d:'F1',w:60,r:'hot'},m:{d:'Off',o:['On','Off','Toggle']}},gen:v=>`Hotkey ${q(v.k)}, ${q(v.m)}`},
stopin:{c:'misc',g:'Other',t:'Stop script after {ms} ms',f:{ms:{d:'60000',w:70}},gen:v=>`SetTimer () => ExitApp(), -${v.ms||0}`},
settxtx:{c:'ui',g:'Window UI',t:'Set control {c} text to value of {e}',f:{c:{d:'txt1',w:60,ctl:1},e:{d:'"Count: " count',w:150}},gen:v=>`${vn(v.c)}.Text := ${v.e}`},
guiend:{c:'ui',g:'Window UI',t:'Close my window',f:{},gen:()=>(GUI.v||'myGui')+'.Destroy()'},
guien:{c:'ui',g:'Window UI',t:'Control {c} {m}',f:{c:{d:'btn1',w:60,ctl:1},m:{d:'enabled',o:['enabled','disabled']}},gen:v=>`${vn(v.c)}.Enabled := ${v.m==='enabled'?'true':'false'}`},
onctl:{c:'ui',g:'Window UI',box:1,glob:1,t:'When control {c} event {ev} happens',f:{c:{d:'btn1',w:70,ctl:1},ev:{d:'Click',o:['Click','Change','DoubleClick','Focus','LoseFocus','ContextMenu']}},gen:v=>`${vn(v.c)}_${v.ev}(*) {`},
onwin:{c:'ui',g:'Window UI',box:1,glob:1,t:'When my window event {ev} happens',f:{ev:{d:'Close',o:['Close','Escape','Size','ContextMenu']}},gen:v=>`${GUI.v||'myGui'}_${v.ev}(*) {`},
guifocus:{c:'ui',g:'Window UI',t:'Focus control {c}',f:{c:{d:'ed1',w:70,ctl:1}},gen:v=>`${vn(v.c)}.Focus()`},
guivis:{c:'ui',g:'Window UI',t:'Control {c} {m}',f:{c:{d:'btn1',w:70,ctl:1},m:{d:'visible',o:['visible','hidden']}},gen:v=>`${vn(v.c)}.Visible := ${v.m==='visible'?'true':'false'}`},
guilist:{c:'ui',g:'Window UI',t:'Add {t} to list {c}',f:{t:{d:'Item',w:90},c:{d:'lb1',w:60,ctl:1}},gen:v=>`${vn(v.c)}.Add([${q(v.t)}])`},
guichoose:{c:'ui',g:'Window UI',t:'Choose item number {n} in {c}',f:{n:{d:'1',w:40},c:{d:'dd1',w:60,ctl:1}},gen:v=>`${vn(v.c)}.Choose(${v.n})`},
guititle:{c:'ui',g:'Window UI',t:'Set window title to {s}',f:{s:{d:'My app',w:120}},gen:v=>`${GUI.v||'myGui'}.Title := ${qi(v.s)}`},
guimin:{c:'ui',g:'Window UI',t:'{m} my window',f:{m:{d:'Minimize',o:['Minimize','Maximize','Restore']}},gen:v=>`${GUI.v||'myGui'}.${v.m}()`},
fsel:{c:'misc',g:'Variables',t:'Ask me to pick a file and save it in {n}',f:{n:{d:'file',w:60}},gen:v=>`${vn(v.n)} := FileSelect()`},
dsel:{c:'misc',g:'Variables',t:'Ask me to pick a folder and save it in {n}',f:{n:{d:'folder',w:60}},gen:v=>`${vn(v.n)} := DirSelect()`},
trayitem:{c:'misc',g:'Tray',box:1,glob:1,t:'Tray menu item {t}',f:{t:{d:'Open window',w:130}},gen:v=>`A_TrayMenu.Add(${q(v.t)}, Tray_${vn(v.t)})\nTray_${vn(v.t)}(*) {`},
traysep:{c:'misc',g:'Tray',t:'Tray menu separator line',f:{},gen:()=>'A_TrayMenu.Add()'},
trayclear:{c:'misc',g:'Tray',t:'Remove the standard tray menu items',f:{},gen:()=>'A_TrayMenu.Delete()'},
traydef:{c:'misc',g:'Tray',t:'Double-clicking the tray icon runs item {t}',f:{t:{d:'Open window',w:130}},gen:v=>`A_TrayMenu.Default := ${q(v.t)}`},
traycheck:{c:'misc',g:'Tray',t:'{m} tray item {t}',f:{m:{d:'Check',o:['Check','Uncheck','ToggleCheck','Enable','Disable']},t:{d:'Open window',w:130}},gen:v=>`A_TrayMenu.${v.m}(${q(v.t)})`},
trayicon:{c:'misc',g:'Tray',t:'Set tray icon to {f}',f:{f:{d:'icon.ico',w:130}},gen:v=>`TraySetIcon(${q(v.f)})`},
trayhide:{c:'misc',g:'Tray',t:'{m} the tray icon',f:{m:{d:'Hide',o:['Hide','Show']}},gen:v=>`A_IconHidden := ${v.m==='Hide'?'true':'false'}`},
trayshow:{c:'misc',g:'Tray',t:'Pop up the tray menu',f:{},gen:()=>'A_TrayMenu.Show()'},
numstate:{c:'key',g:'System',t:'Set {k} {m}',f:{k:{d:'NumLock',o:['NumLock','ScrollLock']},m:{d:'AlwaysOn',o:['AlwaysOn','AlwaysOff','On','Off']}},gen:v=>`Set${v.k}State ${q(v.m)}`},
kwaitd:{c:'key',g:'Keyboard',t:'Wait until key {k} is pressed',f:{k:{d:'F1',w:70,r:'name'}},gen:v=>`KeyWait ${q(v.k)}, "D"`},
relmod:{c:'key',g:'Keyboard',t:'Release stuck modifier keys',f:{},gen:()=>'Send "{Ctrl up}{Shift up}{Alt up}{LWin up}{RWin up}"'},
bgclick:{c:'mouse',g:'Mouse',t:'Click inside window {w} at x {cx} y {cy} (background)',f:{w:{d:'ahk_exe notepad.exe',w:140},cx:{d:'50',w:45},cy:{d:'50',w:45}},gen:v=>`ControlClick ${q('x'+v.cx+' y'+v.cy)}, ${q(v.w)}`},
mwin:{c:'mouse',g:'Mouse',t:'Move mouse to the center of window {s}',f:{s:{d:'A',w:100}},gen:v=>`WinGetPos(&_wx, &_wy, &_ww, &_wh, ${q(v.s)})\nMouseMove _wx + _ww / 2, _wy + _wh / 2`},
imgclick:{c:'mouse',g:'Screen',t:'Wait for image {p} then click it',f:{p:{d:'button.png',w:120}},gen:v=>`while !ImageSearch(&FoundX, &FoundY, 0, 0, A_ScreenWidth, A_ScreenHeight, ${q(v.p)}) {\n  Sleep 100\n}\nClick FoundX, FoundY`},
colorclick:{c:'mouse',g:'Screen',t:'Click color {c} if found in area x1 {x1} y1 {y1} to x2 {x2} y2 {y2}',f:{c:{d:'0xFF0000',w:80},x1:{d:'0',w:45},y1:{d:'0',w:45},x2:{d:'800',w:45},y2:{d:'600',w:45}},gen:v=>`if PixelSearch(&FoundX, &FoundY, ${v.x1}, ${v.y1}, ${v.x2}, ${v.y2}, ${v.c}, 10) {\n  Click FoundX, FoundY\n}`},
wintitle:{c:'misc',g:'Window',t:'Get the active window title into {n}',f:{n:{d:'title',w:70}},gen:v=>`${vn(v.n)} := WinGetTitle("A")`},
wtrans:{c:'misc',g:'Window',t:'Make window {s} see-through level {n} (0 invisible, 255 solid)',f:{s:{d:'A',w:90},n:{d:'200',w:45}},gen:v=>`WinSetTransparent ${v.n}, ${q(v.s)}`},
whide:{c:'misc',g:'Window',t:'{m} window {s}',f:{m:{d:'Hide',o:['Hide','Show']},s:{d:'ahk_exe notepad.exe',w:140}},gen:v=>`Win${v.m} ${q(v.s)}`},
wcenter:{c:'misc',g:'Window',t:'Center window {s} on the screen',f:{s:{d:'A',w:100}},gen:v=>`WinGetPos(, , &_ww, &_wh, ${q(v.s)})\nWinMove((A_ScreenWidth - _ww) / 2, (A_ScreenHeight - _wh) / 2, , , ${q(v.s)})`},
join:{c:'misc',g:'Text',t:'Set {n} to {a} joined with {b}',f:{n:{d:'text',w:60},a:{d:'"Hello, "',w:90},b:{d:'name',w:70}},gen:v=>`${vn(v.n)} := ${v.a} ${v.b}`},
strlen:{c:'misc',g:'Text',t:'Set {n} to the length of {v}',f:{n:{d:'len',w:60},v:{d:'text',w:80}},gen:v=>`${vn(v.n)} := StrLen(${v.v})`},
strcase:{c:'misc',g:'Text',t:'Set {n} to {v} in {m} case',f:{n:{d:'text',w:60},v:{d:'text',w:80},m:{d:'Upper',o:['Upper','Lower']}},gen:v=>`${vn(v.n)} := Str${v.m}(${v.v})`},
strrep:{c:'misc',g:'Text',t:'Set {n} to {v} with {a} replaced by {b}',f:{n:{d:'text',w:60},v:{d:'text',w:80},a:{d:'old',w:60},b:{d:'new',w:60}},gen:v=>`${vn(v.n)} := StrReplace(${v.v}, ${q(v.a)}, ${q(v.b)})`},
strsplit:{c:'misc',g:'Text',t:'Split {v} at {d} into list {n}',f:{v:{d:'text',w:80},d:{d:',',w:40},n:{d:'parts',w:60}},gen:v=>`${vn(v.n)} := StrSplit(${v.v}, ${q(v.d)})`},
copysel:{c:'misc',g:'Text',t:'Copy the selected text into {n}',f:{n:{d:'picked',w:70}},gen:v=>`A_Clipboard := ""\nSend "^c"\nClipWait 1\n${vn(v.n)} := A_Clipboard`},
clrclip:{c:'misc',g:'Text',t:'Clear the clipboard',f:{},gen:()=>'A_Clipboard := ""'},
ifcmp:{c:'ctrl',g:'Control',box:1,t:'If {a} {op} {b}',f:{a:{d:'count',w:80},op:{d:'=',o:['=','!=','>','<','>=','<=']},b:{d:'5',w:70}},gen:v=>`if (${v.a} ${v.op} ${v.b}) {`},
iftext:{c:'ctrl',g:'Control',box:1,t:'If {v} contains {s}',f:{v:{d:'text',w:80},s:{d:'hello',w:90}},gen:v=>`if InStr(${v.v}, ${q(v.s)}) {`},
forlist:{c:'ctrl',g:'Control',box:1,t:'For each {i} in list {v}',f:{i:{d:'item',w:60},v:{d:'parts',w:80}},gen:v=>`for ${vn(v.i)} in ${v.v} {`},
whiletime:{c:'ctrl',g:'Control',box:1,t:'Repeat for {ms} ms (timer {n})',f:{ms:{d:'3000',w:60},n:{d:'started',w:70}},gen:v=>`${vn(v.n)} := A_TickCount\nwhile (A_TickCount - ${vn(v.n)} < ${v.ms||0}) {`},
pausesc:{c:'ctrl',g:'System',t:'Pause the script {m}',f:{m:{d:'Toggle',o:['On','Off','Toggle']}},gen:v=>`Pause ${v.m==='On'?1:v.m==='Off'?0:-1}`},
ifexist:{c:'ctrl',g:'Files',box:1,t:'If file or folder {p} exists',f:{p:{d:'C:\\Users\\me\\file.txt',w:190}},gen:v=>`if FileExist(${q(v.p)}) {`},
fcopy:{c:'misc',g:'Files',t:'Copy file {a} to {b}',f:{a:{d:'a.txt',w:100},b:{d:'b.txt',w:100}},gen:v=>`FileCopy ${q(v.a)}, ${q(v.b)}, 1`},
fmove:{c:'misc',g:'Files',t:'Move file {a} to {b}',f:{a:{d:'a.txt',w:100},b:{d:'folder\\a.txt',w:100}},gen:v=>`FileMove ${q(v.a)}, ${q(v.b)}, 1`},
dircreate:{c:'misc',g:'Files',t:'Make folder {p}',f:{p:{d:'backup',w:130}},gen:v=>`DirCreate ${q(v.p)}`},
power:{c:'misc',g:'System',t:'Computer: {m}',f:{m:{d:'Lock',o:['Lock','Log off','Restart','Shut down','Sleep']}},gen:v=>({'Lock':'DllCall("LockWorkStation")','Log off':'Shutdown 0','Restart':'Shutdown 2','Shut down':'Shutdown 1','Sleep':'DllCall("PowrProf\\SetSuspendState", "Int", 0, "Int", 0, "Int", 0)'})[v.m]||'DllCall("LockWorkStation")'},
runadmin:{c:'misc',g:'System',t:'Run {p} as administrator',f:{p:{d:'notepad.exe',w:140}},gen:v=>`Run ${q('*RunAs '+v.p)}`},
speak:{c:'misc',g:'System',t:'Say out loud {s}',f:{s:{d:'Hello there',w:140}},gen:v=>`ComObject("SAPI.SpVoice").Speak(${qi(v.s)})`},
shot:{c:'misc',g:'System',t:'Copy a screenshot of the {m}',f:{m:{d:'whole screen',o:['whole screen','active window']}},gen:v=>v.m==='whole screen'?'Send "{PrintScreen}"':'Send "!{PrintScreen}"'},
media:{c:'key',g:'System',t:'Press media key {m}',f:{m:{d:'Media_Play_Pause',o:['Media_Play_Pause','Media_Next','Media_Prev','Media_Stop','Volume_Up','Volume_Down','Volume_Mute']}},gen:v=>`Send ${q('{'+v.m+'}')}`},
guicolor:{c:'ui',g:'Window UI',t:'Color control {c}: background {b} text {t} (hex like FF0000)',f:{c:{d:'btn1',w:60,ctl:1},b:{d:'1A1A2E',w:70},t:{d:'FFFFFF',w:70}},gen:v=>`${vn(v.c)}.Opt(${q('+Background'+v.b)})\n${vn(v.c)}.SetFont(${q('c'+v.t)})`},
slowtype:{c:'key',g:'Keyboard',t:'Type {s} slowly, {ms} ms per key',f:{s:{d:'Hello',w:120},ms:{d:'60',w:45}},gen:v=>`SetKeyDelay ${v.ms||0}\nSendEvent ${q('{Raw}'+v.s)}`},
typeline:{c:'key',g:'Keyboard',t:'Type {s} and press Enter',f:{s:{d:'Hello',w:140}},gen:v=>`SendText ${qi(v.s)}\nSend "{Enter}"`},
holdwhile:{c:'key',g:'Keyboard',box:1,t:'While holding key {k}, do',f:{k:{d:'Shift',w:70,r:'name'}},gen:v=>`Send ${q('{'+v.k+' down}')}\ntry {`,tail:v=>['finally {','  Send '+q('{'+v.k+' up}'),'}']},
multiclick:{c:'mouse',g:'Mouse',t:'Click {n} times with {ms} ms between',f:{n:{d:'10',w:45},ms:{d:'50',w:45}},gen:v=>`Loop ${v.n||1} {\n  Click\n  Sleep ${v.ms||0}\n}`},
jiggle:{c:'mouse',g:'Mouse',t:'Wiggle the mouse {px} pixels left and right',f:{px:{d:'5',w:45}},gen:v=>`MouseMove ${v.px}, 0, 0, "R"\nMouseMove -${v.px}, 0, 0, "R"`},
ifimgv:{c:'mouse',g:'Screen',box:1,t:'If image {p} (tolerance {t}) is in area x1 {x1} y1 {y1} to x2 {x2} y2 {y2}',f:{p:{d:'button.png',w:100},t:{d:'30',w:40},x1:{d:'0',w:45},y1:{d:'0',w:45},x2:{d:'1920',w:50},y2:{d:'1080',w:50}},gen:v=>`if ImageSearch(&FoundX, &FoundY, ${v.x1}, ${v.y1}, ${v.x2}, ${v.y2}, ${q('*'+v.t+' '+v.p)}) {`},
minall:{c:'misc',g:'Window',t:'Minimize all windows (show the desktop)',f:{},gen:()=>'WinMinimizeAll()'},
actrun:{c:'misc',g:'Window',t:'Activate window {s}, or run {p} if it is not open',f:{s:{d:'ahk_exe notepad.exe',w:140},p:{d:'notepad.exe',w:110}},gen:v=>`if WinExist(${q(v.s)}) {\n  WinActivate ${q(v.s)}\n} else {\n  Run ${q(v.p)}\n}`},
runmode:{c:'misc',g:'Window',t:'Run {p} {m}',f:{p:{d:'notepad.exe',w:120},m:{d:'Min',o:['Min','Max','Hide']}},gen:v=>`Run ${q(v.p)}, , ${q(v.m)}`},
waitact:{c:'misc',g:'Window',t:'Wait until window {s} is active',f:{s:{d:'ahk_exe notepad.exe',w:150}},gen:v=>`WinWaitActive ${q(v.s)}`},
wsize:{c:'misc',g:'Window',t:'Resize window {s} to {w} by {h}',f:{s:{d:'A',w:90},w:{d:'800',w:50},h:{d:'600',w:50}},gen:v=>`WinMove(, , ${v.w}, ${v.h}, ${q(v.s)})`},
closeall:{c:'misc',g:'Window',t:'Close every window matching {s}',f:{s:{d:'ahk_exe notepad.exe',w:150}},gen:v=>`while WinExist(${q(v.s)}) {\n  WinClose(${q(v.s)})\n  Sleep 100\n}`},
round:{c:'misc',g:'Variables',t:'Set {n} to {v} rounded to {d} decimals',f:{n:{d:'result',w:60},v:{d:'3.14159',w:70},d:{d:'2',w:35}},gen:v=>`${vn(v.n)} := Round(${v.v}, ${v.d})`},
absv:{c:'misc',g:'Variables',t:'Set {n} to the absolute value of {v}',f:{n:{d:'result',w:60},v:{d:'-5',w:60}},gen:v=>`${vn(v.n)} := Abs(${v.v})`},
minmax:{c:'misc',g:'Variables',t:'Set {n} to the {m} of {a} and {b}',f:{n:{d:'result',w:60},m:{d:'Max',o:['Max','Min']},a:{d:'1',w:50},b:{d:'2',w:50}},gen:v=>`${vn(v.n)} := ${v.m}(${v.a}, ${v.b})`},
modv:{c:'misc',g:'Variables',t:'Set {n} to the remainder of {a} divided by {b}',f:{n:{d:'result',w:60},a:{d:'10',w:50},b:{d:'3',w:50}},gen:v=>`${vn(v.n)} := Mod(${v.a}, ${v.b})`},
pickrnd:{c:'misc',g:'Variables',t:'Set {n} to a random choice from {l} (separate with |)',f:{n:{d:'choice',w:60},l:{d:'red|green|blue',w:130}},gen:v=>`_p := StrSplit(${q(v.l)}, "|")\n${vn(v.n)} := _p[Random(1, _p.Length)]`},
pad:{c:'misc',g:'Variables',t:'Set {n} to {v} padded with zeros to {w} digits',f:{n:{d:'padded',w:60},v:{d:'7',w:50},w:{d:'3',w:35}},gen:v=>`${vn(v.n)} := Format(${q('{:0'+v.w+'}')}, ${v.v})`},
setbool:{c:'misc',g:'Variables',t:'Set {n} to {m}',f:{n:{d:'enabled',w:70},m:{d:'true',o:['true','false']}},gen:v=>`${vn(v.n)} := ${v.m}`},
trimv:{c:'misc',g:'Text',t:'Set {n} to {v} without spaces at the ends',f:{n:{d:'text',w:60},v:{d:'text',w:80}},gen:v=>`${vn(v.n)} := Trim(${v.v})`},
substr:{c:'misc',g:'Text',t:'Set {n} to {len} characters of {v} starting at {s}',f:{n:{d:'part',w:60},len:{d:'3',w:35},v:{d:'text',w:70},s:{d:'1',w:35}},gen:v=>`${vn(v.n)} := SubStr(${v.v}, ${v.s}, ${v.len})`},
instrv:{c:'misc',g:'Text',t:'Set {n} to the position of {s} inside {v} (0 = not found)',f:{n:{d:'pos',w:50},s:{d:'a',w:60},v:{d:'text',w:70}},gen:v=>`${vn(v.n)} := InStr(${v.v}, ${q(v.s)})`},
repeat:{c:'misc',g:'Text',t:'Set {n} to {s} repeated {k} times',f:{n:{d:'line',w:60},s:{d:'-',w:50},k:{d:'20',w:40}},gen:v=>`${vn(v.n)} := StrReplace(Format("{:" ${v.k} "}", ""), " ", ${q(v.s)})`},
ifstarts:{c:'ctrl',g:'Text',box:1,t:'If {v} starts with {s}',f:{v:{d:'text',w:80},s:{d:'http',w:70}},gen:v=>`if (InStr(${v.v}, ${q(v.s)}) = 1) {`},
plainclip:{c:'misc',g:'Text',t:'Make the clipboard plain text',f:{},gen:()=>'A_Clipboard := A_Clipboard'},
dateadd:{c:'misc',g:'Time',t:'Set {n} to the date {d} {u} from now',f:{n:{d:'when',w:60},d:{d:'7',w:40},u:{d:'Days',o:['Days','Hours','Minutes','Seconds']}},gen:v=>`${vn(v.n)} := DateAdd(A_Now, ${v.d}, ${q(v.u)})`},
waittime:{c:'misc',g:'Time',t:'Wait until it is {t} (24 hour, like 18:30)',f:{t:{d:'18:30',w:60}},gen:v=>`while (FormatTime(, "HH:mm") != ${q(v.t)}) {\n  Sleep 1000\n}`},
ifhour:{c:'ctrl',g:'Time',box:1,t:'If the hour is from {a} up to {b}',f:{a:{d:'9',w:40},b:{d:'17',w:40}},gen:v=>`if (A_Hour >= ${v.a} && A_Hour < ${v.b}) {`},
ifday:{c:'ctrl',g:'Time',box:1,t:'If today is {d}',f:{d:{d:'Monday',o:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']}},gen:v=>`if (A_WDay = ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(v.d)+1}) {`},
fwrite:{c:'misc',g:'Files',t:'Save text {s} into file {f} (replaces it)',f:{s:{d:'Hello',w:110},f:{d:'note.txt',w:100}},gen:v=>`_f := FileOpen(${q(v.f)}, "w")\n_f.Write(${qi(v.s)})\n_f.Close()`},
forlines:{c:'ctrl',g:'Files',box:1,t:'For each line of file {f}',f:{f:{d:'list.txt',w:120}},gen:v=>`Loop Read ${q(v.f)} {`},
dirdel:{c:'misc',g:'Files',t:'Delete folder {p} and everything in it',f:{p:{d:'old',w:120}},gen:v=>`DirDelete ${q(v.p)}, 1`},
httpget:{c:'misc',g:'System',t:'Read the web page {u} into {n}',f:{u:{d:'https://example.com',w:170},n:{d:'page',w:60}},gen:v=>`_h := ComObject("WinHttp.WinHttpRequest.5.1")\n_h.Open("GET", ${q(v.u)})\n_h.Send()\n${vn(v.n)} := _h.ResponseText`},
volset:{c:'misc',g:'System',t:'Set the volume to {n} percent',f:{n:{d:'50',w:45}},gen:v=>`SoundSetVolume ${v.n}`},
muteset:{c:'misc',g:'System',t:'Mute the sound {m}',f:{m:{d:'On',o:['On','Off']}},gen:v=>`SoundSetMute ${v.m==='On'?1:0}`},
recempty:{c:'misc',g:'System',t:'Empty the recycle bin',f:{},gen:()=>'FileRecycleEmpty()'},
monoff:{c:'misc',g:'System',t:'Turn the monitor off',f:{},gen:()=>'PostMessage(0x112, 0xF170, 2, , "Program Manager")'},
soundwait:{c:'misc',g:'System',t:'Play sound {f} and wait until it ends',f:{f:{d:'C:\\Windows\\Media\\tada.wav',w:190}},gen:v=>`SoundPlay ${q(v.f)}, "Wait"`},
ask3:{c:'misc',g:'Variables',t:'Ask {s} with Yes / No / Cancel and save the answer in {n}',f:{s:{d:'Continue?',w:110},n:{d:'answer',w:60}},gen:v=>`${vn(v.n)} := MsgBox(${qi(v.s)}, "Nexo Ahks", "YesNoCancel")`},
askpw:{c:'misc',g:'Variables',t:'Ask {s} (typing hidden) and save it in {n}',f:{s:{d:'Password?',w:100},n:{d:'secret',w:60}},gen:v=>`${vn(v.n)} := InputBox(${q(v.s)}, "Nexo Ahks", "Password").Value`},
every:{c:'ctrl',g:'Event',box:1,glob:1,t:'Every {ms} ms, do (name {n})',f:{ms:{d:'5000',w:60},n:{d:'check',w:70}},gen:v=>`SetTimer(Timer_${vn(v.n)}, ${v.ms||1000})\nTimer_${vn(v.n)}() {`},
after:{c:'ctrl',g:'Event',box:1,glob:1,t:'After {ms} ms, do once (name {n})',f:{ms:{d:'3000',w:60},n:{d:'later',w:70}},gen:v=>`SetTimer(Timer_${vn(v.n)}, -${v.ms||1000})\nTimer_${vn(v.n)}() {`},
include:{c:'misc',g:'Other',t:'Include script file {f}',f:{f:{d:'helpers.ahk',w:140}},gen:v=>`#Include ${q(v.f)}`},
setctlv:{c:'ui',g:'Window UI',t:'Set control {c} to the value of {v}',f:{c:{d:'ed1',w:60,ctl:1},v:{d:'count',w:90}},gen:v=>`${vn(v.c)}.Value := ${v.v}`},
guiclear:{c:'ui',g:'Window UI',t:'Clear control {c}',f:{c:{d:'ed1',w:60,ctl:1}},gen:v=>`${vn(v.c)}.Value := ""`},
guicheck:{c:'ui',g:'Window UI',t:'Set checkbox {c} to {m}',f:{c:{d:'chk1',w:60,ctl:1},m:{d:'ticked',o:['ticked','not ticked']}},gen:v=>`${vn(v.c)}.Value := ${v.m==='ticked'?1:0}`},
guilistset:{c:'ui',g:'Window UI',t:'Replace the items of {c} with {l} (separate with |)',f:{c:{d:'lb1',w:60,ctl:1},l:{d:'One|Two|Three',w:130}},gen:v=>`${vn(v.c)}.Delete()\n${vn(v.c)}.Add(${ARR(v.l)})`},
guimove:{c:'ui',g:'Window UI',t:'Move control {c} to x {cx} y {cy}',f:{c:{d:'btn1',w:60,ctl:1},cx:{d:'20',w:45},cy:{d:'20',w:45}},gen:v=>`${vn(v.c)}.Move(${v.cx}, ${v.cy})`},
guibg:{c:'ui',g:'Window UI',t:'Set the window background to {b} (hex like 1A1A2E)',f:{b:{d:'1A1A2E',w:70}},gen:v=>`${GUI.v||'myGui'}.BackColor := ${q(v.b)}`},
lvadd:{c:'ui',g:'Window UI',t:'Add row {a} | {b} to list view {c}',f:{a:{d:'one',w:70},b:{d:'two',w:70},c:{d:'lv1',w:60,ctl:1}},gen:v=>`${vn(v.c)}.Add("", ${qi(v.a)}, ${qi(v.b)})`},
lvclear:{c:'ui',g:'Window UI',t:'Clear list view {c}',f:{c:{d:'lv1',w:60,ctl:1}},gen:v=>`${vn(v.c)}.Delete()`},
lvsel:{c:'ui',g:'Window UI',t:'Save the selected row number of {c} in {n}',f:{c:{d:'lv1',w:60,ctl:1},n:{d:'row',w:50}},gen:v=>`${vn(v.n)} := ${vn(v.c)}.GetNext()`},
lvtext:{c:'ui',g:'Window UI',t:'Save the text in column {k} of the selected row of {c} into {n}',f:{k:{d:'1',w:35},c:{d:'lv1',w:60,ctl:1},n:{d:'cell',w:50}},gen:v=>`${vn(v.n)} := ${vn(v.c)}.GetText(${vn(v.c)}.GetNext(), ${v.k})`},
sbtext:{c:'ui',g:'Window UI',t:'Set status bar {c} text to {s}',f:{c:{d:'sb1',w:60,ctl:1},s:{d:'Ready',w:110}},gen:v=>`${vn(v.c)}.SetText(${qi(v.s)})`},
guislot:{c:'ui',g:'Window UI',t:'UI window goes here (edit in UI Designer)',f:{},gen:()=>''},
gmove:{c:'mouse',g:'Games',t:'Move the mouse by x {x} y {y} (works when a game locks the mouse)',f:{x:{d:'200',w:50},y:{d:'0',w:50}},gen:v=>`NexoMoveBy(${v.x}, ${v.y})`},
glook:{c:'mouse',g:'Games',t:'Turn the camera by x {x} y {y} smoothly in {n} steps',f:{x:{d:'400',w:50},y:{d:'0',w:50},n:{d:'12',w:36}},gen:v=>`NexoLook(${v.x}, ${v.y}, ${v.n})`},
gclick:{c:'mouse',g:'Games',t:'Game click {b}, hold {ms} ms',f:{b:{o:['Left','Right','Middle'],d:'Left'},ms:{d:'30',w:40}},gen:v=>`NexoGameClick(${q(v.b)}, ${v.ms})`},
msgclick:{c:'mouse',g:'Background',t:'Click window {w} at x {x} y {y} with window messages (for games, no mouse move)',f:{w:{d:'ahk_exe game.exe',w:120},x:{d:'100',w:40},y:{d:'100',w:40}},gen:v=>`PostMessage(0x201, 1, (${v.y} << 16) | ${v.x}, , ${q(v.w)})\nSleep(30)\nPostMessage(0x202, 0, (${v.y} << 16) | ${v.x}, , ${q(v.w)})`},
msgkey:{c:'key',g:'Background',t:'Press key {k} in window {w} with window messages',f:{k:{d:'a',w:40},w:{d:'ahk_exe game.exe',w:120}},gen:v=>`PostMessage(0x100, GetKeyVK(${q(v.k)}), 0, , ${q(v.w)})\nSleep(30)\nPostMessage(0x101, GetKeyVK(${q(v.k)}), 0xC0000001, , ${q(v.w)})`},
bgscroll:{c:'mouse',g:'Background',t:'Scroll {d} {n} times in window {w} at x {x} y {y} without focusing it',f:{d:{o:['Up','Down'],d:'Down'},n:{d:'3',w:36},w:{d:'ahk_exe notepad.exe',w:120},x:{d:'200',w:40},y:{d:'200',w:40}},gen:v=>`ControlClick("x" ${v.x} " y" ${v.y}, ${q(v.w)}, , "Wheel${v.d}", ${v.n}, "NA Pos")`},
bgtext:{c:'key',g:'Background',t:'Type {s} into window {w} in the background',f:{s:{d:'hello',w:110},w:{d:'ahk_exe notepad.exe',w:120}},gen:v=>`ControlSendText(${q(v.s)}, , ${q(v.w)})`},
wwaitt:{c:'ctrl',g:'Background',t:'Wait up to {s} seconds for window {w}, then set {n} to its id (0 if it never appeared)',f:{s:{d:'10',w:36},w:{d:'ahk_exe notepad.exe',w:120},n:{d:'found',w:60}},gen:v=>`${vn(v.n)} := WinWait(${q(v.w)}, , ${v.s})`},
callo:{c:'ctrl',g:'Other',t:'On {o} call {m} with {a}',f:{o:{d:'items',w:90},m:{d:'Push',w:80},a:{d:'1',w:150}},gen:v=>`${v.o}.${v.m}(${v.a})`},
setprop:{c:'ctrl',g:'Other',t:'Set {o} . {p} to {v}',f:{o:{d:'obj',w:80},p:{d:'Name',w:80},v:{d:'1',w:130}},gen:v=>`${v.o}.${v.p} := ${v.v}`},
note:{c:'note',g:'Other',t:'Note {s}',f:{s:{d:'my note',w:170}},gen:v=>`; ${v.s}`},
sticky:{c:'note',g:'Other',t:'Sticky note {s}',f:{s:{d:'Write anything here. It becomes comments in the script.',w:300,ta:1}},gen:v=>String(v.s).split(/\r?\n/).map(l=>'; '+l).join('\n')},
logv:{c:'misc',g:'Debug',t:'Log {s} to the debug panel',f:{s:{d:'checkpoint',w:150}},gen:v=>`NexoLog(${qi(v.s)})`},
logt:{c:'misc',g:'Debug',t:'Log {s} with the time',f:{s:{d:'checkpoint',w:150}},gen:v=>`NexoLog(FormatTime(, "HH:mm:ss") " " ${qi(v.s)})`},
pausehere:{c:'misc',g:'Debug',t:'Pause here until I press F8 (only when debugging)',f:{},gen:()=>`NexoPause()`},
exit:{c:'misc',g:'Other',t:'Stop script',f:{},gen:()=>'ExitApp'},
regex:{c:'misc',g:'Text',t:'Set {n} to the first match of pattern {p} in {v}',f:{n:{d:'found',w:60},p:{d:'\\d+',w:80},v:{d:'text',w:70}},gen:v=>`${vn(v.n)} := RegExMatch(${v.v}, ${q(v.p)}, &__m) ? __m[0] : ""`},
regrep:{c:'misc',g:'Text',t:'Set {n} to {v} with pattern {p} replaced by {r}',f:{n:{d:'clean',w:60},v:{d:'text',w:70},p:{d:'\\s+',w:70},r:{d:' ',w:50}},gen:v=>`${vn(v.n)} := RegExReplace(${v.v}, ${q(v.p)}, ${q(v.r)})`},
ifregex:{c:'ctrl',g:'Control',box:1,t:'If {v} matches pattern {p}',f:{v:{d:'text',w:80},p:{d:'^\\d+$',w:90}},gen:v=>`if RegExMatch(${v.v}, ${q(v.p)}) {`},
cont:{c:'ctrl',g:'Control',t:'Skip to the next repeat',f:{},gen:()=>'continue'},
arrnew:{c:'misc',g:'Variables',t:'Make list {n} with items {v}',f:{n:{d:'items',w:60},v:{d:'"a", "b", "c"',w:130}},gen:v=>`${vn(v.n)} := [${v.v}]`},
arradd:{c:'misc',g:'Variables',t:'Add {v} to list {n}',f:{v:{d:'"d"',w:70},n:{d:'items',w:60}},gen:v=>`${vn(v.n)}.Push(${v.v})`},
arrget:{c:'misc',g:'Variables',t:'Set {n} to item number {i} of list {l}',f:{n:{d:'item',w:60},i:{d:'1',w:35},l:{d:'items',w:60}},gen:v=>`${vn(v.n)} := ${vn(v.l)}[${v.i}]`},
arrlen:{c:'misc',g:'Variables',t:'Set {n} to how many items are in list {l}',f:{n:{d:'total',w:60},l:{d:'items',w:60}},gen:v=>`${vn(v.n)} := ${vn(v.l)}.Length`},
arrpop:{c:'misc',g:'Variables',t:'Take the last item out of list {l} into {n}',f:{n:{d:'last',w:60},l:{d:'items',w:60}},gen:v=>`${vn(v.n)} := ${vn(v.l)}.Pop()`},
arrrand:{c:'misc',g:'Variables',t:'Set {n} to a random item of list {l}',f:{n:{d:'pick',w:60},l:{d:'items',w:60}},gen:v=>`${vn(v.n)} := ${vn(v.l)}[Random(1, ${vn(v.l)}.Length)]`},
mapnew:{c:'misc',g:'Variables',t:'Make a lookup table (map) called {n}',f:{n:{d:'scores',w:70}},gen:v=>`${vn(v.n)} := Map()`},
mapset:{c:'misc',g:'Variables',t:'In map {m} set {k} to {v}',f:{m:{d:'scores',w:70},k:{d:'"bob"',w:70},v:{d:'10',w:60}},gen:v=>`${vn(v.m)}[${v.k}] := ${v.v}`},
mapget:{c:'misc',g:'Variables',t:'Set {n} to {k} from map {m} (or {d} if missing)',f:{n:{d:'score',w:60},k:{d:'"bob"',w:70},m:{d:'scores',w:70},d:{d:'0',w:40}},gen:v=>`${vn(v.n)} := ${vn(v.m)}.Get(${v.k}, ${v.d})`},
ifmaphas:{c:'ctrl',g:'Control',box:1,t:'If map {m} has {k}',f:{m:{d:'scores',w:70},k:{d:'"bob"',w:70}},gen:v=>`if ${vn(v.m)}.Has(${v.k}) {`},
wclass:{c:'misc',g:'Window',t:'Get the active window class into {n}',f:{n:{d:'cls',w:70}},gen:v=>`${vn(v.n)} := WinGetClass("A")`},
wproc:{c:'misc',g:'Window',t:'Get the active window program name into {n}',f:{n:{d:'prog',w:70}},gen:v=>`${vn(v.n)} := WinGetProcessName("A")`},
scrsz:{c:'misc',g:'Screen',t:'Set {n} to the {k}',f:{n:{d:'sw',w:50},k:{d:'A_ScreenWidth',o:['A_ScreenWidth','A_ScreenHeight']}},gen:v=>`${vn(v.n)} := ${v.k}`},
envget:{c:'misc',g:'System',t:'Set {n} to the environment value {k}',f:{n:{d:'path',w:60},k:{d:'USERNAME',w:90}},gen:v=>`${vn(v.n)} := EnvGet(${q(v.k)})`},
regread:{c:'misc',g:'System',t:'Set {n} to registry value {v} in {k}',f:{n:{d:'val',w:50},v:{d:'Name',w:70},k:{d:'HKCU\\Software\\MyApp',w:150}},gen:v=>`${vn(v.n)} := RegRead(${q(v.k)}, ${q(v.v)}, "")`},
regwrite:{c:'misc',g:'System',t:'Save {d} as registry value {v} in {k}',f:{d:{d:'hello',w:70},v:{d:'Name',w:70},k:{d:'HKCU\\Software\\MyApp',w:150}},gen:v=>`RegWrite ${q(v.d)}, "REG_SZ", ${q(v.k)}, ${q(v.v)}`},
loopfiles:{c:'ctrl',g:'Files',box:1,t:'For each {m} matching {p} (use A_LoopFilePath)',f:{m:{d:'F',o:['F','D','R','FR','DR']},p:{d:'C:\\Users\\*.txt',w:150}},gen:v=>`Loop Files ${q(v.p)}, ${q(v.m)} {`},
loopparse:{c:'ctrl',g:'Text',box:1,t:'For each piece of {v} split at {s} (use A_LoopField)',f:{v:{d:'text',w:70},s:{d:',',w:40}},gen:v=>`Loop Parse ${v.v}, ${q(v.s)} {`},
waitrand:{c:'misc',g:'Time',t:'Wait a random time between {a} and {b} ms',f:{a:{d:'80',w:45},b:{d:'160',w:45}},gen:v=>`Sleep Random(${v.a}, ${v.b})`},
clickrand:{c:'mouse',g:'Mouse',t:'Click a random spot: x {x1} to {x2}, y {y1} to {y2}',f:{x1:{d:'400',w:45},x2:{d:'420',w:45},y1:{d:'300',w:45},y2:{d:'320',w:45}},gen:v=>`Click Random(${v.x1}, ${v.x2}) " " Random(${v.y1}, ${v.y2})`},
cmdout:{c:'misc',g:'System',t:'Run command {c} and save what it prints in {n}',f:{c:{d:'ipconfig',w:110},n:{d:'out',w:50}},gen:v=>`${vn(v.n)} := ComObject("WScript.Shell").Exec(A_ComSpec " /c " ${q(v.c)}).StdOut.ReadAll()`},
stopstart:{c:'misc',g:'Time',t:'Start a stopwatch called {n}',f:{n:{d:'t0',w:50}},gen:v=>`${vn(v.n)} := A_TickCount`},
stopread:{c:'misc',g:'Time',t:'Set {n} to the ms since stopwatch {s} started',f:{n:{d:'elapsed',w:60},s:{d:'t0',w:50}},gen:v=>`${vn(v.n)} := A_TickCount - ${vn(v.s)}`},
onexit:{c:'event',g:'Event',box:1,glob:1,t:'When the script is closing, do',f:{},gen:()=>`OnExit(Exit_Handler)\nExit_Handler(reason, code) {`},
wclickthru:{c:'misc',g:'Window',t:'{m} click-through for window {s}',f:{m:{d:'+',o:['+','-']},s:{d:'A',w:110}},gen:v=>`WinSetExStyle(${q(v.m+'0x20')}, ${q(v.s)})`},
fmt:{c:'misc',g:'Text',t:'Set {n} to {f} filled with {a}',f:{n:{d:'text',w:60},f:{d:'Score: {1:05}',w:110},a:{d:'count',w:70}},gen:v=>`${vn(v.n)} := Format(${q(v.f)}, ${v.a})`},
tonum:{c:'misc',g:'Text',t:'Set {n} to {v} as a number',f:{n:{d:'num',w:60},v:{d:'text',w:70}},gen:v=>`${vn(v.n)} := Number(${v.v})`},
ifnum:{c:'ctrl',g:'Control',box:1,t:'If {v} is a number',f:{v:{d:'text',w:80}},gen:v=>`if IsNumber(${v.v}) {`},
capf:{c:'misc',g:'Text',t:'Set {n} to {v} with a capital first letter',f:{n:{d:'title',w:60},v:{d:'text',w:70}},gen:v=>`${vn(v.n)} := StrUpper(SubStr(${v.v}, 1, 1)) SubStr(${v.v}, 2)`},
forarr:{c:'ctrl',g:'Control',box:1,t:'For each item {v} (number {i}) in list {l}',f:{v:{d:'item',w:55},i:{d:'idx',w:45},l:{d:'items',w:60}},gen:v=>`for ${vn(v.i)}, ${vn(v.v)} in ${vn(v.l)} {`},
formap:{c:'ctrl',g:'Control',box:1,t:'For each key {k} and value {v} in map {m}',f:{k:{d:'key',w:50},v:{d:'val',w:50},m:{d:'scores',w:60}},gen:v=>`for ${vn(v.k)}, ${vn(v.v)} in ${vn(v.m)} {`},
arrjoin:{c:'misc',g:'Variables',t:'Join list {l} into {n} with {s} between',f:{l:{d:'items',w:60},n:{d:'joined',w:60},s:{d:', ',w:40}},gen:v=>`${vn(v.n)} := ""\nfor __i, __v in ${vn(v.l)} {\n  ${vn(v.n)} .= (__i > 1 ? ${q(v.s)} : "") __v\n}`},
arrdel:{c:'misc',g:'Variables',t:'Remove item number {i} from list {l}',f:{i:{d:'1',w:35},l:{d:'items',w:60}},gen:v=>`${vn(v.l)}.RemoveAt(${v.i})`},
arrset:{c:'misc',g:'Variables',t:'Set item number {i} of list {l} to {v}',f:{i:{d:'1',w:35},l:{d:'items',w:60},v:{d:'"x"',w:70}},gen:v=>`${vn(v.l)}[${v.i}] := ${v.v}`},
arrclear:{c:'misc',g:'Variables',t:'Empty list {l}',f:{l:{d:'items',w:60}},gen:v=>`${vn(v.l)}.Length := 0`},
mapdel:{c:'misc',g:'Variables',t:'Remove {k} from map {m}',f:{k:{d:'"bob"',w:70},m:{d:'scores',w:70}},gen:v=>`${vn(v.m)}.Delete(${v.k})`},
mapcount:{c:'misc',g:'Variables',t:'Set {n} to how many entries map {m} has',f:{n:{d:'total',w:60},m:{d:'scores',w:70}},gen:v=>`${vn(v.n)} := ${vn(v.m)}.Count`},
onclip:{c:'event',g:'Event',box:1,glob:1,t:'When the clipboard changes, do',f:{},gen:()=>`OnClipboardChange(Clip_Changed)\nClip_Changed(dataType) {`},
onerr:{c:'event',g:'Event',box:1,glob:1,t:'When an error happens, do (message is e.Message)',f:{},gen:()=>`OnError(Err_Handler)\nErr_Handler(e, mode) {`},
idleget:{c:'misc',g:'System',t:'Set {n} to how long you have been idle (ms)',f:{n:{d:'idle',w:60}},gen:v=>`${vn(v.n)} := A_TimeIdle`},
sysval:{c:'misc',g:'System',t:'Set {n} to {k}',f:{n:{d:'info',w:60},k:{d:'A_UserName',o:['A_UserName','A_ComputerName','A_ScriptDir','A_Desktop','A_MyDocuments','A_Temp','A_AppData','A_WinDir','A_Now','A_OSVersion','A_IsAdmin']}},gen:v=>`${vn(v.n)} := ${v.k}`},
fsize:{c:'misc',g:'Files',t:'Set {n} to the size of file {p} in KB',f:{n:{d:'kb',w:50},p:{d:'C:\\file.txt',w:130}},gen:v=>`${vn(v.n)} := FileGetSize(${q(v.p)}, "K")`},
mkshortcut:{c:'misc',g:'Files',t:'Make a shortcut at {l} pointing to {t}',f:{l:{d:'C:\\Users\\Public\\Desktop\\MyLink.lnk',w:170},t:{d:'C:\\Windows\\notepad.exe',w:150}},gen:v=>`FileCreateShortcut(${q(v.t)}, ${q(v.l)})`},
wstate:{c:'misc',g:'Window',t:'Set {n} to the state of window {s} (-1 min, 0 normal, 1 max)',f:{n:{d:'state',w:50},s:{d:'A',w:90}},gen:v=>`${vn(v.n)} := WinGetMinMax(${q(v.s)})`},
wsnap:{c:'misc',g:'Window',t:'Snap window {s} to the {m}',f:{s:{d:'A',w:90},m:{d:'Left half',o:['Left half','Right half','Top half','Bottom half','Center']}},gen:v=>{const a={'Left half':'__l, __t, (__r - __l) // 2, __b - __t','Right half':'__l + (__r - __l) // 2, __t, (__r - __l) // 2, __b - __t','Top half':'__l, __t, __r - __l, (__b - __t) // 2','Bottom half':'__l, __t + (__b - __t) // 2, __r - __l, (__b - __t) // 2','Center':'__l + (__r - __l) // 5, __t + (__b - __t) // 5, (__r - __l) * 3 // 5, (__b - __t) * 3 // 5'}[v.m]||'__l, __t, __r - __l, __b - __t';return `WinRestore(${q(v.s)})\nMonitorGetWorkArea(, &__l, &__t, &__r, &__b)\nWinMove(${a}, ${q(v.s)})`}},
wgetpos:{c:'misc',g:'Window',t:'Save window {s} position in {x},{y} and size in {w},{h}',f:{s:{d:'A',w:70},x:{d:'wx',w:40},y:{d:'wy',w:40},w:{d:'ww',w:40},h:{d:'wh',w:40}},gen:v=>`WinGetPos(&${vn(v.x)}, &${vn(v.y)}, &${vn(v.w)}, &${vn(v.h)}, ${q(v.s)})`},
monitorcount:{c:'misc',g:'Screen',t:'Set {n} to how many monitors there are',f:{n:{d:'screens',w:60}},gen:v=>`${vn(v.n)} := MonitorGetCount()`},
webgo:{c:'ui',g:'Window UI',t:'In web view {c} go to {u}',f:{c:{d:'wb1',w:60,ctl:1},u:{d:'"https://www.autohotkey.com"',w:170}},gen:v=>`${vn(v.c)}.Value.Navigate(${v.u})`},
webback:{c:'ui',g:'Window UI',t:'In web view {c} go {m}',f:{c:{d:'wb1',w:60,ctl:1},m:{d:'back',o:['back','forward','refresh']}},gen:v=>`${vn(v.c)}.Value.${({back:'GoBack',forward:'GoForward',refresh:'Refresh'})[v.m]||'GoBack'}()`},
tvadd:{c:'ui',g:'Window UI',t:'Add {t} to tree {c}',f:{t:{d:'New item',w:90},c:{d:'tv1',w:60,ctl:1}},gen:v=>`${vn(v.c)}.Add(${q(v.t)})`},
tvclear:{c:'ui',g:'Window UI',t:'Empty tree {c}',f:{c:{d:'tv1',w:60,ctl:1}},gen:v=>`${vn(v.c)}.Delete()`},
tvsel:{c:'ui',g:'Window UI',t:'Save the selected item text of tree {c} in {n}',f:{c:{d:'tv1',w:60,ctl:1},n:{d:'picked',w:55}},gen:v=>`${vn(v.n)} := ${vn(v.c)}.GetText(${vn(v.c)}.GetSelection())`},
ctlfont:{c:'ui',g:'Window UI',t:'Set the font of {c} to {o}',f:{c:{d:'txt1',w:60,ctl:1},o:{d:'s14 bold',w:90}},gen:v=>`${vn(v.c)}.SetFont(${q(v.o)})`},
ctlcolor:{c:'ui',g:'Window UI',t:'Make the text of {c} color {k} (hex like FF0000)',f:{c:{d:'txt1',w:60,ctl:1},k:{d:'FF0000',w:60}},gen:v=>`${vn(v.c)}.SetFont(${q('c'+v.k)})`},
guiflash:{c:'ui',g:'Window UI',t:'Flash the window in the taskbar',f:{},gen:()=>`${GUI.v||'myGui'}.Flash()`},
guialpha:{c:'ui',g:'Window UI',t:'Make the window see-through: {a} (0 invisible - 255 solid)',f:{a:{d:'200',w:45}},gen:v=>`WinSetTransparent(${v.a}, "ahk_id " ${GUI.v||'myGui'}.Hwnd)`},
};
const LBL={hotkey:'When key pressed',loop:'Repeat N',forever:'Repeat forever',while:'While',if:'If',else:'Else',brk:'Break',send:'Press keys',text:'Type text',hold:'Hold / release',click:'Click',move:'Move mouse',wait:'Wait',msg:'Message box',tip:'Tooltip',run:'Open / run',win:'Focus window',set:'Set variable',tog:'Flip variable',note:'Note',exit:'Stop script',hotstr:'When I type',abbr:'Auto-replace',hotif:'Only in window',hotall:'Everywhere',func:'Define my block',callo:'Call a method',gmove:'Move mouse by (games)',glook:'Turn camera (games)',gclick:'Game click',msgclick:'Click with window messages',msgkey:'Press key with window messages',bgscroll:'Scroll without focus',bgtext:'Type in background',wwaitt:'Wait for window (with timeout)',appendv:'Add to the end of',setprop:'Set a property',ucall:'Use my block',call:'Run function',kwait:'Wait for key up',paste:'Paste',csend:'Send to window',drag:'Drag mouse',scroll:'Scroll',ifpix:'If pixel color',ifimg:'If image found',clkimg:'Click found image',rwait:'Random wait',wwait:'Wait for window',wctl:'Window action',clip:'Set clipboard',beep:'Beep',fapp:'Add to file',susp:'Suspend hotkeys',rld:'Reload',rawl:'Raw line',elif:'Else if',ifkey:'If key held',ifwin:'If window active',timer:'Run every N ms',timeroff:'Stop timer',mhold:'Mouse down / up',getpos:'Save mouse pos',incr:'Add to variable',rnd:'Random number',inbox:'Ask me',tray:'Notification',sound:'Play sound',guishow:'Show my window',guislot:'UI window here',hkpass:'Key (let it through)',hkup:'When key released',remap:'Remap key',try:'Try',catch:'If that fails',finally:'Always after',ret:'Stop here',retv:'Return value',funcp:'Function (with input)',callp:'Run function with',brkif:'Stop repeating if',waitc:'Wait until',ifyes:'If I click Yes',ifwex:'If window exists',ifproc:'If program running',ifclip:'If clipboard has',foreach:'For each file',sendn:'Press N times',holdms:'Hold key for time',pastet:'Paste text',typev:'Type a value',blockin:'Block input',caps:'Caps Lock',speed:'Key / mouse speed',mclick:'Click N times',mrel:'Move mouse by',mglide:'Glide mouse',clkhold:'Hold click',getpix:'Save pixel color',waitpix:'Wait for pixel',ifpixn:'If pixel is not',ifcolor:'If color in area',wmove:'Move window',wtop:'Always on top',wclosew:'Wait window closes',pkill:'Close program',pwait:'Wait for program',runw:'Run and wait',runh:'Run command (hidden)',rclip:'Read clipboard',time:'Get time',fread:'Read file',iniload:'Load setting',math:'Math',sett:'Set to text',inputkey:'Wait for key press',showv:'Show value',settxtx:'Set text to value',guiend:'Close my window',guien:'Enable / disable control',fdel:'Delete file',dl:'Download file',inisave:'Save setting',vol:'Volume',mute:'Toggle mute',ttip2:'Timed tooltip',tiptray:'Tray tooltip',hkon:'Hotkey on / off',stopin:'Stop after N ms',onctl:'When control event',onwin:'When window event',guifocus:'Focus control',guivis:'Show / hide control',guilist:'Add to list',guichoose:'Choose list item',guititle:'Window title',guimin:'Minimize window',fsel:'Pick a file',dsel:'Pick a folder',trayitem:'Tray menu item',traysep:'Tray separator',trayclear:'Remove standard tray items',traydef:'Default tray item',traycheck:'Tray item state',trayicon:'Tray icon',trayhide:'Hide / show tray icon',trayshow:'Show tray menu',numstate:'Num / Scroll Lock',kwaitd:'Wait for key down',relmod:'Release modifier keys',bgclick:'Background click',mwin:'Mouse to window center',imgclick:'Wait for image, click',colorclick:'Click found color',wintitle:'Active window title',wtrans:'Window transparency',whide:'Hide / show window',wcenter:'Center window',join:'Join text',strlen:'Text length',strcase:'Upper / lower case',strrep:'Replace text',strsplit:'Split text',copysel:'Copy selected text',clrclip:'Clear clipboard',ifcmp:'If compare',iftext:'If text contains',forlist:'For each in list',whiletime:'Repeat for time',pausesc:'Pause script',ifexist:'If file exists',fcopy:'Copy file',fmove:'Move file',dircreate:'Make folder',power:'Computer power',runadmin:'Run as admin',speak:'Say out loud',shot:'Screenshot',media:'Media key',guicolor:'Color control',slowtype:'Type slowly',typeline:'Type + Enter',holdwhile:'While holding key',multiclick:'Click N times (delay)',jiggle:'Wiggle mouse',ifimgv:'If image in area',minall:'Show desktop',actrun:'Activate or run',runmode:'Run minimized / hidden',waitact:'Wait until active',wsize:'Resize window',closeall:'Close all matching',round:'Round number',absv:'Absolute value',minmax:'Min / Max',modv:'Remainder',pickrnd:'Random choice',pad:'Pad with zeros',setbool:'Set true / false',trimv:'Trim spaces',substr:'Part of text',instrv:'Find in text',repeat:'Repeat text',ifstarts:'If starts with',plainclip:'Plain text clipboard',dateadd:'Date from now',waittime:'Wait until time',ifhour:'If hour between',ifday:'If today is',fwrite:'Save text to file',forlines:'For each file line',dirdel:'Delete folder',httpget:'Read web page',volset:'Set volume',muteset:'Mute sound',recempty:'Empty recycle bin',monoff:'Monitor off',soundwait:'Play sound and wait',ask3:'Ask Yes / No / Cancel',askpw:'Ask password',every:'Every N ms',after:'After N ms',include:'Include file',setctlv:'Set control to value',guiclear:'Clear control',guicheck:'Tick checkbox',guilistset:'Replace list items',guimove:'Move control',guibg:'Window background',lvadd:'Add list row',lvclear:'Clear list view',lvsel:'Selected row',lvtext:'Selected row text',sbtext:'Status bar text',guihide:'Hide my window',setctl:'Set control value',settxt:'Set control text',getctl:'Read control value',};
Object.assign(LBL,{regex:'First regex match',regrep:'Regex replace',ifregex:'If matches pattern',cont:'Skip to next repeat',arrnew:'Make list',arradd:'Add to list',arrget:'Get list item',arrlen:'List length',arrpop:'Take last from list',arrrand:'Random list item',mapnew:'Make map',mapset:'Map: set',mapget:'Map: get',ifmaphas:'If map has',wclass:'Window class',fmt:'Fill a template',tonum:'To number',ifnum:'If is a number',capf:'Capitalize',forarr:'For each list item',formap:'For each map entry',arrjoin:'Join list',arrdel:'Remove list item',arrset:'Set list item',arrclear:'Empty list',mapdel:'Map: remove',mapcount:'Map size',onclip:'When clipboard changes',onerr:'When an error happens',idleget:'Idle time',sysval:'System value',fsize:'File size',mkshortcut:'Make shortcut',wstate:'Window state',wsnap:'Snap window',wgetpos:'Window position',monitorcount:'Monitor count',webgo:'Web view: go to',webback:'Web view: back/forward',tvadd:'Tree: add item',tvclear:'Tree: empty',tvsel:'Tree: selected item',ctlfont:'Control font',ctlcolor:'Control text color',guiflash:'Flash window',guialpha:'Window see-through',wproc:'Window program',scrsz:'Screen size',envget:'Environment value',regread:'Registry read',regwrite:'Registry write',loopfiles:'For each file',loopparse:'For each piece',waitrand:'Wait random',clickrand:'Click random spot',cmdout:'Run command, get output',stopstart:'Start stopwatch',stopread:'Read stopwatch',onexit:'When script closes',wclickthru:'Window click-through'});
let id=1,root={id:'root',t:'root',kids:[]},sel='root',selSet=new Set(),H=[],R=[],last='[]';
const snapS=()=>JSON.stringify([root.kids,GUI,SET]);
const snap=()=>{const s=snapS();if(s!==last){if(TABS[cur])TABS[cur].edited=Date.now();H.push(last);if(H.length>100)H.shift();R=[];last=s}};
const cl=b=>{const c=JSON.parse(JSON.stringify(b));(function f(n){n.id='b'+id++;n.kids.forEach(f)})(c);return c};
const fix=n=>n.kids.forEach(c=>{id=Math.max(id,+c.id.slice(1)+1);fix(c)});
addEventListener('change',snap);
const mb=(t,tip,fn)=>{const e=document.createElement('button');e.className='x';e.style.marginLeft='0';e.textContent=t;e.title=tip;e.setAttribute('aria-label',tip);e.onclick=v=>{v.stopPropagation();fn()};return e};
const KN={' ':'Space',Enter:'Enter',Escape:'Esc',ArrowUp:'Up',ArrowDown:'Down',ArrowLeft:'Left',ArrowRight:'Right',PageUp:'PgUp',PageDown:'PgDn'};
function rec(b,k,mode,el){st('Press the key or combo now…');const h=e=>{if(['Control','Shift','Alt','Meta'].includes(e.key))return;e.preventDefault();e.stopPropagation();removeEventListener('keydown',h,true);
  const n=KN[e.key]||(e.key.length===1?e.key.toLowerCase():e.key),m=(e.ctrlKey?'^':'')+(e.altKey?'!':'')+(e.shiftKey?'+':'')+(e.metaKey?'#':'');
  const v=mode==='name'?n:mode==='hot'?m+n:m+(n.length===1?n:'{'+n+'}');b.v[k]=v;el.value=v;code();snap();st('Set to '+v)};addEventListener('keydown',h,true)}
const PREV={};
async function screenGet(mode){if(!A||!A.screenTool)return null;const r=await A.screenTool(mode);if(r&&r.err){st(r.err);return null}return r}
async function pickColorField(b,k){if(!A)return st('Picking works in the desktop app');st('Click the color on the screen (Esc cancels)');const r=A.screenTool?await screenGet('color'):await A.pick();if(!r)return st('Pick cancelled');b.v[k]=r.c;render();st('Picked '+r.c)}
async function captureField(b,k){if(!A||!A.screenTool)return st('Capturing works in the desktop app');st('Drag a box around what to look for (Esc cancels)');const r=await screenGet('region');if(!r)return st('Capture cancelled');PREV[r.path]=r.preview;b.v[k]=r.path;render();st('Saved a '+r.w+'×'+r.h+' picture')}
async function pick(b,n){if(!A)return st('Picking works in the desktop app');
  if(A.screenTool){st('Click the spot on the screen (Esc cancels)');const r=await screenGet('point');if(!r)return st('Pick cancelled');b.v['x'+n]=String(r.x);b.v['y'+n]=String(r.y);if(n===''&&T[b.t].f.c)b.v.c=r.c;render();return st('Picked '+r.x+', '+r.y)}st('Move the mouse to the spot, then press F8 (Esc cancels)');
  const r=await A.pick();if(!r)return st('Pick cancelled');b.v['x'+n]=String(r.x);b.v['y'+n]=String(r.y);if(n===''&&T[b.t].f.c)b.v.c=r.c;render();st('Picked '+r.x+', '+r.y)}
function parseAhk(txt){
  txt=String(txt);{const mi=txt.indexOf(HMARK);if(mi>=0)txt=txt.slice(0,mi)}txt=txt.replace(/"AHK Blocks"/g,'"Nexo Ahks"');let v1=null;if(looksV1(txt)){v1=v1to2(txt);txt=v1.text}
  const genMatch=(L,li,gv,mode)=>{const r=genFind(L,li,gv,mode);if(!r)return 0;add(r.t,r.v,r.box);return r.n};
  const top={kids:[]},stk=[top];let raw=0,hdr=true,adm=false,skip=0,n=0,rawN=0,inui=0,gui=null,ps={};
  const U=x=>{const m=String(x).trim().match(/^"((?:[^"`]|`.)*)"$/);return!m||/`[^"`nrt]/.test(m[1])?null:unq(m[1])};
  const bal=x=>{let d=0;for(const c of x){if(c==='(')d++;if(c===')'&&--d<0)return false}return d===0};
  const un=c=>{c=c.trim();return c[0]==='('&&c.endsWith(')')&&bal(c.slice(1,-1))?c.slice(1,-1):c};
  const add=(t,v,box)=>{const b=mk(t,v);if(box&&T[t]&&T[t].glob)b.gl=[];stk[stk.length-1].kids.push(b);if(box)stk.push(b);n++;return b};
  const M={SendText:['text','s'],MsgBox:['msg','s'],ToolTip:['tip','s'],Run:['run','p'],WinActivate:['win','s'],WinWait:['wwait','s'],KeyWait:['kwait','k'],SoundPlay:['sound','f']};
  const one={ExitApp:'exit',break:'brk',return:'ret',Reload:'rld',Suspend:'susp','myGui.Show()':'guishow','myGui.Hide()':'guihide','A_TrayMenu.Add()':'traysep','A_TrayMenu.Delete()':'trayclear','A_TrayMenu.Show()':'trayshow'};
  function stmt(l){let m,u;
    const pm=l.match(/^(Send|SendText|Sleep|MsgBox|ToolTip|Run|Click|MouseMove|WinActivate|WinWait|KeyWait|SoundPlay|WinMinimize|WinMaximize|WinRestore|WinClose|SoundBeep)\((.*)\)$/);if(pm&&bal(pm[2]))l=pm[1]+(pm[2].trim()?' '+pm[2].trim():'');
    if(gui&&l===gui.v+'.Show()'){add('guishow');return 1}if(gui&&l===gui.v+'.Hide()'){add('guihide');return 1}
    if(one[l]){add(one[l]);return 1}
    if(m=l.match(/^Send\s+(".*")$/)){u=U(m[1]);if(u===null)return 0;const h=u.match(/^\{(\S+) (down|up)\}$/i),w=u.match(/^\{Wheel(Up|Down) (\d+)\}$/);
      h?add('hold',{k:h[1],m:h[2].toLowerCase()}):w?add('scroll',{d:w[1],n:w[2]}):add('send',{k:u});return 1}
    if(m=l.match(/^(\w+)\s+(".*")$/)){u=U(m[2]);if(u!==null){
      if(M[m[1]]){add(M[m[1]][0],{[M[m[1]][1]]:u});return 1}
      const w=m[1].match(/^Win(Minimize|Maximize|Restore|Close)$/);if(w){add('wctl',{m:w[1],s:u});return 1}}}
    if(m=l.match(/^Sleep\s+Random\((\d+),\s*(\d+)\)$/)){add('rwait',{a:m[1],b:m[2]});return 1}
    if(m=l.match(/^Sleep\s+([^,;"]+)$/)){add('wait',{ms:m[1].trim()});return 1}
    if(m=l.match(/^MouseMove\s+([^,]+),\s*([^,]+)$/)){add('move',{x:m[1].trim(),y:m[2].trim()});return 1}
    if(l==='Click FoundX, FoundY'){add('clkimg');return 1}
    if(m=l.match(/^Click(?:\s+(.+))?$/)){if(!m[1]){add('click');return 1}
      u=U(m[1]);if(u===null){const c2=m[1].match(/^(\d+),\s*(\d+)$/);if(c2){add('click',{x:c2[1],y:c2[2]});return 1}return 0}
      const md=u.match(/^(Left|Right|Middle) (down|up)$/i);if(md){add('mhold',{b:md[1],m:md[2].toLowerCase()});return 1}
      const t=u.split(/\s+/).filter(Boolean),bt=t.filter(z=>MB.includes(z)),nm=t.filter(z=>/^\d+$/.test(z));
      if(nm.length===1&&bt.length<=1&&t.length===bt.length+1){add('mclick',{b:bt[0]||'Left',n:nm[0]});return 1}
      if(t.length!==bt.length+nm.length||bt.length>1||(nm.length&&nm.length!==2))return 0;
      add('click',{b:bt[0]||'Left',x:nm[0]||'',y:nm[1]||''});return 1}
    if(m=l.match(/^A_TrayMenu\.Default := (".*")$/)){u=U(m[1]);if(u!==null){add('traydef',{t:u});return 1}}
    if(m=l.match(/^A_TrayMenu\.(Check|Uncheck|ToggleCheck|Enable|Disable)\((".*")\)$/)){u=U(m[2]);if(u!==null){add('traycheck',{m:m[1],t:u});return 1}}
    if(m=l.match(/^TraySetIcon\((".*")\)$/)){u=U(m[1]);if(u!==null){add('trayicon',{f:u});return 1}}
    if(m=l.match(/^A_IconHidden := (true|false)$/)){add('trayhide',{m:m[1]==='true'?'Hide':'Show'});return 1}
    if(m=l.match(/^(\w+) := !\1$/)){add('tog',{n:m[1]});return 1}
    if(m=l.match(/^(\w+) := Random\((\d+), (\d+)\)$/)){add('rnd',{n:m[1],a:m[2],b:m[3]});return 1}
    if((m=l.match(/^(\w+) \+= (.+)$/))&&!/^A_/i.test(m[1])){add('incr',{n:m[1],v:m[2]});return 1}
    if((m=l.match(/^(\w+)(\+\+|--)$/))&&!/^A_/i.test(m[1])){add('incr',{n:m[1],v:m[2]==='++'?'1':'-1'});return 1}
    if((m=l.match(/^(\w+) \.= (.+)$/))&&!/^A_/i.test(m[1])){add('appendv',{n:m[1],v:m[2]});return 1}
    if((m=l.match(/^(\w+) := WinWait\((.+)\)$/))&&bal(m[2])){const wa=splitArgs(m[2]);if(wa.length===3&&wa[1]===''&&UQ(wa[0])!==null){add('wwaitt',{n:m[1],w:UQ(wa[0]),s:wa[2]});return 1}}
    if((m=l.match(/^(\w+) := (.+)$/))&&!/^A_/i.test(m[1])){add('set',{n:m[1],v:m[2]});return 1}
    if(m=l.match(/^SetTimer (\w+), (\d+)$/)){m[2]==='0'?add('timeroff',{n:m[1]}):add('timer',{ms:m[2],n:m[1]});return 1}
    if(m=l.match(/^MouseGetPos &(\w+), &(\w+)$/)){add('getpos',{vx:m[1],vy:m[2]});return 1}
    if(m=l.match(/^(\w+)\(\)$/)){add('call',{n:m[1]});return 1}
    if(m=l.match(/^; ?(.*)$/)){add('note',{s:m[1]});return 1}
    return 0}
  const L=normGuiLines(bracify(prep(txt)));
  let rawBlk=null;const inits=[];
  for(let li=0;li<L.length;li++){let l=L[li].trim();let m;
    if(stk.length===1&&raw<=0&&/^#Requires\s+AutoHotkey\s+v?2/i.test(l))continue;
    if(/^; --- UI/.test(l)){const r=grabGui(L,li,1);li+=r.used-1;if(!gui){gui=r.g;if(!hdr)add('guislot',{})}continue}
    if(hdr){if(adm){if(l==='}')adm=false;continue}
      let hm;
      if(l===''||/^#Requires\b/i.test(l))continue;if((hm=l.match(/^(\w+) := 0$/))){if(!inits.includes(hm[1]))inits.push(hm[1]);continue}
      if(hm=l.match(/^#SingleInstance(?:\s+(Force|Ignore|Prompt|Off))?$/i)){ps.si=hm[1]?hm[1][0].toUpperCase()+hm[1].slice(1).toLowerCase():'Force';continue}
      if(hm=l.match(/^#MaxThreadsPerHotkey\s+(\d+)$/i)){ps.mt=+hm[1];continue}
      if(/^#NoTrayIcon$/i.test(l)){ps.notray=true;continue}
      if(hm=l.match(/^ProcessSetPriority[\s(]+"(Low|BelowNormal|Normal|AboveNormal|High)"\)?$/i)){const pv=hm[1].toLowerCase();ps.prio=pv==='normal'?'':({low:'Low',belownormal:'BelowNormal',abovenormal:'AboveNormal',high:'High'})[pv];continue}
      if(hm=l.match(/^SendMode\s+"(Input|Event|Play)"$/i)){ps.sm=hm[1];continue}
      if(l==='SetWorkingDir A_ScriptDir'){ps.wd=true;continue}
      if(hm=l.match(/^CoordMode\s+"(Mouse|Pixel)",\s*"Screen"$/i)){ps[hm[1][0].toLowerCase()==='m'?'cm':'cp']=true;continue}
      if(/^DetectHiddenWindows\s+(true|1)$/i.test(l)){ps.dh=true;continue}
      if(hm=l.match(/^SetKeyDelay\s+(-?\d+)$/i)){ps.kd=hm[1];continue}
      if(hm=l.match(/^SetMouseDelay\s+(-?\d+)$/i)){ps.md=hm[1];continue}
      if(l==='Persistent true'){ps.pers=true;continue}
      if(l==='if !A_IsAdmin {'){adm=true;ps.admin=true;continue}
      hdr=false}
    if(!l)continue;
    if(l==='#HotIf'&&/^; Emergency stop:/.test((L[li+1]||'').trim()))continue;
    if(skip){skip=0;continue}
    if(raw<=0){const gm=genMatch(L,li,gui?gui.v:'myGui',1);if(gm){li+=gm-1;continue}}
    if(raw>0){const dd=/^\}/.test(l)?raw-1:raw,tx='  '.repeat(dd)+l;if(rawBlk)rawBlk.v.s+='\n'+tx;else add('rawl',{s:tx});rawN++;if(/\{$/.test(l))raw++;if(/^\}/.test(l))raw--;if(raw<=0)rawBlk=null;continue}
    if(!gui&&/^\w+\s*:=\s*Gui\(.*\)$/.test(l)){const r=grabGui(L,li,0);li+=r.used-1;gui=r.g;add('guislot',{});continue}
    {const gd=l.match(/^global\s+(.+)$/i);if(gd){const parts=splitArgs(gd[1]),names=parts.map(z=>(z.match(/^(\w+)/)||[])[1]).filter(Boolean);
      let fn=null;for(let k=stk.length-1;k>=1;k--)if(stk[k].gl){fn=stk[k];break}
      if(fn)names.forEach(x=>{if(!fn.gl.includes(x))fn.gl.push(x)});
      if(parts.length===1&&/^\w+\s*:=/.test(parts[0])){l=parts[0].replace(/\s*:=\s*/,' := ');L[li]=l}
      else if(parts.every(z=>/^\w+$/.test(z)))continue}}
    if(/^; Emergency stop:/.test(l)){ps.panic=true;const ek=l.match(/^; Emergency stop:\s*(.*)$/);if(ek&&ek[1])ps.pk=ek[1].trim();skip=1;continue}
    if(l==='}'){if(stk.length>1)stk.pop();continue}
    if(/^\}\s*else\s*\{$/.test(l)||l==='else {'){if(l[0]==='}'&&stk.length>1)stk.pop();add('else',{},1);continue}
    if(m=l.match(/^else if\s*(.*?)\s*\{$/)){add('elif',{c:un(m[1])},1);continue}
    if(l[0]===':'){
      if(m=l.match(/^:[^:]*:(.+?)::\s*\{$/)){add('hotstr',{s:m[1]},1);continue}
      if(m=l.match(/^:[^:]*:(.+?)::(.+)$/)){add('abbr',{a:m[1],b:m[2]});continue}}
    else if(m=l.match(/^(\S+?(?: up)?)::\s*\{$/)){add('hotkey',{key:m[1]},1);continue}
    else if((m=l.match(/^(\S+?)::([A-Za-z][A-Za-z0-9_]*|[^\s\w])$/))&&!/^(exitapp|reload|suspend|pause|return|break|continue)$/i.test(m[2])){add('remap',{a:m[1],b:m[2]});continue}
    else if(m=l.match(/^(\S+?)::(.+)$/)){add('hotkey',{key:m[1]},1);if(!stmt(m[2].trim())){add('rawl',{s:m[2].trim()});rawN++}stk.pop();continue}
    if(l==='#HotIf'){add('hotall');continue}
    if(m=l.match(/^#HotIf\s+WinActive\((".*")\)$/)){const u=U(m[1]);if(u!==null){add('hotif',{s:u});continue}}
    if(m=l.match(/^A_TrayMenu\.Add\((".*"),\s*(Tray_\w+)\)$/)){const tt=U(m[1]);if(tt!==null&&m[2]==='Tray_'+vn(tt)&&(L[li+1]||'').trim()===m[2]+'(*) {'){add('trayitem',{t:tt},1);li++;continue}}
    if(m=l.match(/^SetTimer\(Timer_(\w+), (-?\d+)\)$/)){if((L[li+1]||'').trim()==='Timer_'+m[1]+'() {'){const neg=m[2][0]==='-';add(neg?'after':'every',{ms:neg?m[2].slice(1):m[2],n:m[1]},1);li++;continue}}
    if(l==='try {'){add('try',{},1);continue}if(l==='catch {'){add('catch',{},1);continue}if(m=l.match(/^catch\s+(?:\w+\s+)?as\s+(\w+)\s*\{$/)){add('catch',{e:m[1]},1);continue}if(l==='finally {'){add('finally',{},1);continue}
    if(m=l.match(/^loop\s*\{$/i)){add('forever',{},1);continue}
    if((m=l.match(/^loop\s+(.+?)\s*\{$/i))&&!/^(files|parse|read|reg)\b/i.test(m[1])){add('loop',{n:m[1]},1);continue}
    if(m=l.match(/^while\s*(.+?)\s*\{$/)){add('while',{c:un(m[1])},1);continue}
    if(m=l.match(/^if ImageSearch\(&FoundX, &FoundY, 0, 0, A_ScreenWidth, A_ScreenHeight, (".*")\) \{$/)){const u=U(m[1]);if(u!==null){add('ifimg',{p:u},1);continue}}
    if(m=l.match(/^if \(PixelGetColor\((\d+), (\d+)\) = (".*")\) \{$/)){const u=U(m[3]);if(u!==null){add('ifpix',{x:m[1],y:m[2],c:u},1);continue}}
    if(m=l.match(/^if\s*(.+?)\s*\{$/)){add('if',{c:un(m[1])},1);continue}
    if(gui&&(m=l.match(/^(\w+?)_(Click|Change|DoubleClick|Focus|LoseFocus|ContextMenu)\(\*\)\s*\{$/))&&gui.ctl.some(c=>!c.k&&c.n===m[1])){const c=gui.ctl.find(x=>!x.k&&x.n===m[1]);c.evs=(c.evs||[]).filter(e=>!e.includes(m[1]+'_'+m[2]));add('onctl',{c:m[1],ev:m[2]},1);continue}
    if(gui&&(m=l.match(new RegExp('^'+gui.v+'_(Close|Escape|Size|ContextMenu)\\(\\*\\)\\s*\\{$')))){gui.ctl=gui.ctl.filter(x=>!(x.k&&x.s.includes('"'+m[1]+'", '+gui.v+'_'+m[1]+')')));add('onwin',{ev:m[1]},1);continue}
    if(stk.length===1&&(m=l.match(/^(\w+)\(\)\s*\{$/))){add('func',{n:m[1]},1);continue}
    if(stk.length===1&&(m=l.match(/^(\w+)\((.+)\)\s*\{$/))&&!/^(if|while|for|loop|switch|catch|try|else)$/i.test(m[1])&&bal(m[2])){add('funcp',{n:m[1],p:m[2]},1);continue}
    if(!stmt(l)){const gm=genMatch(L,li,gui?gui.v:'myGui',2);if(gm){li+=gm-1;continue}
      if((m=l.match(/^(\w+)\((.+)\)$/))&&bal(m[2])&&!/^(if|while|for|loop|switch|catch|return)$/i.test(m[1])&&!/^A_/.test(m[1])){add('callp',{n:m[1],a:m[2]});continue}
      if((m=splitCall(l))&&!/^(this|super)\b/.test(m[1])){add('callo',{o:m[1],m:m[2],a:m[3]});continue}
      if((m=l.match(/^([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\.(\w+)\s*:=\s*(.+)$/))&&!/^(this|super)\b/.test(m[1])){add('setprop',{o:m[1],p:m[2],v:m[3]});continue}
      const rb=add('rawl',{s:l});rawN++;if(/\{$/.test(l)){raw=1;rawBlk=rb}}}
  const hasTr=k=>k.some(b=>b.t==='trayitem'||hasTr(b.kids));if(ps.pers&&hasTr(top.kids))delete ps.pers;
  /* blocks that talk to a window control but name something that is not one (a loop variable, say) become plain method/property blocks, line by line so nothing is lost */
  {const names=new Set((gui?gui.ctl:[]).filter(c=>!c.k&&c.n).map(c=>c.n));
   const lineBlock=x=>{let mm;x=x.trim();
     if((mm=x.match(/^([A-Za-z_]\w*(?:\.\w+)*)\.(\w+)\s*:=\s*(.+)$/)))return mk('setprop',{o:mm[1],p:mm[2],v:mm[3]});
     if((mm=x.match(/^([A-Za-z_]\w*(?:\.\w+)*)\.(\w+)\((.*)\)$/))&&bal(mm[3]))return mk('callo',{o:mm[1],m:mm[2],a:mm[3]});
     return mk('rawl',{s:x})};
   (function dm(a){for(let i=0;i<a.length;i++){const b=a[i],t=T[b.t];
     if(t&&!t.box&&t.gen&&b.v&&typeof b.v.n==='string'&&/^A_/i.test(b.v.n.trim())){const nb=String(genOf(b)).split('\n').filter(z=>z.trim()).map(z=>mk('rawl',{s:z.trim()}));a.splice(i,1,...nb);i+=nb.length-1;continue}
     if(t&&!t.box&&t.gen){const fe=Object.entries(t.f||{}).find(([k,sp])=>sp.ctl);
       if(fe){const nm=String(b.v[fe[0]]||'').trim();
         if(nm&&!names.has(nm)){const lines=String(genOf(b)).split('\n').filter(z=>z.trim());const nb=lines.map(lineBlock);a.splice(i,1,...nb);i+=nb.length-1;continue}}}
     if(b.kids)dm(b.kids)}})(top.kids)}
  upgradeCalls(top.kids);ps.inits=inits;try{ps.known=[...vars({kids:top.kids})]}catch(e){ps.known=[]}
  return{kids:top.kids,n,rawN,gui,set:ps,v1}}
let TABS=[],cur=0,GUI={title:'My Window',w:420,h:300,top:false,close:true,ctl:[]};
function stripC(l){let qc='';for(let i=0;i<l.length;i++){const c=l[i];if(qc){if(c==='`')i++;else if(c===qc)qc='';continue}if(c==='"'||c==="'"){qc=c;continue}if(c===';'&&i>0&&/\s/.test(l[i-1]))return[l.slice(0,i).trimEnd(),l.slice(i+1).trim()]}return[l,'']}
const HDRX=/^(loop|while|if|else|try|catch|finally|for|switch|class)\b|::$|^[\w.]+\(.*\)$/i;
/* "obj.method(args)" where obj may itself be a call or chain, e.g. FileOpen(p, "w").Write(s) */
function splitCall(l){const bal=t=>{let d=0,q='';for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='`')i++;else if(c===q)q='';continue}if(c==='"'||c==="'"){q=c;continue}if('([{'.includes(c))d++;else if(')]}'.includes(c)){d--;if(d<0)return false}}return d===0&&!q};if(!/\)$/.test(l))return null;let d=0,q='',open=-1;for(let i=l.length-1;i>=0;i--){const c=l[i];if(c==='"'||c==="'"){/* walk strings from the left instead */open=-2;break}if(c===')')d++;else if(c==='('){d--;if(d===0){open=i;break}}}
  if(open===-2){d=0;q='';const pos=[];for(let i=0;i<l.length;i++){const c=l[i];if(q){if(c==='`')i++;else if(c===q)q='';continue}if(c==='"'||c==="'"){q=c;continue}if(c==='(')pos.push(i);else if(c===')'){const o=pos.pop();if(i===l.length-1)open=o}}}
  if(open<=0)return null;const head=l.slice(0,open),mm=head.match(/^(.*[^.\s])\.([A-Za-z_]\w*)$/);if(!mm)return null;
  const obj=mm[1],args=l.slice(open+1,-1);if(!bal(obj)||!bal(args)||!/^[A-Za-z_]/.test(obj)||/^(if|while|for|loop|return|throw|else|try|catch)\b/i.test(obj)||/\s(:=|=|\+=|-=|\.=)\s/.test(obj.replace(/"[^"]*"/g,'')))return null;return[l,obj,mm[2],args]}
function collapseWs(t){let o='',q='',sp=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){o+=c;if(c==='`'&&i+1<t.length)o+=t[++i];else if(c===q)q='';continue}if(c==='"'||c==="'"){q=c;sp=false;o+=c;continue}if(c===' '||c==='\t'){if(!sp)o+=' ';sp=true;continue}sp=false;o+=c}return o}
/* brace-less if/else/for/while/loop/try/catch bodies get braces so the block importer can read them */
function bracify(L){
  const strip=t=>{let o='',q='';for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='`'){i++;continue}if(c===q)q='';continue}if(c==='"'||c==="'"){q=c;continue}o+=c}return o};
  const parenEnd=(t,from)=>{let d=0,q='';for(let i=from;i<t.length;i++){const c=t[i];if(q){if(c==='`')i++;else if(c===q)q='';continue}if(c==='"'||c==="'"){q=c;continue}if(c==='(')d++;else if(c===')'){d--;if(d===0)return i}}return-1};
  const HM=/^(if|while|for|loop|else|try|catch|finally)\b(.*)$/i;
  function one(i){const t=L[i],hm=HM.exec(t);
    if(!hm||/^(if|while|for|loop|else|try|catch|finally)\s*(:=|\.|,)/i.test(t)||/^(if|while|for|loop|else|try|catch|finally)::/i.test(t))return[[t],i+1];
    if(/\{$/.test(t)){let d=0;for(let j=i;j<L.length;j++){const x=strip(L[j]);for(const c of x){if(c==='{')d++;else if(c==='}')d--}if(d<=0){if(j===i)return[[t],i+1];return[[t,...bracify(L.slice(i+1,j)),L[j]],j+1]}}return[[t],i+1]}
    const kind=hm[1].toLowerCase();let rest=hm[2].trim(),head=t,inline='';
    if(kind==='if'||kind==='while'){if(rest[0]==='('){const e=parenEnd(rest,0);if(e<0)return[[t],i+1];if(e<rest.length-1){head=kind+' '+rest.slice(0,e+1);inline=rest.slice(e+1).trim()}}}
    else if(kind==='else'){if(/^if\b/i.test(rest)){const r2=rest.slice(2).trim();if(r2[0]==='('){const e=parenEnd(r2,0);if(e<0)return[[t],i+1];if(e<r2.length-1){head='else if '+r2.slice(0,e+1);inline=r2.slice(e+1).trim()}}}else{head='else';inline=rest}}
    else if(kind==='try'||kind==='finally'){head=kind;inline=rest}
    else if(kind==='catch'){const cm=/^((?:\w+\s+)?as\s+\w+)\s*(.*)$/i.exec(rest);if(cm){head='catch '+cm[1];inline=cm[2]}else{head='catch';inline=rest}}
    if(/^(if|while)$/.test(kind)&&!rest)return[[t],i+1];
    let body,nxt;
    if(inline){body=[inline];nxt=i+1}else{if(i+1>=L.length)return[[t],i+1];if(/^(else|catch|finally)\b/i.test(L[i+1]))return[[t],i+1];const r=one(i+1);body=r[0];nxt=r[1]}
    return[[head+' {',...body,'}'],nxt]}
  const out=[];for(let i=0;i<L.length;){const r=one(i);out.push(...r[0]);i=r[1]}return out}
function prep(txt){const out=[];
  for(const rl of txt.split(/\r?\n/)){let t=rl.trim();
    if(t==='{'){let j=out.length-1;while(j>=0&&!out[j].trim())j--;if(j>=0&&HDRX.test(out[j].trim())&&!/\{$/.test(out[j].trim())){out[j]=out[j].replace(/\s+$/,'')+' {';out.length=j+1;continue}}
    let cm='';if(t&&t[0]!==';'&&t[0]!==':'){const r=stripC(t);if(r[1]&&r[0]){t=r[0];cm='; '+r[1]}t=collapseWs(t)}
    const m=t.match(/^\}\s*(else|catch|finally)\b(.*)$/i);if(m)out.push('}',m[1]+m[2]);else out.push(t);
    if(cm)out.push(cm)}
  /* a line that starts with an operator continues the previous statement, and an open ( or [ continues until it closes */
  const dep=t=>{let d=0,q='';for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='`')i++;else if(c===q)q='';continue}if(c==='"'||c==="'"){q=c;continue}if(c==='('||c==='[')d++;else if(c===')'||c===']')d--}return d};
  const j=[];for(const t of out){const pv=j[j.length-1];
    if(pv&&t&&pv[0]!==';'&&t[0]!==';'&&!/\{$/.test(pv)&&(dep(pv)>0||/^(\.\s|&&\s|\|\|\s|\?\s|:\s|,\s)/.test(t)))j[j.length-1]=pv+' '+t;else j.push(t)}
  return j}
/* hand-written windows: turn AddText()/AddEdit()/... shorthand, empty option slots and Add(...).OnEvent(...) chains into the plain form the Designer reads */
function normGuiLines(L){
  L=L.map(x=>String(x).replace(/^(\s*)global\s+(\w+\s*:=\s*(?:Gui\(|\w+\.Add))/i,'$1$2'));
  const GV=new Set();L.forEach(x=>{const m=String(x).trim().match(/^(\w+)\s*:=\s*Gui\(/);if(m)GV.add(m[1])});if(!GV.size)return L;
  const MAP={Text:'Text',Edit:'Edit',Button:'Button',Checkbox:'Checkbox',Radio:'Radio',DropDownList:'DropDownList',DDL:'DropDownList',ComboBox:'ComboBox',ListBox:'ListBox',ListView:'ListView',TreeView:'TreeView',Slider:'Slider',Progress:'Progress',GroupBox:'GroupBox',Tab3:'Tab3',Tab2:'Tab2',Tab:'Tab',Link:'Link',Picture:'Picture',Pic:'Picture',DateTime:'DateTime',MonthCal:'MonthCal',Hotkey:'Hotkey',ActiveX:'ActiveX',StatusBar:'StatusBar'};
  const src=L.join('\n');let k=0;const fresh=()=>{let n;do{n='ctl'+(++k)}while(new RegExp('\\b'+n+'\\b').test(src));return n};const out=[];
  for(const raw of L){const l=String(raw).trim(),m=l.match(/^((?:\w+\s*:=\s*)?)(\w+)\.Add(\w*)\(/);
    if(!m||!GV.has(m[2])){out.push(raw);continue}
    const st=m[0].length;let d=1,q='',j=st;for(;j<l.length&&d>0;j++){const c=l[j];if(q){if(c==='`')j++;else if(c===q)q='';continue}if(c==='"'||c==="'"){q=c;continue}if(c==='(')d++;if(c===')')d--}
    if(d!==0){out.push(raw);continue}
    const inner=l.slice(st,j-1),rest=l.slice(j).trim();let args=splitArgs(inner);
    if(m[3]){const ty=MAP[m[3]];if(!ty){out.push(raw);continue}args=['"'+ty+'"',args[0]===undefined||args[0]===''?'""':args[0],...args.slice(1)]}else if(args[1]==='')args[1]='""';
    const pre=m[1].replace(/\s*:=\s*$/,'').trim(),call=m[2]+'.Add('+args.join(', ')+')',ch=rest.match(/^\.OnEvent\((.*)\)$/);
    if(rest&&!ch){out.push(raw);continue}
    if(ch){const nm=pre||fresh();out.push(nm+' := '+call,nm+'.OnEvent('+ch[1]+')')}else out.push((pre?pre+' := ':'')+call)}
  return out}
const UQ=x=>{const m=String(x).trim().match(/^"((?:[^"`]|`.)*)"$/);return!m||/`[^"`nrt]/.test(m[1])?null:unq(m[1])};
function skipBlk(L,i){let d=0;for(let j=i;j<L.length;j++){const x=String(L[j]).replace(/"(?:[^"`]|`.)*"/g,'""');for(const c of x){if(c==='{')d++;else if(c==='}')d--}if(d<=0)return j}return L.length-1}
function grabGui(L,s,mark){const g=newGui();Object.assign(g,{imp:1,font:false,show:false,close:false,ctl:[]});const names=new Map();let i=s,gv=null,fnt=null,curTab=null,curTabCtl=null,lastC=null,sect={x:10,y:10};
  const rx=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const guiAhead=at=>{let sh=-1;for(let j=at+1;j<L.length;j++)if(new RegExp('^'+rx(gv)+'\\.Show\\(').test(L[j].trim())){sh=j;break}if(sh<0)return false;if(sh-at<=30)return true;
    for(let j=at+1;j<sh;j++){const t=L[j].trim();if(t.includes(gv+'.')||(names.has((t.match(/^(\w+)\./)||[])[1])))return true}return false};
  const fmerge=(b,a)=>{if(!a.length)return null;const o=a[0]?UQ(a[0]):null;if(o===null&&a[0])return b;const n={...(b||{})};
    (o||'').split(/\s+/).filter(Boolean).forEach(z=>{let m;if(m=z.match(/^s(\d+(?:\.\d+)?)$/i))n.fs=+m[1];else if(/^bold$/i.test(z))n.b=true;else if(/^italic$/i.test(z))n.i=true;else if(/^underline$/i.test(z))n.u=true;else if(/^strike$/i.test(z))n.st=true;else if(/^norm$/i.test(z)){n.b=n.i=n.u=n.st=false}else if(/^cDefault$/i.test(z))n.c=null;else if(m=z.match(/^c([0-9a-f]{6})$/i))n.c=m[1];else if(m=z.match(/^w(\d+)$/i))n.b=+m[1]>=600});
    if(a[1]){const fn=UQ(a[1]);if(fn)n.face=fn}return n};
  for(;i<L.length;i++){const l=L[i].trim();let m;
    if(mark){if(i===s)continue;if(/^; --- end UI/.test(l)){i++;break}}
    if(!l)continue;
    if(!gv){if(m=l.match(/^(\w+)\s*:=\s*Gui\((.*)\)$/)){gv=m[1];g.v=gv;g.ctor=m[2];const a=splitArgs(m[2]),o=a[0]?UQ(a[0]):'',t=a[1]?UQ(a[1]):null;g.opts=o===null?'':o;g.title=t===null?'My Window':t;continue}
      if(!mark)break;gv='myGui';g.v=gv}
    const R=rx(gv);
    if((m=l.match(new RegExp('^'+R+'\\.Title\\s*:=\\s*(".*")$')))&&UQ(m[1])!==null){g.title=UQ(m[1]);g.ctor=undefined;continue}
    if(m=l.match(new RegExp('^'+R+'\\.SetFont\\((.*)\\)$'))){fnt=fmerge(fnt,splitArgs(m[1]));g.ctl.push({k:'line',s:l});continue}
    if(m=l.match(new RegExp('^'+R+'\\.BackColor\\s*:=\\s*"([0-9a-fA-F]{6})"$'))){g.bg=m[1];g.ctl.push({k:'line',s:l});continue}
    if(m=l.match(new RegExp('^(?:(\\w+)\\s*:=\\s*)?'+R+'\\.Add\\((.*)\\)$'))){const a=splitArgs(m[2]),ty=a[0]?UQ(a[0]):null;let ou=a[1]===undefined||a[1]===''?'':UQ(a[1]),optx='',optsp=false;
      if(ou===null){const dm=String(a[1]).match(/^"((?:[^"`]|`.)*)"\s+(.+)$/),lit=dm?UQ('"'+dm[1]+'"'):null;if(lit!==null&&!/^[xywh]-?\d+$/i.test(lit.trim().split(/\s+/).pop()||'')){ou=lit;optx=dm[2];optsp=/\s$/.test(lit)}}
      if(ty!==null&&ou!==null){const tk=ou.split(/\s+/).filter(Boolean),f=r=>tk.find(z=>r.test(z)),X=f(/^x-?\d+$/),Y=f(/^y-?\d+$/),W=f(/^w\d+$/),H=f(/^h\d+$/);
        const XT=tk.find(z=>/^x(?:[mps])?[+-]?\d*$/i.test(z)&&z.length>1),YT=tk.find(z=>/^y(?:[mps])?[+-]?\d*$/i.test(z)&&z.length>1);
        if(CT[ty]||ty==='StatusBar'){const rest=tk.filter(z=>![XT,YT,W,H].includes(z)),a2=a[2];
          let txt='';if(a2){const u=UQ(a2),ar=a2.match(/^\[(.*)\]$/);const it=ar?splitArgs(ar[1]).map(UQ):null;txt=u!==null?u:it&&it.every(z=>z!==null)?it.join('|'):a2}
          const posOf=(tok,axis)=>{const mm=tok&&tok.match(/^[xy](m|p|s)?([+-]?\d+)?$/i);if(!mm)return null;const kind=(mm[1]||'').toLowerCase(),nm2=mm[2]===undefined?null:+mm[2];
            if(!kind){if(nm2===null)return null;if(/^[+-]/.test(mm[2]))return lastC?(axis==='x'?lastC.x+lastC.w:lastC.y+lastC.h)+nm2:10+nm2;return nm2}
            const ad=nm2||0;if(kind==='m')return 10+ad;if(kind==='p')return lastC?(axis==='x'?lastC.x:lastC.y)+ad:10+ad;if(kind==='s')return(axis==='x'?sect.x:sect.y)+ad;return null};
          const tl=String(txt).replace(/<[^>]+>/g,'').length,est=['Text','Checkbox','Radio','Link','Button'].includes(ty)?Math.max(CT[ty]?Math.min(CT[ty].w,60):24,Math.round(tl*7.2)+(ty==='Checkbox'||ty==='Radio'?26:ty==='Button'?20:4)):null;
          const inTab=!!(curTab&&curTabCtl&&!isTab(ty)),base=inTab?(lastC&&lastC.tabOf===curTab.id&&lastC.pg===curTab.pg?lastC:null):lastC;
          let ax=posOf(XT,'x'),ay=posOf(YT,'y');if(ax===null)ax=inTab?curTabCtl.x+12:10;if(ay===null)ay=base?base.y+base.h+8:(inTab?curTabCtl.y+32:10);if(ty==='StatusBar'){ax=0;ay=0}
          const RT=tk.find(z=>/^r\d+(\.\d+)?$/i.test(z));
          const aw=W?+W.slice(1):est!==null?est:CT[ty]?CT[ty].w:100,ah=H?+H.slice(1):RT?Math.round(parseFloat(RT.slice(1))*20+8):CT[ty]?CT[ty].h:24;
          const c={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),t:ty,n:m[1]||'',anon:!m[1],x:ax,y:ay,w:aw,h:ah,hw:W?1:0,hh:H?1:0,opt:rest.join(' '),arg:a2,text:txt,fn:'',evs:[],imp:1,fp:fnt?{...fnt}:null};
          if(curTab&&!isTab(ty)){c.tabOf=curTab.id;c.pg=curTab.pg}
          if(optx){c.optx=optx;if(optsp)c.optsp=1}g.ctl.push(c);if(m[1])names.set(m[1],c);if(ty!=='StatusBar')lastC=c;if(rest.some(z=>/^Section$/i.test(z)))sect={x:ax,y:ay};continue}}
      g.ctl.push({k:'line',s:l});continue}
    if((m=l.match(/^(\w+)\.UseTab\((.*)\)$/))&&names.has(m[1])&&isTab(names.get(m[1]).t)){const tc=names.get(m[1]),a=m[2].trim();
      if(a===''){if(curTabCtl)lastC=curTabCtl;curTab=null;curTabCtl=null;continue}
      let pg=/^\d+$/.test(a)?+a:null;if(pg===null){const nm=UQ(a);if(nm!==null){const ix=String(tc.text).split('|').findIndex(z=>z.toLowerCase()===nm.toLowerCase());if(ix>=0)pg=ix+1}}
      if(pg){curTab={id:tc.id,pg};curTabCtl=tc;continue}
      g.ctl.push({k:'line',s:l});curTab=null;curTabCtl=null;continue}
    if((m=l.match(/^(\w+)\.SetFont\((.*)\)$/))&&names.has(m[1])){const c=names.get(m[1]);c.fp=fmerge(c.fp,splitArgs(m[2]));g.ctl.push({k:'line',s:l});continue}
    if((m=l.match(/^(\w+)\.ModifyCol\((\d+),\s*"(Integer|Float|AutoHdr)"\)$/))&&mark&&names.has(m[1])&&names.get(m[1]).t==='ListView'){const c=names.get(m[1]);if(m[3]==='AutoHdr')c.autohdr=1;else{c.ct=c.ct||[];c.ct[+m[2]-1]=m[3]}continue}
    if((m=l.match(/^(\w+)\.OnEvent\("Click",\s*(\w+)_Pick\)$/))&&mark&&m[1]===m[2]&&names.has(m[1])&&names.get(m[1]).t==='Button'){names.get(m[1]).colorpick=1;continue}
    if((m=l.match(/^(\w+)_color\s*:=\s*0xFFFFFF$/))&&mark&&names.has(m[1])&&names.get(m[1]).t==='Button')continue;
    if((m=l.match(/^(\w+)_Pick\(\*\) \{$/))&&names.has(m[1])&&/^; nexo-colorpick$/.test((L[i+1]||'').trim())){i=skipBlk(L,i);continue}
    if((m=l.match(/^(\w+)\.OnEvent\("(\w+)",\s*(.+)\)$/))&&names.has(m[1])){const c=names.get(m[1]),lm=m[3].trim().match(/^\(\*\)\s*=>\s*(\w+)\(\)$/);
      if(lm&&m[2]===evOf(c)&&!c.fn)c.fn=lm[1];else c.evs.push(l);continue}
    if(new RegExp('^'+R+'\\.OnEvent\\("Close",\\s*\\(\\*\\)\\s*=>\\s*ExitApp\\(\\)\\)$').test(l)){g.close=true;continue}
    if(m=l.match(new RegExp('^'+R+'\\.Show\\((.*)\\)$'))){g.show=true;g.showr=m[1].trim();const u=UQ(m[1]);if(u){const w=u.match(/\bw(\d+)/),h=u.match(/\bh(\d+)/);if(w)g.w=+w[1];if(h)g.h=+h[1]}if(!mark){i++;break}continue}
    if(new RegExp('^'+R+'\\.OnEvent\\("Size",\\s*'+R+'_Anchor\\)$').test(l))continue;
    if(new RegExp('^'+R+'_Anchor\\(g, mm, w, h\\) \\{$').test(l)){const mt=(L[i+1]||'').trim().match(/^; nexo-anchors (.*)$/);if(mt){try{g.anchors=JSON.parse(mt[1])}catch(e){}}i=skipBlk(L,i);continue}
    if((m=l.match(/^Nexo_Tips\[(\w+)\.Hwnd\]\s*:=\s*(".*")$/))&&names.has(m[1])){const tv=UQ(m[2]);if(tv!==null)names.get(m[1]).tip=tv;continue}
    if(/^Nexo_Tips\s*:=\s*Map\(\)$/.test(l)||/^OnMessage\(0x200,\s*Nexo_Hover\)$/.test(l))continue;
    if(/^Nexo_Hover\(wParam, lParam, msg, hwnd\) \{$/.test(l)){i=skipBlk(L,i);continue}
    if(m=l.match(/^(\w+)\.Value\.Navigate\((".*")\)$/)){const wc=names.get(m[1]);if(wc&&wc.t==='ActiveX'){const u=UQ(m[2]);if(u!==null){wc.nav=u;continue}}}
    if(m=l.match(/^WinSetTransparent\((\d+), "ahk_id " \w+\.Hwnd\)$/)){g.alpha=+m[1];continue}
    const nm=(l.match(/^(\w+)\./)||[])[1];
    if(nm===gv||names.has(nm)||l[0]===';'||mark){g.ctl.push({k:'line',s:l});continue}
    if(!mark&&guiAhead(i)){g.ctl.push({k:'line',s:l});continue}
    break}
  if(curTab)g.noClose=true;
  g.ctl.forEach(c=>{if(c.ct)c.ct=Array.from(c.ct,x=>x||'')});
  if(g.anchors){g.ctl.forEach(c=>{const a=g.anchors[c.n];if(a)Object.assign(c,a)});delete g.anchors}
  return{g,used:i-s}}
const DS={admin:false,panic:true,pk:'^!q',mt:2,sm:'',si:'Force',wd:false,cm:true,cp:true,dh:false,kd:'',md:'',pers:false,notray:false,prio:''};
const OFFSET={admin:false,panic:false,pk:'^!q',mt:0,sm:'',si:'',wd:false,cm:false,cp:false,dh:false,kd:'',md:'',pers:false,notray:false,prio:''};
const setFromParse=d=>Object.assign({},OFFSET,d||{});
const LEG=(()=>{try{return JSON.parse(localStorage.getItem('ahkbset'))||{}}catch(e){return{}}})();
const APP={theme:LEG.theme||'auto'};
const migrate=()=>({...DS,...(LEG.admin!==undefined?{admin:!!LEG.admin}:{}),...(LEG.panic!==undefined?{panic:!!LEG.panic}:{}),...(LEG.pk?{pk:LEG.pk}:{}),...(LEG.mt!==undefined?{mt:LEG.mt?2:0}:{}),...(LEG.sm!==undefined?{sm:LEG.sm}:{}),...(LEG.scr!==undefined?{cm:!!LEG.scr,cp:!!LEG.scr}:{})});
let SET={...DS};
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function hl(c){const re=/(;.*$)|("(?:[^"`\n]|`.)*")|(^#\w+)|(^[^\s;:]\S*?::)|(\b\d+(?:\.\d+)?\b)|\b(Loop|while|if|else|break|global)\b/gm;let o='',i=0,m;
  const sp=(col,x)=>`<span style="color:var(--${col})">${esc(x)}</span>`;
  while((m=re.exec(c))){o+=esc(c.slice(i,m.index));o+=m[1]?sp('mut',m[1]):m[2]?sp('key',m[2]):m[3]?sp('mouse',m[3]):m[4]?`<b style="color:var(--event)">${esc(m[4])}</b>`:m[5]?sp('event',m[5]):sp('ctrl',m[6]);i=re.lastIndex}
  return o+esc(c.slice(i))}
const RES=new Set('and as break by case catch class continue contains else false finally for from global goto if in is isset local loop not or return static super switch this throw true try unset until while'.split(' '));
const VARB=['fmt','tonum','capf','arrjoin','mapcount','idleget','sysval','fsize','wstate','monitorcount','tvsel','regex','regrep','arrnew','arrget','arrlen','arrpop','arrrand','mapnew','mapget','wclass','wproc','scrsz','envget','regread','cmdout','stopstart','stopread','set','tog','incr','rnd','inbox','getctl','getpix','rclip','time','fread','iniload','math','sett','inputkey','fsel','dsel','join','strlen','strcase','strrep','strsplit','copysel','wintitle','round','absv','minmax','modv','pickrnd','pad','setbool','trimv','substr','instrv','repeat','dateadd','httpget','ask3','askpw','lvsel','lvtext'];
const IFS=['if','ifpix','ifpixn','ifimg','ifcolor','elif','ifkey','ifwin','ifyes','ifwex','ifproc','ifclip','ifcmp','iftext','ifexist','ifstarts','ifhour','ifday','ifimgv'];
const NEED={every:'n',after:'n',trayitem:'t',send:'k',text:'s',run:'p',win:'s',wwait:'s',kwait:'k',call:'n',func:'n',funcp:'n',timer:'n',rawl:'s',set:'n',tog:'n',hold:'k',sendn:'k',holdms:'k'};
const LOOPS=['loop','forever','while','foreach','forlist','whiletime','forlines','loopfiles','loopparse','forarr','formap'];
const ACT=['clickrand','send','text','hold','click','move','mclick','mrel','mglide','drag','scroll','sendn','holdms','pastet','typev','clkhold','paste','mhold'];
const TOPONLY=new Set(['hotkey','hotstr','hkpass','hkup','func','funcp','trayitem','remap','abbr','hotif','hotall','guislot','onctl','onwin','every','after','include','onexit','onclip','onerr']);
const AHKW=[...new Set(('Send SendText SendInput Click MouseMove MouseClick MouseClickDrag MouseGetPos Sleep MsgBox InputBox ToolTip TrayTip Run RunWait WinActivate WinClose WinMinimize WinMaximize WinRestore WinMove WinExist WinActive WinWait WinWaitClose WinGetTitle WinSetAlwaysOnTop ProcessExist ProcessClose ProcessWait KeyWait GetKeyState Hotkey SetTimer SoundBeep SoundPlay SoundSetVolume SoundSetMute PixelGetColor PixelSearch ImageSearch FileAppend FileRead FileDelete FileExist IniRead IniWrite Random FormatTime StrReplace StrSplit SubStr InStr StrLen StrUpper StrLower Trim Round Floor Ceil Abs Min Max Format DllCall ComObject Gui ExitApp Reload Suspend Pause BlockInput SetKeyDelay SetMouseDelay SendMode CoordMode SetCapsLockState Download OnMessage OutputDebug ControlSend ControlClick InputHook ClipWait EnvGet Exit Sort Map Array Object RegExMatch RegExReplace Abs ACos ASin ATan BlockInput CallbackCreate CallbackFree CaretGetPos Ceil Chr Click ClipWait ComCall ComObjActive ComObjArray ComObjConnect ComObject ComObjFlags ComObjFromPtr ComObjGet ComObjQuery ComObjType ComObjValue ComValue ControlAddItem ControlChooseIndex ControlChooseString ControlClick ControlDeleteItem ControlFindItem ControlFocus ControlGetChecked ControlGetChoice ControlGetClassNN ControlGetEnabled ControlGetFocus ControlGetHwnd ControlGetIndex ControlGetItems ControlGetPos ControlGetStyle ControlGetExStyle ControlGetText ControlGetVisible ControlHide ControlHideDropDown ControlMove ControlSend ControlSendText ControlSetChecked ControlSetEnabled ControlSetStyle ControlSetExStyle ControlSetText ControlShow ControlShowDropDown CoordMode Cos Critical DateAdd DateDiff DetectHiddenText DetectHiddenWindows DirCopy DirCreate DirDelete DirExist DirMove DirSelect DllCall Download DriveGetCapacity DriveGetFileSystem DriveGetLabel DriveGetList DriveGetSerial DriveGetSpaceFree DriveGetStatus DriveGetType EditGetLine EditGetLineCount EditGetSelectedText EditPaste EnvGet EnvSet Exp FileAppend FileCopy FileCreateShortcut FileDelete FileEncoding FileExist FileGetAttrib FileGetShortcut FileGetSize FileGetTime FileGetVersion FileInstall FileMove FileOpen FileRead FileRecycle FileRecycleEmpty FileSelect FileSetAttrib FileSetTime Float FormatTime GetKeyName GetKeySC GetKeyState GetKeyVK GetMethod GroupActivate GroupAdd GroupClose GroupDeactivate GuiCtrlFromHwnd GuiFromHwnd HasBase HasMethod HasProp HotIf HotIfWinActive HotIfWinExist HotIfWinNotActive HotIfWinNotExist Hotkey Hotstring IL_Add IL_Create IL_Destroy IniDelete InstallKeybdHook InstallMouseHook Integer IsObject IsSet IsSetRef IsNumber IsInteger IsFloat IsAlpha IsAlnum IsDigit IsLower IsUpper IsSpace IsTime IsXDigit KeyHistory ListHotkeys ListLines ListVars ListViewGetContent LoadPicture Log Ln LTrim RTrim Menu MenuBar MenuFromHandle MenuSelect Mod MonitorGet MonitorGetCount MonitorGetName MonitorGetPrimary MonitorGetWorkArea Number NumGet NumPut ObjAddRef ObjBindMethod ObjGetBase ObjGetCapacity ObjHasOwnProp ObjOwnPropCount ObjOwnProps ObjRelease ObjSetBase ObjSetCapacity OnClipboardChange OnError OnExit Ord Persistent PostMessage ProcessGetName ProcessGetParent ProcessGetPath ProcessSetPriority ProcessWaitClose RegCreateKey RegDelete RegDeleteKey RegRead RegWrite RunAs SendEvent SendLevel SendMessage SendPlay SetControlDelay SetDefaultMouseSpeed SetNumLockState SetRegView SetScrollLockState SetStoreCapsLockMode SetTitleMatchMode SetWinDelay SetWorkingDir Shutdown Sin SoundGetInterface SoundGetMute SoundGetName SoundGetVolume SplitPath Sqrt StatusBarGetText StatusBarWait StrCompare StrGet String StrPtr StrPut StrTitle SubStr SysGet SysGetIPAddresses Tan Thread TraySetIcon Type VarSetStrCapacity VerCompare WinActivateBottom WinGetClass WinGetClientPos WinGetControls WinGetControlsHwnd WinGetCount WinGetExStyle WinGetID WinGetIDLast WinGetList WinGetMinMax WinGetPID WinGetPos WinGetProcessName WinGetProcessPath WinGetStyle WinGetText WinGetTransColor WinGetTransparent WinHide WinKill WinMinimizeAll WinMinimizeAllUndo WinMoveBottom WinMoveTop WinRedraw WinSetEnabled WinSetExStyle WinSetRegion WinSetStyle WinSetTitle WinSetTransColor WinSetTransparent WinShow WinWaitNotActive Buffer Error OSError TypeError ValueError MemberError PropertyError MethodError TargetError TimeoutError UnsetError UnsetItemError IndexError KeyError ZeroDivisionError MemoryError Func BoundFunc Closure Enumerator File Primitive RegExMatchInfo InputBox').split(' '))];
const BI=new Set(AHKW),BIL=new Set(AHKW.map(x=>x.toLowerCase()));
function brace(c){let d=0;for(const ln of c.split('\n')){if(ln.trim()[0]===':')continue;let qc='';for(let i=0;i<ln.length;i++){const ch=ln[i];if(qc){if(ch==='`')i++;else if(ch===qc)qc='';continue}if(ch==='"'||ch==="'"){qc=ch;continue}if(ch===';'&&(i===0||/\s/.test(ln[i-1])))break;if(ch==='{')d++;if(ch==='}')d--}}return d}
class Iss{constructor(id,sev,msg,why,fix){this.id=id;this.sev=sev;this.msg=msg;this.why=why||'';this.fix=fix||null}toString(){return this.msg+(this.why?' — '+this.why:'')}}
const ISS=[];
function placementRule(t,anc,prev){const nm=LBL[t]||t;
  if(TOPONLY.has(t)&&anc.length&&!(t==='guislot'&&anc.every(a=>a==='func'||a==='funcp')))return{msg:nm+' can’t go inside another block',why:'AutoHotkey only allows hotkeys, hotstrings, functions, tray items and #HotIf lines at the top level of the script, not inside a hotkey or a loop. Drag it out to the main area.'};
  if((t==='else'||t==='elif')&&!(prev&&IFS.includes(prev)))return{msg:'“'+nm+'” needs an If block right before it',why:'An Else or Else if only works directly after an If-style block at the same level. Put it right underneath one.'};
  if((t==='catch'||t==='finally')&&!(prev&&['try','catch'].includes(prev)))return{msg:'“'+nm+'” needs a Try block right before it',why:'Catch and Finally belong to a Try. Put them directly underneath it.'};
  if((t==='brk'||t==='brkif'||t==='cont')&&!anc.some(a=>LOOPS.includes(a)))return{msg:'“'+nm+'” only works inside a repeat block',why:'There is no loop to stop here. Put it inside Repeat, While or For each.'};
  if(t==='clkimg'&&!anc.some(a=>['ifimg','ifcolor','ifimgv'].includes(a)))return{msg:'“Click found image” only works inside “If image found” or “If color found”',why:'The spot to click is only known inside those blocks.'};
  return null}
function pathTypes(id){if(id==='root')return[];const r=[];const f=(n,acc)=>{for(const k of n.kids){if(k.id===id){r.push(...acc,k.t);return true}if(f(k,[...acc,k.t]))return true}return false};f(root,[]);return r}
function lint(c){const out=[],E='error',Wn='warn',I='info';
  const add=(b,sev,msg,why,fix)=>out.push(new Iss(b?b.id:null,sev,msg,why,fix));
  const FX=(label,fn)=>({label,fn});
  try{typeIssues().forEach(t=>add(t.b,Wn,t.msg,t.why))}catch(e){}
  const usedKeys=new Set(),names=new Set();
  (function pk(n){n.kids.forEach(b=>{const v=b.v||{};if(!b.off){if(['hotkey','hkpass','hkup'].includes(b.t))usedKeys.add(String(v.key).replace(/^[~$*]+/,'').toLowerCase());if(b.t==='remap')usedKeys.add(String(v.a).replace(/^[~$*]+/,'').toLowerCase())}['n','t','s','a'].forEach(k=>{if(typeof v[k]==='string')names.add(v[k].toLowerCase())});pk(b)})})(root);
  if(SET.pk)usedKeys.add(String(SET.pk).replace(/^[~$*]+/,'').toLowerCase());
  const freeKey=()=>{for(let i=1;i<=24;i++){if(!usedKeys.has('f'+i)){usedKeys.add('f'+i);return 'F'+i}}return 'F1'};
  const uniq=x=>{const base=String(x).replace(/\d+$/,'')||'item';let i=2;while(names.has((base+i).toLowerCase()))i++;names.add((base+i).toLowerCase());return base+i};
  const rm=(b,l)=>FX(l||'Remove it',()=>{const f=findBlock(root,b.id);if(f)f.p.kids.splice(f.i,1)});
  {const known=new Set([...vars(root),'e','mode','reason','code','dataType','A_Index','A_LoopField','A_LoopFilePath','item']);
    (function wk(n){n.kids.forEach(b=>{if(b.t==='funcp')String(b.v.p).split(',').forEach(z=>known.add(z.trim().replace(/^[&*]+|\?$|\s*:?=.*$/g,'')));if(b.t==='forarr'){known.add(vn(b.v.i));known.add(vn(b.v.v))}if(b.t==='formap'){known.add(vn(b.v.k));known.add(vn(b.v.v))}wk(b)})})(root);
    (function wr(n){n.kids.forEach(b=>{if(!b.off){for(const f in b.v||{})if(isR(b.v[f]))rwalk(b.v[f],y=>{if(y.t==='var'){const nm=vn(y.v.n);if(nm&&!/^A_/i.test(nm)&&!known.has(nm)){known.add(nm);add(b,I,'The value block “'+nm+'” is used but no block ever sets it','Add a “Set variable” block named '+nm+' before this, or pick one of your variables in the VALUE BLOCKS list.')}}})}wr(b)})})(root)}
  const mkFn=name=>FX('Create function “'+name+'”',()=>{root.kids.push(S('func',{n:vn(name)},[S('note',{s:'Put what this function should do here'})]))});
  const FN=new Set(allFuncs()),FNL=new Set(allFuncs().map(x=>x.toLowerCase())),hasInc=hasType(root,'include')||rawAny(/^\s*#Include\b/i),fnKnown=n=>{n=vn(n).toLowerCase();return FNL.has(n)||BIL.has(n)||hasInc},hk=new Map(),fnd=new Set(),trs=new Set(),evs=new Set(),hs=new Set(),cn=new Set(ctlNames());let ctx='',trItem=false,slots=0;
  const alive=['hotkey','hkpass','hkup','hotstr'].some(t=>hasType(root,t));
  const walk=(n,anc)=>n.kids.forEach((b,i)=>{if(b.off)return;const nm=LBL[b.t]||b.t,top=!anc.length,prev=i?n.kids[i-1].t:null,v=b.v||{},tt=T[b.t];
    if(top){if(b.t==='hotif')ctx=String(v.s);if(b.t==='hotall')ctx=''}
    const pr=placementRule(b.t,anc,prev);if(pr)add(b,E,pr.msg,pr.why);
    if(tt&&tt.box&&!b.kids.length)add(b,Wn,'“'+nm+'” is empty','There is nothing inside it, so it does nothing. Drop blocks into it.',rm(b,'Remove the empty block'));
    if(['hotkey','hkpass','hkup'].includes(b.t)){const k=String(v.key).trim();
      if(!k)add(b,E,'This hotkey has no key','Type a key like F1 or ^j, or press ⌨ and hit the keys you want.',FX('Use a free key',()=>{b.v.key=freeKey()}));
      else{if(/\s/.test(k)||/(ctrl|shift|alt|win)\s*\+/i.test(k))add(b,E,'Hotkey “'+k+'” is not valid','AutoHotkey uses symbols instead of words: ^ is Ctrl, + is Shift, ! is Alt, # is Win (so Ctrl+J is ^j). Press ⌨ and hit the keys to fill it in.',FX('Convert to symbols',()=>{const M={ctrl:'^',control:'^',shift:'+',alt:'!',win:'#',windows:'#'};const p=String(b.v.key).trim().split(/\s*\+\s*|\s+/).filter(Boolean);const key=p.pop()||'';b.v.key=p.map(x=>M[x.toLowerCase()]||'').join('')+(key.length===1?key.toLowerCase():key)}));
        if(top){const id=(ctx+'|'+k.replace(/^[~$*]+/,'')+(b.t==='hkup'?' up':'')).toLowerCase();if(hk.has(id))add(b,E,'Hotkey '+k+' is used twice','AutoHotkey refuses to start when two hotkeys are the same. Remove one or change its key.',FX('Change it to a free key',()=>{b.v.key=freeKey()}));else hk.set(id,b)}}}
    if(b.t==='remap'&&top){const id=(ctx+'|'+String(v.a).replace(/^[~$*]+/,'')).toLowerCase();if(hk.has(id))add(b,E,'Key '+v.a+' is used twice','This remap clashes with another hotkey on the same key.',FX('Remove this remap',()=>{const f=findBlock(root,b.id);if(f)f.p.kids.splice(f.i,1)}));else hk.set(id,b)}
    if(b.t==='hotstr'||b.t==='abbr'){const k=(b.t==='hotstr'?v.s:v.a);if(hs.has(k))add(b,E,'Hotstring “'+k+'” is used twice','AutoHotkey refuses to start with two identical hotstrings.',FX('Rename it',()=>{const fk=b.t==='hotstr'?'s':'a';b.v[fk]=uniq(b.v[fk])}));hs.add(k)}
    if((b.t==='func'||b.t==='funcp')&&top){const f=vn(v.n).toLowerCase();if(fnd.has(f))add(b,E,'Function '+v.n+' is defined twice','Two functions with the same name stop the script from loading. Rename one.',FX('Rename it',()=>{b.v.n=uniq(b.v.n)}));fnd.add(f)}
    if((b.t==='every'||b.t==='after')&&top){const f='timer_'+vn(v.n).toLowerCase();if(fnd.has(f))add(b,E,'Timer name “'+v.n+'” is used twice','Each timer needs its own name, because it becomes a function.',FX('Rename it',()=>{b.v.n=uniq(b.v.n)}));fnd.add(f)}
    if(b.t==='onctl'||b.t==='onwin'){const k=b.t==='onctl'?vn(v.c)+'_'+v.ev:'win_'+v.ev;if(evs.has(k))add(b,E,'This event already has a handler','Two handlers would create two functions with the same name, and AutoHotkey won’t start. Keep one.',rm(b,'Remove the duplicate'));evs.add(k)}
    if(b.t==='trayitem'&&top){const f=vn(v.t).toLowerCase();if(trs.has(f))add(b,E,'Tray item “'+v.t+'” is used twice','Two tray items with the same text create two functions with the same name. Rename one.',FX('Rename it',()=>{b.v.t=uniq(b.v.t)}));trs.add(f);trItem=true}
    if(b.t==='trayclear'&&top&&trItem)add(b,Wn,'Put “Remove standard tray items” before your own items','It removes every item in the menu, including the ones you added before it.');
    if(b.t==='guislot'){slots++;if(slots>1)add(b,E,'Only one “UI window here” block is allowed','The window code would be written twice.',rm(b,'Remove the extra one'))}
    if(NEED[b.t]&&!String(v[NEED[b.t]]).trim())add(b,E,'“'+nm+'” has an empty box','The generated line would be incomplete and AutoHotkey would complain. Fill it in.');
    if(VARB.includes(b.t)){const nv=String(v.n||'');if(RES.has(nv.toLowerCase())||/^\d/.test(nv)||/^A_/i.test(nv))add(b,E,'“'+nv+'” can’t be used as a variable name','It is a reserved word, starts with a number, or belongs to AutoHotkey (names starting with A_). Pick another name like “count”.',FX('Use a valid name',()=>{let z=vn(nv).replace(/^[^A-Za-z_]+/,'').replace(/^A_/i,'my_');if(!z||RES.has(z.toLowerCase()))z='my_'+(z||'var');b.v.n=z}));else if(vn(nv)!==nv)add(b,E,'Variable name “'+nv+'” has unsupported characters','Variable names can only use letters, numbers and _.',FX('Clean the name',()=>{b.v.n=vn(nv)}))}
    if(['call','callp','ucall','timer','timeroff'].includes(b.t)&&!fnKnown(v.n))add(b,E,'Function “'+v.n+'” does not exist','This calls a function nobody defined. Add a “Define function” block with that name, or check the spelling.',mkFn(v.n));
    if(['setctl','settxt','getctl','settxtx','guien','guifocus','guivis','guilist','guichoose','guicolor','onctl','setctlv','guiclear','guicheck','guilistset','guimove','lvadd','lvclear','lvsel','lvtext','sbtext'].includes(b.t)&&!cn.has(String(v.c)))add(b,E,'Control “'+v.c+'” is not in your window','There is no control with that name in the UI Designer. Pick one from the dropdown, or add it there.',ctlNames().length?FX('Use “'+ctlNames()[0]+'”',()=>{b.v.c=ctlNames()[0]}):null);
    if(['guishow','guihide','guiend','guititle','guimin','guibg'].includes(b.t)&&!real().length&&!GUI.imp)add(b,E,'There is no window to control','Your script has no UI window yet. Add controls in the UI Designer first.');
    if((b.t==='forever'||(b.t==='while'&&!/:=|\(/.test(String(b.v.c||''))))&&!hasPause(b))add(b,Wn,'This repeat has no wait inside','A loop that never pauses can freeze your PC and eat 100% of a core. Add a Wait block inside it.',FX('Add a short Wait inside',()=>{b.kids.push(mk('wait',{ms:'10'}))}));
    if(b.t==='ret'&&top)add(b,Wn,'“Stop here” at the top level ends the startup section','Blocks after it won’t run at startup (hotkeys still work).',rm(b));
    if(top&&ACT.includes(b.t)&&alive)add(b,I,'“'+nm+'” runs once, when the script starts','It is outside any hotkey, so it happens one time at launch and not when you press a key. Drop it inside a “When key pressed” block to run it on a keypress.',FX('Put it inside a new hotkey',()=>{const f=findBlock(root,b.id);if(!f)return;f.p.kids.splice(f.i,1,S('hotkey',{key:freeKey()},[b]))}));
    if(b.t==='power'&&['Log off','Restart','Shut down','Sleep'].includes(v.m))add(b,I,'This really will '+String(v.m).toLowerCase()+' your PC','Be careful when you run this block. Test it with “Lock” first.');
    walk(b,[...anc,b.t])});
  walk(root,[]);
  if(SET.panic&&SET.pk){const id='|'+SET.pk.replace(/^[~$*]+/,'').toLowerCase();if(hk.has(id))add(hk.get(id),E,'The emergency stop key '+SET.pk+' is also used here','Two hotkeys on the same key stop AutoHotkey from loading. Change this hotkey, or change the emergency key in Script settings.',FX('Change that hotkey',()=>{const hb=hk.get(id);hb.v[hb.t==='remap'?'a':'key']=freeKey()}))}
  GUI.ctl.forEach(x=>{if(!x.k&&x.fn&&!fnKnown(x.fn))add(null,E,'Control '+x.n+' runs function '+x.fn+', but no function has that name','Make one with “Define function”, or pick another in the UI Designer.',mkFn(x.fn))});
  if(c){const d=brace(c);if(d)add(null,E,'The code has '+(d>0?'an unclosed {':'an extra }'),'AutoHotkey won’t load it. Check your Raw line blocks for a missing or extra brace.')}
  const rank={error:0,warn:1,info:2};out.sort((a,b)=>rank[a.sev]-rank[b.sev]);ISS.length=0;ISS.push(...out);return out}


function myDefs(){const out=[];(function w(n){n.kids.forEach(b=>{if(b.off)return;if(b.t==='func'||b.t==='funcp'){out.push({n:vn(b.v.n),params:(b.t==='funcp'?String(b.v.p||'').split(','):[]).map(z=>z.replace(/:?=.*$/,'').replace(/[&*]/g,'').replace(/\bbyref\b/i,'').trim()).filter(Boolean).slice(0,8),ret:hasType(b,'retv')})}w(b)})})(root);return out}
const myDef=n=>myDefs().find(d=>d.n.toLowerCase()===vn(n).toLowerCase());
const niceName=n=>String(n).replace(/_/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2');
function titleOf(x,keyT){const d=myDef(x.v.n);if(!d)return'{n} (not defined)';return niceName(d.n)+d.params.map((p,i)=>' '+niceName(p)+' {a'+(i+1)+'}').join('')}
const titleT=b=>b.t==='ucall'?titleOf(b):T[b.t].t;
const rT=x=>x.t==='ucallr'?titleOf(x):RB[x.t].t;
function splitArgs(a){const o=[];let cur='',dp=0,q='';for(let i=0;i<a.length;i++){const c=a[i];if(q){cur+=c;if(c==='`'&&i+1<a.length)cur+=a[++i];else if(c===q)q='';continue}if(c==='"'||c==="'"){q=c;cur+=c;continue}if('([{'.includes(c))dp++;if(')]}'.includes(c))dp--;if(c===','&&dp===0){o.push(cur.trim());cur='';continue}cur+=c}if(cur.trim()!==''||o.length)o.push(cur.trim());return o}
function upgradeCalls(kids){const defs=new Map();(function w(n){n.forEach(b=>{if(b.t==='func'||b.t==='funcp')defs.set(vn(b.v.n).toLowerCase(),b.t==='funcp'?splitArgs(String(b.v.p||'')).filter(Boolean).length:0);w(b.kids||[])})})(kids);if(!defs.size)return;
  (function w(n){n.forEach(b=>{if(b.t==='call'||b.t==='callp'){const k=vn(b.v.n).toLowerCase();if(defs.has(k)){const np=defs.get(k),args=b.t==='callp'?splitArgs(String(b.v.a)):[];if(np<=8&&args.length===np){const v={n:b.v.n};args.forEach((a,i)=>{v['a'+(i+1)]=a});const nb=mk('ucall',v);b.t='ucall';b.v=nb.v}}}w(b.kids||[])})})(kids)}
const mk=(t,v)=>{const b={id:'b'+id++,t,v:{},kids:[]};for(const k in T[t].f)b.v[k]=T[t].f[k].d;return Object.assign(b.v,v||{}),b};
function findBlock(n,i,p){for(let k=0;k<n.kids.length;k++){const c=n.kids[k];if(c.id===i)return{n:c,p:n,i:k};const r=findBlock(c,i);if(r)return r}return null}
const has=(n,i)=>n.id===i||n.kids.some(c=>has(c,i));
function ins(pid,idx,b){const p=pid==='root'?root:(findBlock(root,pid)||{}).n||root;p.kids.splice(idx,0,b)}
function drop(pid,idx,data){
  if(data.startsWith('new:')){const pr=data.slice(4).split('|'),nb=mk(pr[0]);if(pr[1])nb.v.n=pr[1];ins(pid,idx,nb)}
  else if(data.startsWith('move:')){const r=findBlock(root,data.slice(5));if(!r||has(r.n,pid))return;
    r.p.kids.splice(r.i,1);if(r.p.id===pid&&r.i<idx)idx--;ins(pid,idx,r.n)}
  render()}
let DRAG=null;
const prevOf=(pid,idx)=>{const p=pid==='root'?root:(findBlock(root,pid)||{}).n;return p&&idx>0&&p.kids[idx-1]?p.kids[idx-1].t:null};
function gap(pid,idx,empty){const g=document.createElement('div');g.className='gap'+(empty?' empty':'');if(empty)g.textContent=pid==='root'?'Start here: click “When key pressed” on the left, then click the actions you want it to do. (Or press ⏺ Record and just do them.)':'Drop blocks here';const base=g.textContent;
  g.ondragover=e=>{if(DRAG&&(DRAG.rt||DRAG.rep))return;e.preventDefault();g.classList.add('over');const r=DRAG?placementRule(DRAG.t,pathTypes(pid),prevOf(pid,idx)):null;g.classList.toggle('bad',!!r);g.textContent=r?'⛔ '+r.msg+' — '+r.why:base};
  g.ondragleave=()=>{g.classList.remove('over','bad');g.textContent=base};
  g.ondrop=e=>{e.preventDefault();e.stopPropagation();DRAG=null;drop(pid,idx,e.dataTransfer.getData('text'))};return g}
addEventListener('dragend',()=>{DRAG=null});
function list(n){const f=document.createDocumentFragment();
  if(!n.kids.length){f.append(gap(n.id,0,1));return f}
  f.append(gap(n.id,0));n.kids.forEach((b,i)=>{f.append(blk(b),gap(n.id,i+1))});return f}

/* ================= VALUE BLOCKS (Sketchware/Scratch style): drop them into the white input slots ================= */
const isR=x=>!!x&&typeof x==='object'&&x.r===1;
const RB={
 var:{c:'vr',g:'Variables',ty:'n',t:'{n}',f:{n:{k:'v',d:'count',w:70}},gen:v=>vn(v.n)},
 num:{c:'math',g:'Math',ty:'n',t:'number {n}',f:{n:{k:'n',d:'0',w:44}},gen:v=>v.n},
 add:{c:'math',g:'Math',ty:'n',t:'{a} + {b}',f:{a:{k:'n',w:36},b:{k:'n',w:36}},gen:v=>`(${v.a} + ${v.b})`},
 sub:{c:'math',g:'Math',ty:'n',t:'{a} − {b}',f:{a:{k:'n',w:36},b:{k:'n',w:36}},gen:v=>`(${v.a} - ${v.b})`},
 mul:{c:'math',g:'Math',ty:'n',t:'{a} × {b}',f:{a:{k:'n',w:36},b:{k:'n',w:36}},gen:v=>`(${v.a} * ${v.b})`},
 div:{c:'math',g:'Math',ty:'n',t:'{a} ÷ {b}',f:{a:{k:'n',w:36},b:{k:'n',w:36}},gen:v=>`(${v.a} / ${v.b})`},
 mod:{c:'math',g:'Math',ty:'n',t:'{a} % {b}',f:{a:{k:'n',w:36},b:{k:'n',w:36}},gen:v=>`Mod(${v.a}, ${v.b})`},
 idiv:{c:'math',g:'Math',ty:'n',t:'{a} whole-divided by {b}',f:{a:{k:'n',w:36},b:{k:'n',w:36}},gen:v=>`(${v.a} // ${v.b})`},
 pow:{c:'math',g:'Math',ty:'n',t:'{a} to the power {b}',f:{a:{k:'n',w:36},b:{k:'n',w:36}},gen:v=>`(${v.a} ** ${v.b})`},
 round:{c:'math',g:'Math',ty:'n',t:'round {a} to {b} places',f:{a:{k:'n',w:36},b:{k:'n',d:'0',w:28}},gen:v=>`Round(${v.a}, ${v.b})`},
 abs:{c:'math',g:'Math',ty:'n',t:'absolute {a}',f:{a:{k:'n',w:36}},gen:v=>`Abs(${v.a})`},
 floor:{c:'math',g:'Math',ty:'n',t:'round down {a}',f:{a:{k:'n',w:36}},gen:v=>`Floor(${v.a})`},
 ceil:{c:'math',g:'Math',ty:'n',t:'round up {a}',f:{a:{k:'n',w:36}},gen:v=>`Ceil(${v.a})`},
 sqrt:{c:'math',g:'Math',ty:'n',t:'square root of {a}',f:{a:{k:'n',w:36}},gen:v=>`Sqrt(${v.a})`},
 min:{c:'math',g:'Math',ty:'n',t:'smaller of {a} and {b}',f:{a:{k:'n',w:36},b:{k:'n',w:36}},gen:v=>`Min(${v.a}, ${v.b})`},
 max:{c:'math',g:'Math',ty:'n',t:'bigger of {a} and {b}',f:{a:{k:'n',w:36},b:{k:'n',w:36}},gen:v=>`Max(${v.a}, ${v.b})`},
 rand:{c:'math',g:'Math',ty:'n',t:'random from {a} to {b}',f:{a:{k:'n',d:'1',w:32},b:{k:'n',d:'10',w:32}},gen:v=>`Random(${v.a}, ${v.b})`},
 cmp:{c:'cmp',g:'Compare',ty:'b',t:'{a} {op} {b}',f:{a:{k:'n',w:40},op:{k:'o',d:'=',o:['=','!=','>','<','>=','<=','==']},b:{k:'n',w:40}},gen:v=>`(${v.a} ${v.op} ${v.b})`},
 logic:{c:'logic',g:'Logic',ty:'b',t:'{a} {op} {b}',f:{a:{k:'n',d:'1',w:40},op:{k:'o',d:'and',o:['and','or']},b:{k:'n',d:'0',w:40}},gen:v=>`(${v.a} ${v.op} ${v.b})`},
 not:{c:'logic',g:'Logic',ty:'b',t:'not {a}',f:{a:{k:'n',d:'0',w:40}},gen:v=>`(!${v.a})`},
 bool:{c:'logic',g:'Logic',ty:'b',t:'{v}',f:{v:{k:'o',d:'true',o:['true','false']}},gen:v=>v.v},
 ternary:{c:'logic',g:'Logic',ty:'n',t:'if {c} then {a} else {b}',f:{c:{k:'n',d:'1',w:36},a:{k:'n',w:36},b:{k:'n',w:36}},gen:v=>`(${v.c} ? ${v.a} : ${v.b})`},
 text:{c:'text',g:'Text',ty:'t',t:'“{t}”',f:{t:{k:'t',d:'hello',w:70}},gen:v=>v.t},
 join:{c:'text',g:'Text',ty:'t',t:'join {a} and {b}',f:{a:{k:'t',w:56},b:{k:'t',w:56}},gen:v=>`(${v.a} . ${v.b})`},
 len:{c:'text',g:'Text',ty:'n',t:'length of {a}',f:{a:{k:'t',w:60}},gen:v=>`StrLen(${v.a})`},
 upper:{c:'text',g:'Text',ty:'t',t:'UPPERCASE {a}',f:{a:{k:'t',w:60}},gen:v=>`StrUpper(${v.a})`},
 lower:{c:'text',g:'Text',ty:'t',t:'lowercase {a}',f:{a:{k:'t',w:60}},gen:v=>`StrLower(${v.a})`},
 trim:{c:'text',g:'Text',ty:'t',t:'trim spaces from {a}',f:{a:{k:'t',w:60}},gen:v=>`Trim(${v.a})`},
 substr:{c:'text',g:'Text',ty:'t',t:'{n} letters of {a} from {s}',f:{n:{k:'n',d:'1',w:28},a:{k:'t',w:56},s:{k:'n',d:'1',w:28}},gen:v=>`SubStr(${v.a}, ${v.s}, ${v.n})`},
 replace:{c:'text',g:'Text',ty:'t',t:'in {a} replace {b} with {c}',f:{a:{k:'t',w:50},b:{k:'t',w:40},c:{k:'t',w:40}},gen:v=>`StrReplace(${v.a}, ${v.b}, ${v.c})`},
 contains:{c:'cmp',g:'Text',ty:'b',t:'{a} contains {b}',f:{a:{k:'t',w:56},b:{k:'t',w:46}},gen:v=>`(InStr(${v.a}, ${v.b}) > 0)`},
 pos:{c:'text',g:'Text',ty:'n',t:'position of {b} in {a}',f:{b:{k:'t',w:46},a:{k:'t',w:56}},gen:v=>`InStr(${v.a}, ${v.b})`},
 keyheld:{c:'sense',g:'Sensing',ty:'b',t:'key {k} is held down',f:{k:{k:'t',d:'a',w:40}},gen:v=>`GetKeyState(${v.k}, "P")`},
 mousex:{c:'sense',g:'Sensing',ty:'n',t:'mouse x',f:{},gen:()=>`(MouseGetPos(&__mx), __mx)`},
 mousey:{c:'sense',g:'Sensing',ty:'n',t:'mouse y',f:{},gen:()=>`(MouseGetPos(, &__my), __my)`},
 pixel:{c:'sense',g:'Sensing',ty:'t',t:'color at x {x} y {y}',f:{x:{k:'n',d:'100',w:36},y:{k:'n',d:'100',w:36}},gen:v=>`PixelGetColor(${v.x}, ${v.y})`},
 clip:{c:'sense',g:'Sensing',ty:'t',t:'clipboard text',f:{},gen:()=>'A_Clipboard'},
 time:{c:'sense',g:'Sensing',ty:'n',t:'current {k}',f:{k:{k:'o',d:'hour',o:['hour','minute','second','day of month','month','year','weekday number','milliseconds since start']}},gen:v=>({'hour':'A_Hour','minute':'A_Min','second':'A_Sec','day of month':'A_MDay','month':'A_Mon','year':'A_Year','weekday number':'A_WDay','milliseconds since start':'A_TickCount'})[v.k]||'A_Hour'},
 scr:{c:'sense',g:'Sensing',ty:'n',t:'screen {k}',f:{k:{k:'o',d:'width',o:['width','height']}},gen:v=>v.k==='height'?'A_ScreenHeight':'A_ScreenWidth'},
 idle:{c:'sense',g:'Sensing',ty:'n',t:'ms since last input',f:{},gen:()=>'A_TimeIdle'},
 wtitle:{c:'sense',g:'Sensing',ty:'t',t:'title of the active window',f:{},gen:()=>'WinGetTitle("A")'},
 winexists:{c:'sense',g:'Sensing',ty:'b',t:'window {a} exists',f:{a:{k:'t',d:'ahk_exe notepad.exe',w:100}},gen:v=>`(WinExist(${v.a}) != 0)`},
 winactive:{c:'sense',g:'Sensing',ty:'b',t:'window {a} is active',f:{a:{k:'t',d:'ahk_exe notepad.exe',w:100}},gen:v=>`(WinActive(${v.a}) != 0)`},
 procexists:{c:'sense',g:'Sensing',ty:'b',t:'program {a} is running',f:{a:{k:'t',d:'notepad.exe',w:80}},gen:v=>`(ProcessExist(${v.a}) != 0)`},
 fileexists:{c:'sense',g:'Sensing',ty:'b',t:'file {a} exists',f:{a:{k:'t',d:'C:\\file.txt',w:100}},gen:v=>`(FileExist(${v.a}) != "")`},
 ctlvalue:{c:'sense',g:'Sensing',ty:'t',t:'value of {c}',f:{c:{k:'c',d:'',w:60}},gen:v=>`${vn(v.c)}.Value`},
 litem:{c:'list',g:'Lists',ty:'n',t:'item {i} of list {l}',f:{i:{k:'n',d:'1',w:28},l:{k:'v',d:'items',w:56}},gen:v=>`${vn(v.l)}[${v.i}]`},
 llen:{c:'list',g:'Lists',ty:'n',t:'length of list {l}',f:{l:{k:'v',d:'items',w:56}},gen:v=>`${vn(v.l)}.Length`},
 mhas:{c:'cmp',g:'Lists',ty:'b',t:'map {m} has {k}',f:{m:{k:'v',d:'scores',w:56},k:{k:'t',d:'bob',w:44}},gen:v=>`${vn(v.m)}.Has(${v.k})`},
 colorof:{c:'sense',g:'Sensing',ty:'n',t:'picked color of {c}',f:{c:{k:'c',d:'',w:60}},gen:v=>`${vn(v.c)}_color`},
 ucallr:{c:'vr',g:'My blocks',ty:'n',t:'{n}',f:{n:{k:'v',d:'MyBlock',w:90},a1:{k:'n',w:36},a2:{k:'n',w:36},a3:{k:'n',w:36},a4:{k:'n',w:36},a5:{k:'n',w:36},a6:{k:'n',w:36},a7:{k:'n',w:36},a8:{k:'n',w:36}},gen:v=>{const d=myDef(v.n);const k=d?d.params.length:0;return vn(v.n)+'('+Array.from({length:k},(_,i)=>v['a'+(i+1)]).join(', ')+')'}},
 pick:{c:'list',g:'Lists',ty:'n',t:'random item of list {l}',f:{l:{k:'v',d:'items',w:56}},gen:v=>`${vn(v.l)}[Random(1, ${vn(v.l)}.Length)]`},
 split:{c:'list',g:'Lists',ty:'l',t:'split {a} at {b}',f:{a:{k:'t',w:56},b:{k:'t',d:',',w:30}},gen:v=>`StrSplit(${v.a}, ${v.b})`},
 joinl:{c:'text',g:'Lists',ty:'t',t:'join list {l} with {s}',f:{l:{k:'v',d:'items',w:56},s:{k:'t',d:', ',w:30}},gen:v=>`NexoJoin(${vn(v.l)}, ${v.s})`},
 nowd:{c:'sense',g:'Time',ty:'d',t:'current date and time',f:{},gen:()=>'A_Now'},
 dateadd:{c:'sense',g:'Time',ty:'d',t:'{d} plus {n} {u}',f:{d:{k:'n',d:'A_Now',w:60},n:{k:'n',d:'1',w:28},u:{k:'o',d:'Days',o:['Seconds','Minutes','Hours','Days']}},gen:v=>`DateAdd(${v.d}, ${v.n}, "${v.u}")`},
 datediff:{c:'sense',g:'Time',ty:'n',t:'{a} minus {b} in {u}',f:{a:{k:'n',d:'A_Now',w:60},b:{k:'n',d:'A_Now',w:60},u:{k:'o',d:'Seconds',o:['Seconds','Minutes','Hours','Days']}},gen:v=>`DateDiff(${v.a}, ${v.b}, "${v.u}")`},
 datefmt:{c:'text',g:'Time',ty:'t',t:'format date {d} as {f}',f:{d:{k:'n',d:'A_Now',w:60},f:{k:'t',d:'yyyy-MM-dd HH:mm',w:100}},gen:v=>`FormatTime(${v.d}, ${v.f})`},
 justpressed:{c:'sense',g:'Sensing',ty:'b',t:'key {k} was just pressed',f:{k:{k:'t',d:'a',w:40}},gen:v=>`NexoJustPressed(${v.k})`},
 mousein:{c:'sense',g:'Sensing',ty:'b',t:'mouse is inside x {x} y {y} width {w} height {h}',f:{x:{k:'n',d:'0',w:36},y:{k:'n',d:'0',w:36},w:{k:'n',d:'100',w:36},h:{k:'n',d:'100',w:36}},gen:v=>`NexoMouseIn(${v.x}, ${v.y}, ${v.w}, ${v.h})`},
 mget:{c:'list',g:'Lists',ty:'n',t:'{k} from map {m}',f:{k:{k:'t',d:'bob',w:44},m:{k:'v',d:'scores',w:56}},gen:v=>`${vn(v.m)}.Get(${v.k}, "")`}
};
const RGROUPS=['Math','Compare','Logic','Text','Sensing','Time','Lists','Variables'];
const mkR=(t,vals)=>{const d=RB[t],v={};for(const f in d.f)v[f]=d.f[f].d!==undefined?d.f[f].d:'';return{r:1,id:'r'+(id++),t,v:Object.assign(v,vals||{})}};
const defOf=(h,f)=>{const sp=h.r?RB[h.t].f[f]:T[h.t].f[f];return sp&&sp.d!==undefined?sp.d:''};
function rfield(d,val){if(isR(val))return rexpr(val);const k=d.k||'n';if(k==='t')return q(val==null?'':val);if(k==='n'){const z=String(val==null?'':val).trim();return z===''?'0':z}return String(val==null?'':val)}
function rexpr(x){const d=RB[x.t];if(!d)return'0';const v={};for(const f in d.f)v[f]=rfield(d.f[f],x.v&&x.v[f]);try{return d.gen(v)}catch(e){return'0'}}
function rtext(x){const d=RB[x.t];if(!d)return'?';return rT(x).replace(/\{(\w+)\}/g,(m,f)=>{const z=x.v&&x.v[f];return isR(z)?'⟨'+rtext(z)+'⟩':(z===''||z==null?'…':z)})}
function rwalk(x,fn){fn(x);for(const f in x.v)if(isR(x.v[f]))rwalk(x.v[f],fn)}
function rcontains(x,h){let hit=false;rwalk(x,y=>{if(y===h)hit=true});return hit}
/* what kind of value does a block field take?  expr = typed code/number, text = typed words, ident = a variable name, other = not droppable */
let _FK=null;
function fieldKind(bt,f){if(bt==='ucall'&&/^a\d$/.test(f))return'expr';_FK=_FK||{};const key=bt+'.'+f;if(_FK[key])return _FK[key];const t=T[bt];let kind='other';
  if(t&&t.f[f]&&!t.f[f].o&&!t.f[f].ctl&&!t.f[f].r){const v={};for(const g in t.f)v[g]=t.f[g].d;v[f]='QZ 1+1';let g='';try{g=String(t.gen(v))}catch(e){}
    if(/QZ_1_1/.test(g))kind='ident';else if(g.includes('QZ 1+1')){let inq=false,out=false,inn=false;for(let i=0;i<g.length;i++){const ch=g[i];if(ch==='`'){i++;continue}if(ch==='"'){inq=!inq;continue}if(g.startsWith('QZ 1+1',i)){if(inq)inn=true;else out=true}}kind=out?'expr':inn?'text':'other'}}
  return _FK[key]=kind}
const NODROP=new Set(['hotkey','hkpass','hkup','hotstr','abbr','remap','func','funcp','call','callp','timer','timeroff','every','after','onctl','onwin','trayitem','hotif','include','guislot','rawl','note','onexit','onclip','onerr']);
const canDrop=(b,k)=>!NODROP.has(b.t)&&['expr','text'].includes(fieldKind(b.t,k));
/* turn a block's fields into plain values for the code generator; dropped value blocks become code */
function resolveVals(b){const v=b.v||{};let any=false;for(const f in v)if(isR(v[f])){any=true;break}if(!any)return{vals:v,reps:[]};
  const ef=exprFields()[b.t]||new Set(),vals=Object.assign({},v),reps=[];
  for(const f in v){if(!isR(v[f]))continue;const e=rexpr(v[f]);if(fieldKind(b.t,f)==='expr'||ef.has(f)&&fieldKind(b.t,f)!=='text')vals[f]=e;else{vals[f]='\u0001'+reps.length+'\u0002';reps.push(e)}}
  return{vals,reps}}
function fixPH(out,reps){if(!reps.length)return out;return out.replace(/"((?:[^"`]|`.)*)"|\u0001(\d+)\u0002/g,(m,inner,idx)=>{if(idx!==undefined)return'String('+reps[+idx]+')';if(!/\u0001\d+\u0002/.test(inner))return m;const parts=inner.split(/\u0001(\d+)\u0002/),o=[];for(let i=0;i<parts.length;i++){if(i%2===0){if(parts[i])o.push('"'+parts[i]+'"')}else o.push('String('+reps[+parts[i]]+')')}return o.join(' ')})}
const HMARK='; --- helper functions used by your blocks ---';
const HELPERS={
NexoLog:'NexoLog(s) {\n  try FileAppend(s "`n", "*", "UTF-8")\n}',
NexoMoveBy:'NexoMoveBy(dx, dy) {\n  DllCall("mouse_event", "UInt", 0x0001, "Int", Round(dx), "Int", Round(dy), "UInt", 0, "UPtr", 0)\n}',
NexoLook:'NexoLook(dx, dy, steps := 12, delay := 8) {\n  px := 0\n  py := 0\n  Loop steps {\n    nx := Round(dx * A_Index / steps)\n    ny := Round(dy * A_Index / steps)\n    DllCall("mouse_event", "UInt", 0x0001, "Int", nx - px, "Int", ny - py, "UInt", 0, "UPtr", 0)\n    px := nx\n    py := ny\n    Sleep(delay)\n  }\n}',
NexoGameClick:'NexoGameClick(button := "Left", hold := 30) {\n  down := button = "Right" ? 0x0008 : button = "Middle" ? 0x0020 : 0x0002\n  DllCall("mouse_event", "UInt", down, "Int", 0, "Int", 0, "UInt", 0, "UPtr", 0)\n  Sleep(hold)\n  DllCall("mouse_event", "UInt", down * 2, "Int", 0, "Int", 0, "UInt", 0, "UPtr", 0)\n}',
NexoJoin:'NexoJoin(arr, sep := ", ") {\n  out := ""\n  for i, v in arr\n    out .= (i > 1 ? sep : "") v\n  return out\n}',
NexoJustPressed:'NexoJustPressed(k) {\n  static was := Map()\n  now := GetKeyState(k, "P")\n  prev := was.Has(k) ? was[k] : false\n  was[k] := now\n  return now && !prev\n}',
NexoMouseIn:'NexoMouseIn(x, y, w, h) {\n  MouseGetPos(&mx, &my)\n  return mx >= x && mx < x + w && my >= y && my < y + h\n}',
Nexo_PickColor:'Nexo_PickColor() {\n  global Nexo_PkState\n  CoordMode("Mouse", "Screen")\n  CoordMode("Pixel", "Screen")\n  Nexo_PkState := ""\n  Hotkey("*LButton", Nexo_PkClick, "On")\n  Hotkey("*Escape", Nexo_PkEsc, "On")\n  while Nexo_PkState = "" {\n    MouseGetPos(&x, &y)\n    ToolTip("Color " PixelGetColor(x, y) "  (click to pick, Esc to cancel)", x + 20, y + 20)\n    Sleep(30)\n  }\n  MouseGetPos(&x, &y)\n  c := Nexo_PkState = "ok" ? PixelGetColor(x, y) : ""\n  Hotkey("*LButton", "Off")\n  Hotkey("*Escape", "Off")\n  ToolTip()\n  return c\n}\n\nNexo_PkClick(*) {\n  global Nexo_PkState\n  Nexo_PkState := "ok"\n}\n\nNexo_PkEsc(*) {\n  global Nexo_PkState\n  Nexo_PkState := "no"\n}',
NexoPause:'NexoPause() {\n  if (EnvGet("NEXO_DEBUG") != "") {\n    KeyWait("F8", "D")\n    KeyWait("F8")\n  }\n}',
NexoT:'NexoT(id, names, vals*) {\n  static mode := EnvGet("NEXO_DEBUG")\n  if (mode = "")\n    return\n  out := "@@T|" id\n  nm := StrSplit(names, ",")\n  for i, v in vals {\n    try s := String(v)\n    catch\n      s := "<object>"\n    out .= "|" nm[i] "=" StrReplace(StrReplace(s, "`n", "\\n"), "|", "/")\n  }\n  try FileAppend(out "`n", "*", "UTF-8")\n  if (mode = "step") {\n    KeyWait("F8", "D")\n    KeyWait("F8")\n  } else if (SubStr(mode, 1, 5) = "slow:")\n    Sleep(Integer(SubStr(mode, 6)))\n}'
};
function addHelpers(code){const need=[];for(const k in HELPERS){if(new RegExp('\\b'+k+'\\b').test(code)&&!new RegExp('^'+k+'\\(','m').test(code)){need.push(k)}}
  if(!need.length)return code;return code.replace(/\n+$/,'\n')+'\n'+HMARK+'\n'+need.map(k=>HELPERS[k]).join('\n\n')+'\n'}
let DBG=null;
const noTrace=new Set(['else','elif','catch','finally','guislot','note','sticky','logv','logt','pausehere']);
function buildDebug(mode){DBG=mode||'fast';try{return build()}finally{DBG=null}}
function genOf(b){const rv=resolveVals(b);return fixPH(String(T[b.t].gen(rv.vals)),rv.reps)}
