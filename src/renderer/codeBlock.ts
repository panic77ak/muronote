import type MarkdownIt from 'markdown-it'
import type { RenderRule } from 'markdown-it/lib/renderer.mjs'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'

// 注册常用语言子集，避免引入全量包
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('css', css)
hljs.registerLanguage('json', json)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('sh', bash)

export function registerCodeBlock(md: MarkdownIt): void {
  // 使用 md.renderer.rules.fence 在实例创建后赋值，避免 options.highlight 中循环引用问题
  const fenceRule: RenderRule = (tokens, idx): string => {
    const token = tokens[idx]
    const lang = token.info.trim().split(/\s+/)[0]
    const rawCode = token.content.trim()

    let highlightedCode: string
    if (lang && hljs.getLanguage(lang)) {
      try {
        highlightedCode = hljs.highlight(rawCode, { language: lang, ignoreIllegals: true }).value
      } catch {
        highlightedCode = md.utils.escapeHtml(rawCode)
      }
    } else {
      highlightedCode = md.utils.escapeHtml(rawCode)
    }

    const langLabel = lang ? `<span class="code-lang-label">${md.utils.escapeHtml(lang)}</span>` : ''
    // 复制按钮用 data-action="copy-code" 标记，通过事件委托在根节点统一绑定
    const copyBtn = `<button class="copy-code-btn" data-action="copy-code" title="复制代码">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    </button>`

    return `<div class="code-block-wrapper">
  <div class="code-block-header">${langLabel}${copyBtn}</div>
  <pre class="code-block hljs"><code class="language-${md.utils.escapeHtml(lang || 'text')}">${highlightedCode}</code></pre>
</div>\n`
  }

  md.renderer.rules.fence = fenceRule
}
