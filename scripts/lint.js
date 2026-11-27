// Catches the mistakes tests miss: undefined names, duplicate declarations, unreachable code.
// The editor is linted as ONE script (renderer/app.js), because its files share one scope.
const fs = require('fs'), path = require('path');
const { Linter } = require('eslint');
const root = path.join(__dirname, '..');
const linter = new Linter();
const common = { 'no-undef': 'error', 'no-dupe-keys': 'error', 'no-redeclare': 'error', 'no-const-assign': 'error', 'no-func-assign': 'error', 'no-unreachable': 'error', 'no-dupe-args': 'error', 'no-dupe-else-if': 'error', 'no-self-assign': 'error', 'no-unsafe-finally': 'error', 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] };
const web = { env: { browser: true, es2022: true }, parserOptions: { ecmaVersion: 2022, sourceType: 'script' }, globals: { Sim: 'readonly', monaco: 'readonly', require: 'readonly', module: 'writable' }, rules: common };
const node = { env: { node: true, es2022: true }, parserOptions: { ecmaVersion: 2022, sourceType: 'script' }, rules: common };
const jobs = [];
for (const f of ['main.js', 'preload.js', 'capture-preload.js', 'compile-util.js', 'crash-util.js', 'screen-util.js', 'update-util.js', 'ahk-runtime-util.js']) jobs.push([f, fs.readFileSync(path.join(root, f), 'utf8'), node]);
for (const f of fs.readdirSync(__dirname).filter(f => /\.js$/.test(f))) jobs.push(['scripts/' + f, fs.readFileSync(path.join(__dirname, f), 'utf8'), { ...node, rules: { ...common, 'no-undef': 'off', 'no-unused-vars': 'off' } }]);
jobs.push(['renderer/sim.js', fs.readFileSync(path.join(root, 'renderer', 'sim.js'), 'utf8'), { ...web, env: { browser: true, node: true, es2022: true } }]);
jobs.push(['renderer/app.js', fs.readFileSync(path.join(root, 'renderer', 'app.js'), 'utf8'), web]);
let errors = 0, warns = 0;
for (const [name, code, cfg] of jobs) {
  for (const m of linter.verify(code, cfg, { filename: name })) {
    if (m.severity === 2) { errors++; console.log(name + ':' + m.line + ' ' + m.ruleId + ' ' + m.message); } else warns++;
  }
}
console.log(errors ? errors + ' lint error(s)' : 'lint ok' + (warns ? ' (' + warns + ' unused-variable warnings)' : ''));
process.exit(errors ? 1 : 0);
