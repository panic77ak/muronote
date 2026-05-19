import MarkdownIt from 'markdown-it'
import { registerCodeBlock } from './codeBlock'
import { registerTable } from './table'
import { registerImage } from './image'
import { registerBlockquote } from './blockquote'

/**
 * 初始化 markdown-it 实例并注册所有自定义渲染器
 * 注意：渲染规则必须在实例创建后注册，不能在 options 中引用 md 自身（会导致 TS 循环引用错误）
 */
export function createMarkdownRenderer(): MarkdownIt {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  })

  // 逐一注册自定义渲染器
  registerCodeBlock(md)
  registerTable(md)
  registerImage(md)
  registerBlockquote(md)

  return md
}
