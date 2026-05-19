import { useState, useEffect, useRef, useCallback } from 'react'
import { createMarkdownRenderer } from '../../renderer'
import EditorToolbar from './EditorToolbar'
import './NoteEditor.css'

interface NoteEditorProps {
  filePath: string
  content: string
  onChange: (content: string) => void
  onSave: (content: string) => void
  onSaveError?: () => void
}

const AUTOSAVE_DELAY = 500 // ms
const PREVIEW_DEBOUNCE = 300 // ms

// 每个编辑器实例共享一个渲染器单例（模块级）
const md = createMarkdownRenderer()

/**
 * NoteEditor — 左右分栏编辑器
 * - 左侧：textarea 编辑区
 * - 右侧：实时 Markdown 渲染预览（防抖 300ms）
 * - 失焦或 500ms 无输入后自动保存
 */
function NoteEditor({ filePath, content, onChange, onSave, onSaveError }: NoteEditorProps): React.ReactElement {
  // 本地内容 state：初始值来自 prop
  const [localContent, setLocalContent] = useState(content)

  // 预览 HTML state
  const [previewHtml, setPreviewHtml] = useState(() => md.render(content))

  // content prop 变化时（切换文件）同步本地状态
  useEffect(() => {
    setLocalContent(content)
    setPreviewHtml(md.render(content))
  }, [content])

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const localContentRef = useRef(localContent)

  // 同步 ref（用于 blur 时保存）
  useEffect(() => {
    localContentRef.current = localContent
  }, [localContent])

  // filePath 变化时清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    }
  }, [filePath])

  // 防抖预览更新
  const schedulePreviewUpdate = useCallback((newContent: string) => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    previewTimerRef.current = setTimeout(() => {
      setPreviewHtml(md.render(newContent))
    }, PREVIEW_DEBOUNCE)
  }, [])

  // 防抖自动保存
  const scheduleAutoSave = useCallback(
    (newContent: string) => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = setTimeout(() => {
        onSave(newContent)
      }, AUTOSAVE_DELAY)
    },
    [onSave]
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newContent = e.target.value
    setLocalContent(newContent)
    onChange(newContent)
    schedulePreviewUpdate(newContent)
    scheduleAutoSave(newContent)
  }

  const handleBlur = (): void => {
    // 失焦时立即保存
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
    onSave(localContentRef.current)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (!e.ctrlKey) return

    const isBold = e.key === 'b' || e.key === 'B'
    const isItalic = e.key === 'i' || e.key === 'I'
    if (!isBold && !isItalic) return

    e.preventDefault()

    const textarea = e.target as HTMLTextAreaElement
    const { selectionStart, selectionEnd, value } = textarea
    const wrapper = isBold ? '**' : '*'
    const wrapLen = wrapper.length

    const before = value.slice(0, selectionStart)
    const selected = value.slice(selectionStart, selectionEnd)
    const after = value.slice(selectionEnd)

    const newContent = before + wrapper + selected + wrapper + after
    setLocalContent(newContent)
    onChange(newContent)
    schedulePreviewUpdate(newContent)
    scheduleAutoSave(newContent)

    // React 重渲染后恢复光标/选区
    requestAnimationFrame(() => {
      if (selected.length > 0) {
        // 有选中：选区覆盖原始选中内容（不含 wrapper）
        textarea.setSelectionRange(selectionStart + wrapLen, selectionEnd + wrapLen)
      } else {
        // 无选中：光标置于两个 wrapper 之间
        textarea.setSelectionRange(selectionStart + wrapLen, selectionStart + wrapLen)
      }
    })
  }

  // 预览区复制按钮事件委托
  const previewRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Toolbar 格式化操作 ──
  const handleToolbarAction = useCallback((action: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const { selectionStart, selectionEnd, value } = textarea
    const before = value.slice(0, selectionStart)
    const selected = value.slice(selectionStart, selectionEnd)
    const after = value.slice(selectionEnd)

    let insert = ''
    let cursorOffset = 0

    switch (action) {
      case 'h1': insert = `# ${selected || '标题'}`; cursorOffset = 2; break
      case 'h2': insert = `## ${selected || '标题'}`; cursorOffset = 3; break
      case 'h3': insert = `### ${selected || '标题'}`; cursorOffset = 4; break
      case 'bold': insert = `**${selected || '粗体'}**`; cursorOffset = 2; break
      case 'italic': insert = `*${selected || '斜体'}*`; cursorOffset = 1; break
      case 'code': insert = `\`${selected || '代码'}\``; cursorOffset = 1; break
      case 'link': insert = `[${selected || '链接文字'}](url)`; cursorOffset = 1; break
      case 'ul': insert = `- ${selected || '列表项'}`; cursorOffset = 2; break
      case 'ol': insert = `1. ${selected || '列表项'}`; cursorOffset = 3; break
      case 'quote': insert = `> ${selected || '引用'}`; cursorOffset = 2; break
      case 'codeblock': insert = `\`\`\`\n${selected || ''}\n\`\`\``; cursorOffset = 4; break
      default: return
    }

    const newContent = before + insert + after
    setLocalContent(newContent)
    onChange(newContent)
    schedulePreviewUpdate(newContent)
    scheduleAutoSave(newContent)

    // 恢复焦点并定位光标
    requestAnimationFrame(() => {
      textarea.focus()
      const pos = selectionStart + (selected ? insert.length : cursorOffset)
      textarea.setSelectionRange(pos, pos)
    })
  }, [onChange, schedulePreviewUpdate, scheduleAutoSave])

  useEffect(() => {
    const container = previewRef.current
    if (!container) return

    const handleClick = (e: MouseEvent): void => {
      const target = e.target as HTMLElement
      const btn = target.closest('[data-action="copy-code"]') as HTMLButtonElement | null
      if (!btn) return

      const wrapper = btn.closest('.code-block-wrapper')
      if (!wrapper) return

      const code = wrapper.querySelector('code')
      if (!code) return

      const text = code.textContent ?? ''
      void navigator.clipboard.writeText(text).then(() => {
        btn.classList.add('copied')
        const originalTitle = btn.title
        btn.title = '已复制！'
        setTimeout(() => {
          btn.classList.remove('copied')
          btn.title = originalTitle
        }, 2000)
      })
    }

    container.addEventListener('click', handleClick)
    return () => {
      container.removeEventListener('click', handleClick)
    }
  }, [previewHtml])

  return (
    <div className="editor-split">
      {/* 左侧编辑区 */}
      <div className="editor-pane">
        <EditorToolbar onAction={handleToolbarAction} />
        <textarea
          ref={textareaRef}
          className="editor-pane-textarea"
          value={localContent}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder="开始输入 Markdown…"
          autoFocus
        />
      </div>

      {/* 分隔线 */}
      <div className="editor-split-divider" />

      {/* 右侧预览区 */}
      <div className="preview-pane" ref={previewRef}>
        <div
          className="markdown-body preview-content"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    </div>
  )
}

export default NoteEditor
