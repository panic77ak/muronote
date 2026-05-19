/**
 * Capture screenshots for README documentation.
 * Run: npm run build && npx playwright test e2e/tests/screenshots.spec.ts
 */
import { test, _electron } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const ROOT = path.resolve(__dirname, '../..')
const MAIN_ENTRY = path.join(ROOT, 'out/main/index.js')
const SCREENSHOT_DIR = path.join(ROOT, 'docs/screenshots')

// Ensure output directory exists
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

test.describe('README Screenshots', () => {
  test('capture all screenshots', async () => {
    const app = await _electron.launch({
      args: [MAIN_ENTRY],
      cwd: ROOT,
      env: { ...process.env, NODE_ENV: 'test' },
    })

    const page = await app.firstWindow()
    await page.waitForSelector('.app-layout', { timeout: 15_000 })

    // Clear any leftover localStorage so welcome page shows
    await page.evaluate(() => {
      localStorage.clear()
    })
    await page.reload()
    await page.waitForSelector('.app-layout', { timeout: 15_000 })

    // Disable animations for crisp screenshots
    await page.addStyleTag({
      content: `*, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }`,
    })

    // Wait for fonts
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(500)

    // Set a consistent viewport
    await page.setViewportSize({ width: 1280, height: 800 })

    // ── 1. Welcome Page (Ink theme - default) ──
    await page.waitForSelector('.welcome-page', { timeout: 10_000 })
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'welcome.png'),
      fullPage: false,
    })

    // ── 2. Open a test folder with sample markdown ──
    // Create a temp folder with sample notes
    const testDir = path.join(ROOT, 'e2e/test-notes')
    fs.mkdirSync(testDir, { recursive: true })
    fs.writeFileSync(
      path.join(testDir, 'Getting Started.md'),
      `---
tags: [guide, tutorial]
status: draft
---

# Getting Started with Muronote

Muronote is a beautiful Markdown reader designed for designers and writers who care about typography.

## Why Muronote?

> Good typography is invisible. Bad typography is everywhere.
> — *Oliver Reichenstein*

When you open a folder of Markdown files, Muronote transforms them into beautifully typeset documents with carefully tuned:

- **Line height** — Optimal 1.75 ratio for comfortable reading
- **Letter spacing** — Subtle adjustments for different font sizes
- **Hierarchy** — Clear visual distinction between headings, body, and captions

## Features at a Glance

| Feature | Description |
|---------|-------------|
| Three Themes | Ink, Paper, and Sepia for any lighting |
| Quick Open | \`Ctrl+P\` to fuzzy-search notes |
| Full-text Search | Search across all notes instantly |
| Auto Save | Never lose your work |

## Code Example

\`\`\`javascript
const greeting = "Hello, Muronote!";
console.log(greeting);
\`\`\`

## Getting Help

Press \`Ctrl+/\` to see all keyboard shortcuts. Happy writing!
`
    )
    fs.writeFileSync(
      path.join(testDir, 'Design Notes.md'),
      `# Design Notes

Some design-related notes here.
`
    )
    fs.writeFileSync(
      path.join(testDir, 'Project Ideas.md'),
      `# Project Ideas

- Build a markdown reader
- Create a design system
`
    )

    // Set folder via localStorage and reload
    await page.evaluate((dir) => {
      localStorage.setItem('muronote-folder', dir)
    }, testDir)
    await page.reload()
    await page.waitForSelector('.sidebar', { timeout: 15_000 })
    // Wait for file list to populate
    await page.waitForSelector('.file-item', { timeout: 15_000 })
    await page.waitForTimeout(500)

    // Click on 'Getting Started' file
    const fileItem = page.locator('.file-item-name', { hasText: 'Getting Started' })
    await fileItem.click()
    await page.waitForTimeout(800)

    // ── 3. Reader - Ink Theme ──
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme')
    })
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'reader-ink.png'),
      fullPage: false,
    })

    // ── 4. Reader - Paper Theme ──
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'paper')
    })
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'reader-paper.png'),
      fullPage: false,
    })

    // ── 5. Reader - Sepia Theme ──
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'sepia')
    })
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'reader-sepia.png'),
      fullPage: false,
    })

    // ── 6. Editor Mode ──
    // Switch back to Ink theme for editor
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme')
    })
    // Click editor pill button
    const editorBtn = page.locator('.pill-btn', { hasText: '编辑' })
    await editorBtn.click()
    await page.waitForTimeout(800)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'editor.png'),
      fullPage: false,
    })

    // ── 7. Settings Panel ──
    // Switch back to reader mode first
    const readerBtn = page.locator('.pill-btn', { hasText: '阅读' })
    await readerBtn.click()
    await page.waitForTimeout(300)
    // Open settings
    const settingsBtn = page.locator('.settings-trigger')
    await settingsBtn.click()
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'settings.png'),
      fullPage: false,
    })

    await app.close()

    // Clean up test notes
    fs.rmSync(testDir, { recursive: true, force: true })
  })
})
