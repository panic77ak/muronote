import { test, _electron, expect } from '@playwright/test'
import path from 'path'

const ROOT = path.resolve(__dirname, '../..')
const MAIN_ENTRY = path.join(ROOT, 'out/main/index.js')

test.describe('Muronote Visual Regression', () => {
  test('app launches and shows welcome page', async () => {
    const app = await _electron.launch({
      args: [MAIN_ENTRY],
      cwd: ROOT,
      env: { ...process.env, NODE_ENV: 'test' },
    })

    const page = await app.firstWindow()
    await page.waitForSelector('.app-layout', { timeout: 15_000 })

    // Disable animations for stable screenshots
    await page.addStyleTag({
      content: `*, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }`,
    })

    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(500)

    // Screenshot welcome page (default Ink theme)
    await expect(page).toHaveScreenshot('welcome-ink.png')

    // Switch to Paper theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'paper')
    })
    await page.waitForTimeout(300)
    await expect(page).toHaveScreenshot('welcome-paper.png')

    // Switch to Sepia theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'sepia')
    })
    await page.waitForTimeout(300)
    await expect(page).toHaveScreenshot('welcome-sepia.png')

    await app.close()
  })
})
