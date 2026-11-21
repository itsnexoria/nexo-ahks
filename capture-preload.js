const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('cap', {
  onInit: f => ipcRenderer.on('cap-init', (_, d) => f(d)),
  done: r => ipcRenderer.send('cap-done', r)
});
