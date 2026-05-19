import './EditorToolbar.css'

interface EditorToolbarProps {
  onAction: (action: string, payload?: string) => void
}

const TOOLS = [
  { action: 'h1', label: 'H1', title: '标题 1' },
  { action: 'h2', label: 'H2', title: '标题 2' },
  { action: 'h3', label: 'H3', title: '标题 3' },
  { action: 'divider1', label: '', title: '' },
  { action: 'bold', label: 'B', title: '粗体 (Ctrl+B)', className: 'tool-bold' },
  { action: 'italic', label: 'I', title: '斜体 (Ctrl+I)', className: 'tool-italic' },
  { action: 'code', label: '<>', title: '行内代码' },
  { action: 'divider2', label: '', title: '' },
  { action: 'link', label: '🔗', title: '链接' },
  { action: 'ul', label: '•', title: '无序列表' },
  { action: 'ol', label: '1.', title: '有序列表' },
  { action: 'quote', label: '❝', title: '引用块' },
  { action: 'codeblock', label: '```', title: '代码块' },
]

function EditorToolbar({ onAction }: EditorToolbarProps): React.ReactElement {
  return (
    <div className="editor-toolbar">
      {TOOLS.map((tool) => {
        if (tool.action.startsWith('divider')) {
          return <span key={tool.action} className="editor-toolbar-divider" />
        }
        return (
          <button
            key={tool.action}
            className={`editor-toolbar-btn ${tool.className ?? ''}`}
            onClick={() => onAction(tool.action)}
            title={tool.title}
          >
            {tool.label}
          </button>
        )
      })}
    </div>
  )
}

export default EditorToolbar
