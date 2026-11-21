// Unit tests for compile-util.js and crash-util.js (plain Node).
const fs = require('fs'), os = require('os'), path = require('path');
const C = require('../compile-util'), K = require('../crash-util');
const fail = []; const ok = (c, m) => { if (!c) fail.push(m); };
// compile
ok(C.normVersion('1.2') === '1.2.0.0' && C.normVersion('') === '1.0.0.0' && C.normVersion('v3.4.5.6.7') === '3.4.5.6' && C.normVersion('1.x.2') === '1.2.0.0' && C.normVersion('99999.1') === '65535.1.0.0', 'versions are normalised to four numbers');
ok(C.safeExeName('My: Tool?.exe') === 'My_ Tool_' && C.safeExeName('') === 'script' && C.safeExeName('a/b\\c') === 'a_b_c', 'exe names are made safe');
const d = C.directives({ name: 'Clicker', version: '2.1', company: 'Nexoria', description: 'Auto clicker\nwith newline', copyright: '(c) 2026', admin: true });
ok(d.includes(';@Ahk2Exe-SetName Clicker') && d.includes(';@Ahk2Exe-SetVersion 2.1.0.0') && d.includes(';@Ahk2Exe-SetCompanyName Nexoria') && d.includes(';@Ahk2Exe-SetDescription Auto clicker with newline') && d.includes(';@Ahk2Exe-SetCopyright (c) 2026') && d.includes(';@Ahk2Exe-UpdateManifest 1'), 'directives are written (newlines removed, admin manifest): ' + d.join(' | '));
ok(!C.directives({ name: 'x' }).some(x => /UpdateManifest|CompanyName|Copyright/.test(x)), 'optional directives are left out when empty');
ok(C.withDirectives('x := 1', { name: 'A' }).startsWith(';@Ahk2Exe-SetName A\n') && C.withDirectives('x := 1', { name: 'A' }).endsWith('\nx := 1'), 'directives go in front of the script');
ok(C.compileArgs({ src: 'a.ahk', out: 'a.exe', base: 'AutoHotkey64.exe' }).join(' ') === '/in a.ahk /out a.exe /base AutoHotkey64.exe /silent verbose' && C.compileArgs({ src: 'a', out: 'b', base: 'c', icon: 'i.ico' }).slice(-2).join(' ') === '/icon i.ico', 'compiler arguments, with optional icon');
// crash
const txt = K.formatCrash('Unexpected error', new Error('boom'), { version: '9.9', platform: 'win32 x64', electron: '30' });
ok(/Unexpected error/.test(txt) && /Nexo Ahks 9\.9 on win32 x64 \(Electron 30\)/.test(txt) && /boom/.test(txt), 'crash report has version, platform and the error');
ok(/just text/.test(K.formatCrash('x', 'just text', {})), 'non-Error values are reported too');
const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nexo-crash-')), 'sub', 'crash.log');
ok(K.appendLog(f, 'one') && K.appendLog(f, 'two') && /one[\s\S]*two/.test(fs.readFileSync(f, 'utf8')), 'log appends and creates its folder');
for (let i = 0; i < 50; i++) K.appendLog(f, 'x'.repeat(5000), 100000);
ok(fs.statSync(f).size <= 100000 + 20, 'log is trimmed so it never grows without limit: ' + fs.statSync(f).size);
const blocker = path.join(path.dirname(f), 'iamafile'); fs.writeFileSync(blocker, 'x');
ok(K.appendLog(path.join(blocker, 'sub', 'crash.log'), 'x') === false, 'an unwritable log does not throw');
const g = K.makeThrottle(1000);
ok(g.begin('a', 0) === true && g.begin('b', 10) === false, 'only one crash dialog at a time'); g.end();
ok(g.begin('a', 500) === false, 'the same message is not repeated within the gap'); ok(g.begin('a', 2000) === true, 'but is allowed again later'); g.end();
ok(g.begin('c', 2001) === true, 'a different message is allowed after the dialog closed');
console.log(fail.length ? 'UTIL TESTS FAILED\n - ' + fail.join('\n - ') : 'utils ok');
process.exit(fail.length ? 1 : 0);
