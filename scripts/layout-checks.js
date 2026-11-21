// Page-side layout checks. Runs inside the real app page (Electron or any browser); returns a list of problems.
// Usage:  const problems = await page.evaluate('(' + layoutChecks.toString() + ')()')
function layoutChecks() {
  const out = [], vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
  const name = e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : '')) + (e.textContent ? ' "' + e.textContent.trim().slice(0, 18) + '"' : '');
  const W = innerWidth;
  // 1. header and toolbar must each stay on ONE row
  const oneRow = (root, label) => {
    if (!root) return out.push(label + ' is missing');
    const items = [...root.querySelectorAll('button,select,input,.sp')].filter(e => vis(e) && e.className !== 'sp');
    if (!items.length) return;
    const mids = items.map(e => { const r = e.getBoundingClientRect(); return Math.round(r.top + r.height / 2); }), min = Math.min(...mids), max = Math.max(...mids);
    if (max - min > 14) { const wrapped = items.filter((e, i) => mids[i] - min > 14).map(name).slice(0, 4).join(', '); out.push(label + ' wraps onto a second row (' + wrapped + ')'); }
  };
  oneRow(document.getElementById('top'), 'Header');
  oneRow(document.getElementById('bar'), 'Toolbar');
  // 2. nothing may make the page scroll sideways
  const de = document.documentElement;
  if (de.scrollWidth > W + 1) out.push('The page scrolls sideways (' + de.scrollWidth + 'px wide in a ' + W + 'px window)');
  if (document.body.scrollWidth > W + 1) out.push('The body is wider than the window (' + document.body.scrollWidth + 'px)');
  // 3. button text must not be cut off
  document.querySelectorAll('button').forEach(b => {
    if (!vis(b) || b.closest('[hidden]') || b.closest('dialog:not([open])')) return;
    if (b.scrollWidth > b.clientWidth + 2) out.push('Button text is cut off: ' + name(b) + ' (' + b.scrollWidth + ' > ' + b.clientWidth + ')');
  });
  // 4. header and toolbar controls must be fully on screen
  ['top', 'bar'].forEach(id => { const r = document.getElementById(id); if (!r) return; r.querySelectorAll('button,select,input').forEach(e => { if (!vis(e)) return; const b = e.getBoundingClientRect(); if (b.right > W + 1 || b.left < -1) out.push('Off screen in the ' + id + ': ' + name(e) + ' (right edge at ' + Math.round(b.right) + ' of ' + W + ')'); }); });
  // 5. the working areas must have a usable size
  [['side', 140], ['main', 400]].forEach(([id, min]) => { const e = document.getElementById(id); if (e && vis(e) && e.getBoundingClientRect().width < min) out.push('#' + id + ' is too narrow (' + Math.round(e.getBoundingClientRect().width) + 'px)'); });
  return out;
}
if (typeof module !== 'undefined') module.exports = layoutChecks;
