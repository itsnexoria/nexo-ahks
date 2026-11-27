'use strict';
// Pure helpers for the update check (no Electron, unit-tested).
function parseVersion(v) {
  const m = String(v == null ? '' : v).trim().replace(/^v/i, '').match(/^(\d+(?:\.\d+)*)(?:-([0-9A-Za-z.-]+))?/);
  if (!m) return { nums: [0], pre: '' };
  return { nums: m[1].split('.').map(n => parseInt(n, 10) || 0), pre: m[2] || '' };
}
// true when a is a newer version than b. 1.2.0 > 1.2.0-beta.1, 1.10.0 > 1.9.0
function newer(a, b) {
  const x = parseVersion(a), y = parseVersion(b), n = Math.max(x.nums.length, y.nums.length, 3);
  for (let i = 0; i < n; i++) { const p = x.nums[i] || 0, q = y.nums[i] || 0; if (p !== q) return p > q; }
  if (x.pre === y.pre) return false;
  if (!x.pre) return true;   // release beats its own prerelease
  if (!y.pre) return false;
  const A = x.pre.split('.'), B = y.pre.split('.');
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    if (A[i] === undefined) return false; if (B[i] === undefined) return true;
    const na = /^\d+$/.test(A[i]), nb = /^\d+$/.test(B[i]);
    if (na && nb) { if (+A[i] !== +B[i]) return +A[i] > +B[i]; }
    else if (na !== nb) return nb;       // numbers sort before words
    else if (A[i] !== B[i]) return A[i] > B[i];
  }
  return false;
}
// "owner/repo" from package.json "repository" (string or {url}); repo names may contain dots
function repoSlug(repository) {
  const s = String((repository && (repository.url || repository)) || '');
  const m = s.match(/github(?:\.com)?[/:]([^/\s:]+)\/([^/\s]+?)(?:\.git)?\/?(?:[#?].*)?$/i);
  return m ? m[1] + '/' + m[2] : null;
}
module.exports = { parseVersion, newer, repoSlug };
