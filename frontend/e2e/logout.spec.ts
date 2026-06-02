import { test, expect } from '@playwright/test'

test.describe('Auth — Logout', () => {
  test('redirige vers /login après déconnexion (mode démo)', async ({ page }) => {
    await page.goto('/?demo=1')

    await page.getByRole('button', { name: /déconnexion|logout/i }).click()

    await expect(page).toHaveURL(/\/login/)
  })
})
