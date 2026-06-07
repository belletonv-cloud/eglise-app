import { test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OUT = path.resolve(__dirname, '../../tmp/theme-scan')
fs.mkdirSync(OUT, { recursive: true })

const PAGES = [
  '/dashboard?demo=1',
  '/members?demo=1',
  '/songs?demo=1',
  '/historique?demo=1',
  '/annuaire?demo=1',
  '/sondages?demo=1',
  '/annonces?demo=1',
  '/checkin?demo=1',
  '/?demo=1',
]

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

test.describe('Theme contrast scan', () => {
  for (const pageUrl of PAGES) {
    const name = pageUrl.split('?')[0].replace(/\//g, '_') || 'home'

    test(`light: ${name}`, async ({ page }) => {
      await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 30000 })
      await sleep(2000)
      await page.screenshot({ path: path.join(OUT, `light_${name}.png`), fullPage: true })
    })

    test(`dark: ${name}`, async ({ page }) => {
      // Set localStorage before navigating
      await page.addInitScript(() => {
        localStorage.setItem('dark-mode', 'true')
      })
      await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 30000 })
      await sleep(2000)
      // Force dark class if not auto-applied
      await page.evaluate(() => {
        document.documentElement.classList.add('dark')
        const app = document.getElementById('app')
        if (app) app.classList.add('dark')
      })
      await sleep(500)
      await page.screenshot({ path: path.join(OUT, `dark_${name}.png`), fullPage: true })
    })
  }
})
