# CLAUDE.md — Muronote 项目上下文

> 这是给 AI 助手的项目速览文件，每次会话自动加载。

## 项目概述

Muronote 是一款为设计师打造的本地 Markdown 笔记应用（桌面端）。
用户打开一个文件夹，所有 `.md` 文件出现在侧边栏，以出版物级排版体验阅读和编辑。

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Electron 42 + electron-vite 5 |
| 前端 | React 19 + TypeScript 6 |
| 编辑器 | CodeMirror 6 |
| Markdown 渲染 | markdown-it + highlight.js |
| 状态管理 | Zustand |
| 文件监听 | chokidar 5 |
| 配置持久化 | electron-store |
| 自动更新 | electron-updater (GitHub Releases) |
| 测试 | Playwright (视觉回归) |
| 打包 | electron-builder (NSIS / DMG / AppImage) |

## 目录结构

```
muronote/
├── src/
│   ├── main/              # Electron 主进程
│   │   └── index.ts       # 窗口创建、IPC 处理、文件操作
│   ├── preload/           # 预加载脚本（contextBridge）
│   │   └── index.ts       # 暴露 electronAPI 给渲染进程
│   └── renderer/          # 渲染进程（React 应用）
│       ├── src/
│       │   ├── App.tsx              # 根组件（路由/状态/布局）
│       │   ├── renderer.ts          # markdown-it 渲染器配置
│       │   ├── components/
│       │   │   ├── Reader/          # 阅读视图 + 目录导航
│       │   │   ├── Editor/          # CodeMirror 编辑器 + 工具栏
│       │   │   ├── Sidebar/         # 文件列表 + 搜索结果
│       │   │   ├── Settings/        # 设置面板（主题/字体/宽度）
│       │   │   ├── QuickOpen/       # Ctrl+P 快速打开
│       │   │   └── ShortcutsPanel/  # Ctrl+/ 快捷键面板
│       │   └── themes/              # CSS 主题变量
│       │       ├── variables.css    # Ink(默认深色) 变量
│       │       ├── paper.css        # Paper(浅色) 变量
│       │       ├── sepia.css        # Sepia(暖色) 变量
│       │       └── typography.css   # 排版基础样式
│       └── index.html
├── resources/             # 应用图标（ico/png/svg）
├── docs/screenshots/      # README 用界面截图
├── e2e/tests/             # Playwright 测试
├── electron-builder.yml   # 打包配置（在 package.json 中）
└── CLAUDE.md              # ← 你正在读的这个文件
```

## 架构要点

1. **安全模型**：渲染进程不启用 nodeIntegration，所有文件操作通过 preload contextBridge 暴露的 `window.electronAPI` 调用主进程
2. **主题切换**：CSS 变量 + `document.documentElement.setAttribute('data-theme', ...)` ，Auto 模式监听 `prefers-color-scheme`
3. **文件监听**：主进程用 chokidar watch 文件夹，变化时通过 IPC 通知渲染进程刷新
4. **自动保存**：编辑器 onChange debounce 后调用 `writeFile` IPC

## 常用命令

```bash
npm run dev          # 开发模式（热更新）
npm run build        # 构建（不打包）
npm run make         # 构建 + 打包为安装程序
npm run lint         # ESLint 检查
npm run format       # Prettier 格式化
npm run test:visual  # Playwright 视觉回归测试

# 重新生成 README 截图
npm run build && npx playwright test e2e/tests/screenshots.spec.ts
```

## 代码风格

- TypeScript strict 模式
- 组件：函数式 + Hooks，每个组件一个文件夹（.tsx + .css）
- CSS：BEM-like 命名，无 CSS-in-JS
- 注释语言：中文
- Commit 风格：`type(scope): 描述`（feat/fix/refactor/docs/chore）

## 当前状态

- 版本：1.0.0
- 已发布到 GitHub: https://github.com/panic77ak/muronote
- 支持平台：Windows / macOS / Linux
- 双语 README：README.md (EN) + README.zh-CN.md (ZH)

## 待办/可扩展方向

- 插件系统（自定义渲染器/主题）
- 多标签页
- 导出 PDF / HTML
- 双向链接 `[[wiki-link]]`
- 图片粘贴自动存储
- 同步方案（Git / WebDAV）
- 移动端伴侣应用
