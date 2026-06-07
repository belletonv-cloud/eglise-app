import { test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OUT = path.resolve(__dirname, '../../tmp/theme-deployed')
fs.mkdirSync(OUT, { recursive: true })

const BASE = 'https://eglise-app.pages.dev'

const PAGES = [
  '/dashboard?demo=1',
  '/members?demo=1',
  '/songs?demo=1',
  '/teams?demo=1',
  '/schedule?demo=1',
  '/events?demo=1',
  '/checkin?demo=1',
  '/plans?demo=1',
  '/calendar?demo=1',
  '/music-stand?demo=1',
  '/admin?demo=1',
]

test.describe('Deployed contrast audit', () => {
  for (const pageUrl of PAGES) {
    const name = pageUrl.split('?')[0].replace(/\//g, '_') || 'home'

    for (const mode of ['light', 'dark'] as const) {
      test(`${mode}: ${name}`, async ({ page }) => {
        if (mode === 'dark') {
          await page.addInitScript(() => {
            localStorage.setItem('dark-mode', 'true')
          })
        }

        const response = await page.goto(`${BASE}${pageUrl}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        })
        await page.waitForTimeout(3000)

        // Check if we landed on login instead
        const url = page.url()
        if (url.includes('/login')) {
          console.log(`  ↪ redirected to login for ${name}`)
          // Take screenshot where we landed
          if (mode === 'dark') {
            await page.evaluate(() => {
              document.documentElement.classList.add('dark')
              document.getElementById('app')?.classList.add('dark')
            })
            await page.waitForTimeout(500)
          }
          await page.screenshot({
            path: path.join(OUT, `${mode}_${name}.png`),
            fullPage: true,
          })
          return
        }

        if (mode === 'dark') {
          await page.evaluate(() => {
            document.documentElement.classList.add('dark')
            document.getElementById('app')?.classList.add('dark')
          })
          await page.waitForTimeout(500)
        }

        // Screenshot
        await page.screenshot({
          path: path.join(OUT, `${mode}_${name}.png`),
          fullPage: true,
        })

        // Contrast audit
        const results = await new AxeBuilder({ page })
          .withTags(['color-contrast'])
          .analyze()

        const violations = results.violations.filter(
          v => v.id === 'color-contrast'
        )

        if (violations.length > 0) {
          const report = violations.flatMap(v =>
            v.nodes.map(n => {
              const target = n.target.join(', ')
              const snippet = (n.html || '').slice(0, 120)
              return `  [${n.impact}] ${target} — ${snippet}`
            })
          ).join('\n')

          fs.writeFileSync(
            path.join(OUT, `${mode}_${name}_axe.txt`),
            `Found ${violations.length} violations on ${mode}/${name}:\n${report}\n`
          )

          console.log(`\n⚠️  ${mode}/${name}: ${violations.length} violations`)
          for (const l of report.split('\n')) console.log(l)
        } else {
          console.log(`✅ ${mode}/${name}: clean`)
        }
      })
    }
  }
})
