import { test } from '@playwright/test'

test('debug production', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('https://main.eglise-app.pages.dev/demo-tour', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(3000)

  const html = await page.evaluate(() => document.querySelector('#app')?.innerHTML?.substring(0, 200) || 'EMPTY')
  console.log('#app innerHTML:', html)
  console.log('Page errors:', JSON.stringify(errors))
  console.log('URL:', page.url())
})
