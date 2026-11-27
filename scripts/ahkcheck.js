// Makes a real script for every block (and every template) and, when AutoHotkey v2 is available, asks AutoHotkey itself to check it.
//   node scripts/ahkcheck.js --dry            only generate the scripts (runs anywhere, part of `npm test`)
//   node scripts/ahkcheck.js [--exe <path>]   generate + validate with real AutoHotkey v2 (Windows; CI does this)
//   AHK_EXE=<path> works instead of --exe. Scripts are written to ./ahkcheck-out/ so you can look at failures.
const fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');
const { JSDOM } = require('jsdom');
const argv = process.argv.slice(2), dry = argv.includes('--dry');
const ei = argv.indexOf('--exe'), exe = (ei >= 0 && argv[ei + 1]) || process.env.AHK_EXE || '';
const outDir = path.join(__dirname, '..', 'ahkcheck-out');
const dom = new JSDOM(require('./page-util').pageHtml(), { runScripts: 'dangerously', url: 'http://localhost/index.html', pretendToBeVisual: true, beforeParse(w) {
  w.matchMedia = () => ({ matches: false, addListener() {}, addEventListener() {} });
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true }; w.HTMLDialogElement.prototype.close = function () { this.open = false };
} });
const w = dom.window, ev = s => w.eval(s);
setTimeout(() => {
  const jobs = ev(`(()=>{const out=[];
    for(const k in T){if(k==='guislot'||k==='guilistset')continue;const b=mk(k);if(T[k].box)b.kids=[mk('wait')];
      root.kids=(T[k].glob||T[k].c==='event')?[b]:[S('hotkey',{key:'F1'},[b])];GUI=newGui();GUI.ctl=[];SET={...DS,panic:false};
      out.push({name:'block_'+k,code:build()})}
    TPL.forEach((t,i)=>{SET={...DS};GUI=newGui();GUI.ctl=[];root.kids=t.f();if(t.g){GUI=t.g();normGui(GUI)}out.push({name:'template_'+i+'_'+t.n.replace(/\\W+/g,'_').slice(0,30),code:build()})});
    const v1=['count = 0\\nSetTimer, Tick, 1000\\nF1::\\nGosub, DoIt\\nreturn\\nDoIt:\\ncount += 1\\nMsgBox, hi %count%\\nreturn\\nTick:\\ncount++\\nreturn'];
    v1.forEach((src,i)=>{const r=parseAhk(src);root.kids=r.kids;GUI=r.gui||newGui();SET=setFromParse(r.set);out.push({name:'v1import_'+i,code:build()})});
    return out})()`);
  fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true });
  const files = jobs.map(j => { const f = path.join(outDir, j.name + '.ahk'); fs.writeFileSync(f, '\ufeff' + j.code, 'utf8'); return { name: j.name, file: f, code: j.code }; });
  const bad = files.filter(f => !/^#Requires AutoHotkey v2/m.test(f.code) || /\bundefined\b|\bNaN\b|\[object/.test(f.code));
  if (bad.length) { console.log('generated scripts with obvious problems:\n - ' + bad.map(b => b.name).join('\n - ')); process.exit(1); }
  if (dry || !exe) { console.log('generated ' + files.length + ' scripts' + (dry ? ' (dry run, AutoHotkey not run)' : ' (no --exe / AHK_EXE given, so AutoHotkey was not run)')); fs.rmSync(outDir, { recursive: true, force: true }); process.exit(0); }
  if (!fs.existsSync(exe)) { console.log('AutoHotkey not found at ' + exe); process.exit(1); }
  const run = (args, timeout) => spawnSync(exe, args, { timeout: timeout || 20000, encoding: 'utf8', windowsHide: true });
  // does this AutoHotkey know /validate? (checks the syntax without running anything). If not, ExitApp is put first: load errors are still reported.
  const probe = path.join(outDir, '_probe.ahk'); fs.writeFileSync(probe, '#Requires AutoHotkey v2.0\nx := 1\n');
  const pr = run(['/ErrorStdOut', '/validate', probe], 15000);
  const hasValidate = pr.status === 0 && !/switch|usage|unrecogni/i.test((pr.stdout || '') + (pr.stderr || ''));
  console.log('AutoHotkey: ' + exe + '  mode: ' + (hasValidate ? '/validate' : 'ExitApp-first fallback'));
  const failures = [];
  for (const f of files) {
    let file = f.file;
    if (!hasValidate) { file = f.file.replace(/\.ahk$/, '.chk.ahk'); fs.writeFileSync(file, '\ufeff' + f.code.replace(/^(#Requires[^\n]*\n)/m, '$1ExitApp\n'), 'utf8'); }
    const r = run(hasValidate ? ['/ErrorStdOut', '/validate', file] : ['/ErrorStdOut', file], 20000);
    const text = String((r.stdout || '') + (r.stderr || '')).trim();
    if (r.error || r.status !== 0 || /\bError\b.*\(\d+\)|^\s*Line Text:/m.test(text)) failures.push({ name: f.name, why: (r.error && r.error.message) || text.slice(0, 600) || 'exit code ' + r.status });
  }
  if (failures.length) { console.log(failures.length + ' of ' + files.length + ' scripts were rejected by AutoHotkey:'); failures.forEach(x => console.log('\n--- ' + x.name + '\n' + x.why)); process.exit(1); }
  console.log('AutoHotkey accepted all ' + files.length + ' generated scripts'); fs.rmSync(outDir, { recursive: true, force: true }); process.exit(0);
}, 800);
