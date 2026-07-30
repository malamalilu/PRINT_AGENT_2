const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("litaAgent", {
  getStatus: () => ipcRenderer.invoke("agent:get-status"),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings) => ipcRenderer.invoke("settings:save", settings),
  getPrinters: () => ipcRenderer.invoke("printers:list"),
  testPrint: (payload) => ipcRenderer.invoke("printers:test", payload)
});
