/* Nexo Ahks "Try it" simulator: runs the *generated* AutoHotkey v2 code in a small interpreter so you can
   click your window, watch variables and see what would happen, without AutoHotkey installed.
   Pure JavaScript (no DOM) so it can be tested in Node. Anything it cannot simulate is reported, never silently wrong. */
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.Sim = factory(); })(typeof self !== 'undefined' ? self : this, function () {
'use strict';
class SimError extends Error { constructor(m, ln) { super(m); this.ln = ln; } }
const KW = new Set(['if', 'else', 'while', 'loop', 'for', 'try', 'catch', 'finally', 'switch', 'case', 'default', 'return', 'break', 'continue', 'global', 'static', 'local', 'throw', 'class', 'until', 'goto', 'gosub']);
const lc = s => String(s).toLowerCase();

/* ---------- source -> logical lines ---------- */
function stripComment(l) { let q = ''; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '`') i++; else if (c === q) q = ''; continue; } if (c === '"' || c === "'") { q = c; continue; } if (c === ';' && (i === 0 || /\s/.test(l[i - 1]))) return l.slice(0, i); } return l; }
function depthOf(l) { let d = 0, q = ''; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '`') i++; else if (c === q) q = ''; continue; } if (c === '"' || c === "'") { q = c; continue; } if (c === '(' || c === '[') d++; else if (c === ')' || c === ']') d--; } return d; }
function prep(src) {
  const raw = String(src).replace(/\r\n?/g, '\n').split('\n'), out = []; let blk = false;
  for (let i = 0; i < raw.length; i++) {
    let l = raw[i];
    if (blk) { if (l.includes('*/')) { blk = false; l = l.slice(l.indexOf('*/') + 2); } else continue; }
    if (l.trim().startsWith('/*')) { if (!l.includes('*/')) blk = true; continue; }
    l = stripComment(l).trim(); if (!l) continue;
    out.push({ t: l, ln: i + 1 });
  }
  const j = [];
  for (const o of out) {
    const p = j[j.length - 1];
    const cont = p && (depthOf(p.t) > 0 || /(,|&&|\|\||\band|\bor)$/i.test(p.t) && !/^(case|default)\b/i.test(p.t) || /^(\.\s|,|&&|\|\||\?\s|:\s|and\b|or\b)/i.test(o.t));
    if (cont) p.t += ' ' + o.t; else j.push({ t: o.t, ln: o.ln });
  }
  const k = [];
  for (const o of j) { let t = o.t; while (t.length > 1 && t[0] === '}') { k.push({ t: '}', ln: o.ln }); t = t.slice(1).trim(); } if (t) k.push({ t, ln: o.ln }); }
  return k;
}

/* ---------- tokenizer ---------- */
const OPS = [':=', '+=', '-=', '*=', '/=', '//=', '.=', '|=', '&=', '^=', '>>=', '<<=', '!==', '===', '==', '!=', '<>', '<=', '>=', '&&', '||', '++', '--', '**', '//', '=>', '~=', '<<', '>>', '??', '+', '-', '*', '/', '=', '<', '>', '!', '?', ':', ',', '(', ')', '[', ']', '{', '}', '.', '&', '|', '^', '~', '%'];
const ESC = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', a: '\x07', '0': '\0' };
function tokenize(s, ln) {
  const T = []; let i = 0, sp = false;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; sp = true; continue; }
    if (c === '"' || c === "'") { let j = i + 1, v = ''; for (; j < s.length && s[j] !== c; j++) { if (s[j] === '`' && j + 1 < s.length) { j++; v += ESC[s[j]] !== undefined ? ESC[s[j]] : s[j]; } else v += s[j]; } if (j >= s.length) throw new SimError('Missing closing quote', ln); T.push({ t: 'str', v, sp }); i = j + 1; sp = false; continue; }
    let m;
    if ((m = /^0x[0-9a-f]+/i.exec(s.slice(i)))) { T.push({ t: 'num', v: parseInt(m[0], 16), sp }); i += m[0].length; sp = false; continue; }
    if ((m = /^\d+(\.\d+)?(e[+-]?\d+)?/i.exec(s.slice(i)))) { T.push({ t: 'num', v: Number(m[0]), sp }); i += m[0].length; sp = false; continue; }
    if ((m = /^[A-Za-z_\u0080-\uffff][\w\u0080-\uffff]*/.exec(s.slice(i)))) { T.push({ t: 'id', v: m[0], sp }); i += m[0].length; sp = false; continue; }
    const op = OPS.find(o => s.startsWith(o, i));
    if (!op) throw new SimError('Unexpected character "' + c + '"', ln);
    T.push({ t: 'op', v: op, sp }); i += op.length; sp = false;
  }
  return T;
}

/* ---------- expression parser (Pratt) ---------- */
const ASSIGN = new Set([':=', '+=', '-=', '*=', '/=', '//=', '.=', '|=', '&=', '^=', '>>=', '<<=']);
const CMP = new Set(['=', '==', '!=', '!==', '<>', '<', '>', '<=', '>=', '~=']);
function parseExpr(T, ln, from = 0) {
  let p = from;
  const peek = () => T[p], next = () => T[p++], isOp = (v, t = peek()) => t && t.t === 'op' && t.v === v;
  const fail = m => { throw new SimError(m, ln); };
  function startsOperand(t) { return t && (t.t === 'num' || t.t === 'str' || (t.t === 'id' && !/^(and|or|not|is|in|contains)$/i.test(t.v)) || (t.t === 'op' && (t.v === '(' || t.v === '[' || t.v === '!' ) && t.sp && t.v !== '!')); }
  function expr(bp) {
    let l = unary();
    for (;;) {
      const t = peek(); if (!t) break;
      let op = t.t === 'op' ? t.v : t.t === 'id' && /^(and|or)$/i.test(t.v) ? lc(t.v) : null;
      if (startsOperand(t) && bp <= 9 && (op === null || ((t.v === '(' || t.v === '[') && t.sp))) { const r = expr(10); l = { k: 'cat', l, r }; continue; }
      if (op === null) break;
      if (ASSIGN.has(op)) { if (bp > 1) break; next(); const r = expr(1); l = { k: 'asg', op, t: l, v: r }; continue; }
      if (op === '?') { if (bp > 2) break; next(); const a = expr(1); if (!isOp(':')) fail('Missing ":" in ? : expression'); next(); const b = expr(1); l = { k: 'tern', c: l, a, b }; continue; }
      if (op === '??') { if (bp > 3) break; next(); l = { k: 'coal', l, r: expr(4) }; continue; }
      if (op === '||' || op === 'or') { if (bp > 4) break; next(); l = { k: 'or', l, r: expr(5) }; continue; }
      if (op === '&&' || op === 'and') { if (bp > 5) break; next(); l = { k: 'and', l, r: expr(6) }; continue; }
      if (CMP.has(op)) { if (bp > 8) break; next(); l = { k: 'bin', op, l, r: expr(9) }; continue; }
      if (op === '.' && t.sp) { if (bp > 9) break; next(); l = { k: 'cat', l, r: expr(10) }; continue; }
      if (op === '+' || op === '-') { if (bp > 11) break; next(); l = { k: 'bin', op, l, r: expr(12) }; continue; }
      if (op === '*' || op === '/' || op === '//') { if (bp > 12) break; next(); l = { k: 'bin', op, l, r: expr(13) }; continue; }
      if (op === '&' || op === '|' || op === '^' || op === '<<' || op === '>>') { if (bp > 10) break; next(); l = { k: 'bin', op, l, r: expr(11) }; continue; }
      if (op === '**') { if (bp > 14) break; next(); l = { k: 'bin', op, l, r: expr(14) }; continue; }
      break;
    }
    return l;
  }
  function unary() {
    const t = peek(); if (!t) fail('Unexpected end of expression');
    if (t.t === 'op') {
      if (t.v === '!') { next(); return { k: 'not', x: expr(13) }; }
      if (t.v === '-') { next(); return { k: 'neg', x: expr(13) }; }
      if (t.v === '+') { next(); return expr(13); }
      if (t.v === '~') { next(); return { k: 'bnot', x: expr(13) }; }
      if (t.v === '&') { next(); return { k: 'ref', x: unary() }; }
      if (t.v === '++' || t.v === '--') { next(); return { k: 'inc', pre: 1, d: t.v === '++' ? 1 : -1, t: unary() }; }
    }
    if (t.t === 'id' && lc(t.v) === 'not') { next(); return { k: 'not', x: expr(6) }; }
    return postfix(primary());
  }
  function postfix(e) {
    for (;;) {
      const t = peek(); if (!t) break;
      if (isOp('(', t) && !t.sp) { next(); e = { k: 'call', f: e, a: args(')') }; continue; }
      if (isOp('[', t) && !t.sp) { next(); e = { k: 'idx', o: e, a: args(']') }; continue; }
      if (isOp('.', t) && !t.sp && T[p + 1] && T[p + 1].t === 'id') { next(); const n = next().v; e = { k: 'mem', o: e, n }; continue; }
      if ((isOp('++', t) || isOp('--', t)) && !startsOperand(T[p + 1])) { next(); e = { k: 'inc', pre: 0, d: t.v === '++' ? 1 : -1, t: e }; continue; }
      break;
    }
    return e;
  }
  function args(close) {
    const a = [];
    if (isOp(close)) { next(); return a; }
    for (;;) {
      if (isOp(',')) { next(); a.push({ k: 'unset' }); continue; }
      if (isOp(close)) { next(); break; }
      let e = expr(1);
      if (isOp('*')) { next(); e = { k: 'spread', x: e }; }
      a.push(e);
      if (isOp(',')) { next(); if (isOp(close)) { next(); break; } continue; }
      if (isOp(close)) { next(); break; }
      fail('Expected "," or "' + close + '"');
    }
    return a;
  }
  function lambdaParams(from) {
    const ps = []; let q = from;
    while (T[q] && !(T[q].t === 'op' && T[q].v === ')')) {
      let byref = false, rest = false, nm;
      if (isOp('&', T[q])) { byref = true; q++; }
      if (isOp('*', T[q])) { rest = true; q++; if (isOp(',', T[q])) { q++; continue; } if (isOp(')', T[q])) break; }
      if (!T[q] || T[q].t !== 'id') return null;
      nm = T[q].v; q++;
      if (isOp('*', T[q])) { rest = true; q++; }
      ps.push({ n: nm, byref, rest });
      if (isOp(',', T[q])) q++;
    }
    return { ps, end: q };
  }
  function primary() {
    const t = next();
    if (t.t === 'num') return { k: 'num', v: t.v };
    if (t.t === 'str') return { k: 'str', v: t.v };
    if (t.t === 'id') {
      if (isOp('=>')) { next(); return { k: 'lam', ps: [{ n: t.v }], b: expr(1) }; }
      const n = lc(t.v);
      if (n === 'true') return { k: 'num', v: 1 }; if (n === 'false') return { k: 'num', v: 0 };
      if (n === 'unset') return { k: 'unset' };
      return { k: 'var', n: t.v };
    }
    if (t.v === '(') {
      const lp = lambdaParams(p); if (lp && T[lp.end + 1] && T[lp.end + 1].t === 'op' && T[lp.end + 1].v === '=>') { p = lp.end + 2; return { k: 'lam', ps: lp.ps, b: expr(1) }; }
      const e = expr(1); if (isOp(',')) { const list = [e]; while (isOp(',')) { next(); list.push(expr(1)); } if (!isOp(')')) fail('Missing ")"'); next(); return { k: 'seq', a: list }; } if (!isOp(')')) fail('Missing ")"'); next(); return { k: 'par', x: e };
    }
    if (t.v === '[') return { k: 'arr', a: args(']') };
    if (t.v === '{') { const o = []; while (!isOp('}')) { if (!peek()) fail('Missing "}"'); const kt = next(); if (!isOp(':')) fail('Expected ":" in object'); next(); o.push([kt.v, expr(1)]); if (isOp(',')) next(); } next(); return { k: 'obj', o }; }
    fail('Unexpected "' + (t.v === undefined ? '?' : t.v) + '"');
  }
  const e = expr(0);
  return { e, end: p };
}
const compileExpr = (s, ln) => { const T = tokenize(s, ln); if (!T.length) return { k: 'unset' }; const r = parseExpr(T, ln); if (r.end < T.length) throw new SimError('Unexpected "' + (T[r.end].v) + '"', ln); return r.e; };
function splitTop(s) { const o = []; let cur = '', d = 0, q = ''; for (let i = 0; i < s.length; i++) { const c = s[i]; if (q) { cur += c; if (c === '`' && i + 1 < s.length) cur += s[++i]; else if (c === q) q = ''; continue; } if (c === '"' || c === "'") { q = c; cur += c; continue; } if ('([{'.includes(c)) d++; if (')]}'.includes(c)) d--; if (c === ',' && d === 0) { o.push(cur.trim()); cur = ''; continue; } cur += c; } if (cur.trim() !== '' || o.length) o.push(cur.trim()); return o; }

