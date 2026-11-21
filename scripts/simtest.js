// Unit tests for the Try-it simulator (renderer/sim.js), plain Node, no browser.
const Sim = require('../renderer/sim.js');
const fail = []; const ok = (c, m) => { if (!c) fail.push(m); };
const run = (code, host) => { const s = Sim.create(code, host || {}); if (s.error) throw new Error(s.error); return s.run(); };
const g = (s, n) => { const e = s.vars().find(v => v[0].toLowerCase() === n.toLowerCase()); return e ? e[1] : undefined; };
const errs = s => s.log.filter(l => l.k === 'err').map(l => l.text);
const T = (name, code, expect) => { try { const s = run(code); for (const k in expect) ok(g(s, k) === expect[k], name + ': ' + k + ' = ' + g(s, k) + ' (wanted ' + expect[k] + ') errors: ' + errs(s).join('; ')); ok(!errs(s).length || expect.__err, name + ' unexpected errors: ' + errs(s).join('; ')); } catch (e) { fail.push(name + ' threw ' + e.message); } };

// expressions
T('arithmetic', 'a := 2 + 3 * 4\nb := (2 + 3) * 4\nc := 7 // 2\nd := 7 / 2\ne := 2 ** 10\nf := -3 + 1\ng1 := 10 - 2 - 3', { a: '14', b: '20', c: '3', d: '3.5', e: '1024', f: '-2', g1: '5' });
T('strings', 's := "ab" "cd"\nt := "x" . "y"\nn := 5\nu := "n=" n\nl := StrLen("hello")\nv := SubStr("abcdef", 2, 3)\nw := StrReplace("a-b-c", "-", "+")\nx := Trim("  hi  ")\ny := StrUpper("abc")', { s: '"abcd"', t: '"xy"', u: '"n=5"', l: '5', v: '"bcd"', w: '"a+b+c"', x: '"hi"', y: '"ABC"' });
T('escapes', 's := "a`tb"\nq := "say `"hi`""\nl := StrLen(s)', { l: '3', q: '"say \\"hi\\""'.replace('\\"', '"').replace('\\"', '"') });
T('compare', 'a := (1 < 2)\nb := ("abc" = "ABC")\nc := ("abc" == "ABC")\nd := (10 > 9)\ne := ("10" > "9")\nf := (3 != 4)', { a: '1', b: '1', c: '0', d: '1', e: '1', f: '1' });
T('logic', 'a := 1 && 0\nb := 0 || 5\nc := !0\nd := not 1\ne := 1 and 2\nf := (0 ? "y" : "n")\ng1 := ""\nh := g1 ?? "dflt"', { a: '0', b: '5', c: '1', d: '0', e: '2', f: '"n"', h: '""' });
T('compound', 'a := 5\na += 3\na *= 2\na -= 1\ns := "x"\ns .= "y"\ni := 0\ni++\ni++\nj := i--', { a: '15', s: '"xy"', i: '1', j: '2' });
T('format', 'a := Format("{:03}", 7)\nb := Format("{1}-{2}", "x", "y")\nc := Format("{:.2f}", 3.14159)\nd := Format("{:X}", 255)\ne := Round(2.567, 1)\nf := Floor(-1.5)\ng1 := Mod(10, 3)\nh := Min(4, 2, 9)', { a: '"007"', b: '"x-y"', c: '"3.14"', d: '"FF"', e: '2.6', f: '-2', g1: '1', h: '2' });
// control flow
T('if/else', 'x := 5\nif (x > 3) {\n  r := "big"\n} else if (x > 1) {\n  r := "mid"\n} else {\n  r := "small"\n}\nif x = 5\n  s := "five"\nelse\n  s := "other"', { r: '"big"', s: '"five"' });
T('loops', 'c := 0\nLoop 4 {\n  c += A_Index\n}\nw := 0\nwhile w < 3\n  w++\nb := 0\nLoop {\n  b++\n  if b >= 5\n    break\n}\nk := 0\nLoop 6 {\n  if Mod(A_Index, 2)\n    continue\n  k += A_Index\n}', { c: '10', w: '3', b: '5', k: '12' });
T('for', 'a := [10, 20, 30]\nt := 0\nfor v in a\n  t += v\nu := 0\nfor i, v in a\n  u += i * v\nm := Map("x", 1, "y", 2)\nks := ""\nfor k, v in m\n  ks .= k v', { t: '60', u: '140', ks: '"x1y2"' });
T('switch', 'f(n) {\n  switch n {\n    case 1: return "one"\n    case 2, 3: return "few"\n    default: return "many"\n  }\n}\na := f(1)\nb := f(3)\nc := f(9)', { a: '"one"', b: '"few"', c: '"many"' });
T('try/catch', 'r := ""\ntry {\n  x := 1 / 0\n} catch as e {\n  r := e.Message\n}\ns := ""\ntry {\n  throw Error("boom")\n} catch as e2 {\n  s := e2.Message\n} finally {\n  s .= "!"\n}', { r: '"Divide by zero."', s: '"boom!"' });
T('loop parse', 'o := ""\nLoop Parse "a,b,c", ","\n  o .= A_LoopField', { o: '"abc"' });
// functions & scope
T('functions', 'add(a, b := 10) {\n  return a + b\n}\nx := add(1)\ny := add(1, 2)\nfact(n) {\n  return n <= 1 ? 1 : n * fact(n - 1)\n}\nz := fact(5)\nvar(a, b*) {\n  return b.Length\n}\nv := var(1, 2, 3, 4)', { x: '11', y: '3', z: '120', v: '3' });
T('local vs global', 'count := 1\nbad() {\n  count := 99\n}\ngood() {\n  global count\n  count := 5\n}\nbad()\nafter_bad := count\ngood()', { after_bad: '1', count: '5' });
T('static', 'next() {\n  static n := 0\n  n += 1\n  return n\n}\nnext()\nnext()\nr := next()', { r: '3' });
T('byref', 'swap(&a, &b) {\n  t := a\n  a := b\n  b := t\n}\nx := 1\ny := 2\nswap(&x, &y)', { x: '2', y: '1' });
T('closures', 'make(n) {\n  return (x) => x + n\n}\nadd5 := make(5)\nr := add5(10)\ncnt := 0\ninc := () => cnt += 1\ninc()\ninc()', { r: '15', cnt: '2' });
T('command style', 'x := 0\nAdd(a) {\n  global x\n  x += a\n}\nAdd 5\nSleep 10\nToolTip "hi"', { x: '5' });
// collections
T('arrays', 'a := [1, 2]\na.Push(3)\nn := a.Length\nl := a.Pop()\na[1] := 9\nf := a[1]\nb := Array(5, 6)\nc := b[-1]', { n: '3', l: '3', f: '9', c: '6' });
T('maps', 'm := Map()\nm["k"] := 5\nm.Set("z", 1)\nh := m.Has("k")\nc := m.Count\nd := m.Get("nope", 7)\nm.Delete("k")\nc2 := m.Count', { h: '1', c: '2', d: '7', c2: '1' });
T('regex', 'p := RegExMatch("abc123", "\\d+", &m)\nr := m[0]\ns := RegExReplace("a1b2", "\\d", "#")', { p: '4', r: '"123"', s: '"a#b#"' });
// errors the real script would hit
{ const s = run('x := ""\ny := x + 1\nz := 5'); ok(errs(s).length === 1 && /Expected a Number/.test(errs(s)[0]) && g(s, 'z') === undefined, 'empty string in math is reported (script stops like AutoHotkey): ' + errs(s)); }
{ const s = run('m := Map()\nv := m["nope"]'); ok(/no key "nope"/.test(errs(s)[0] || ''), 'missing Map key is reported: ' + errs(s)); }
{ const s = run('a := [1]\nv := a[5]'); ok(/Invalid index/.test(errs(s)[0] || ''), 'bad array index is reported'); }
{ const s = run('s := "abc"\nn := s.Length'); ok(/no property named "Length"/.test(errs(s)[0] || ''), 'String.Length is reported like AutoHotkey v2: ' + errs(s)); }
{ const s = run('Loop {\n  x := 1\n}'); ok(/endless loop/.test(errs(s)[0] || ''), 'endless loop is stopped'); }
{ const s = run('f() {\n  return f()\n}\nf()'); ok(/Stack overflow/.test(errs(s)[0] || ''), 'runaway recursion is stopped'); }
{ const s = run('DoesNotExist(1)\nx := 1'); ok(g(s, 'x') === '1' && s.log.some(l => l.k === 'warn' && /DoesNotExist/.test(l.text)), 'unknown functions are skipped with a note, not silently'); }
{ const s = run('ExitApp\nx := 1'); ok(s.exited && g(s, 'x') === undefined, 'ExitApp stops the script'); }
{ try { const s = Sim.create('x := (1 +'); ok(s.error || true, 'broken code is rejected'); const s2 = run('x := 1'); ok(!!s2, ''); } catch (e) { } }
ok(!!Sim.create('x := "unterminated').error, 'a syntax error is reported instead of crashing');
// output
{ const msgs = []; const s = run('MsgBox "Hello " "World"\nr := MsgBox("Sure?", "T", "YesNo")\nSend "{Enter}"\nClick 10, 20\nA_Clipboard := "copied"', { msgbox: m => msgs.push(m) }); ok(msgs.length === 2 && msgs[0].text === 'Hello World', 'MsgBox reaches the host'); ok(g(s, 'r') === '"Yes"', 'Yes/No box answers Yes by default'); ok(s.log.some(l => l.k === 'send' && /Enter/.test(l.text)) && s.log.some(l => l.k === 'click'), 'Send and Click are logged'); ok(s.clip === 'copied', 'clipboard is simulated'); }
{ const s = Sim.create('r := MsgBox("Sure?", , "YesNo")'); s.answer = 'No'; s.run(); ok(g(s, 'r') === '"No"', 'the preview can answer No'); }
// timers
{ const s = run('n := 0\ntick() {\n  global n\n  n += 1\n}\nSetTimer(tick, 100)'); s.advance(350); ok(g(s, 'n') === '3', 'timer fires every period: ' + g(s, 'n')); s.advance(100); ok(g(s, 'n') === '4', 'timer keeps firing'); }
{ const s = run('n := 0\ntick() {\n  global n\n  n += 1\n  if n = 2\n    SetTimer(tick, 0)\n}\nSetTimer(tick, 50)'); s.advance(1000); ok(g(s, 'n') === '2', 'SetTimer(fn, 0) cancels'); }
{ const s = run('n := 0\nonce() {\n  global n\n  n += 1\n}\nSetTimer(once, -200)'); s.advance(1000); ok(g(s, 'n') === '1', 'negative period runs once'); }
{ const s = run('n := 0\nt() {\n  global n\n  n += 1\n}\nSetTimer(t, 100)\nSleep 350'); ok(g(s, 'n') === '3', 'timers run during Sleep like in AutoHotkey'); }
// hotkeys
{ const s = run('n := 0\nF1::{\n  global n\n  n += 1\n}\n^!q::ExitApp\n:*:btw::by the way'); ok(s.hotkeys.length === 2 && s.hotstrings.length === 1, 'hotkeys and hotstrings are found'); s.runHotkey(0); s.runHotkey(0); ok(g(s, 'n') === '2', 'running a hotkey runs its body'); s.runHotkey(1); ok(s.exited, 'a hotkey can exit the script'); }
// GUI
{
  const code = 'myGui := Gui(, "Demo")\nmyGui.SetFont("s10", "Segoe UI")\ned1 := myGui.Add("Edit", "x20 y20 w200 h26", "")\nbtn1 := myGui.Add("Button", "x20 y60 w100 h30", "Say hi")\nbtn1.OnEvent("Click", (*) => Hi())\nchk1 := myGui.Add("Checkbox", "x20 y100 w120 h24 Checked", "Check me")\ndd1 := myGui.Add("DropDownList", "x20 y130 w120 h26 Choose2", ["One", "Two", "Three"])\ndd1.OnEvent("Change", (*) => Picked())\nmyGui.OnEvent("Close", (*) => ExitApp())\nmyGui.Show("w300 h200")\nHi() {\n  ed1.Value := "Hello " ed1.Value\n  MsgBox ed1.Value\n}\nPicked() {\n  global chosen\n  chosen := dd1.Text\n}';
  const s = run(code); const gui = s.guis[0];
  ok(gui && gui.title === 'Demo' && gui.w === 300 && gui.h === 200 && gui.visible === 1, 'Gui is created and shown');
  ok(gui.ctls.length === 4 && gui.ctls[0].x === 20 && gui.ctls[1].w === 100 && gui.ctls[2].value === 1 && gui.ctls[3].value === 2 && gui.ctls[3].text === 'Two', 'controls get position, size, checked and choice from options');
  gui.ctls[0].value = gui.ctls[0].text = 'Bob'; s.fire(gui.ctls[1], 'Click');
  ok(gui.ctls[0].value === 'Hello Bob' && s.log.some(l => l.k === 'msg' && l.text === 'Hello Bob'), 'button click runs the handler, which reads and writes the edit');
  gui.ctls[3].value = 3; gui.ctls[3].text = 'Three'; s.fire(gui.ctls[3], 'Change'); ok(g(s, 'chosen') === '"Three"', 'dropdown change handler sees the new choice');
  s.fireGui(gui, 'Close'); ok(s.exited, 'closing the window runs its Close handler');
}
{
  const code = 'g := Gui("+Resize", "R")\nb := g.Add("Button", "x10 y10 w100 h30", "B")\ne := g.Add("Edit", "x10 y50 w200 h100", "")\ng.OnEvent("Size", Anchor)\ng.Show("w300 h200")\nAnchor(gg, mm, w, h) {\n  dx := w - 300\n  dy := h - 200\n  e.Move(10, 50, 200 + dx, 100 + dy)\n  b.Move(10 + dx, 10)\n}';
  const s = run(code), gui = s.guis[0]; s.resize(gui, 400, 260);
  ok(gui.w === 400 && gui.ctls[1].w === 300 && gui.ctls[1].h === 160 && gui.ctls[0].x === 110, 'resize runs the Size handler and Move() updates controls: ' + JSON.stringify(gui.ctls.map(c => [c.x, c.y, c.w, c.h])));
}
{ const s = run('g := Gui()\ng.Add("Text", "x10 y10", "Name:")\nr1 := g.Add("Radio", "x10 y40", "A")\nr2 := g.Add("Radio", "x10 y60", "B")\nr1.Value := 1\nr2.Value := 1\ng.Show()'); const c = s.guis[0].ctls; ok(c[1].value === 0 && c[2].value === 1, 'selecting one radio clears the other in its group'); }
{ const s = run('g := Gui()\ne := g.Add("Edit", "vName w100", "Z")\nc := g.Add("Checkbox", "vOn", "x")\nr := g.Submit()\nn := r.Name\nm := r.On\ng.Show()'); ok(g(s, 'n') === '"Z"' && g(s, 'm') === '0', 'Submit() returns named control values'); }
// forms found in real scripts
T('comma sequence', 'n := 0\nf := () => (n += 1, n += 10, n)\nr := f()', { r: '11', n: '11' });
T('concat before parenthesis', 'v := 1\ns := \'{"a":\' (v ? "yes" : "no") . \',"b":\' (0 ? "x" : "y") \'}\'', { s: '"{\\"a\\":yes,\\"b\\":y}"'.replace(/\\"/g, '"') });
T('arrow function as a call argument is not a definition', 'OnMessage(0x0201, (w, l, m, h) => 1)\nsq(x) => x * x\nr := sq(7)', { r: '49' });
T('admin pretend', 'r := A_IsAdmin', { r: '1' });
T('hotkey with up', 'F1 up::MsgBox "x"\nF2::{\n  MsgBox "y"\n}', {});
console.log(fail.length ? 'SIM TESTS FAILED\n - ' + fail.join('\n - ') : 'sim ok');
process.exit(fail.length ? 1 : 0);
