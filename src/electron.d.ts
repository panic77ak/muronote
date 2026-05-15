export interface ElectronAPI {
  readFile: (filePath: string) => Promise<string>
  readDir: (dirPath: string) => Promise<Array<{ name: string; path: string }>>
  openFolder: () => Promise<string | null>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
