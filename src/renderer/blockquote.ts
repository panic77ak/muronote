import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'

export function registerBlockquote(md: MarkdownIt): void {
  // 左侧竖线 + 背景微淡，通过 CSS class 实现，此处只确保 class 被挂上
  md.renderer.rules.blockquote_open = (tokens: Token[], idx: number): string => {
    const token = tokens[idx]
    const attrs = token.attrs ? token.attrs.map(([k, v]) => ` ${k}="${v}"`).join('') : ''
    return `<blockquote class="md-blockquote"${attrs}>\n`
  }

  md.renderer.rules.blockquote_close = (): string => {
    return `</blockquote>\n`
  }
}
