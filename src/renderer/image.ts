import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'

export function registerImage(md: MarkdownIt): void {
  // 图片居中 + alt text 作图注（figcaption）
  md.renderer.rules.image = (tokens: Token[], idx: number): string => {
    const token = tokens[idx]
    const src = token.attrGet('src') ?? ''
    const alt = token.content ?? ''
    const title = token.attrGet('title') ?? ''

    const altHtml = md.utils.escapeHtml(alt)
    const srcHtml = md.utils.escapeHtml(src)
    const titleAttr = title ? ` title="${md.utils.escapeHtml(title)}"` : ''

    const figcaption = altHtml
      ? `\n  <figcaption class="image-caption">${altHtml}</figcaption>`
      : ''

    return `<figure class="image-wrapper">
  <img src="${srcHtml}" alt="${altHtml}"${titleAttr} loading="lazy" />${figcaption}
</figure>\n`
  }
}
