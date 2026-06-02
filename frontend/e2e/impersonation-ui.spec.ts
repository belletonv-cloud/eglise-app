import { test, expect } from '@playwright/test'

test.describe('Impersonation — Indication + menu', () => {
  test('affiche l’email/persona impersonné et masque le menu admin', async ({ page }) => {
    await page.goto('/?demo=1')

    const adminLink = page.locator('a[href*="/admin"]').first()

    // Baseline: admin link visible in demo admin
    await expect(adminLink).toBeVisible()

    // Open persona selector (icon-only button)
    await page.locator('.demo-persona-selector > button').click()
    await page.getByRole('button', { name: /Membre/ }).click()

    // Impersonation badge + details
    await expect(page.getByText('Impersonné')).toBeVisible()
    await expect(page.getByText(/Orig:/)).toBeVisible()

    // Menu should evolve: admin section hidden for member
    await expect(adminLink).toBeHidden()

    // Stop and ensure we are back to admin
    await page.getByRole('button', { name: 'Stop' }).click()
    await expect(page.getByText('Impersonné')).toBeHidden()
    await expect(adminLink).toBeVisible()
  })
})
