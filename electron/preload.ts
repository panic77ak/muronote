import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
  openFolder: () => ipcRenderer.invoke('fs:openFolder'),
})
