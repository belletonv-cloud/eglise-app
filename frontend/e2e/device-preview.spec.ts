import { test, expect } from '@playwright/test'

test.describe('Aperçu responsive (iframe)', () => {
  test('peut ouvrir et fermer l’aperçu mobile en mode démo', async ({ page }) => {
    await page.goto('/?demo=1')

    // device button is the only one with this title
    await page.getByTitle('Aperçu responsive (desktop/tablette/mobile)').click()
    await page.getByRole('button', { name: '📲 Mobile' }).click()

    await expect(page.getByText('Aperçu')).toBeVisible()
    const frame = page.locator('iframe')
    await expect(frame).toBeVisible()

    // iframe should load something (same origin)
    await expect(frame).toHaveAttribute('src', /preview=true/)
    await expect(frame).toHaveAttribute('src', /device=mobile/)

    // No iframe-in-iframe cascade
    await expect(page.frameLocator('iframe').locator('iframe')).toHaveCount(0)

    await page.getByRole('button', { name: 'Fermer ✕' }).click()
    await expect(page.getByText('Aperçu')).toBeHidden()
  })

  test('peut ouvrir l’aperçu tablette en mode démo', async ({ page }) => {
    await page.goto('/?demo=1')

    await page.getByTitle('Aperçu responsive (desktop/tablette/mobile)').click()
    await page.getByRole('button', { name: '📱 Tablette' }).click()

    await expect(page.getByText('Aperçu')).toBeVisible()
    const frame = page.locator('iframe')
    await expect(frame).toBeVisible()
    await expect(frame).toHaveAttribute('src', /preview=true/)
    await expect(frame).toHaveAttribute('src', /device=tablet/)

    // No iframe-in-iframe cascade
    await expect(page.frameLocator('iframe').locator('iframe')).toHaveCount(0)
  })
})
