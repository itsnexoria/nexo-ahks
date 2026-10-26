const { contextBridge, ipcRenderer: i, webUtils } = require('electron');
contextBridge.exposeInMainWorld('api', {
  saveProject: (s, def, as) => i.invoke('save-project', s, def, as),
  openProject: () => i.invoke('open-project'),
  exportAhk: (c, d) => i.invoke('export-ahk', c, d),
  importAhk: () => i.invoke('import-ahk'),
  compile: (c, n) => i.invoke('compile', c, n),
  pick: () => i.invoke('pick'),
  recStart: () => i.invoke('rec-start'),
  recStop: () => i.invoke('rec-stop'),
  // script launcher
  runScript: o => i.invoke('run-script', o),
  stopScript: id => i.invoke('stop-script', id),
  stopAll: () => i.invoke('stop-all'),
  running: () => i.invoke('running'),
  libLoad: () => i.invoke('lib-load'),
  libSave: d => i.invoke('lib-save', d),
  libSync: l => i.invoke('lib-sync', l),
  scanFolder: () => i.invoke('scan-folder'),
  readFile: p => i.invoke('read-file', p),
  setStartup: o => i.invoke('set-startup', o),
  reveal: p => i.invoke('reveal', p),
  getPrefs: () => i.invoke('get-prefs'),
  setPrefs: p => i.invoke('set-prefs', p),
  pathOf: f => { try { return webUtils.getPathForFile(f); } catch (e) { return undefined; } },
  onScriptState: f => i.on('script-state', (_, d) => f(d)),
  onTray: f => i.on('tray-cmd', (_, d) => f(d)),
  onOpen: f => i.on('open-file', (_, d) => f(d))
});
