import { test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OUT = path.resolve(__dirname, '../../tmp/theme-audit')
fs.mkdirSync(OUT, { recursive: true })

interface PageDef { url: string; label: string; login?: boolean }

const PAGES: PageDef[] = [
  { url: '/login?demo=1', label: 'login' },
  { url: '/dashboard?demo=1', label: 'dashboard' },
  { url: '/members?demo=1', label: 'members' },
  { url: '/songs?demo=1', label: 'songs' },
  { url: '/?demo=1', label: 'home' },
  { url: '/historique?demo=1', label: 'historique' },
  { url: '/annuaire?demo=1', label: 'annuaire' },
  { url: '/sondages?demo=1', label: 'sondages' },
  { url: '/annonces?demo=1', label: 'annonces' },
  { url: '/checkin?demo=1', label: 'checkin' },
]

test.describe('Contrast audit', () => {
  for (const { url, label } of PAGES) {
    for (const mode of ['light', 'dark'] as const) {
      test(`${mode}: ${label}`, async ({ page }) => {
        if (mode === 'dark') {
          await page.addInitScript(() => {
            localStorage.setItem('dark-mode', 'true')
          })
        }

        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(2500)

        if (mode === 'dark') {
          await page.evaluate(() => {
            document.documentElement.classList.add('dark')
            const app = document.getElementById('app')
            if (app) app.classList.add('dark')
          })
          await page.waitForTimeout(500)
        }

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
              const impact = n.impact || 'unknown'
              return `  [${impact}] ${target} — ${snippet}`
            })
          ).join('\n')

          fs.writeFileSync(
            path.join(OUT, `${mode}_${label}_axe.txt`),
            `Found ${violations.length} color-contrast on ${mode}/${label}:\n${report}\n`
          )

          console.log(`\n⚠️  ${mode}/${label}: ${violations.length}`)
          for (const l of report.split('\n')) console.log(l)
        } else {
          console.log(`✅ ${mode}/${label}: clean`)
        }
      })
    }
  }
})
