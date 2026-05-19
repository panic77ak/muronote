export interface NoteFile {
  name: string
  path: string
  mtime: number
  relativePath?: string
}

export interface DirChangedEvent {
  type: 'add' | 'change' | 'unlink'
  filePath: string
  dirPath: string
}

export interface SearchMatch {
  lineNumber: number
  lineText: string
  matchStart: number
  matchEnd: number
}

export interface SearchResult {
  filePath: string
  fileName: string
  matches: SearchMatch[]
}

export interface ElectronAPI {
  // 文件读写
  readFile:  (filePath: string) => Promise<string>
  writeFile: (filePath: string, content: string) => Promise<boolean>

  // 目录
  readDir:    (dirPath: string) => Promise<NoteFile[]>
  openFolder: () => Promise<string | null>

  // 文件操作
  createFile: (dirPath: string, fileName: string) => Promise<string>
  deleteFile: (filePath: string) => Promise<boolean>

  // chokidar 监听
  watchDir:   (dirPath: string) => Promise<boolean>
  unwatchDir: () => Promise<boolean>

  // 目录变更通知（注册回调，返回取消函数）
  onDirChanged: (callback: (event: DirChangedEvent) => void) => () => void

  // 全文搜索
  searchContent: (query: string) => Promise<SearchResult[]>

  // 拖拽设置文件夹
  setFolder: (dirPath: string) => Promise<string | null>

  // 窗口控制
  windowMinimize: () => Promise<void>
  windowMaximize: () => Promise<void>
  windowClose: () => Promise<void>

  // 平台信息
  platform: string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
