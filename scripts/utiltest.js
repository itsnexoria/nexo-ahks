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
// ---- tool validators: a wrong file can never be trusted as AutoHotkey / the compiler ----
ok(C.looksLikeAhk('C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey64.exe') && C.looksLikeAhk('/x/AutoHotkey32.exe') && C.looksLikeAhk('AutoHotkey.exe') && C.looksLikeAhk('C:\\a\\autohotkey64_uia.exe'), 'real AutoHotkey v2 programs are accepted');
ok(!C.looksLikeAhk('AutoHotkeyU64.exe') && !C.looksLikeAhk('AutoHotkeyA32.exe') && !C.looksLikeAhk('Ahk2Exe.exe') && !C.looksLikeAhk('notepad.exe') && !C.looksLikeAhk('') && !C.looksLikeAhk(null) && !C.looksLikeAhk('AutoHotkey64.exe.bak'), 'v1 programs, the compiler and random files are refused as AutoHotkey');
ok(C.looksLikeCompiler('C:\\AutoHotkey\\Compiler\\Ahk2Exe.exe') && C.looksLikeCompiler('/x/ahk2exe.EXE') && !C.looksLikeCompiler('AutoHotkey64.exe') && !C.looksLikeCompiler('Ahk2Exe.exe.txt') && !C.looksLikeCompiler(undefined), 'only Ahk2Exe.exe is accepted as the compiler');
ok(C.isAhkV2('2.0.19') && C.isAhkV2(' 2.1-alpha.3 ') && !C.isAhkV2('1.1.37.02') && !C.isAhkV2('') && !C.isAhkV2(undefined), 'AutoHotkey version 2 is told apart from version 1');
// ---- update helpers ----
const U = require('../update-util');
ok(U.newer('1.10.0', '1.9.0') && U.newer('v2.0.0', '1.99.99') && !U.newer('1.2.3', '1.2.3') && !U.newer('1.2.2', '1.2.3') && U.newer('1.2.4', '1.2.3.9'), 'versions compare as numbers, not text');
ok(U.newer('1.2.0', '1.2.0-beta.1') && !U.newer('1.2.0-beta.1', '1.2.0') && U.newer('1.2.0-beta.10', '1.2.0-beta.2') && !U.newer('1.2.0-rc.1', '1.2.0-rc.1') && U.newer('1.2.0-rc.1', '1.2.0-beta.9'), 'a release beats its own prerelease and prereleases are ordered');
ok(!U.newer('garbage', '1.0.0') && U.newer('1.0.1', 'garbage'), 'junk versions do not crash');
ok(U.repoSlug('github:itsnexoria/nexo-ahks') === 'itsnexoria/nexo-ahks' && U.repoSlug({ url: 'git+https://github.com/itsnexoria/nexo.ahks.git' }) === 'itsnexoria/nexo.ahks' && U.repoSlug('https://github.com/a/b/') === 'a/b' && U.repoSlug('https://gitlab.com/a/b') === null && U.repoSlug(undefined) === null, 'the GitHub repo is found even when its name has a dot');
// ---- AutoHotkey download helpers ----
const R = require('../ahk-runtime-util');
const rel = { assets: [{ name: 'AutoHotkey_2.0.19_setup.exe', browser_download_url: 'https://github.com/AutoHotkey/AutoHotkey/releases/download/v2.0.19/AutoHotkey_2.0.19_setup.exe' }, { name: 'AutoHotkey_2.0.19.zip', size: 1234, digest: 'sha256:' + 'ab'.repeat(32), browser_download_url: 'https://github.com/AutoHotkey/AutoHotkey/releases/download/v2.0.19/AutoHotkey_2.0.19.zip' }] };
const as = R.pickAsset(rel);
ok(as && as.name === 'AutoHotkey_2.0.19.zip' && as.digest === 'sha256:' + 'ab'.repeat(32), 'the official v2 zip is picked from the release');
ok(R.pickAsset({ assets: [{ name: 'AutoHotkey_2.0.19.zip', browser_download_url: 'https://evil.example/AutoHotkey_2.0.19.zip' }] }) === null, 'a download from another host is refused');
ok(R.pickAsset({ assets: [{ name: 'AutoHotkey_1.1.37.02.zip', browser_download_url: 'https://github.com/x/y.zip' }] }) === null && R.pickAsset({}) === null && R.pickAsset(null) === null, 'version 1 zips and empty releases give nothing');
const buf = Buffer.from('hello'); const h = require('crypto').createHash('sha256').update(buf).digest('hex');
ok(R.verifyDigest(buf, 'sha256:' + h).ok && R.verifyDigest(buf, 'sha256:' + h).checked && !R.verifyDigest(buf, 'sha256:' + '0'.repeat(64)).ok && R.verifyDigest(buf, '').ok && !R.verifyDigest(buf, '').checked, 'checksums are enforced when GitHub gives one');
ok(R.entriesSafe(['AutoHotkey64.exe', 'Compiler/Ahk2Exe.exe']) && !R.entriesSafe(['../evil.exe']) && !R.entriesSafe(['a/../../b']) && !R.entriesSafe(['/etc/x']) && !R.entriesSafe(['C:\\Windows\\x']) && !R.entriesSafe(['..\\x']), 'zip entries cannot escape the folder');
const td = fs.mkdtempSync(path.join(os.tmpdir(), 'nx-rt-')); fs.mkdirSync(path.join(td, 'AutoHotkey', 'Compiler'), { recursive: true });
fs.writeFileSync(path.join(td, 'AutoHotkey', 'autohotkey64.exe'), 'x'); fs.writeFileSync(path.join(td, 'AutoHotkey', 'Compiler', 'Ahk2Exe.exe'), 'x');
const loc = R.locate(td); ok(loc.ahk && /autohotkey64\.exe$/i.test(loc.ahk) && loc.compiler && /Ahk2Exe\.exe$/.test(loc.compiler), 'the program and the compiler are found inside an unpacked download');
ok(R.locate(fs.mkdtempSync(path.join(os.tmpdir(), 'nx-rt-'))).ahk === null, 'an empty folder finds nothing');
console.log(fail.length ? 'UTIL TESTS FAILED\n - ' + fail.join('\n - ') : 'utils ok');
process.exit(fail.length ? 1 : 0);
