import { useState, useRef, useEffect } from 'react'
import './SettingsPopover.css'

type ThemeMode = 'ink' | 'paper' | 'sepia'
type FontBody = 'sans' | 'serif' | 'lora'
type FontHeading = 'inter' | 'serif'
type ReaderWidth = '560' | '720' | '900' | 'full'

interface SettingsPopoverProps {
  open: boolean
  onClose: () => void
  theme: ThemeMode
  fontBody: FontBody
  headingFont: FontHeading
  readerWidth: ReaderWidth
  onThemeChange: (t: ThemeMode) => void
  onFontBodyChange: (f: FontBody) => void
  onHeadingFontChange: (h: FontHeading) => void
  onWidthChange: (w: ReaderWidth) => void
}

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: 'ink', label: 'Ink' },
  { value: 'paper', label: 'Paper' },
  { value: 'sepia', label: 'Sepia' },
]

const BODY_FONTS: { value: FontBody; label: string }[] = [
  { value: 'sans', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
  { value: 'lora', label: 'Lora' },
]

const HEADING_FONTS: { value: FontHeading; label: string }[] = [
  { value: 'inter', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
]

const WIDTHS: { value: ReaderWidth; label: string }[] = [
  { value: '560', label: '窄' },
  { value: '720', label: '标准' },
  { value: '900', label: '宽' },
  { value: 'full', label: '全屏' },
]

function SettingsPopover({
  open,
  onClose,
  theme,
  fontBody,
  headingFont,
  readerWidth,
  onThemeChange,
  onFontBodyChange,
  onHeadingFontChange,
  onWidthChange,
}: SettingsPopoverProps): React.ReactElement | null {
  const panelRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent): void => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // 延迟绑定，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open, onClose])

  // ESC 关闭
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
    <div className="settings-popover" ref={panelRef}>
      {/* 主题 */}
      <div className="settings-group">
        <span className="settings-group-label">主题</span>
        <div className="settings-segmented">
          {THEMES.map((t) => (
            <button
              key={t.value}
              className={`seg-btn seg-btn--theme-${t.value} ${theme === t.value ? 'active' : ''}`}
              onClick={() => onThemeChange(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 正文字体 */}
      <div className="settings-group">
        <span className="settings-group-label">正文</span>
        <div className="settings-segmented">
          {BODY_FONTS.map((f) => (
            <button
              key={f.value}
              className={`seg-btn seg-btn--font-${f.value} ${fontBody === f.value ? 'active' : ''}`}
              onClick={() => onFontBodyChange(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 标题字体 */}
      <div className="settings-group">
        <span className="settings-group-label">标题</span>
        <div className="settings-segmented">
          {HEADING_FONTS.map((h) => (
            <button
              key={h.value}
              className={`seg-btn seg-btn--heading-${h.value} ${headingFont === h.value ? 'active' : ''}`}
              onClick={() => onHeadingFontChange(h.value)}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* 阅读宽度 */}
      <div className="settings-group">
        <span className="settings-group-label">宽度</span>
        <div className="settings-segmented">
          {WIDTHS.map((w) => (
            <button
              key={w.value}
              className={`seg-btn ${readerWidth === w.value ? 'active' : ''}`}
              onClick={() => onWidthChange(w.value)}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SettingsPopover
