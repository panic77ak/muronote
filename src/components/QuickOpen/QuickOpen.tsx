import { useState, useEffect, useRef, useCallback } from 'react'
import type { NoteFile } from '../../electron.d'
import './QuickOpen.css'

interface QuickOpenProps {
  open: boolean
  onClose: () => void
  onSelect: (file: NoteFile) => void
  dirPath: string
}

function QuickOpen({ open, onClose, onSelect, dirPath }: QuickOpenProps): React.ReactElement | null {
  const [query, setQuery] = useState('')
  const [files, setFiles] = useState<NoteFile[]>([])
  const [filtered, setFiltered] = useState<NoteFile[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // 加载文件列表
  useEffect(() => {
    if (!open || !dirPath) return
    void (async () => {
      const list = await window.electronAPI.readDir(dirPath)
      setFiles(list)
      setFiltered(list.slice(0, 20))
    })()
  }, [open, dirPath])

  // 打开时聚焦
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // 过滤
  useEffect(() => {
    if (!query.trim()) {
      setFiltered(files.slice(0, 20))
      setSelectedIndex(0)
      return
    }
    const lower = query.toLowerCase()
    const result = files.filter((f) =>
      f.name.toLowerCase().includes(lower) ||
      (f.relativePath && f.relativePath.toLowerCase().includes(lower))
    ).slice(0, 20)
    setFiltered(result)
    setSelectedIndex(0)
  }, [query, files])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        onSelect(filtered[selectedIndex])
        onClose()
      }
    }
  }, [filtered, selectedIndex, onSelect, onClose])

  // 点击蒙版关闭
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('quick-open-backdrop')) {
      onClose()
    }
  }, [onClose])

  if (!open) return null

  return (
    <div className="quick-open-backdrop" onClick={handleBackdropClick}>
      <div className="quick-open-panel">
        <input
          ref={inputRef}
          className="quick-open-input"
          type="text"
          placeholder="输入文件名快速跳转..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="quick-open-list">
          {filtered.map((file, i) => (
            <div
              key={file.path}
              className={`quick-open-item ${i === selectedIndex ? 'active' : ''}`}
              onClick={() => { onSelect(file); onClose() }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="quick-open-name">
                {file.name.replace(/\.md$/, '')}
              </span>
              {file.relativePath && file.relativePath.includes('/') && (
                <span className="quick-open-path">
                  {file.relativePath.split('/').slice(0, -1).join('/')}
                </span>
              )}
            </div>
          ))}
          {filtered.length === 0 && query && (
            <div className="quick-open-empty">无匹配文件</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuickOpen
