import { useEffect, useState, useCallback, useRef } from 'react'
import type { NoteFile, DirChangedEvent } from '../../electron.d'
import './FileList.css'

interface FileListProps {
  dirPath: string
  activeFilePath: string | null
  onFileSelect: (file: NoteFile) => void
  onFileDelete: (file: NoteFile) => void
}

/**
 * 将 mtime 格式化为"今天 HH:mm"或"M月D日"
 */
function formatMtime(mtime: number): string {
  const now = new Date()
  const date = new Date(mtime)

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) {
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    return `今天 ${hh}:${mm}`
  }

  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

/**
 * 去掉 .md 后缀显示文件名
 */
function displayName(fileName: string): string {
  return fileName.endsWith('.md') ? fileName.slice(0, -3) : fileName
}

function FileList({ dirPath, activeFilePath, onFileSelect, onFileDelete }: FileListProps): React.ReactElement {
  const [files, setFiles] = useState<NoteFile[]>([])
  const [loading, setLoading] = useState(true)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: NoteFile } | null>(null)

  // 加载文件列表
  const loadFiles = useCallback(async () => {
    if (!dirPath) return
    try {
      const list = await window.electronAPI.readDir(dirPath)
      setFiles(list)
    } catch (err) {
      console.error('读取目录失败', err)
    } finally {
      setLoading(false)
    }
  }, [dirPath])

  // 初始加载 + chokidar 监听
  useEffect(() => {
    setLoading(true)
    void loadFiles()
    void window.electronAPI.watchDir(dirPath)

    const unsubscribe = window.electronAPI.onDirChanged((_event: DirChangedEvent) => {
      // 目录有变化 → 重新加载列表
      void loadFiles()
    })

    return () => {
      unsubscribe()
      void window.electronAPI.unwatchDir()
    }
  }, [dirPath, loadFiles])

  // 点击空白处关闭右键菜单
  const menuRef = useRef<HTMLUListElement>(null)
  useEffect(() => {
    if (!contextMenu) return
    const handleGlobalClick = (): void => setContextMenu(null)
    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [contextMenu])

  const handleContextMenu = (e: React.MouseEvent, file: NoteFile): void => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, file })
  }

  const handleDeleteClick = (file: NoteFile): void => {
    setContextMenu(null)
    onFileDelete(file)
  }

  if (loading) {
    return <div className="file-list-empty">加载中…</div>
  }

  if (files.length === 0) {
    return <div className="file-list-empty">暂无 Markdown 文件</div>
  }

  return (
    <>
      <ul className="file-list">
        {files.map((file) => (
          <li
            key={file.path}
            className={`file-item ${activeFilePath === file.path ? 'active' : ''}`}
            onClick={() => onFileSelect(file)}
            onContextMenu={(e) => handleContextMenu(e, file)}
            title={file.path}
          >
            <span className="file-item-name">{displayName(file.name)}</span>
            <span className="file-item-mtime">{formatMtime(file.mtime)}</span>
          </li>
        ))}
      </ul>

      {/* 右键菜单 */}
      {contextMenu && (
        <ul
          ref={menuRef}
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <li
            className="context-menu-item context-menu-item--danger"
            onClick={() => handleDeleteClick(contextMenu.file)}
          >
            删除笔记
          </li>
        </ul>
      )}
    </>
  )
}

export default FileList
