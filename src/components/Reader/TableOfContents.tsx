import { useMemo } from 'react'
import './TableOfContents.css'

interface TocItem {
  level: number
  text: string
  id: string
}

interface TableOfContentsProps {
  html: string
  visible: boolean
  onToggle: () => void
}

/**
 * 从渲染后的 HTML 中提取标题结构
 */
function extractHeadings(html: string): TocItem[] {
  const regex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[1-6]>/gi
  const headings: TocItem[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1], 10),
      id: match[2],
      text: match[3].replace(/<[^>]*>/g, ''), // 去掉内部 HTML 标签
    })
  }

  // 如果 HTML 没有 id 属性，尝试用纯文本标题解析
  if (headings.length === 0) {
    const fallbackRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi
    while ((match = fallbackRegex.exec(html)) !== null) {
      const text = match[2].replace(/<[^>]*>/g, '')
      headings.push({
        level: parseInt(match[1], 10),
        id: text.toLowerCase().replace(/[^\w一-鿿]+/g, '-').replace(/^-|-$/g, ''),
        text,
      })
    }
  }

  return headings
}

function TableOfContents({ html, visible, onToggle }: TableOfContentsProps): React.ReactElement {
  const headings = useMemo(() => extractHeadings(html), [html])

  if (headings.length === 0) return <></>

  const handleClick = (id: string): void => {
    // 尝试滚动到对应标题
    const el = document.getElementById(id)
      || document.querySelector(`[id="${id}"]`)
      || findHeadingByText(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      <button className="toc-toggle" onClick={onToggle} title="目录大纲">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 3h10M3 6h7M3 9h10M3 12h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>

      {visible && (
        <div className="toc-panel">
          <div className="toc-header">
            <span className="toc-title">目录</span>
          </div>
          <nav className="toc-list">
            {headings.map((h, i) => (
              <a
                key={`${h.id}-${i}`}
                className={`toc-item toc-item--level-${h.level}`}
                onClick={() => handleClick(h.id)}
                title={h.text}
              >
                {h.text}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}

/**
 * 回退方案：按文本内容匹配 h 标签
 */
function findHeadingByText(text: string): HTMLElement | null {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
  for (const h of headings) {
    if (h.textContent?.toLowerCase().replace(/[^\w一-鿿]+/g, '-').replace(/^-|-$/g, '') === text) {
      return h as HTMLElement
    }
  }
  return null
}

export default TableOfContents
