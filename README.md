# Muronote

<p align="center">
  <img src="resources/icon-512.png" alt="Muronote Logo" width="128" height="128">
</p>

<p align="center">
  <strong>A beautiful local Markdown note-taking app built for designers.</strong>
</p>

<p align="center">
  <a href="./README.zh-CN.md">中文文档</a> •
  <a href="https://github.com/panic77ak/muronote/releases">Download</a> •
  <a href="#features">Features</a> •
  <a href="#screenshots">Screenshots</a>
</p>

---

Open a folder, and all `.md` files appear in the sidebar — ready to read, edit, and organize with a publishing-quality typographic experience.

## Screenshots

### Welcome Page
> Drag a folder or select a notes directory to get started.

![Welcome Page](docs/screenshots/welcome.png)

### Reading Mode — Ink Theme (Dark)
> Elegant typography with carefully tuned line-height and hierarchy.

![Reading Mode - Ink](docs/screenshots/reader-ink.png)

### Reading Mode — Paper Theme (Light)
> Clean white background with a print-like feel.

![Reading Mode - Paper](docs/screenshots/reader-paper.png)

### Reading Mode — Sepia Theme (Warm)
> Warm tones for comfortable long-form reading.

![Reading Mode - Sepia](docs/screenshots/reader-sepia.png)

### Editor Mode
> Built-in CodeMirror editor with syntax highlighting.

![Editor Mode](docs/screenshots/editor.png)

### Settings Panel
> Theme, font, and layout customization at your fingertips.

![Settings Panel](docs/screenshots/settings.png)

## Features

- **Elegant Typography** — Carefully tuned line-height, letter-spacing, and hierarchy for a print-like reading experience
- **Three Themes** — Ink (dark), Paper (light), Sepia (warm) + Auto mode that follows system preference
- **Markdown Editor** — Built-in CodeMirror editor with live preview
- **Sidebar & File Tree** — Browse and search all notes in your folder
- **Table of Contents** — Auto-generated outline for quick navigation
- **Quick Open** — Fuzzy search to jump to any note instantly (`Ctrl+P`)
- **Full-text Search** — Search across all notes in your folder
- **Keyboard Shortcuts** — Full shortcut support for power users (`Ctrl+/` to view all)
- **Drag & Drop** — Drag folders directly into the app to open them
- **Local First** — All data stays on your machine, no cloud sync required
- **Auto Update** — Built-in update mechanism via GitHub Releases
- **Cross Platform** — Windows, macOS, and Linux

## Install

### Download

Go to the [Releases](https://github.com/panic77ak/muronote/releases) page and download the latest version for your platform:

| Platform | File |
|----------|------|
| Windows  | `Muronote Setup x.x.x.exe` |
| macOS    | `Muronote-x.x.x.dmg` |
| Linux    | `Muronote-x.x.x.AppImage` |

### Build from Source

```bash
# Clone the repository
git clone https://github.com/panic77ak/muronote.git
cd muronote

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build installable package for your platform
npm run make
```

## Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development mode with hot reload |
| `npm run build` | Build the app (without packaging) |
| `npm run make` | Build and package for your platform |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test:visual` | Run Playwright visual tests |

## Tech Stack

- **Framework**: Electron + electron-vite
- **Frontend**: React 19 + TypeScript
- **Editor**: CodeMirror 6
- **Markdown**: markdown-it + highlight.js
- **State**: Zustand
- **Testing**: Playwright
- **Build**: electron-builder

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New note |
| `Ctrl+P` | Quick open |
| `Ctrl+Shift+R` | Toggle read/edit mode |
| `Ctrl+/` | Show keyboard shortcuts |

## License

MIT