/* ---------- statement parser ---------- */
function parseParams(s, ln) {
  return splitTop(s).filter(Boolean).map(z => {
    let byref = false, rest = false, def = null, opt = false;
    if (z === '*') return { n: '', byref: false, rest: true, def: null, opt: false };
    if (z[0] === '&') { byref = true; z = z.slice(1).trim(); }
    if (z.endsWith('*')) { rest = true; z = z.slice(0, -1).trim(); }
    const m = z.match(/^([A-Za-z_]\w*)\s*(\?)?\s*(?::=\s*(.*))?$/);
    if (!m) throw new SimError('Bad parameter "' + z + '"', ln);
    if (m[2]) opt = true; if (m[3] !== undefined) def = compileExpr(m[3], ln);
    return { n: m[1], byref, rest, def, opt };
  });
}
function parseProgram(src) {
  const L = prep(src); let p = 0; const funcs = new Map(), hotkeys = [], hotstrings = [], notes = [];
  const cmdNames = null;
  function block() { const b = []; while (p < L.length) { if (L[p].t === '}') { p++; return b; } const s = stmt(); if (s) b.push(s); } return b; }
  function body() { if (L[p] && L[p].t === '{') { p++; return block(); } const s = stmt(); return s ? [s] : []; }
  function skipBlock() { let d = 1; while (p < L.length && d > 0) { const t = L[p].t; if (t.endsWith('{')) d++; if (t === '}') d--; p++; } }
  function openOf(t) { return t.endsWith('{') ? [t.slice(0, -1).trim(), true] : [t, false]; }
  function afterHeader(open) { if (open) return block(); return body(); }
  function stmt() {
    const { t, ln } = L[p]; let m;
    if (t === '{') { p++; return { k: 'blk', b: block(), ln }; }
    if (t[0] === '#') { p++; if (/^#HotIf/i.test(t)) notes.push('HotIf'); return null; }
    if (/^[A-Za-z_]\w*:$/.test(t) && !/^(default|else|try|finally)\s*:/i.test(t)) { p++; return null; }
    if ((m = /^:([^:]*):([^:]+)::(.*)$/.exec(t))) { p++; hotstrings.push({ opts: m[1], abbr: m[2], text: m[3].trim(), ln }); return null; }
    if ((m = /^(~?[*$]*[<>^!+#~*$]*(?:[^\s:"'=]+(?:\s+up)?|[^\s"'=]+ & [^\s"'=]+))::(.*)$/.exec(t)) && !/:=/.test(m[1])) {
      p++; let rest = m[2].trim(), b;
      if (rest === '{') b = block(); else if (rest === '' && L[p] && L[p].t === '{') { p++; b = block(); } else if (rest.endsWith('{')) { rest = rest.slice(0, -1).trim(); b = [lineStmt(rest, ln)].concat(block()); } else b = rest ? [lineStmt(rest, ln)] : [];
      hotkeys.push({ key: m[1], body: b, ln }); return null;
    }
    let mm;
    if ((mm = /^(if)\b\s*(.*)$/i.exec(t)) && !/^if\s*(:=|=)/i.test(t)) {
      const [c, open] = openOf(mm[2]); p++; const ce = compileExpr(c, ln); const b = afterHeader(open); let e = null;
      if (L[p] && /^else\b/i.test(L[p].t)) { const r = L[p].t.slice(4).trim(); if (r === '') { p++; e = body(); } else if (r === '{') { p++; e = block(); } else { L[p] = { t: r, ln: L[p].ln }; e = [stmt()].filter(Boolean); } }
      return { k: 'if', c: ce, b, e, ln };
    }
    if ((mm = /^while\b\s*(.*)$/i.exec(t))) { const [c, open] = openOf(mm[1]); p++; return { k: 'while', c: compileExpr(c, ln), b: afterHeader(open), ln }; }
    if ((mm = /^loop\b\s*(.*)$/i.exec(t))) {
      const [c, open] = openOf(mm[1]); p++;
      if (/^(files|parse|read|reg)\b/i.test(c)) {
        const kind = lc(c.split(/\s/)[0]), a = c.slice(kind.length).replace(/^[\s,]+/, ''), b = afterHeader(open);
        if (kind === 'parse') { const ar = splitTop(a); return { k: 'lparse', s: compileExpr(ar[0] || '""', ln), d: ar[1] ? compileExpr(ar[1], ln) : null, b, ln }; }
        return { k: 'lunsup', n: 'Loop ' + kind, b, ln };
      }
      return { k: 'loop', n: c ? compileExpr(c, ln) : null, b: afterHeader(open), ln };
    }
    if ((mm = /^for\s+(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.*)$/i.exec(t))) { const [c, open] = openOf(mm[3]); p++; return { k: 'for', a: mm[1], b2: mm[2] || null, o: compileExpr(c, ln), b: afterHeader(open), ln }; }
    if ((mm = /^try\b\s*(.*)$/i.exec(t))) {
      const rest = mm[1].trim(); let b; p++;
      if (rest === '{') b = block(); else if (rest === '') b = body(); else { L[p - 1] = { t: rest, ln }; p--; b = [stmt()].filter(Boolean); }
      let cv = null, cb = null, fb = null;
      if (L[p] && /^catch\b/i.test(L[p].t)) { let r = L[p].t.slice(5).trim(); const open = r.endsWith('{'); if (open) r = r.slice(0, -1).trim(); const am = /(?:^|\s)as\s+(\w+)$/i.exec(r); cv = am ? am[1] : null; p++; cb = open ? block() : body(); }
      if (L[p] && /^finally\b/i.test(L[p].t)) { let r = L[p].t.slice(7).trim(); const open = r.endsWith('{'); p++; fb = open ? block() : body(); }
      return { k: 'try', b, cv, cb, fb, ln };
    }
    if ((mm = /^switch\b\s*(.*)$/i.exec(t))) {
      const [c, open] = openOf(mm[1]); p++; if (!open && L[p] && L[p].t === '{') p++;
      const cases = []; let cur = null;
      while (p < L.length && L[p].t !== '}') {
        const lt = L[p].t, cm = /^case\s+(.*)$/i.exec(lt), dm = /^default\b\s*:?\s*(.*)$/i.exec(lt);
        if (cm || dm) {
          let head = cm ? cm[1] : '', rest = dm ? dm[1] : '';
          if (cm) { let q = '', ci = -1; for (let i = 0; i < head.length; i++) { const ch = head[i]; if (q) { if (ch === '`') i++; else if (ch === q) q = ''; continue; } if (ch === '"' || ch === "'") { q = ch; continue; } if (ch === ':') { ci = i; break; } } rest = ci >= 0 ? head.slice(ci + 1).trim() : ''; head = ci >= 0 ? head.slice(0, ci) : head; }
          cur = { v: cm ? splitTop(head).map(z => compileExpr(z, L[p].ln)) : null, b: [] }; cases.push(cur);
          if (rest) { L[p] = { t: rest, ln: L[p].ln }; cur.b.push(stmt()); } else p++;
          continue;
        }
        if (!cur) throw new SimError('Expected "case" in switch', L[p].ln);
        const s = stmt(); if (s) cur.b.push(s);
      }
      p++; return { k: 'switch', e: compileExpr(c, ln), cases, ln };
    }
    if (/^class\b/i.test(t)) { const open = t.endsWith('{'); p++; if (open || (L[p] && L[p].t === '{')) { if (!open) p++; skipBlock(); } notes.push('class'); return null; }
    if ((mm = /^return\b\s*(.*)$/i.exec(t))) { p++; return { k: 'ret', e: mm[1] ? compileExpr(mm[1], ln) : null, ln }; }
    if (/^break\b/i.test(t)) { p++; return { k: 'brk', ln }; }
    if (/^continue\b/i.test(t)) { p++; return { k: 'cnt', ln }; }
    if ((mm = /^throw\b\s*(.*)$/i.exec(t))) { p++; return { k: 'throw', e: mm[1] ? compileExpr(mm[1], ln) : null, ln }; }
    if ((mm = /^(global|local|static)\b\s*(.*)$/i.exec(t)) && !/^(global|local|static)\s*(:=|=)/i.test(t)) {
      p++; const kind = lc(mm[1]), items = splitTop(mm[2]).map(z => { const q = /^([A-Za-z_]\w*)\s*(?::=\s*(.*))?$/.exec(z); if (!q) throw new SimError('Bad declaration "' + z + '"', ln); return { n: q[1], init: q[2] !== undefined ? compileExpr(q[2], ln) : null }; });
      return { k: 'decl', kind, items, ln };
    }
    if ((mm = /^([A-Za-z_]\w*)\(([^()]*)\)\s*=>\s*(.*)$/.exec(t)) && !KW.has(lc(mm[1]))) { p++; funcs.set(lc(mm[1]), { name: mm[1], ps: parseParams(mm[2], ln), body: [{ k: 'ret', e: compileExpr(mm[3], ln), ln }] }); return null; }
    if ((mm = /^([A-Za-z_]\w*)\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*(\{)?$/.exec(t)) && !KW.has(lc(mm[1])) && (mm[3] || (L[p + 1] && L[p + 1].t === '{'))) {
      p++; if (!mm[3]) p++; const ps = parseParams(mm[2], ln); funcs.set(lc(mm[1]), { name: mm[1], ps, body: block() }); return null;
    }
    p++; return lineStmt(t, ln);
  }
  function lineStmt(t, ln) {
    let m;
    if ((m = /^([A-Za-z_]\w*)\s+(.+)$/.exec(t)) && !KW.has(lc(m[1])) && !/^(:=|\+=|-=|\*=|\/=|\/\/=|\.=|=|==|!=|<|>|\?|\.|\+\+|--|&&|\|\||and\b|or\b|is\b|in\b|contains\b|~=|\*|\/|\+|-(?!\s*\d)|&(?=\s|&|=)|\||\^|%)/i.test(m[2]) && !(/^\(/.test(m[2]) && !/^\([^()]*\)\s*=>/.test(m[2]))) {
      const a = splitTop(m[2].replace(/^,\s*/, '')).map(z => z === '' ? { k: 'unset' } : compileExpr(z, ln));
      return { k: 'x', e: { k: 'call', f: { k: 'var', n: m[1] }, a, cmd: 1 }, ln };
    }
    if (/^[A-Za-z_]\w*$/.test(t) && !KW.has(lc(t))) return { k: 'x', e: { k: 'bare', n: t }, ln };
    return { k: 'x', e: compileExpr(t, ln), ln };
  }
  const top = []; while (p < L.length) { if (L[p].t === '}') { p++; continue; } const s = stmt(); if (s) top.push(s); }
  return { top, funcs, hotkeys, hotstrings, notes };
}

/* ---------- values ---------- */
class AArr { constructor(a) { this.a = a || []; } }
class AMap { constructor() { this.m = new Map(); this.def = undefined; } }
class AObj { constructor(p) { this.p = p || {}; } }
class AStub { constructor(n) { this.n = n; } }
class AMatch { constructor(m) { this.m = m; } }
class Fn { constructor(def, env) { this.def = def; this.env = env || null; this.name = def.name || '(function)'; } }
class BFn { constructor(n) { this.n = n; } }
class Ref { constructor(get, set) { this.get = get; this.set = set; } }
class ExitSignal extends Error {}
class SimStop extends Error {}
const typeName = v => v === undefined ? 'unset' : typeof v === 'number' ? (Number.isInteger(v) ? 'Integer' : 'Float') : typeof v === 'string' ? 'String' : v instanceof AArr ? 'Array' : v instanceof AMap ? 'Map' : v instanceof AStub ? 'Object' : v instanceof VCtl ? 'Gui.' + v.type : v instanceof VGui ? 'Gui' : (v instanceof Fn || v instanceof BFn) ? 'Func' : 'Object';
const isNumStr = s => typeof s === 'string' && /^\s*([-+]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?|0x[0-9a-f]+)\s*$/i.test(s);
function num(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && isNumStr(v)) return /^\s*0x/i.test(v) ? parseInt(v, 16) : Number(v);
  throw new SimError('Expected a Number but got ' + (v === undefined ? 'an unset value' : v === '' ? 'an empty string' : typeof v === 'string' ? 'a String ("' + v.slice(0, 20) + '")' : 'a ' + typeName(v)) + '.');
}
function str(v) { if (v === undefined) return ''; if (typeof v === 'number') return String(v); if (typeof v === 'string') return v; throw new SimError('Expected a String but got ' + (/^[AEIOU]/.test(typeName(v)) ? 'an ' : 'a ') + typeName(v) + '.'); }
function truthy(v) { if (v === undefined || v === '' || v === 0) return false; if (typeof v === 'string' && isNumStr(v)) return num(v) !== 0; return true; }
const show = v => typeof v === 'string' ? '"' + v + '"' : v === undefined ? '' : (v instanceof AArr ? '[…]' : v instanceof AMap ? 'Map' : typeof v === 'number' ? String(v) : typeName(v));
const bool = b => (b ? 1 : 0);
const pad2 = n => String(n).padStart(2, '0');
function ymd(d) { return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds()); }
function parseYmd(s) { s = String(s); const m = /^(\d{4})(\d\d)?(\d\d)?(\d\d)?(\d\d)?(\d\d)?/.exec(s); if (!m) throw new SimError('Invalid date/time "' + s + '"'); return new Date(+m[1], (+m[2] || 1) - 1, +m[3] || 1, +m[4] || 0, +m[5] || 0, +m[6] || 0); }
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MONS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function formatTime(t, f) {
  const d = parseYmd(t); if (f === '' || f === undefined) f = 'h:mm tt dddd, MMMM d, yyyy';
  return f.replace(/'([^']*)'|yyyy|yy|MMMM|MMM|MM|M|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|tt|t/g, (m, lit) => {
    if (lit !== undefined) return lit; const h12 = d.getHours() % 12 || 12;
    return { yyyy: d.getFullYear(), yy: pad2(d.getFullYear() % 100), MMMM: MONS[d.getMonth()], MMM: MONS[d.getMonth()].slice(0, 3), MM: pad2(d.getMonth() + 1), M: d.getMonth() + 1, dddd: DAYS[d.getDay()], ddd: DAYS[d.getDay()].slice(0, 3), dd: pad2(d.getDate()), d: d.getDate(), HH: pad2(d.getHours()), H: d.getHours(), hh: pad2(h12), h: h12, mm: pad2(d.getMinutes()), m: d.getMinutes(), ss: pad2(d.getSeconds()), s: d.getSeconds(), tt: d.getHours() < 12 ? 'AM' : 'PM', t: d.getHours() < 12 ? 'A' : 'P' }[m];
  });
}
function format(fmt, args) {
  let auto = 0;
  return String(fmt).replace(/\{(\d*)(?::([^}]*))?\}/g, (m0, idx, spec) => {
    const i = idx === '' ? auto++ : Number(idx) - 1; let v = args[i]; if (v === undefined) return '';
    if (!spec) return str(v);
    const m = /^([-0+ #]*)(\d*)(?:\.(\d+))?([a-zA-Z]?)$/.exec(spec); if (!m) return str(v);
    const flags = m[1], w = +m[2] || 0, pr = m[3] === undefined ? null : +m[3], ty = m[4]; let o;
    if (ty === 'f' || ty === 'F') o = num(v).toFixed(pr === null ? 6 : pr);
    else if (ty === 'e' || ty === 'E') o = num(v).toExponential(pr === null ? 6 : pr);
    else if (ty === 'x') o = Math.trunc(num(v)).toString(16); else if (ty === 'X') o = Math.trunc(num(v)).toString(16).toUpperCase(); else if (ty === 'o') o = Math.trunc(num(v)).toString(8);
    else if (ty === 'd' || ty === 'i' || ty === 'u') o = String(Math.trunc(num(v)));
    else { o = str(v); if (pr !== null) o = o.slice(0, pr); if (ty === 'U') o = o.toUpperCase(); if (ty === 'l') o = o.toLowerCase(); }
    if (ty === 'x' && flags.includes('#')) o = '0x' + o;
    if (o.length < w) { if (flags.includes('-')) o = o.padEnd(w); else if (flags.includes('0') && ty !== 's' && typeof v !== 'string' || (flags.includes('0') && ty)) o = (o[0] === '-' ? '-' + o.slice(1).padStart(w - 1, '0') : o.padStart(w, '0')); else o = o.padStart(w); }
    return o;
  });
}
function toRegex(needle, extraFlags) {
  let flags = 'd' + (extraFlags || ''); const m = /^([imsxADJUXSC`\n\r]*)\)/.exec(needle);
  if (m) { needle = needle.slice(m[0].length); for (const c of m[1]) { if (c === 'i' && !flags.includes('i')) flags += 'i'; if (c === 'm' && !flags.includes('m')) flags += 'm'; if (c === 's' && !flags.includes('s')) flags += 's'; } }
  try { return new RegExp(needle.replace(/\(\?P</g, '(?<'), flags); } catch (e) { throw new SimError('Bad regular expression: ' + e.message); }
}

/* ---------- Gui objects ---------- */
let UID = 100;
const SIZES = { Text: [0, 20], Edit: [120, 24], Button: [80, 26], Checkbox: [0, 22], Radio: [0, 22], DropDownList: [120, 24], ComboBox: [120, 24], ListBox: [120, 100], ListView: [200, 120], Slider: [120, 24], Progress: [120, 18], GroupBox: [160, 100], Tab3: [240, 140], Tab2: [240, 140], Tab: [240, 140], Link: [0, 20], Picture: [64, 64], DateTime: [130, 24], MonthCal: [220, 160], Hotkey: [120, 24], TreeView: [200, 120], ActiveX: [200, 120], StatusBar: [0, 22] };
class VGui {
  constructor(opts, title) { this.id = ++UID; this.opts = opts || ''; this.title = title === undefined ? 'AutoHotkey' : title; this.ctls = []; this.handlers = {}; this.w = 0; this.h = 0; this.visible = 0; this.destroyed = 0; this.font = { opts: '', name: '' }; this.back = ''; this.resizable = /\+Resize/i.test(opts || ''); this.mx = 10; this.my = 10; this.focus = null; this.shown = 0; }
}
class VCtl {
  constructor(gui, type, opts, text) {
    this.id = ++UID; this.gui = gui; this.type = type; this.opts = opts || ''; this.handlers = {}; this.enabled = 1; this.visible = 1; this.items = []; this.rows = []; this.cols = []; this.name = ''; this.min = 0; this.max = 100; this.fontOpts = '';
    const o = this.opts, last = gui.ctls[gui.ctls.length - 1];
    let m;
    if (/(^|\s)[-+]?Disabled\b/i.test(o)) this.enabled = 0; if (/(^|\s)[-+]?Hidden\b/i.test(o)) this.visible = 0;
    if ((m = /(?:^|\s)v(\w+)/.exec(o))) this.name = m[1];
    if ((m = /Range(-?\d+)-(-?\d+)/.exec(o))) { this.min = +m[1]; this.max = +m[2]; }
    this.password = /Password/i.test(o); this.readonly = /ReadOnly/i.test(o); this.multi = /Multi|\br\d+/i.test(o) && this.type === 'Edit'; this.numeric = /(^|\s)Number\b/.test(o); this.def = /Default/i.test(o);
    const rel = (axis, dflt) => { const re = new RegExp('(?:^|\\s)' + axis + '(m|p|s)?([+-]?\\d+)?(?=\\s|$)', 'i'), mm = re.exec(o); if (!mm) return null; if (mm[1] === 'm') return gui[axis === 'x' ? 'mx' : 'my']; if (mm[1] === 'p' || mm[1] === 's') return last ? (axis === 'x' ? last.x : last.y) + (mm[2] ? +mm[2] : 0) : dflt; if (mm[2] === undefined) return null; const v = +mm[2]; if (/[+-]/.test(mm[2][0]) && last) return axis === 'x' ? last.x + last.w + v : last.y + last.h + v; return v; };
    let x = rel('x', 10), y = rel('y', 10), w = (m = /(?:^|\s)w(\d+)/.exec(o)) ? +m[1] : null, h = (m = /(?:^|\s)h(\d+)/.exec(o)) ? +m[1] : null;
    const rows = (m = /(?:^|\s)r(\d+(?:\.\d+)?)/.exec(o)) ? +m[1] : null;
    if (type === 'Text' || type === 'Checkbox' || type === 'Radio' || type === 'Link' || type === 'Button') { const t = typeof text === 'string' ? text : ''; if (w === null) w = Math.max(type === 'Button' ? 80 : 24, Math.round(t.replace(/<[^>]+>/g, '').length * 7.2) + (type === 'Checkbox' || type === 'Radio' ? 26 : type === 'Button' ? 20 : 4)); }
    const d = SIZES[type] || [100, 24]; if (w === null) w = d[0] || 100; if (h === null) h = rows ? Math.round(rows * 20 + 6) : d[1];
    if (x === null) x = last && type !== 'StatusBar' ? (/(^|\s)ys/.test(o) ? last.x : gui.mx) : gui.mx; if (y === null) y = last ? last.y + last.h + 8 : gui.my;
    this.x = x; this.y = y; this.w = w; this.h = h;
    if (['DropDownList', 'ComboBox', 'ListBox', 'Tab3', 'Tab2', 'Tab'].includes(type)) { this.items = text instanceof AArr ? text.a.map(str) : []; const c = /Choose(\d+)/i.exec(o); this.value = c ? +c[1] : (type.startsWith('Tab') ? 1 : 0); this.text = this.value && this.items[this.value - 1] || ''; }
    else if (type === 'ListView') { this.cols = text instanceof AArr ? text.a.map(str) : []; this.value = 0; this.text = ''; }
    else if (type === 'Checkbox' || type === 'Radio') { this.text = str(text); this.value = /Checked(?!0)/i.test(o) ? 1 : 0; }
    else if (type === 'Slider' || type === 'Progress') { const v = /(?:^|\s)(?:Value|Background)?(\d+)$/.exec(''); this.value = typeof text === 'number' ? text : this.min; this.text = ''; }
    else if (type === 'Edit') { this.text = str(text); this.value = this.text; }
    else if (type === 'ActiveX') { this.text = typeof text === 'string' ? text : ''; this.value = new AStub('ActiveX (' + this.text + ')'); }
    else { this.text = text === undefined ? '' : (text instanceof AArr ? '' : str(text)); this.value = this.text; }
  }
  get val() { return this.value; }
}

/* ---------- interpreter ---------- */
const LOGF = /^(send|sendinput|sendevent|sendplay|sendtext|controlsend|controlsendtext|click|mouseclick|mouseclickdrag|mousemove|run|runwait|runas|winactivate|winclose|winkill|winminimize|winmaximize|winrestore|winhide|winshow|winmove|winsettitle|winsetalwaysontop|filedelete|filecopy|filemove|filerecycle|fileappend|dircreate|dirdelete|dircopy|dirmove|soundplay|soundbeep|soundsetvolume|soundsetmute|download|processclose|regwrite|regdelete|inidelete|iniwrite|shutdown|winminimizeall|winminimizeallundo|filerecycleempty|filecreateshortcut|blockinput|dllcall|clipwait|keywait|controlclick|controlsettext|controlfocus|setcapslockstate|setnumlockstate|setscrolllockstate|postmessage|sendmessage|winsettransparent|winsettranscolor|winsetstyle|winsetexstyle)$/;
const QUIET = /^(setkeydelay|setmousedelay|setdefaultmousespeed|coordmode|critical|persistent|suspend|pause|settitlematchmode|detecthiddenwindows|detecthiddentext|sendmode|sendlevel|setworkingdir|installkeybdhook|installmousehook|onerror|onmessage|onclipboardchange|setwindelay|setcontroldelay|traysetseticon|traysetsicon|setstorecapslockmode|listlines|listvars|keyhistory|processsetpriority|thread|menuselect|fileencoding|hotif|hotifwinactive|hotifwinexist|hotifwinnotactive|hotifwinnotexist|dllcall|onexit|seticon|trayseticon|traysetsicon)$/;

class Interp {
  constructor(prog, host) {
    this.prog = prog; this.host = host || {}; this.funcs = prog.funcs; this.globals = new Map(); this.gnames = new Map(); this.log = []; this.timers = []; this.clock = 0; this.guis = []; this.steps = 0; this.limit = 200000;
    this.exited = false; this.depth = 0; this.loops = []; this.clip = ''; this.answer = 'Yes'; this.inputAnswer = undefined; this.warned = new Set(); this.statics = new Map(); this.keys = new Set(); this.hotkeys = prog.hotkeys.slice(); this.hotstrings = prog.hotstrings.slice(); this.start = Date.now(); this.inTimer = 0; this.thisHotkey = ''; this.slept = 0; this.exitFn = null;
    this.genv = { v: this.globals, glob: null, parent: null, isG: true, st: null, names: this.gnames };
  }
  add(k, text, ln) { const e = { k, text, ln }; this.log.push(e); if (this.log.length > 600) this.log.shift(); if (this.host.log) this.host.log(e); return e; }
  warnOnce(key, text) { if (this.warned.has(key)) return; this.warned.add(key); this.add('warn', text); }
  tick(ln) { if (++this.steps > this.limit) throw new SimStop('Stopped after ' + this.limit + ' steps: this looks like an endless loop (a real script would keep running and use your CPU).'); this.ln = ln; }
  /* variables */
  builtinVar(k) {
    const n = new Date();
    switch (k) {
      case 'a_index': return this.loops.length ? this.loops[this.loops.length - 1].i : 0; case 'a_loopfield': return this.loops.length ? this.loops[this.loops.length - 1].f : '';
      case 'a_now': return ymd(new Date(this.start + this.clock)); case 'a_tickcount': return Math.round(Date.now() - this.start + this.clock);
      case 'a_screenwidth': return 1920; case 'a_screenheight': return 1080; case 'a_mousex': return (this.host.mouse && this.host.mouse.x) || 100; case 'a_mousey': return (this.host.mouse && this.host.mouse.y) || 100;
      case 'a_username': return 'User'; case 'a_computername': return 'PC'; case 'a_scriptdir': return 'C:\\Scripts'; case 'a_scriptname': return 'script.ahk'; case 'a_scriptfullpath': return 'C:\\Scripts\\script.ahk'; case 'a_workingdir': return 'C:\\Scripts';
      case 'a_space': return ' '; case 'a_tab': return '\t'; case 'a_clipboard': return this.clip; case 'a_thishotkey': return this.thisHotkey; case 'a_priorhotkey': return '';
      case 'a_yyyy': return String(n.getFullYear()); case 'a_mm': return pad2(n.getMonth() + 1); case 'a_dd': return pad2(n.getDate()); case 'a_hour': return pad2(n.getHours()); case 'a_min': return pad2(n.getMinutes()); case 'a_sec': return pad2(n.getSeconds()); case 'a_wday': return n.getDay() + 1;
      case 'a_appdata': return 'C:\\Users\\User\\AppData\\Roaming'; case 'a_desktop': return 'C:\\Users\\User\\Desktop'; case 'a_temp': return 'C:\\Users\\User\\AppData\\Local\\Temp'; case 'a_iscompiled': return 0; case 'a_isadmin': return 1; case 'a_ahkversion': return '2.0.18'; case 'a_lasterror': return 0; case 'a_timeidle': return 0; case 'a_args': return new AArr([]); case 'a_traymenu': return this.stubTray || (this.stubTray = new AStub('A_TrayMenu')); case 'a_osversion': return 'WIN_10'; case 'a_linenumber': return this.ln || 0; case 'a_programfiles': return 'C:\\Program Files'; case 'a_mydocuments': return 'C:\\Users\\User\\Documents';
    }
    return undefined;
  }
  getVar(env, n) {
    const k = lc(n);
    for (let e = env; e; e = e.parent) {
      if (e.glob && e.glob.has(k)) return this.globals.has(k) ? this.deref(this.globals.get(k)) : undefined;
      if (e.st && e.st.has(k)) return e.st.get(k);
      if (e.v.has(k)) return this.deref(e.v.get(k));
    }
    if (this.globals.has(k)) return this.deref(this.globals.get(k));
    if (k.startsWith('a_')) { const b = this.builtinVar(k); if (b !== undefined) return b; }
    const f = this.funcs.get(k); if (f) return this.fnObj(f);
    if (B[k]) return new BFn(k);
    return undefined;
  }
  deref(v) { return v instanceof Ref ? v.get() : v; }
  fnObj(f) { if (!f.obj) f.obj = new Fn(f, null); return f.obj; }
  setVar(env, n, val) {
    const k = lc(n);
    if (k === 'a_clipboard') { this.clip = str(val); return; }
    for (let e = env; e; e = e.parent) {
      if (e.glob && e.glob.has(k)) { this.globals.set(k, val); this.gnames.set(k, n); return; }
      if (e.st && e.st.has(k)) { e.st.set(k, val); return; }
      if (e.v.has(k)) { const cur = e.v.get(k); if (cur instanceof Ref) cur.set(val); else e.v.set(k, val); return; }
    }
    if (env.isG) { this.globals.set(k, val); this.gnames.set(k, n); return; }
    env.v.set(k, val);
  }
  /* evaluation */
  ev(n, env) {
    switch (n.k) {
      case 'num': case 'str': return n.v;
      case 'unset': return undefined;
      case 'var': return this.getVar(env, n.n);
      case 'par': return this.ev(n.x, env);
      case 'seq': { let r; for (const x of n.a) r = this.ev(x, env); return r; }
      case 'arr': return new AArr(this.evArgs(n.a, env));
      case 'obj': { const o = new AObj(); n.o.forEach(([k, v]) => { o.p[k] = this.ev(v, env); }); return o; }
      case 'cat': return str(this.ev(n.l, env)) + str(this.ev(n.r, env));
      case 'not': return bool(!truthy(this.ev(n.x, env)));
      case 'neg': return -num(this.ev(n.x, env));
      case 'bnot': return ~num(this.ev(n.x, env));
      case 'and': { const l = this.ev(n.l, env); return truthy(l) ? this.ev(n.r, env) : l; }
      case 'or': { const l = this.ev(n.l, env); return truthy(l) ? l : this.ev(n.r, env); }
      case 'coal': { const l = this.ev(n.l, env); return l === undefined ? this.ev(n.r, env) : l; }
      case 'tern': return truthy(this.ev(n.c, env)) ? this.ev(n.a, env) : this.ev(n.b, env);
      case 'bin': return this.bin(n.op, this.ev(n.l, env), this.ev(n.r, env));
      case 'asg': return this.assign(n, env);
      case 'inc': { const cur = this.read(n.t, env), nv = num(cur) + n.d; this.write(n.t, nv, env); return n.pre ? nv : num(cur); }
      case 'ref': return new Ref(() => this.read(n.x, env), v => this.write(n.x, v, env));
      case 'lam': return new Fn({ name: '(lambda)', ps: n.ps.map(p => ({ n: p.n, byref: !!p.byref, rest: !!p.rest, def: null })), body: [{ k: 'ret', e: n.b, ln: this.ln }] }, env);
      case 'mem': return this.getProp(this.ev(n.o, env), n.n);
      case 'idx': return this.getIndex(this.ev(n.o, env), this.evArgs(n.a, env));
      case 'call': return this.callExpr(n, env);
      case 'bare': { const bk = lc(n.n); if (!this.funcs.has(bk) && !B[bk]) { if (QUIET.test(bk)) return undefined; if (LOGF.test(bk)) { this.logAction(bk, []); return undefined; } } const f = this.funcs.get(lc(n.n)); if (f) return this.callFn(this.fnObj(f), []); if (B[lc(n.n)]) return this.callB(lc(n.n), [], env); const v = this.getVar(env, n.n); if (v instanceof Fn || v instanceof BFn) return v; this.warnOnce('bare:' + lc(n.n), '“' + n.n + '” is not a command or function the simulator knows'); return undefined; }
      case 'spread': throw new SimError('Unexpected "*"');
    }
    throw new SimError('Cannot evaluate ' + n.k);
  }
  evArgs(a, env) { const o = []; for (const x of a) { if (x.k === 'spread') { const v = this.ev(x.x, env); if (v instanceof AArr) o.push(...v.a); else throw new SimError('Only an Array can be expanded with *'); } else o.push(this.ev(x, env)); } return o; }
  read(t, env) { if (t.k === 'var') return this.getVar(env, t.n); if (t.k === 'mem') return this.getProp(this.ev(t.o, env), t.n); if (t.k === 'idx') return this.getIndex(this.ev(t.o, env), this.evArgs(t.a, env)); if (t.k === 'par') return this.read(t.x, env); throw new SimError('Cannot read this'); }
  write(t, v, env) { if (t.k === 'var') return this.setVar(env, t.n, v); if (t.k === 'mem') return this.setProp(this.ev(t.o, env), t.n, v); if (t.k === 'idx') return this.setIndex(this.ev(t.o, env), this.evArgs(t.a, env), v); if (t.k === 'par') return this.write(t.x, v, env); throw new SimError('Cannot assign to this'); }
  assign(n, env) {
    if (n.op === ':=') { const v = this.ev(n.v, env); this.write(n.t, v, env); return v; }
    const cur = this.read(n.t, env), r = this.ev(n.v, env); let v;
    switch (n.op) { case '+=': v = num(cur) + num(r); break; case '-=': v = num(cur) - num(r); break; case '*=': v = num(cur) * num(r); break; case '/=': v = this.bin('/', cur, r); break; case '//=': v = this.bin('//', cur, r); break; case '.=': v = str(cur) + str(r); break; case '|=': v = num(cur) | num(r); break; case '&=': v = num(cur) & num(r); break; case '^=': v = num(cur) ^ num(r); break; case '>>=': v = num(cur) >> num(r); break; case '<<=': v = num(cur) << num(r); break; }
    this.write(n.t, v, env); return v;
  }
  bin(op, a, b) {
    switch (op) {
      case '+': return num(a) + num(b); case '-': return num(a) - num(b); case '*': return num(a) * num(b);
      case '/': { const d = num(b); if (d === 0) throw new SimError('Divide by zero.'); return num(a) / d; }
      case '//': { const d = num(b); if (d === 0) throw new SimError('Divide by zero.'); return Math.trunc(num(a) / d); }
      case '**': return Math.pow(num(a), num(b)); case '&': return num(a) & num(b); case '|': return num(a) | num(b); case '^': return num(a) ^ num(b); case '<<': return num(a) << num(b); case '>>': return num(a) >> num(b);
      case '=': return bool(this.eq(a, b, false)); case '==': return bool(this.eq(a, b, true)); case '!=': case '<>': return bool(!this.eq(a, b, false)); case '!==': return bool(!this.eq(a, b, true));
      case '<': return bool(this.cmp(a, b) < 0); case '>': return bool(this.cmp(a, b) > 0); case '<=': return bool(this.cmp(a, b) <= 0); case '>=': return bool(this.cmp(a, b) >= 0);
      case '~=': { const m = toRegex(str(b)).exec(str(a)); return m ? m.index + 1 : 0; }
    }
    throw new SimError('Unknown operator ' + op);
  }
  eq(a, b, cs) { const na = typeof a === 'number' || isNumStr(a), nb = typeof b === 'number' || isNumStr(b); if (na && nb) return num(a) === num(b); if (typeof a === 'object' || typeof b === 'object') return a === b; const x = str(a), y = str(b); return cs ? x === y : x.toLowerCase() === y.toLowerCase(); }
  cmp(a, b) { const na = typeof a === 'number' || isNumStr(a), nb = typeof b === 'number' || isNumStr(b); if (na && nb) return num(a) - num(b); const x = str(a).toLowerCase(), y = str(b).toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; }
  /* calls */
  callExpr(n, env) {
    const f = n.f;
    if (f.k === 'mem') { const o = this.ev(f.o, env); return this.callMethod(o, f.n, this.evArgs(n.a, env), env); }
    if (f.k === 'var') {
      const k = lc(f.n); let v = this.getVar(env, f.n);
      if (v instanceof Fn) return this.callFn(v, this.evArgs(n.a, env));
      if (B[k]) return this.callB(k, this.evArgs(n.a, env), env);
      if (v instanceof BFn) return this.callB(v.n, this.evArgs(n.a, env), env);
      const args = n.a.map(x => x.k === 'ref' ? this.ev(x, env) : null);
      if (QUIET.test(k)) return undefined;
      if (LOGF.test(k)) { const a = this.evArgs(n.a, env); this.logAction(k, a); return undefined; }
      this.warnOnce('fn:' + k, 'The simulator does not know “' + f.n + '”, so it was skipped');
      return undefined;
    }
    const fv = this.ev(f, env); return this.callFn(fv, this.evArgs(n.a, env));
  }
  logAction(k, a) {
    const t = a.map(show).join(', ');
    if (k.startsWith('send') || k === 'controlsend' || k === 'controlsendtext') this.add('send', 'Send ' + (a[0] === undefined ? '' : str(a[0])));
    else if (k === 'click' || k === 'mouseclick') this.add('click', k === 'click' ? 'Click ' + t : 'MouseClick ' + t);
    else if (k === 'mousemove') this.add('click', 'MouseMove ' + t);
    else if (k === 'run' || k === 'runwait') this.add('do', 'Run ' + t);
    else this.add('do', k.charAt(0).toUpperCase() + k.slice(1) + '(' + t + ')');
  }
  callFn(fn, args) {
    if (fn instanceof BFn) return this.callB(fn.n, args, this.genv);
    if (!(fn instanceof Fn)) throw new SimError('This value of type "' + typeName(fn) + '" is not callable.');
    if (++this.depth > 200) { this.depth = 0; throw new SimError('Stack overflow: a function keeps calling itself.'); }
    try {
      const d = fn.def; let st = this.statics.get(d); if (!st) { st = new Map(); this.statics.set(d, st); }
      const env = { v: new Map(), glob: null, parent: fn.env, isG: false, st: null, stAll: st, names: new Map() };
      d.ps.forEach((p, i) => {
        const k = lc(p.n);
        if (p.rest) { env.v.set(k, new AArr(args.slice(i))); return; }
        let v = args[i];
        if (v instanceof Ref && !p.byref) v = v.get();
        if (v === undefined && p.def) v = this.ev(p.def, env);
        env.v.set(k, v);
      });
      const r = this.exec(d.body, env);
      return r && r.r === 'ret' ? r.v : undefined;
    } finally { this.depth--; }
  }
  /* statements */
  exec(list, env) { for (const s of list) { const r = this.run1(s, env); if (r) return r; } return undefined; }
  loopBody(b, env) { const r = this.exec(b, env); if (r) { if (r.r === 'brk') return 'b'; if (r.r === 'cnt') return undefined; return r; } return undefined; }
  run1(s, env) {
    this.tick(s.ln);
    switch (s.k) {
      case 'x': this.ev(s.e, env); return;
      case 'blk': return this.exec(s.b, env);
      case 'if': return truthy(this.ev(s.c, env)) ? this.exec(s.b, env) : (s.e ? this.exec(s.e, env) : undefined);
      case 'while': { this.loops.push({ i: 0, f: '' }); try { while (truthy(this.ev(s.c, env))) { this.loops[this.loops.length - 1].i++; this.tick(s.ln); const r = this.loopBody(s.b, env); if (r === 'b') break; if (r) return r; } } finally { this.loops.pop(); } return; }
      case 'loop': { const cnt = s.n ? num(this.ev(s.n, env)) : Infinity; this.loops.push({ i: 0, f: '' }); try { for (let i = 1; i <= cnt; i++) { this.loops[this.loops.length - 1].i = i; this.tick(s.ln); const r = this.loopBody(s.b, env); if (r === 'b') break; if (r) return r; } } finally { this.loops.pop(); } return; }
      case 'lparse': { const text = str(this.ev(s.s, env)), dl = s.d ? str(this.ev(s.d, env)) : ''; const parts = dl === '' ? [...text] : text.split(new RegExp('[' + dl.replace(/[\]\\^-]/g, '\\$&') + ']')); this.loops.push({ i: 0, f: '' }); try { for (let i = 0; i < parts.length; i++) { const L = this.loops[this.loops.length - 1]; L.i = i + 1; L.f = parts[i]; const r = this.loopBody(s.b, env); if (r === 'b') break; if (r) return r; } } finally { this.loops.pop(); } return; }
      case 'lunsup': this.warnOnce('lu:' + s.n, '“' + s.n + '” is not simulated, so its block was skipped'); return;
      case 'for': {
        const o = this.ev(s.o, env); let pairs;
        if (o instanceof AArr) pairs = o.a.map((v, i) => [i + 1, v]); else if (o instanceof AMap) pairs = [...o.m.entries()].sort((a, b) => (String(a[1][0]) < String(b[1][0]) ? -1 : 1)).map(e => [e[1][0], e[1][1]]); else if (o instanceof AObj) pairs = Object.keys(o.p).map(k => [k, o.p[k]]); else throw new SimError('This value of type "' + typeName(o) + '" cannot be used in a for loop.');
        this.loops.push({ i: 0, f: '' });
        try { for (let i = 0; i < pairs.length; i++) { this.loops[this.loops.length - 1].i = i + 1; if (s.b2) { this.setVar(env, s.a, pairs[i][0]); this.setVar(env, s.b2, pairs[i][1]); } else this.setVar(env, s.a, o instanceof AArr ? pairs[i][1] : pairs[i][0]); const r = this.loopBody(s.b, env); if (r === 'b') break; if (r) return r; } } finally { this.loops.pop(); }
        return;
      }
      case 'ret': return { r: 'ret', v: s.e ? this.ev(s.e, env) : undefined };
      case 'brk': return { r: 'brk' }; case 'cnt': return { r: 'cnt' };
      case 'throw': { const v = s.e ? this.ev(s.e, env) : undefined; const e = new SimError(v instanceof AObj && v.p.Message !== undefined ? str(v.p.Message) : str(v), s.ln); e.val = v; throw e; }
      case 'decl': {
        for (const it of s.items) {
          const k = lc(it.n);
          if (s.kind === 'global') { if (!env.isG) { env.glob = env.glob || new Set(); env.glob.add(k); } if (it.init) { this.globals.set(k, this.ev(it.init, env)); this.gnames.set(k, it.n); } }
          else if (s.kind === 'static') { const stores = env.stAll || (env.stAll = new Map()); if (!stores.has(k)) { stores.set(k, it.init ? this.ev(it.init, env) : undefined); } env.st = env.st || new Map(); env.st = stores; }
          else { env.v.set(k, it.init ? this.ev(it.init, env) : undefined); }
        }
        return;
      }
      case 'switch': { const v = this.ev(s.e, env); for (const c of s.cases) { if (!c.v || c.v.some(x => this.eq(v, this.ev(x, env), false))) { if (!c.v) continue; const r = this.exec(c.b, env); if (r && r.r === 'brk') return; return r; } } const d = s.cases.find(c => !c.v); if (d) { const r = this.exec(d.b, env); if (r && r.r === 'brk') return; return r; } return; }
      case 'try': {
        let r;
        try { r = this.exec(s.b, env); }
        catch (e) {
          if (e instanceof ExitSignal || e instanceof SimStop) throw e;
          const se = e instanceof SimError ? e : new SimError('Simulator problem: ' + e.message, s.ln);
          if (s.cb) { if (s.cv) this.setVar(env, s.cv, se.val !== undefined ? se.val : new AObj({ Message: se.message, What: '', Line: se.ln || s.ln, Extra: '', File: 'script.ahk', Stack: '' })); r = this.exec(s.cb, env); }
        } finally { if (s.fb) { const fr = this.exec(s.fb, env); if (fr) r = fr; } }
        return r;
      }
    }
    throw new SimError('Cannot run ' + s.k);
  }
  /* properties & methods */
  getProp(o, n) {
    const k = lc(n);
    if (o instanceof AStub) return '';
    if (o instanceof VCtl) {
      switch (k) { case 'value': return o.value; case 'text': return o.text; case 'enabled': return o.enabled; case 'visible': return o.visible; case 'name': return o.name; case 'hwnd': return o.id; case 'gui': return o.gui; case 'classnn': return o.type + '1'; case 'focused': return bool(o.gui.focus === o); }
      throw new SimError('This value of type "' + typeName(o) + '" has no property named "' + n + '".');
    }
    if (o instanceof VGui) { switch (k) { case 'title': return o.title; case 'backcolor': return o.back; case 'hwnd': return o.id; case 'marginx': return o.mx; case 'marginy': return o.my; } throw new SimError('This value of type "Gui" has no property named "' + n + '".'); }
    if (o instanceof AArr) { if (k === 'length') return o.a.length; if (k === 'capacity') return o.a.length; }
    if (o instanceof AMap) { if (k === 'count') return o.m.size; if (k === 'capacity') return o.m.size; if (k === 'default') return o.def; if (k === 'casesense') return 1; }
    if (o instanceof AObj) { if (Object.prototype.hasOwnProperty.call(o.p, n)) return o.p[n]; const ci = Object.keys(o.p).find(x => lc(x) === k); if (ci) return o.p[ci]; if (k === 'message' || k === 'what' || k === 'extra') return ''; }
    if (o instanceof AMatch) { if (k === 'count') return o.m.length - 1; if (k === 'pos') return o.m.index + 1; if (k === 'len') return o.m[0].length; }
    if (o instanceof Fn) { if (k === 'name') return o.name; if (k === 'isvariadic') return 0; }
    throw new SimError('This value of type "' + typeName(o) + '" has no property named "' + n + '".');
  }
  setProp(o, n, v) {
    const k = lc(n);
    if (o instanceof AStub) return;
    if (o instanceof VCtl) {
      switch (k) {
        case 'value': if (o.type === 'Checkbox' || o.type === 'Radio') { o.value = num(v); if (o.type === 'Radio' && o.value) this.radioClear(o); } else if (['DropDownList', 'ComboBox', 'ListBox', 'Tab3', 'Tab2', 'Tab'].includes(o.type)) { o.value = num(v); o.text = o.items[o.value - 1] || ''; } else if (o.type === 'Slider' || o.type === 'Progress') o.value = Math.min(o.max, Math.max(o.min, num(v))); else { o.value = o.text = str(v); } return;
        case 'text': if (['DropDownList', 'ListBox', 'Tab3', 'Tab2', 'Tab'].includes(o.type)) { const i = o.items.findIndex(x => lc(x) === lc(str(v))); o.value = i + 1; o.text = i >= 0 ? o.items[i] : ''; } else { o.text = str(v); if (o.type === 'ComboBox') o.value = 0; else if (o.type === 'Edit' || o.type === 'Text' || o.type === 'Hotkey') o.value = o.text; } return;
        case 'enabled': o.enabled = truthy(v) ? 1 : 0; return; case 'visible': o.visible = truthy(v) ? 1 : 0; return;
      }
    }
    if (o instanceof VGui) { if (k === 'title') { o.title = str(v); return; } if (k === 'backcolor') { o.back = str(v); return; } if (k === 'marginx') { o.mx = num(v); return; } if (k === 'marginy') { o.my = num(v); return; } }
    if (o instanceof AMap && k === 'default') { o.def = v; return; }
    if (o instanceof AArr && k === 'length') { const n2 = num(v); o.a.length = n2; return; }
    if (o instanceof AObj) { o.p[n] = v; return; }
    throw new SimError('Cannot set property "' + n + '" on a value of type "' + typeName(o) + '".');
  }
  radioClear(r) { const g = r.gui.ctls, i = g.indexOf(r); let a = i, b = i; while (a > 0 && g[a - 1].type === 'Radio' && !/Group/.test(g[a].opts)) a--; while (b < g.length - 1 && g[b + 1].type === 'Radio' && !/Group/.test(g[b + 1].opts)) b++; for (let j = a; j <= b; j++) if (g[j] !== r) g[j].value = 0; }
  mkey(k) { return typeof k + ':' + (typeof k === 'string' ? k : String(k)); }
  getIndex(o, a) {
    if (o instanceof AStub) return '';
    if (o instanceof VGui) { const k = lc(str(a[0])); const c = o.ctls.find(x => lc(x.name) === k || String(x.id) === k); if (!c) throw new SimError('Control not found: no control has the name ' + show(a[0]) + '.'); return c; }
    if (o instanceof AArr) { let i = num(a[0]); if (i < 0) i = o.a.length + 1 + i; if (i < 1 || i > o.a.length) throw new SimError('Invalid index: ' + num(a[0]) + ' (the Array has ' + o.a.length + ' items).'); const v = o.a[i - 1]; return v; }
    if (o instanceof AMap) { const e = o.m.get(this.mkey(a[0])); if (e) return e[1]; if (o.def !== undefined) return o.def; throw new SimError('Item has no value: the Map has no key ' + show(a[0]) + '.'); }
    if (o instanceof AMatch) { const i = typeof a[0] === 'number' ? a[0] : (isNumStr(a[0]) ? num(a[0]) : null); if (i !== null) return o.m[i] === undefined ? '' : o.m[i]; return (o.m.groups && o.m.groups[a[0]]) || ''; }
    if (o instanceof AObj) return o.p[str(a[0])];
    throw new SimError('This value of type "' + typeName(o) + '" has no items to read with [ ].');
  }
  setIndex(o, a, v) {
    if (o instanceof AArr) { let i = num(a[0]); if (i < 0) i = o.a.length + 1 + i; if (i < 1 || i > o.a.length) throw new SimError('Invalid index: ' + i + ' (use Push or InsertAt to add items).'); o.a[i - 1] = v; return; }
    if (o instanceof AMap) { o.m.set(this.mkey(a[0]), [a[0], v]); return; }
    if (o instanceof AObj) { o.p[str(a[0])] = v; return; }
    throw new SimError('This value of type "' + typeName(o) + '" cannot be changed with [ ].');
  }
  callMethod(o, n, a, env) {
    const k = lc(n);
    if (o instanceof AStub) { this.warnOnce('stub:' + o.n, o.n + ' is not simulated (calls on it are skipped)'); return ''; }
    if (o instanceof VGui) return this.guiMethod(o, k, n, a);
    if (o instanceof VCtl) return this.ctlMethod(o, k, n, a);
    if (o instanceof AArr) {
      switch (k) {
        case 'push': o.a.push(...a); return; case 'pop': if (!o.a.length) throw new SimError('Array is empty: nothing to Pop.'); return o.a.pop();
        case 'has': { const i = num(a[0]); return bool(i >= 1 && i <= o.a.length && o.a[i - 1] !== undefined); }
        case 'insertat': o.a.splice(num(a[0]) - 1, 0, ...a.slice(1)); return; case 'removeat': { const i = num(a[0]) - 1, c = a[1] === undefined ? 1 : num(a[1]); if (i < 0 || i >= o.a.length) throw new SimError('Invalid index: ' + (i + 1)); const r = o.a.splice(i, c); return c === 1 ? r[0] : undefined; }
        case 'delete': o.a[num(a[0]) - 1] = undefined; return; case 'clone': return new AArr(o.a.slice());
      }
    }
    if (o instanceof AMap) {
      switch (k) {
        case 'set': for (let i = 0; i + 1 < a.length; i += 2) o.m.set(this.mkey(a[i]), [a[i], a[i + 1]]); return; case 'get': { const e = o.m.get(this.mkey(a[0])); if (e) return e[1]; if (a.length > 1) return a[1]; if (o.def !== undefined) return o.def; throw new SimError('Item has no value: the Map has no key ' + show(a[0]) + '.'); }
        case 'has': return bool(o.m.has(this.mkey(a[0]))); case 'delete': { const e = o.m.get(this.mkey(a[0])); o.m.delete(this.mkey(a[0])); return e ? e[1] : undefined; } case 'clear': o.m.clear(); return;
        case 'clone': { const c = new AMap(); c.m = new Map(o.m); c.def = o.def; return c; }
      }
    }
    if (o instanceof AObj) { if (k === 'hasownprop') return bool(Object.keys(o.p).some(x => lc(x) === lc(str(a[0])))); const pv = this.getProp(o, n); if (pv instanceof Fn || pv instanceof BFn) return this.callFn(pv, a); }
    if (o instanceof Fn) { if (k === 'call') return this.callFn(o, a.slice(1)); }
    throw new SimError('This value of type "' + typeName(o) + '" has no method named "' + n + '".');
  }
  guiMethod(g, k, n, a) {
    switch (k) {
      case 'add': { const type = str(a[0]); const c = new VCtl(g, type, a[1] === undefined ? '' : str(a[1]), a[2]); g.ctls.push(c); c.fontOpts = g.font.opts; c.fontName = g.font.name; return c; }
      case 'setfont': g.font = { opts: a[0] === undefined ? '' : str(a[0]), name: a[1] === undefined ? '' : str(a[1]) }; return;
      case 'show': { const o = a[0] === undefined ? '' : str(a[0]); let m; g.visible = /(^|\s)Hide\b/i.test(o) ? 0 : 1; g.destroyed = 0; if ((m = /(?:^|\s)w(\d+)/.exec(o))) g.w = +m[1]; if ((m = /(?:^|\s)h(\d+)/.exec(o))) g.h = +m[1]; if (!g.w || !g.h) { let mx = 0, my = 0; g.ctls.forEach(c => { mx = Math.max(mx, c.x + c.w); my = Math.max(my, c.y + c.h); }); if (!g.w) g.w = mx + g.mx; if (!g.h) g.h = my + g.my; } g.shown = 1; return; }
      case 'hide': g.visible = 0; return; case 'destroy': g.visible = 0; g.destroyed = 1; return; case 'minimize': case 'maximize': case 'restore': case 'flash': case 'move': case 'minsize': case 'maxsize': return;
      case 'opt': { const o = a[0] === undefined ? '' : str(a[0]); if (/\+Resize/i.test(o)) g.resizable = true; if (/-Resize/i.test(o)) g.resizable = false; return; }
      case 'submit': { const r = new AObj(); g.ctls.forEach(c => { if (c.name) r.p[c.name] = c.value; }); if (a[0] === undefined || truthy(a[0])) g.visible = 0; return r; }
      case 'onevent': g.handlers[lc(str(a[0]))] = a[1]; return;
      case 'getpos': case 'getclientpos': { const set = (i, v) => { if (a[i] instanceof Ref) a[i].set(v); }; set(0, 100); set(1, 100); set(2, g.w); set(3, g.h); return; }
    }
    { const ADD = { text: 'Text', edit: 'Edit', button: 'Button', checkbox: 'Checkbox', radio: 'Radio', dropdownlist: 'DropDownList', ddl: 'DropDownList', combobox: 'ComboBox', listbox: 'ListBox', listview: 'ListView', treeview: 'TreeView', slider: 'Slider', progress: 'Progress', groupbox: 'GroupBox', tab3: 'Tab3', tab2: 'Tab2', tab: 'Tab', link: 'Link', picture: 'Picture', pic: 'Picture', datetime: 'DateTime', monthcal: 'MonthCal', hotkey: 'Hotkey', activex: 'ActiveX', statusbar: 'StatusBar' }; const m = /^add(\w+)$/.exec(k); if (m && ADD[m[1]]) return this.guiMethod(g, 'add', 'Add', [ADD[m[1]]].concat(a)); }
    throw new SimError('This value of type "Gui" has no method named "' + n + '".');
  }
  ctlMethod(c, k, n, a) {
    switch (k) {
      case 'onevent': c.handlers[lc(str(a[0]))] = a[1]; return; case 'focus': c.gui.focus = c; return;
      case 'move': { if (a[0] !== undefined) c.x = num(a[0]); if (a[1] !== undefined) c.y = num(a[1]); if (a[2] !== undefined) c.w = num(a[2]); if (a[3] !== undefined) c.h = num(a[3]); return; }
      case 'getpos': { [c.x, c.y, c.w, c.h].forEach((v, i) => { if (a[i] instanceof Ref) a[i].set(v); }); return; }
      case 'add': {
        if (c.type === 'ListView') { c.rows.push(a.slice(1).map(x => str(x))); return c.rows.length; }
        if (c.type === 'TreeView') { c.rows.push(str(a[0])); return c.rows.length; }
        const items = a[0] instanceof AArr ? a[0].a.map(str) : [str(a[0])]; c.items.push(...items); return;
      }
      case 'delete': { if (c.type === 'ListView' || c.type === 'TreeView') { if (a[0] === undefined) c.rows = []; else c.rows.splice(num(a[0]) - 1, 1); return; } if (a[0] === undefined) { c.items = []; c.value = 0; c.text = ''; } else { c.items.splice(num(a[0]) - 1, 1); } return; }
      case 'choose': { const i = typeof a[0] === 'number' || isNumStr(a[0]) ? num(a[0]) : c.items.findIndex(x => lc(x) === lc(str(a[0]))) + 1; c.value = i; c.text = c.items[i - 1] || ''; return; }
      case 'getcount': return c.type === 'ListView' || c.type === 'TreeView' ? c.rows.length : c.items.length;
      case 'gettext': { if (c.type === 'ListView') { const r = c.rows[num(a[0]) - 1]; return r ? (r[(a[1] === undefined ? 1 : num(a[1])) - 1] || '') : ''; } return c.text; }
      case 'getnext': { const from = a[0] === undefined ? 0 : num(a[0]); return c.sel && c.sel > from ? c.sel : 0; } case 'modify': case 'insertcol': case 'modifycol': case 'redraw': case 'setfont': case 'usetab': case 'setimagelist': case 'seticon': case 'setparts': return;
      case 'settext': c.text = str(a[0]); return;
      case 'opt': { const o = str(a[0]); if (/\+Disabled/i.test(o)) c.enabled = 0; if (/-Disabled/i.test(o)) c.enabled = 1; if (/\+Hidden/i.test(o)) c.visible = 0; if (/-Hidden/i.test(o)) c.visible = 1; if (/\+ReadOnly/i.test(o)) c.readonly = true; if (/-ReadOnly/i.test(o)) c.readonly = false; return; }
    }
    throw new SimError('This value of type "Gui.' + c.type + '" has no method named "' + n + '".');
  }
  /* builtins */
  callB(k, a, env) { const f = B[k]; if (f) return f.call(this, a, env); if (LOGF.test(k)) { this.logAction(k, a); return undefined; } return undefined; }
  /* host-facing */
  entry(fn) {
    this.steps = 0;
    try { fn(); }
    catch (e) {
      if (e instanceof ExitSignal) { this.exited = true; this.timers = []; this.add('info', 'The script exited (ExitApp).'); }
      else if (e instanceof SimStop) this.add('err', e.message);
      else if (e instanceof SimError) this.add('err', e.message + (e.ln ? '  (line ' + e.ln + ')' : ''), e.ln);
      else this.add('err', 'Simulator problem: ' + (e && e.message), this.ln);
    } finally { if (this.host.changed) this.host.changed(); }
  }
  run() { this.entry(() => { const r = this.exec(this.prog.top, this.genv); }); return this; }
  invoke(fn, args) { if (this.exited || !fn) return undefined; let r; this.entry(() => { r = this.callFn(fn, args || []); }); return r; }
  fire(c, ev, extra) { if (this.exited) return; const h = c.handlers[lc(ev)]; if (h) this.invoke(h, [c, extra === undefined ? 0 : extra]); else if (this.host.changed) this.host.changed(); }
  fireGui(g, ev) { const h = g.handlers[lc(ev)]; let cancel = false; if (h) { const r = this.invoke(h, [g]); cancel = truthy(r); } if (!cancel && lc(ev) === 'close' && !h) { g.visible = 0; g.destroyed = 1; if (this.host.changed) this.host.changed(); } }
  resize(g, w, h) { g.w = Math.round(w); g.h = Math.round(h); const hd = g.handlers.size; if (hd) this.invoke(hd, [g, 0, g.w, g.h]); else if (this.host.changed) this.host.changed(); }
  runHotkey(i) { const hk = this.hotkeys[i]; if (!hk || this.exited) return; this.thisHotkey = hk.key; this.entry(() => { if (hk.fn) this.callFn(hk.fn, [hk.key]); else this.exec(hk.body, { v: new Map(), glob: null, parent: null, isG: false, st: null, stAll: this.hkStat(hk), names: new Map() }); }); }
  hkStat(hk) { if (!hk._st) hk._st = new Map(); return hk._st; }
  runHotstring(i) { const h = this.hotstrings[i]; if (h) this.add('send', 'Typed replacement: ' + h.text); }
  advance(ms) {
    const target = this.clock + ms; let guard = 0;
    for (;;) {
      if (this.exited) break; const due = this.timers.filter(t => t.next <= target).sort((x, y) => x.next - y.next)[0];
      if (!due || ++guard > 2000) break;
      this.clock = Math.max(this.clock, due.next);
      if (due.once) this.timers = this.timers.filter(t => t !== due); else due.next += Math.max(1, due.period);
      if (this.inTimer < 3) { this.inTimer++; try { this.invoke(due.fn, []); } finally { this.inTimer--; } }
    }
    this.clock = target;
  }
  vars() { const o = []; this.globals.forEach((v, k) => { if (!(v instanceof Fn)) o.push([this.gnames.get(k) || k, v instanceof AArr ? '[' + v.a.map(show).join(', ') + ']' : v instanceof AMap ? 'Map(' + [...v.m.values()].map(e => show(e[0]) + ': ' + show(e[1])).join(', ') + ')' : show(v)]); }); return o; }
  stop() { this.exited = true; this.timers = []; }
}

/* ---------- built-in functions ---------- */
const B = Object.create(null);
const numArg = (a, i, d) => (a[i] === undefined ? d : num(a[i]));
const strArg = (a, i, d) => (a[i] === undefined ? (d === undefined ? '' : d) : str(a[i]));
B.msgbox = function (a) {
  const text = a.length ? str(a[0]) : 'Press OK to continue.', title = a[1] === undefined ? 'script.ahk' : str(a[1]), o = a[2] === undefined ? '' : str(a[2]);
  this.add('msg', text, this.ln); if (this.host.msgbox) this.host.msgbox({ text, title, opts: o });
  const yn = /yes|y\/n|\byn\b/i.test(o) || (isNumStr(o) && [3, 4].includes(num(o) & 15));
  if (yn) return this.answer; if (/cancel/i.test(o) || (isNumStr(o) && [1, 3].includes(num(o) & 15))) return 'OK'; return 'OK';
};
B.tooltip = function (a) { const t = strArg(a, 0); this.add('tip', t === '' ? '(tooltip hidden)' : 'ToolTip: ' + t); if (this.host.tip) this.host.tip(t); };
B.traytip = function (a) { this.add('tip', 'TrayTip: ' + strArg(a, 1) + ' ' + strArg(a, 0)); };
B.inputbox = function (a) { const prompt = strArg(a, 0), def = strArg(a, 3); this.add('msg', 'InputBox: ' + prompt, this.ln); const v = this.inputAnswer !== undefined ? this.inputAnswer : def; return new AObj({ Value: v, Result: 'OK' }); };
B.sleep = function (a) { const ms = numArg(a, 0, 0); this.slept += ms; if (this.inTimer < 3) { this.inTimer++; try { this.advance(Math.max(0, ms)); } finally { this.inTimer--; } } };
B.random = function (a) { const r = this.host.random ? this.host.random() : Math.random(); if (!a.length) return r; let lo = numArg(a, 0, 0), hi = numArg(a, 1, 2147483647); if (a.length === 1) { hi = lo; lo = 0; } if (lo > hi) [lo, hi] = [hi, lo]; return Number.isInteger(lo) && Number.isInteger(hi) ? lo + Math.floor(r * (hi - lo + 1)) : lo + r * (hi - lo); };
B.round = a => { const n = num(a[0]), p = numArg(a, 1, 0); const f = Math.pow(10, p); const r = Math.sign(n) * Math.round(Math.abs(n) * f) / f; return p > 0 ? Number(r.toFixed(p)) : r; };
B.floor = a => Math.floor(num(a[0])); B.ceil = a => Math.ceil(num(a[0])); B.abs = a => Math.abs(num(a[0])); B.sqrt = a => { const n = num(a[0]); if (n < 0) return ''; return Math.sqrt(n); };
B.mod = a => { const d = num(a[1]); if (d === 0) throw new SimError('Divide by zero.'); return num(a[0]) % d; };
B.min = a => Math.min(...a.map(num)); B.max = a => Math.max(...a.map(num)); B.sin = a => Math.sin(num(a[0])); B.cos = a => Math.cos(num(a[0])); B.tan = a => Math.tan(num(a[0])); B.exp = a => Math.exp(num(a[0])); B.ln = a => Math.log(num(a[0])); B.log = a => Math.log10(num(a[0]));
B.integer = a => { const n = num(a[0]); return Math.trunc(n); }; B.float = a => num(a[0]); B.number = a => num(a[0]); B.string = a => str(a[0]);
B.isnumber = a => bool(isNumStr(a[0]) || typeof a[0] === 'number'); B.isinteger = a => bool((typeof a[0] === 'number' && Number.isInteger(a[0])) || (isNumStr(a[0]) && Number.isInteger(num(a[0])) && !/[.e]/i.test(a[0]))); B.isfloat = a => bool((typeof a[0] === 'number' && !Number.isInteger(a[0])) || (isNumStr(a[0]) && /[.e]/i.test(a[0])));
B.isalpha = a => bool(/^[A-Za-z]+$/.test(str(a[0]))); B.isalnum = a => bool(/^[A-Za-z0-9]+$/.test(str(a[0]))); B.isdigit = a => bool(/^\d+$/.test(str(a[0]))); B.isspace = a => bool(/^\s+$/.test(str(a[0]))); B.isupper = a => bool(/^[A-Z]+$/.test(str(a[0]))); B.islower = a => bool(/^[a-z]+$/.test(str(a[0])));
B.isset = a => bool(a[0] !== undefined); B.isobject = a => bool(a[0] !== undefined && typeof a[0] !== 'number' && typeof a[0] !== 'string'); B.type = a => typeName(a[0]) === 'unset' ? 'String' : typeName(a[0]);
B.strlen = a => str(a[0]).length; B.strupper = a => str(a[0]).toUpperCase(); B.strlower = a => str(a[0]).toLowerCase(); B.strtitle = a => str(a[0]).toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase());
B.trim = a => { const s = str(a[0]), c = a[1] === undefined ? ' \t\r\n' : str(a[1]); let i = 0, j = s.length; while (i < j && c.includes(s[i])) i++; while (j > i && c.includes(s[j - 1])) j--; return s.slice(i, j); };
B.ltrim = a => { const s = str(a[0]), c = a[1] === undefined ? ' \t\r\n' : str(a[1]); let i = 0; while (i < s.length && c.includes(s[i])) i++; return s.slice(i); };
B.rtrim = a => { const s = str(a[0]), c = a[1] === undefined ? ' \t\r\n' : str(a[1]); let j = s.length; while (j > 0 && c.includes(s[j - 1])) j--; return s.slice(0, j); };
B.substr = a => { const s = str(a[0]); let st = num(a[1]); if (st === 0) st = 1; const i = st < 0 ? Math.max(0, s.length + st) : st - 1; const l = a[2] === undefined ? s.length : num(a[2]); return l < 0 ? s.slice(i, s.length + l) : s.slice(i, i + l); };
B.instr = a => { const h = str(a[0]), n = str(a[1]), cs = a[2] !== undefined && truthy(a[2]); const st = numArg(a, 3, 1); const H = cs ? h : h.toLowerCase(), N = cs ? n : n.toLowerCase(); const i = st < 0 ? H.lastIndexOf(N, H.length + st) : H.indexOf(N, st - 1); return i + 1; };
B.strreplace = function (a) { const h = str(a[0]), s = str(a[1]), r = strArg(a, 2), cs = a[3] !== undefined && truthy(a[3]); if (s === '') return h; const re = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), cs ? 'g' : 'gi'); let n = 0, lim = a[5] === undefined ? Infinity : num(a[5]); const out = h.replace(re, m => { if (n >= lim) return m; n++; return r; }); if (a[4] instanceof Ref) a[4].set(n); return out; };
B.strsplit = a => { const s = str(a[0]); const d = a[1] === undefined ? '' : (a[1] instanceof AArr ? a[1].a.map(str) : [str(a[1])]); let parts; if (d.length === 0 || (d.length === 1 && d[0] === '')) parts = [...s]; else parts = s.split(new RegExp(d.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'))); if (a[2] !== undefined) { const om = str(a[2]); parts = parts.map(p => { let i = 0, j = p.length; while (i < j && om.includes(p[i])) i++; while (j > i && om.includes(p[j - 1])) j--; return p.slice(i, j); }); } return new AArr(parts); };
B.chr = a => String.fromCodePoint(num(a[0])); B.ord = a => str(a[0]).codePointAt(0) || 0;
B.format = a => format(str(a[0]), a.slice(1)); B.formattime = function (a) { return formatTime(a[0] === undefined || a[0] === '' ? this.builtinVar('a_now') : a[0], a[1] === undefined ? undefined : str(a[1])); };
B.dateadd = a => { const d = parseYmd(a[0]), n = num(a[1]), u = lc(str(a[2])); const mul = { seconds: 1000, minutes: 60000, hours: 3600000, days: 86400000 }[u]; if (!mul) throw new SimError('Bad time unit "' + str(a[2]) + '"'); return ymd(new Date(d.getTime() + n * mul)); };
B.datediff = a => { const x = parseYmd(a[0]), y = parseYmd(a[1]), u = lc(str(a[2])); const div = { seconds: 1000, minutes: 60000, hours: 3600000, days: 86400000 }[u]; if (!div) throw new SimError('Bad time unit "' + str(a[2]) + '"'); return Math.trunc((x - y) / div); };
B.regexmatch = function (a) { const re = toRegex(str(a[1])), h = str(a[0]); re.lastIndex = 0; const st = a[3] === undefined ? 0 : num(a[3]) - 1; const m = re.exec(h.slice(st)); if (m) m.index += st; if (a[2] instanceof Ref) a[2].set(m ? new AMatch(m) : ''); return m ? m.index + 1 : 0; };
B.regexreplace = function (a) { const re = toRegex(str(a[1]), 'g'), h = str(a[0]); let n = 0; const out = h.replace(re, (...m) => { n++; return str(a[2] === undefined ? '' : a[2]).replace(/\$(\d+|\$)/g, (z, d) => d === '$' ? '$' : (typeof m[+d] === 'string' ? m[+d] : '')); }); if (a[3] instanceof Ref) a[3].set(n); return out; };
B.map = a => { const m = new AMap(); for (let i = 0; i + 1 < a.length; i += 2) m.m.set(typeof a[i] + ':' + (typeof a[i] === 'string' ? a[i] : String(a[i])), [a[i], a[i + 1]]); return m; };
B.array = a => new AArr(a.slice()); B.object = a => { const o = new AObj(); for (let i = 0; i + 1 < a.length; i += 2) o.p[str(a[i])] = a[i + 1]; return o; };
B.gui = function (a) { const g = new VGui(a[0] === undefined ? '' : str(a[0]), a[1] === undefined ? undefined : str(a[1])); this.guis.push(g); return g; };
B.settimer = function (a) {
  const fn = a[0], p = a[1] === undefined ? 250 : (typeof a[1] === 'string' && /^off$/i.test(a[1]) ? 0 : num(a[1]));
  const same = t => t.fn === fn || (fn instanceof Fn && t.fn instanceof Fn && t.fn.def === fn.def);
  this.timers = this.timers.filter(t => !same(t)); if (p === 0) return;
  this.timers.push({ fn, period: Math.abs(p), next: this.clock + Math.abs(p), once: p < 0 });
};
B.exitapp = function () { throw new ExitSignal(); }; B.exit = function () { throw new ExitSignal(); };
B.reload = function () { this.add('info', 'Reload requested: the script would restart here.'); throw new ExitSignal(); };
B.mousegetpos = function (a) { const m = this.host.mouse || { x: 100, y: 100 }; [m.x, m.y, 0, ''].forEach((v, i) => { if (a[i] instanceof Ref) a[i].set(v); }); };
B.imagesearch = function (a) { if (a[0] instanceof Ref) a[0].set(''); if (a[1] instanceof Ref) a[1].set(''); this.add('do', 'ImageSearch ' + show(a[6]) + ' → not found (the simulator cannot see your screen)'); return 0; };
B.pixelsearch = function (a) { if (a[0] instanceof Ref) a[0].set(''); if (a[1] instanceof Ref) a[1].set(''); this.add('do', 'PixelSearch ' + show(a[6]) + ' → not found (the simulator cannot see your screen)'); return 0; };
B.pixelgetcolor = function () { return '0x000000'; };
B.getkeystate = function (a) { const k = lc(str(a[0])); return bool(this.keys.has(k)); };
const setRefs = (a, from, vals) => vals.forEach((v, i) => { if (a[from + i] instanceof Ref) a[from + i].set(v); });
B.wingetpos = function (a) { setRefs(a, 0, [100, 100, 800, 600]); }; B.wingettitle = () => 'Untitled - Notepad'; B.wingetclass = () => 'Notepad'; B.wingetprocessname = () => 'notepad.exe'; B.wingetminmax = () => 0; B.wingetid = () => 66666;
B.monitorgetcount = () => 1; B.monitorgetworkarea = function (a) { setRefs(a, 1, [0, 0, 1920, 1040]); return 1; }; B.monitorget = function (a) { setRefs(a, 1, [0, 0, 1920, 1080]); return 1; };
B.envget = () => ''; B.fileread = function (a) { this.add('do', 'FileRead ' + show(a[0]) + ' (the simulator cannot read your files)'); return ''; }; B.filegetsize = () => 0; B.iniread = a => (a[3] === undefined ? '' : a[3]); B.regread = () => '';
B.fileselect = function () { this.add('do', 'FileSelect: the dialog is not shown, treated as cancelled'); return ''; }; B.dirselect = B.fileselect;
['winwait', 'winwaitactive', 'winwaitclose', 'winwaitnotactive', 'processwait', 'processwaitclose'].forEach(n => { B[n] = function (a) { this.add('do', n.replace(/^./, c => c.toUpperCase()) + ' → continues immediately in the simulator'); return 1; }; });
['inputhook', 'fileopen', 'comobject', 'comobjget', 'comobjcreate'].forEach(n => { B[n] = function () { return new AStub(n); }; });
const PICKS = ['0x3399FF', '0xE5484D', '0x30A46C', '0xF08A24'];
B.nexo_pickcolor = function () { const c = this.host.pickColor ? this.host.pickColor() : PICKS[(this.picks = (this.picks || 0) + 1) % PICKS.length]; this.add('do', 'Color picker (pretend): picked ' + c); return c; };
B.winactive = () => 0; B.winexist = () => 0; B.processexist = () => 0; B.fileexist = () => ''; B.direxist = () => '';
B.hotkey = function (a) { const k = str(a[0]); if (a[1] instanceof Fn || a[1] instanceof BFn) this.hotkeys.push({ key: k, fn: a[1], body: [] }); else if (a[1] !== undefined) { const m = lc(str(a[1])); const hk = this.hotkeys.find(h => lc(h.key) === lc(k)); if (hk) hk.off = m === 'off'; } };
B.hotstring = function (a) { this.warnOnce('hs', 'Hotstring() calls are not simulated'); };
B.objbindmethod = function (a) { return a[0]; };
B.sendtext = function (a) { this.add('send', 'SendText ' + strArg(a, 0)); };
B.dllcall = function () { return 0; };
['error', 'oserror', 'valueerror', 'typeerror', 'indexerror', 'keyerror', 'memberror', 'propertyerror', 'methoderror', 'targeterror', 'timeouterror', 'unseterror', 'zerodivisionerror'].forEach(n => { B[n] = function (a) { return new AObj({ Message: strArg(a, 0), What: strArg(a, 1), Extra: strArg(a, 2), Line: this.ln || 0, File: 'script.ahk', Stack: '' }); }; });

return { SimError, prep, tokenize, parseProgram, parseExpr, compileExpr, splitTop, lc,
  create(code, host) { let prog; try { prog = parseProgram(code); } catch (e) { return { error: e.message + (e.ln ? ' (line ' + e.ln + ')' : '') }; } prog.funcs.delete('nexo_pickcolor'); return new Interp(prog, host); },
  AArr, AMap, AObj, VCtl, VGui, Fn };
});
