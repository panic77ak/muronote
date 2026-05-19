# Muronote

A beautiful local Markdown note-taking app built for designers.

Open a folder, and all `.md` files appear in the sidebar — ready to read, edit, and organize with a publishing-quality typographic experience.

## Features

- **Elegant Typography** — Carefully tuned line-height, letter-spacing, and hierarchy for a print-like reading experience
- **Three Themes** — Ink (dark), Paper (light), Sepia (warm) + Auto mode that follows system preference
- **Markdown Editor** — Built-in CodeMirror editor with live preview
- **Sidebar & File Tree** — Browse and search all notes in your folder
- **Table of Contents** — Auto-generated outline for quick navigation
- **Quick Open** — Fuzzy search to jump to any note instantly
- **Keyboard Shortcuts** — Full shortcut support for power users
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

## License

MIT
