// Test helper: index.html with its local <script src="..."> files pasted in, so jsdom can run the whole page without a file server.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'renderer');
function pageHtml() {
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  return html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
    if (/^(https?:)?\/\//i.test(src)) return m;
    return '<script>' + fs.readFileSync(path.join(dir, src), 'utf8').replace(/<\/script/gi, '<\\/script') + '</script>';
  });
}
// all renderer script files in the order index.html loads them (used by lint)
function pageScripts() {
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]).filter(s => !/^(https?:)?\/\//i.test(s));
}
module.exports = { pageHtml, pageScripts, dir };
