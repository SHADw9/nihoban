const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('nihobanDesktop', {
  speak: (text, rate) => ipcRenderer.invoke('tts:speak', { text, rate }),
  cancel: () => ipcRenderer.invoke('tts:cancel')
});
