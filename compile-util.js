'use strict';
// Pure helpers for "Compile to EXE" (no Electron, so they can be unit-tested anywhere).
const clean = s => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').trim();
// Ahk2Exe wants a version like 1.2.3.4
function normVersion(v) {
  const p = clean(v).split('.').map(x => x.replace(/\D/g, '')).filter(x => x !== '');
  if (!p.length) return '1.0.0.0';
  while (p.length < 4) p.push('0');
  return p.slice(0, 4).map(x => String(Math.min(65535, +x))).join('.');
}
function safeExeName(n) { return (clean(n) || 'script').replace(/[\\/:*?"<>|]/g, '_').replace(/\.exe$/i, '') || 'script'; }
// The ;@Ahk2Exe-... comment lines that set the program's name, version, company, ... and "run as administrator".
function directives(o) {
  o = o || {}; const L = [], add = (k, v) => { v = clean(v); if (v) L.push(';@Ahk2Exe-' + k + ' ' + v); };
  add('SetName', o.name); add('SetVersion', normVersion(o.version)); add('SetCompanyName', o.company); add('SetDescription', o.description || o.name); add('SetCopyright', o.copyright);
  if (o.admin) L.push(';@Ahk2Exe-UpdateManifest 1');
  return L;
}
const withDirectives = (code, o) => { const d = directives(o); return d.length ? d.join('\n') + '\n' + String(code) : String(code); };
function compileArgs(a) {
  const r = ['/in', a.src, '/out', a.out, '/base', a.base, '/silent', 'verbose'];
  if (a.icon) r.push('/icon', a.icon);
  return r;
}

// ---- is this file really the program we expect? (so a wrong pick can never get stuck) ----
const baseName = p => String(p == null ? '' : p).split(/[\\/]/).pop().toLowerCase();
// AutoHotkey v2 programs: AutoHotkey64.exe, AutoHotkey32.exe, AutoHotkey.exe, AutoHotkey64_UIA.exe ...
// (AutoHotkeyU64.exe / AutoHotkeyA32.exe are v1 names, Ahk2Exe.exe is the compiler, so none of those count)
const looksLikeAhk = p => /^autohotkey(32|64)?(_uia)?\.exe$/.test(baseName(p));
const looksLikeCompiler = p => baseName(p) === 'ahk2exe.exe';
const isAhkV2 = v => /^2\./.test(String(v || '').trim());
module.exports = { looksLikeAhk, looksLikeCompiler, isAhkV2, clean, normVersion, safeExeName, directives, withDirectives, compileArgs };
