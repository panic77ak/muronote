import { useEffect } from 'react'
import './ShortcutsPanel.css'

interface ShortcutsPanelProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { group: '通用', items: [
    { keys: 'Ctrl + N', desc: '新建笔记' },
    { keys: 'Ctrl + P', desc: '快速打开文件' },
    { keys: 'Ctrl + Shift + R', desc: '切换阅读/编辑模式' },
    { keys: 'Ctrl + /', desc: '显示快捷键' },
  ]},
  { group: '编辑', items: [
    { keys: 'Ctrl + B', desc: '粗体' },
    { keys: 'Ctrl + I', desc: '斜体' },
  ]},
  { group: '导航', items: [
    { keys: '↑ / ↓', desc: '快速打开中选择文件' },
    { keys: 'Enter', desc: '确认选择' },
    { keys: 'Esc', desc: '关闭面板' },
  ]},
]

function ShortcutsPanel({ open, onClose }: ShortcutsPanelProps): React.ReactElement | null {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="shortcuts-backdrop" onClick={onClose}>
      <div className="shortcuts-panel" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h3>键盘快捷键</h3>
          <button className="shortcuts-close" onClick={onClose}>×</button>
        </div>
        <div className="shortcuts-body">
          {SHORTCUTS.map((group) => (
            <div key={group.group} className="shortcuts-group">
              <h4 className="shortcuts-group-title">{group.group}</h4>
              {group.items.map((item) => (
                <div key={item.keys} className="shortcuts-row">
                  <kbd className="shortcuts-kbd">{item.keys}</kbd>
                  <span className="shortcuts-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ShortcutsPanel
