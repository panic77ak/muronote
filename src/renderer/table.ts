import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'

export function registerTable(md: MarkdownIt): void {
  // 用响应式 div 包裹 table，防止宽表格在窄屏溢出
  md.renderer.rules.table_open = (tokens: Token[], idx: number): string => {
    const token = tokens[idx]
    // 保留 token 自带属性（如 class）
    const attrs = token.attrs ? token.attrs.map(([k, v]) => ` ${k}="${v}"`).join('') : ''
    return `<div class="table-wrapper"><table${attrs}>`
  }

  md.renderer.rules.table_close = (): string => {
    return `</table></div>\n`
  }
}
