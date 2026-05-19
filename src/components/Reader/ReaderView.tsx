import { useEffect, useRef } from 'react'
import './ReaderView.css'

type ReaderWidth = '560' | '720' | '900' | 'full'

interface ReaderViewProps {
  html: string
  tags?: string[]
  status?: string
  width?: ReaderWidth
}

/**
 * ReaderView — 阅读模式视图
 * - 内容最大宽度 720px，水平居中，两侧留白
 * - 无工具栏干扰
 * - 复制按钮通过事件委托绑定在根节点，不在每个代码块单独绑定
 */
function ReaderView({ html, tags, status, width = '720' }: ReaderViewProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const maxWidth = width === 'full' ? '100%' : `${width}px`

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 事件委托：在根节点统一处理所有复制按钮点击
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
  }, [html]) // html 变化时重新绑定（容器内容已更新）

  return (
    <div className="reader-view" ref={containerRef}>
      <div className="markdown-body reader-content" style={{ maxWidth, margin: '0 auto' }}>
        {(tags?.length || status) && (
          <div className="note-meta">
            {status && <span className="meta-status">{status}</span>}
            {tags?.map(tag => <span className="meta-tag" key={tag}>#{tag}</span>)}
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}

export default ReaderView
