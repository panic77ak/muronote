import { useState, useCallback, useEffect, useRef } from 'react'
import matter from 'gray-matter'
import ReaderView from './components/Reader/ReaderView'
import TableOfContents from './components/Reader/TableOfContents'
import FileList from './components/Sidebar/FileList'
import SearchResults from './components/Sidebar/SearchResults'
import NoteEditor from './components/Editor/NoteEditor'
import SettingsPopover from './components/Settings/SettingsPopover'
import QuickOpen from './components/QuickOpen/QuickOpen'
import ShortcutsPanel from './components/ShortcutsPanel/ShortcutsPanel'
import { createMarkdownRenderer } from './renderer'
import type { NoteFile, SearchResult } from './electron.d'
import './themes/variables.css'
import './themes/typography.css'
import './themes/paper.css'
import './themes/sepia.css'
import './App.css'

// 初始化 markdown 渲染器（单例）
const md = createMarkdownRenderer()

// ── 欢迎页示例 HTML（folderPath 为空时展示，直接硬编码 HTML 字符串）──
const WELCOME_SAMPLE_HTML = `
<h1>让 Markdown 也可以很美</h1>
<p>DumbNote 是为设计师打造的本地 Markdown 阅读器。打开一个文件夹，所有 <code>.md</code> 文件将自动出现在左侧列表。</p>
<h2>排版即体验</h2>
<p>精心调校的行高、字间距与信息层级，让文档阅读体验接近出版物质感。支持 <strong>粗体</strong>、<em>斜体</em>与行内 <code>代码标注</code>。</p>
<blockquote><p>好的排版不是装饰，而是让内容更容易被理解。</p></blockquote>
<h2>三套主题，随心切换</h2>
<ul>
<li><strong>Ink</strong>——深墨色，适合夜间专注阅读</li>
<li><strong>Paper</strong>——米白色，模拟纸张质感</li>
<li><strong>Sepia</strong>——暖棕色，护眼长文阅读</li>
</ul>
<p>点击右上角浮层切换主题与字体，设置自动保存。</p>
`

// ── 无 folderPath 时渲染欢迎页用的占位 markdown（有选中文件才用 md.render 渲染正文）──
const WELCOME_MARKDOWN = ``

type ViewMode = 'reader' | 'editor'
type ThemeMode = 'ink' | 'paper' | 'sepia' | 'auto'
type FontBody = 'sans' | 'serif' | 'lora'
type FontHeading = 'inter' | 'serif'
type ReaderWidth = '560' | '720' | '900' | 'full'

const FONT_DATA_ATTR: Record<FontBody, string | null> = {
  sans: null,
  serif: 'serif',
  lora: 'lora',
}

/**
 * 生成新建笔记文件名 untitled-YYYYMMDD-HHmmss.md
 */
function generateUntitledName(): string {
  const now = new Date()
  const pad = (n: number, len = 2): string => String(n).padStart(len, '0')
  const date =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const time =
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `untitled-${date}-${time}.md`
}

/**
 * 使用 gray-matter 剥离 frontmatter，只返回正文
 */
function stripFrontmatter(raw: string): string {
  try {
    const { content } = matter(raw)
    return content
  } catch {
    return raw
  }
}

/**
 * 从 frontmatter 中提取 tags 和 status
 */
function parseFrontmatterMeta(raw: string): { tags?: string[]; status?: string } {
  try {
    const { data } = matter(raw)
    const tags = Array.isArray(data.tags)
      ? (data.tags as string[]).map(String)
      : typeof data.tags === 'string' && data.tags
        ? [data.tags]
        : undefined
    const status = typeof data.status === 'string' && data.status ? data.status : undefined
    return { tags, status }
  } catch {
    return {}
  }
}

