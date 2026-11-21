'use strict';
// Pure helpers for the friendly crash dialog and the crash log.
const fs = require('fs'), path = require('path');
function formatCrash(kind, err, info) {
  info = info || {};
  const body = err && err.stack ? err.stack : String(err);
  return ['--- ' + new Date().toISOString() + '  ' + kind, 'Nexo Ahks ' + (info.version || '?') + ' on ' + (info.platform || '?') + ' (Electron ' + (info.electron || '?') + ')', body].join('\n');
}
// Append to the log, keeping only the newest `max` characters so it never grows forever.
function appendLog(file, text, max) {
  max = max || 200000;
  try { let old = ''; try { old = fs.readFileSync(file, 'utf8'); } catch (e) {} let n = old + text + '\n\n'; if (n.length > max) n = n.slice(n.length - max); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, n); return true; } catch (e) { return false; }
}
// One dialog at a time, and the same message is not shown again within `gap` ms.
function makeThrottle(gap) {
  gap = gap || 3000; let busy = false, last = '', at = 0;
  return { begin(msg, now) { now = now === undefined ? Date.now() : now; if (busy || (msg === last && now - at < gap)) return false; busy = true; last = msg; at = now; return true; }, end() { busy = false; } };
}
module.exports = { formatCrash, appendLog, makeThrottle };
