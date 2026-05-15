import { ipcMain, dialog } from 'electron'
import fs from 'fs/promises'
import path from 'path'

export function registerFsHandlers(): void {
  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    return await fs.readFile(filePath, 'utf-8')
  })

  ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    return entries
      .filter(e => e.isFile() && e.name.endsWith('.md'))
      .map(e => ({ name: e.name, path: path.join(dirPath, e.name) }))
  })

  ipcMain.handle('fs:openFolder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })
}
