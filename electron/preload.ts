import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // ── 文件读写 ──
  readFile:   (filePath: string) =>
    ipcRenderer.invoke('fs:readFile', filePath),
  writeFile:  (filePath: string, content: string) =>
    ipcRenderer.invoke('fs:writeFile', filePath, content),

  // ── 目录 ──
  readDir:    (dirPath: string) =>
    ipcRenderer.invoke('fs:readDir', dirPath),
  openFolder: () =>
    ipcRenderer.invoke('fs:openFolder'),

  // ── 文件操作 ──
  createFile: (dirPath: string, fileName: string) =>
    ipcRenderer.invoke('fs:createFile', dirPath, fileName),
  deleteFile: (filePath: string) =>
    ipcRenderer.invoke('fs:deleteFile', filePath),
  renameFile: (oldPath: string, newName: string) =>
    ipcRenderer.invoke('fs:renameFile', oldPath, newName),
  duplicateFile: (filePath: string) =>
    ipcRenderer.invoke('fs:duplicateFile', filePath),

  // ── chokidar 监听 ──
  watchDir:   (dirPath: string) =>
    ipcRenderer.invoke('fs:watchDir', dirPath),
  unwatchDir: () =>
    ipcRenderer.invoke('fs:unwatchDir'),

  // ── 目录变更通知（主进程 → 渲染进程）──
  onDirChanged: (callback: (event: { type: string; filePath: string; dirPath: string }) => void) => {
    const handler = (_ipcEvent: Electron.IpcRendererEvent, data: { type: string; filePath: string; dirPath: string }): void => {
      callback(data)
    }
    ipcRenderer.on('fs:dirChanged', handler)
    // 返回取消订阅函数
    return () => ipcRenderer.removeListener('fs:dirChanged', handler)
  },

  // ── 全文搜索 ──
  searchContent: (query: string) =>
    ipcRenderer.invoke('fs:searchContent', query),

  // ── 拖拽设置文件夹 ──
  setFolder: (dirPath: string) =>
    ipcRenderer.invoke('fs:setFolder', dirPath),

  // ── 获取拖拽文件路径（Electron 42+ 必须通过 webUtils） ──
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  // ── 窗口控制（Windows frameless） ──
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowMaximize: () => ipcRenderer.invoke('window:maximize'),
  windowClose:    () => ipcRenderer.invoke('window:close'),

  // ── 平台信息 ──
  platform: process.platform,
})
