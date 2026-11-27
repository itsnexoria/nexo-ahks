'use strict';
// Pure helpers for "Download AutoHotkey v2" (no Electron / network, so they are unit-tested).
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const RELEASES = 'https://api.github.com/repos/AutoHotkey/AutoHotkey/releases/latest';
const MAX_BYTES = 120 * 1024 * 1024;
const OK_HOSTS = /^https:\/\/(github\.com|objects\.githubusercontent\.com|release-assets\.githubusercontent\.com)\//i;
// the official v2 zip is called AutoHotkey_2.0.19.zip
function pickAsset(release) {
  const list = (release && Array.isArray(release.assets)) ? release.assets : [];
  const a = list.find(x => x && /^AutoHotkey_2\.\d+(\.\d+)*\.zip$/i.test(String(x.name)) && OK_HOSTS.test(String(x.browser_download_url)));
  return a ? { name: a.name, url: a.browser_download_url, size: a.size || 0, digest: typeof a.digest === 'string' ? a.digest : '' } : null;
}
// GitHub publishes "sha256:<hex>" for new assets. If we have one it must match.
function verifyDigest(buf, digest) {
  const m = /^sha256:([0-9a-f]{64})$/i.exec(String(digest || ''));
  if (!m) return { checked: false, ok: true };
  const got = crypto.createHash('sha256').update(buf).digest('hex');
  return { checked: true, ok: got.toLowerCase() === m[1].toLowerCase() };
}
// finds the first file (case-insensitive name) up to `depth` folders deep
function findFile(root, names, depth) {
  const want = new Set([].concat(names).map(n => n.toLowerCase()));
  const walk = (d, left) => {
    let es = []; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return null; }
    for (const e of es) if (e.isFile() && want.has(e.name.toLowerCase())) return path.join(d, e.name);
    if (left > 0) for (const e of es) if (e.isDirectory()) { const r = walk(path.join(d, e.name), left - 1); if (r) return r; }
    return null;
  };
  return walk(root, depth == null ? 3 : depth);
}
// after extracting: where are the AHK program and the compiler?
function locate(root) {
  return { ahk: findFile(root, ['AutoHotkey64.exe', 'AutoHotkey32.exe']), compiler: findFile(root, ['Ahk2Exe.exe']) };
}
// every entry of a zip listing must stay inside the target folder (zip-slip)
function entriesSafe(names) { return names.every(n => { n = String(n).replace(/\\/g, '/'); return !n.startsWith('/') && !/^[a-z]:/i.test(n) && !n.split('/').includes('..'); }); }
module.exports = { RELEASES, MAX_BYTES, OK_HOSTS, pickAsset, verifyDigest, findFile, locate, entriesSafe };
