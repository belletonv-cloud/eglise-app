import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('should load the app and return 200', async ({ page }) => {
    const res = await page.goto('/?demo=1')
    expect(res?.status()).toBe(200)
  })

  test('should render content in body', async ({ page }) => {
    await page.goto('/?demo=1')
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeAttached()
  })
})