function App(): React.ReactElement {
  const [mode, setMode] = useState<ViewMode>('reader')

  // ── 文件夹 & 文件状态 ──
  const [folderPath, setFolderPath] = useState<string>(() =>
    localStorage.getItem('dumbnote-folder') ?? ''
  )
  // currentFolderRef 同步跟踪 folderPath，供 handleNewNote 等回调中读取（避免 React state 异步竞态）
  const currentFolderRef = useRef<string>('')
  currentFolderRef.current = folderPath
  const [activeFile, setActiveFile] = useState<NoteFile | null>(null)
  const [fileContent, setFileContent] = useState<string>('')  // 原始内容（含 frontmatter）
  const [editorContent, setEditorContent] = useState<string>('') // 编辑器中的内容

  // ── 全文搜索状态 ──
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── 错误提示 Toast ──
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }, [])

  // ── 主题 & 字体 ──
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('dumbnote-theme')
    return (saved as ThemeMode) || 'ink'
  })

  const [fontBody, setFontBody] = useState<FontBody>(() => {
    const saved = localStorage.getItem('dumbnote-font-body')
    return (saved as FontBody) || 'sans'
  })

  const [headingFont, setHeadingFont] = useState<FontHeading>(() => {
    const saved = localStorage.getItem('headingFont')
    return (saved as FontHeading) || 'inter'
  })

  // ── 阅读宽度 ──
  const [readerWidth, setReaderWidth] = useState<ReaderWidth>(() =>
    (localStorage.getItem('readerWidth') as ReaderWidth) || '720'
  )

  const handleWidthChange = (w: ReaderWidth): void => {
    setReaderWidth(w)
    localStorage.setItem('readerWidth', w)
  }

  // ── 设置面板状态 ──
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tocVisible, setTocVisible] = useState(false)
  const [quickOpenVisible, setQuickOpenVisible] = useState(false)
  const [shortcutsVisible, setShortcutsVisible] = useState(false)

  // ── 侧边栏宽度（可拖拽调整） ──
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('dumbnote-sidebar-width')
    return saved ? parseInt(saved, 10) : 220
  })
  const sidebarResizing = useRef(false)

  const handleSidebarResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    sidebarResizing.current = true
    const startX = e.clientX
    const startWidth = sidebarWidth

    const onMove = (ev: MouseEvent): void => {
      const newWidth = Math.min(400, Math.max(160, startWidth + ev.clientX - startX))
      setSidebarWidth(newWidth)
    }
    const onUp = (): void => {
      sidebarResizing.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      localStorage.setItem('dumbnote-sidebar-width', String(sidebarWidth))
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [sidebarWidth])

  // ── 渲染 HTML ──
  // 阅读模式用剥离 frontmatter 后的正文渲染；无 folderPath 时欢迎页用硬编码 HTML，不经过 md.render
  const renderedHtml = activeFile ? md.render(stripFrontmatter(fileContent)) : md.render(WELCOME_MARKDOWN)

  // ── 字数统计 & 阅读时间 ──
  const wordCount = activeFile
    ? stripFrontmatter(fileContent).replace(/\s+/g, '').length
    : 0
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 400))

  // ── 提取 frontmatter meta（tags/status） ──
  const { tags: noteTags, status: noteStatus } = activeFile
    ? parseFrontmatterMeta(fileContent)
    : {}

  // ── 主题切换 ──
  useEffect(() => {
    const applyTheme = (t: string): void => {
      if (t === 'ink') {
        document.documentElement.removeAttribute('data-theme')
      } else {
        document.documentElement.setAttribute('data-theme', t)
      }
    }

    if (theme === 'auto') {
      // 跟随系统偏好
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const resolved = mq.matches ? 'ink' : 'paper'
      applyTheme(resolved)

      const listener = (e: MediaQueryListEvent): void => {
        applyTheme(e.matches ? 'ink' : 'paper')
      }
      mq.addEventListener('change', listener)
      localStorage.setItem('dumbnote-theme', 'auto')
      return () => mq.removeEventListener('change', listener)
    } else {
      applyTheme(theme)
      localStorage.setItem('dumbnote-theme', theme)
    }
  }, [theme])

  // ── 字体切换 ──
  useEffect(() => {
    const attrValue = FONT_DATA_ATTR[fontBody]
    if (attrValue) {
      document.documentElement.setAttribute('data-font-body', attrValue)
    } else {
      document.documentElement.removeAttribute('data-font-body')
    }
    localStorage.setItem('dumbnote-font-body', fontBody)
  }, [fontBody])

  // ── 标题字体切换 ──
  useEffect(() => {
    document.documentElement.setAttribute('data-font-heading', headingFont)
    localStorage.setItem('headingFont', headingFont)
  }, [headingFont])

  // ── 持久化文件夹路径 ──
  useEffect(() => {
    if (folderPath) {
      localStorage.setItem('dumbnote-folder', folderPath)
    }
  }, [folderPath])

  // ── 全文搜索（防抖 300ms）──
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await window.electronAPI.searchContent(query)
        setSearchResults(results)
      } catch (err) {
        console.error('全文搜索失败', err)
      }
    }, 300)
  }, [])

  // ── 搜索结果点击：打开对应文件 ──
  const handleSearchResultSelect = useCallback(async (filePath: string, fileName: string) => {
    const file: NoteFile = { name: fileName, path: filePath, mtime: Date.now() }
    setActiveFile(file)
    try {
      const raw = await window.electronAPI.readFile(filePath)
      setFileContent(raw)
      setEditorContent(raw)
    } catch (err) {
      console.error('读取文件失败', err)
      showToast('读取文件失败，请重试')
    }
  }, [showToast])

  // ── 读取文件内容 ──
  const loadFile = useCallback(async (file: NoteFile) => {
    try {
      const raw = await window.electronAPI.readFile(file.path)
      setFileContent(raw)
      setEditorContent(raw)
    } catch (err) {
      console.error('读取文件失败', err)
      showToast('读取文件失败，请重试')
    }
  }, [showToast])

  // ── 选中文件 ──
  const handleFileSelect = useCallback(async (file: NoteFile) => {
    setActiveFile(file)
    await loadFile(file)
  }, [loadFile])

  // ── chokidar 通知：当前打开文件被外部修改时刷新 ──
  const activeFileRef = useRef<NoteFile | null>(null)
  activeFileRef.current = activeFile

  useEffect(() => {
    if (!folderPath) return

    const unsubscribe = window.electronAPI.onDirChanged((event) => {
      const current = activeFileRef.current
      if (
        event.type === 'change' &&
        current &&
        current.path === event.filePath
      ) {
        // 外部修改了当前文件，重新读取
        void loadFile(current)
      }
    })

    return unsubscribe
  }, [folderPath, loadFile])

  // ── 最近打开的文件夹 ──
  const [recentFolders, setRecentFolders] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dumbnote-recent-folders') ?? '[]')
    } catch { return [] }
  })

  const addRecentFolder = useCallback((fp: string) => {
    setRecentFolders((prev) => {
      const updated = [fp, ...prev.filter((p) => p !== fp)].slice(0, 5)
      localStorage.setItem('dumbnote-recent-folders', JSON.stringify(updated))
      return updated
    })
  }, [])

  // ── 通用：设置文件夹路径 ──
  const applyFolder = useCallback((path: string) => {
    setFolderPath(path)
    setActiveFile(null)
    setFileContent('')
    setEditorContent('')
    addRecentFolder(path)
  }, [addRecentFolder])

  // ── 关闭文件夹 ──
  const handleCloseFolder = useCallback(() => {
    setFolderPath('')
    setActiveFile(null)
    setFileContent('')
    setEditorContent('')
    setSearchQuery('')
    setSearchResults([])
    localStorage.removeItem('dumbnote-folder')
  }, [])

  // ── 打开文件夹（对话框） ──
  const handleOpenFolder = async (): Promise<void> => {
    const path = await window.electronAPI.openFolder()
    if (path) {
      applyFolder(path)
    }
  }

  // ── 拖拽文件夹 ──
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    const items = e.dataTransfer.files
    if (items.length === 0) {
      showToast('未检测到文件')
      return
    }
    // Electron 42+: 使用 webUtils.getPathForFile 获取路径
    const droppedPath = window.electronAPI.getPathForFile(items[0])
    if (!droppedPath) {
      showToast('无法获取路径')
      return
    }
    // 通过主进程验证是目录
    const validPath = await window.electronAPI.setFolder(droppedPath)
    if (validPath) {
      applyFolder(validPath)
    } else {
      showToast('请拖入一个文件夹（非文件）')
    }
  }, [applyFolder, showToast])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current <= 0) {
      setIsDragging(false)
      dragCounter.current = 0
    }
  }, [])

  // ── 自动保存 ──
  const handleSave = useCallback(async (content: string) => {
    const file = activeFileRef.current
    if (!file) return
    try {
      await window.electronAPI.writeFile(file.path, content)
      setFileContent(content)
    } catch (err) {
      console.error('保存失败', err)
      showToast('保存失败，请重试')
    }
  }, [showToast])

  // ── 删除文件 ──
  const handleFileDelete = useCallback(async (file: NoteFile) => {
    const deleted = await window.electronAPI.deleteFile(file.path)
    if (deleted) {
      // 若删除的是当前打开文件，清空内容
      if (activeFile?.path === file.path) {
        setActiveFile(null)
        setFileContent('')
        setEditorContent('')
        setMode('reader')
      }
    }
  }, [activeFile])

  // ── 重命名文件 ──
  const handleFileRename = useCallback(async (file: NoteFile, newName: string) => {
    try {
      const newPath = await window.electronAPI.renameFile(file.path, newName)
      // 若重命名的是当前打开文件，更新 activeFile
      if (activeFile?.path === file.path) {
        setActiveFile({ ...file, name: newName, path: newPath })
      }
    } catch (err) {
      console.error('重命名失败', err)
      showToast('重命名失败，请重试')
    }
  }, [activeFile, showToast])

  // ── 复制文件 ──
  const handleFileDuplicate = useCallback(async (file: NoteFile) => {
    try {
      await window.electronAPI.duplicateFile(file.path)
    } catch (err) {
      console.error('复制失败', err)
      showToast('复制失败，请重试')
    }
  }, [showToast])

  // ── Ctrl+N 新建笔记 ──
  const handleNewNote = useCallback(async () => {
    // 读取 ref 获取当前最新路径（避免 React state 异步更新竞态）
    let targetFolder = currentFolderRef.current

    if (!targetFolder) {
      // 先打开文件夹
      const newPath = await window.electronAPI.openFolder()
      if (!newPath) return
      setFolderPath(newPath)
      // 直接使用返回值，不依赖尚未更新的 state
      targetFolder = newPath
    }

    const fileName = generateUntitledName()
    try {
      const newPath = await window.electronAPI.createFile(targetFolder, fileName)
      const newFile: NoteFile = {
        name: fileName,
        path: newPath,
        mtime: Date.now(),
      }
      setActiveFile(newFile)
      setFileContent('')
      setEditorContent('')
      setMode('editor') // 新建后切到编辑模式
    } catch (err) {
      console.error('新建文件失败', err)
      showToast('新建文件失败，请重试')
    }
  }, [showToast])

  // ── 快捷键 ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ctrl+N 新建
      if (e.ctrlKey && !e.shiftKey && e.key === 'n') {
        e.preventDefault()
        void handleNewNote()
      }
      // Ctrl+Shift+R 切换阅读/编辑
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        setMode((prev) => (prev === 'reader' ? 'editor' : 'reader'))
      }
      // Ctrl+P 快速打开
      if (e.ctrlKey && !e.shiftKey && e.key === 'p') {
        e.preventDefault()
        setQuickOpenVisible(true)
      }
      // Ctrl+/ 快捷键面板
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault()
        setShortcutsVisible((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNewNote])

  // ── folderPath 变化时更新侧边栏（FileList 自行处理） ──

  // ── 文件夹路径显示（截短）──
  const folderDisplayName = folderPath
    ? folderPath.split(/[\\/]/).pop() ?? folderPath
    : ''

  return (
    <>
    <div className="app-layout" onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}>
      {/* ── 左侧侧边栏（仅在有文件夹时显示） ── */}
      {folderPath && (
        <>
          <aside className="sidebar" style={{ width: sidebarWidth }}>
            <div className="sidebar-header">
              <span className="folder-path" title={folderPath}>
                📁 {folderDisplayName}
                <button
                  className="folder-close-btn"
                  onClick={handleCloseFolder}
                  title="关闭文件夹"
                >
                  ×
                </button>
              </span>
              <button className="new-note-btn" onClick={handleNewNote} title="Ctrl+N">
                + 新建笔记
              </button>
            </div>

            <div className="sidebar-content">
              {/* 统一搜索框 */}
              <div className="full-search-box">
                <input
                  type="text"
                  className="full-search-input"
                  placeholder="搜索笔记..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="full-search-clear"
                    onClick={() => handleSearchChange('')}
                    title="清空搜索"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* 根据搜索状态切换展示 */}
              {searchQuery ? (
                <SearchResults
                  results={searchResults}
                  query={searchQuery}
                  onFileSelect={handleSearchResultSelect}
                />
              ) : (
                <FileList
                  dirPath={folderPath}
                  activeFilePath={activeFile?.path ?? null}
                  onFileSelect={(f) => void handleFileSelect(f)}
                  onFileDelete={(f) => void handleFileDelete(f)}
                  onFileRename={(f, n) => void handleFileRename(f, n)}
                  onFileDuplicate={(f) => void handleFileDuplicate(f)}
                />
              )}
            </div>
          </aside>

          {/* 侧边栏拖拽调整手柄 */}
          <div className="sidebar-resize-handle" onMouseDown={handleSidebarResizeStart} />
        </>
      )}

      {/* ── 右侧主区域 ── */}
      <main className="main-area">
        {/* 顶部工具栏：常驻模式切换 + 设置按钮 */}
        <div className="toolbar">
          <div className="toolbar-left">
            {activeFile && (
              <span className="toolbar-filename" title={activeFile.path}>
                {activeFile.name.replace(/\.md$/, '')}
              </span>
            )}
          </div>

          <div className="toolbar-right">
            {/* 阅读/编辑 模式 pill */}
            <div className="mode-pill">
              <button
                className={`pill-btn ${mode === 'reader' ? 'active' : ''}`}
                onClick={() => setMode('reader')}
                title="阅读模式 (Ctrl+Shift+R)"
              >
                阅读
              </button>
              <button
                className={`pill-btn ${mode === 'editor' ? 'active' : ''}`}
                onClick={() => setMode('editor')}
                title="编辑模式 (Ctrl+Shift+R)"
              >
                编辑
              </button>
            </div>

            {/* 设置按钮 */}
            <button
              className={`settings-trigger ${settingsOpen ? 'active' : ''}`}
              onClick={() => setSettingsOpen(!settingsOpen)}
              title="排版设置"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M13.5 8a5.5 5.5 0 01-.15 1.25l1.45 1.13a.35.35 0 01.08.44l-1.37 2.37a.35.35 0 01-.42.15l-1.71-.69a5.3 5.3 0 01-1.08.63l-.26 1.82a.34.34 0 01-.34.3H7.3a.34.34 0 01-.34-.3l-.26-1.82a5.6 5.6 0 01-1.08-.63l-1.71.69a.35.35 0 01-.42-.15L2.12 10.82a.35.35 0 01.08-.44l1.45-1.13A5.7 5.7 0 013.5 8c0-.43.05-.85.15-1.25L2.2 5.62a.35.35 0 01-.08-.44l1.37-2.37a.35.35 0 01.42-.15l1.71.69c.33-.25.69-.46 1.08-.63l.26-1.82A.34.34 0 017.3 .6h2.4a.34.34 0 01.34.3l.26 1.82c.39.17.75.38 1.08.63l1.71-.69a.35.35 0 01.42.15l1.37 2.37a.35.35 0 01-.08.44l-1.45 1.13c.1.4.15.82.15 1.25z" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </button>

            {/* Windows 窗口控制按钮 */}
            {window.electronAPI?.platform === 'win32' && (
              <div className="window-controls">
                <button className="win-ctrl-btn" onClick={() => window.electronAPI.windowMinimize()} title="最小化">
                  <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6h8" stroke="currentColor" strokeWidth="1"/></svg>
                </button>
                <button className="win-ctrl-btn" onClick={() => window.electronAPI.windowMaximize()} title="最大化">
                  <svg width="12" height="12" viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none"/></svg>
                </button>
                <button className="win-ctrl-btn win-ctrl-btn--close" onClick={() => window.electronAPI.windowClose()} title="关闭">
                  <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1"/></svg>
                </button>
              </div>
            )}
          </div>

          {/* 设置面板 Popover */}
          <SettingsPopover
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            theme={theme}
            fontBody={fontBody}
            headingFont={headingFont}
            readerWidth={readerWidth}
            onThemeChange={setTheme}
            onFontBodyChange={setFontBody}
            onHeadingFontChange={setHeadingFont}
            onWidthChange={handleWidthChange}
          />
        </div>

        {/* ── 内容区 ── */}
        {!folderPath ? (
          /* 未打开文件夹：显示欢迎页 */
          <div className="welcome-page">
            <div className="welcome-content">
              <div className="welcome-hero">
                <h1 className="welcome-title">DumbNote</h1>
                <p className="welcome-subtitle">为设计师打造的本地 Markdown 阅读器</p>
              </div>

              <div className={`welcome-drop-zone ${isDragging ? 'dragging' : ''}`}>
                <div className="welcome-drop-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect x="8" y="12" width="32" height="28" rx="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M24 22v12M18 28l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="welcome-drop-text">拖入文件夹到此处</p>
                <span className="welcome-drop-or">或</span>
                <button className="welcome-cta-btn" onClick={handleOpenFolder}>
                  选择笔记目录
                </button>
              </div>

              <div className="welcome-features">
                <div className="welcome-feature">
                  <span className="welcome-feature-icon">🎨</span>
                  <span>3 套精调主题</span>
                </div>
                <div className="welcome-feature">
                  <span className="welcome-feature-icon">🔤</span>
                  <span>多种字体组合</span>
                </div>
                <div className="welcome-feature">
                  <span className="welcome-feature-icon">⌨️</span>
                  <span>Ctrl+/ 查看快捷键</span>
                </div>
              </div>

              {/* 最近打开 */}
              {recentFolders.length > 0 && (
                <div className="welcome-recent">
                  <span className="welcome-recent-label">最近打开</span>
                  <div className="welcome-recent-list">
                    {recentFolders.map((fp) => (
                      <button
                        key={fp}
                        className="welcome-recent-item"
                        onClick={() => applyFolder(fp)}
                        title={fp}
                      >
                        <span className="welcome-recent-icon">📁</span>
                        <span className="welcome-recent-name">{fp.split(/[\\/]/).pop()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : mode === 'reader' ? (
          <>
            {activeFile && (
              <TableOfContents
                html={renderedHtml}
                visible={tocVisible}
                onToggle={() => setTocVisible(!tocVisible)}
              />
            )}
            <ReaderView html={renderedHtml} tags={noteTags} status={noteStatus} width={readerWidth} />
          </>
        ) : (
          activeFile ? (
            <NoteEditor
              key={activeFile.path}
              filePath={activeFile.path}
              content={editorContent}
              onChange={setEditorContent}
              onSave={(c) => void handleSave(c)}
              onSaveError={() => showToast('自动保存失败')}
            />
          ) : (
            <div className="editor-placeholder">
              <p>请先从左侧打开或新建一个笔记</p>
            </div>
          )
        )}

        {/* 底部状态栏 */}
        {activeFile && (
          <div className="status-bar">
            <span className="status-bar-item">{wordCount} 字</span>
            <span className="status-bar-item">约 {readingMinutes} 分钟</span>
            <span className="status-bar-item status-bar-mode">{mode === 'reader' ? '阅读' : '编辑'}</span>
          </div>
        )}
      </main>
    </div>
    {toastMsg && (
      <div className="toast toast-error">{toastMsg}</div>
    )}
    {folderPath && (
      <QuickOpen
        open={quickOpenVisible}
        onClose={() => setQuickOpenVisible(false)}
        onSelect={(f) => void handleFileSelect(f)}
        dirPath={folderPath}
      />
    )}
    <ShortcutsPanel
      open={shortcutsVisible}
      onClose={() => setShortcutsVisible(false)}
    />
  </>
  )
}

export default App
