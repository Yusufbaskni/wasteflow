const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wasteflowDesktop', {
  openImage: () => ipcRenderer.invoke('open-image'),
  openCsv: () => ipcRenderer.invoke('open-csv'),
  fetchFx: () => ipcRenderer.invoke('fetch-fx'),
  fetchRoute: (from, to) => ipcRenderer.invoke('fetch-route', from, to)
});
