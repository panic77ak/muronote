import { useState } from 'react'
import MarkdownIt from 'markdown-it'
import './App.css'

// 先创建实例，再在 options 中引用，避免循环引用
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

// 自定义 code block 渲染，不在 MarkdownIt options 中使用 md 自身
md.renderer.rules.fence = (tokens, idx): string => {
  const token = tokens[idx]
  const code = token.content.trim()
  return `<pre class="code-block"><code>${md.utils.escapeHtml(code)}</code></pre>\n`
}

const SAMPLE_MARKDOWN = `# DumbNote 阅读体验测试

这是一段**正文段落**，包含 *斜体* 和 \`行内代码\`。

## 代码块测试

\`\`\`typescript
const greeting = (name: string) => \`Hello, \${name}\`
console.log(greeting('Designer'))
\`\`\`

## 列表测试

- 设计师是核心用户
- 阅读体验优先于编辑
- 信息层级清晰可见

## 引用块测试

> AI 时代，设计师每天需要阅读大量 Markdown 文档。
`

function App(): React.ReactElement {
  const [folderPath, setFolderPath] = useState<string>('')

  const handleOpenFolder = async (): Promise<void> => {
    const path = await window.electronAPI.openFolder()
    if (path) {
      setFolderPath(path)
    }
  }

  const renderedHtml = md.render(SAMPLE_MARKDOWN)

  return (
    <div className="app">
      <header className="toolbar">
        <button className="open-btn" onClick={handleOpenFolder}>
          打开文件夹
        </button>
        {folderPath && <span className="folder-path">{folderPath}</span>}
      </header>
      <main className="content">
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </main>
    </div>
  )
}

export default App
