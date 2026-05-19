import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'

// chokidar v5 是 ESM-only 包，必须用动态 import 而不是 require
// FSWatcher 接口（简化，只用到 close/on）
interface FSWatcher {
  close(): Promise<void>
  on(event: string, listener: (filePath: string) => void): this
}

// 全局 watcher 实例，同一时间只监听一个目录
let currentWatcher: FSWatcher | null = null

// 当前打开的根目录（路径白名单），用于 IPC 路径安全校验
let currentRootDir: string | null = null

/**
 * 校验传入路径是否在当前根目录下（防止路径穿越攻击）
 * - 返回 true：路径合法
 * - 抛出 Error：路径不合法
 */
function assertPathInRoot(targetPath: string): void {
  if (!currentRootDir) {
    throw new Error('未打开任何文件夹，操作被拒绝')
  }
  const resolvedTarget = path.resolve(targetPath)
  const resolvedRoot = path.resolve(currentRootDir)
  if (!resolvedTarget.startsWith(resolvedRoot + path.sep) && resolvedTarget !== resolvedRoot) {
    throw new Error(`路径越界：${targetPath} 不在当前文件夹内`)
  }
}

export function registerFsHandlers(): void {
  // ──────────────────────────────────────────────
  // 读取文件内容
  // ──────────────────────────────────────────────
  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    assertPathInRoot(filePath)
    return await fs.readFile(filePath, 'utf-8')
  })

  // ──────────────────────────────────────────────
  // 写入文件内容（自动保存 / 编辑保存）
  // ──────────────────────────────────────────────
  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    assertPathInRoot(filePath)
    await fs.writeFile(filePath, content, 'utf-8')
    return true
  })

  // ──────────────────────────────────────────────
  // 读取目录：返回 .md 文件列表，附带 mtime
  // ──────────────────────────────────────────────
  ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
    assertPathInRoot(dirPath)
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    const mdFiles = entries.filter(e => e.isFile() && e.name.endsWith('.md'))

    const results = await Promise.all(
      mdFiles.map(async (e) => {
        const filePath = path.join(dirPath, e.name)
        const stat = await fs.stat(filePath)
        return {
          name: e.name,
          path: filePath,
          mtime: stat.mtimeMs,
        }
      })
    )

    // 按最近修改时间倒序
    results.sort((a, b) => b.mtime - a.mtime)
    return results
  })

  // ──────────────────────────────────────────────
  // 打开文件夹对话框（允许任意路径，设置为新根目录）
  // ──────────────────────────────────────────────
  ipcMain.handle('fs:openFolder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (result.canceled) return null
    const selectedPath = result.filePaths[0]
    // 更新根目录白名单
    currentRootDir = selectedPath
    return selectedPath
  })

  // ──────────────────────────────────────────────
  // 新建笔记文件
  // ──────────────────────────────────────────────
  ipcMain.handle('fs:createFile', async (_event, dirPath: string, fileName: string) => {
    assertPathInRoot(dirPath)
    const filePath = path.join(dirPath, fileName)
    await fs.writeFile(filePath, '', 'utf-8')
    return filePath
  })

  // ──────────────────────────────────────────────
  // 删除文件（主进程弹确认对话框后删除）
  // ──────────────────────────────────────────────
  ipcMain.handle('fs:deleteFile', async (_event, filePath: string) => {
    assertPathInRoot(filePath)
    // 弹确认对话框
    const result = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['删除', '取消'],
      defaultId: 1,
      cancelId: 1,
      title: '删除笔记',
      message: `确认删除「${path.basename(filePath, '.md')}」？`,
      detail: '此操作不可撤销。',
    })

    if (result.response === 0) {
      await fs.unlink(filePath)
      return true
    }
    return false
  })

  // ──────────────────────────────────────────────
  // 启动 chokidar 监听目录（允许任意路径，同步更新根目录）
  // chokidar v5 是 ESM-only，必须用动态 import()
  // ──────────────────────────────────────────────
  ipcMain.handle('fs:watchDir', async (_event, dirPath: string) => {
    // watchDir 用于监听根目录，允许任意路径并同步更新 currentRootDir
    currentRootDir = dirPath

    // 停止旧的 watcher
    if (currentWatcher) {
      await currentWatcher.close()
      currentWatcher = null
    }

    // 动态 import chokidar（ESM）
    const chokidar = await import('chokidar')
    const watcher = chokidar.watch(dirPath, {
      depth: 0,           // 只监听一层，不递归子目录
      ignoreInitial: true,
      persistent: true,
    })

    currentWatcher = watcher as unknown as FSWatcher

    const notify = (type: string, filePath: string): void => {
      // 只通知 .md 文件变化
      if (!filePath.endsWith('.md')) return
      BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
          win.webContents.send('fs:dirChanged', { type, filePath, dirPath })
        }
      })
    }

    watcher
      .on('add',    (p: string) => notify('add', p))
      .on('change', (p: string) => notify('change', p))
      .on('unlink', (p: string) => notify('unlink', p))

    return true
  })

  // ──────────────────────────────────────────────
  // 停止监听
  // ──────────────────────────────────────────────
  ipcMain.handle('fs:unwatchDir', async () => {
    if (currentWatcher) {
      await currentWatcher.close()
      currentWatcher = null
    }
    return true
  })

  // ──────────────────────────────────────────────
  // 检查文件是否存在
  // ──────────────────────────────────────────────
  ipcMain.handle('fs:exists', (_event, filePath: string) => {
    assertPathInRoot(filePath)
    return fsSync.existsSync(filePath)
  })

  // ──────────────────────────────────────────────
  // 设置拖拽进来的文件夹路径为新根目录
  // ──────────────────────────────────────────────
  ipcMain.handle('fs:setFolder', async (_event, dirPath: string) => {
    // 验证是有效目录
    try {
      const stat = await fs.stat(dirPath)
      if (!stat.isDirectory()) return null
    } catch {
      return null
    }
    currentRootDir = dirPath
    return dirPath
  })

  // ──────────────────────────────────────────────
  // 全文搜索：遍历 currentRootDir 下所有 .md 文件
  // ──────────────────────────────────────────────
  ipcMain.handle('fs:searchContent', (_event, query: string) => {
    if (!currentRootDir || !query.trim()) return []

    const MAX_MATCHES_PER_FILE = 5
    const MAX_TOTAL_RESULTS = 50
    const MAX_LINE_LENGTH = 120

    const results: Array<{
      filePath: string
      fileName: string
      matches: Array<{
        lineNumber: number
        lineText: string
        matchStart: number
        matchEnd: number
      }>
    }> = []

    let totalCount = 0
    const lowerQuery = query.toLowerCase()

    // 列出所有 .md 文件（只读根目录，不接受外部路径）
    let entries: string[]
    try {
      entries = fsSync.readdirSync(currentRootDir)
    } catch {
      return []
    }

    for (const name of entries) {
      if (totalCount >= MAX_TOTAL_RESULTS) break
      if (!name.endsWith('.md')) continue

      const filePath = path.join(currentRootDir, name)

      let content: string
      try {
        content = fsSync.readFileSync(filePath, 'utf-8')
      } catch {
        continue
      }

      const lines = content.split('\n')
      const fileMatches: Array<{
        lineNumber: number
        lineText: string
        matchStart: number
        matchEnd: number
      }> = []

      for (let i = 0; i < lines.length; i++) {
        if (fileMatches.length >= MAX_MATCHES_PER_FILE) break
        const line = lines[i]
        const idx = line.toLowerCase().indexOf(lowerQuery)
        if (idx === -1) continue

        // 截断行到 MAX_LINE_LENGTH，保证匹配词在截断范围内可见
        let lineText = line
        let matchStart = idx
        let matchEnd = idx + query.length

        if (lineText.length > MAX_LINE_LENGTH) {
          // 以匹配位置为中心截取
          const half = Math.floor(MAX_LINE_LENGTH / 2)
          const start = Math.max(0, idx - half)
          const end = Math.min(lineText.length, start + MAX_LINE_LENGTH)
          lineText = (start > 0 ? '…' : '') + lineText.slice(start, end) + (end < line.length ? '…' : '')
          const offset = start > 0 ? start - 1 : start  // 省略号占 1 个字符
          matchStart = idx - offset
          matchEnd = matchStart + query.length
        }

        fileMatches.push({
          lineNumber: i + 1,
          lineText,
          matchStart,
          matchEnd,
        })
      }

      if (fileMatches.length > 0) {
        results.push({ filePath, fileName: name, matches: fileMatches })
        totalCount += fileMatches.length
      }
    }

    return results
  })
}
