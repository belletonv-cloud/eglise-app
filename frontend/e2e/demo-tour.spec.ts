import { test, expect } from '@playwright/test'

test.describe('Demo Tour', () => {
  test('page de démo se charge avec le titre et les boutons', async ({ page }) => {
    await page.goto('/demo-tour')
    await expect(page.locator('h1')).toContainText('Église App')
    await expect(page.locator('.btn-primary')).toContainText('visite guidée')
    await expect(page.locator('.btn-secondary')).toContainText('Dashboard')
  })

  test('clic "Accéder au Dashboard" active le mode démo et navigue', async ({ page }) => {
    await page.goto('/demo-tour')
    await page.locator('.btn-secondary').click()
    await page.waitForURL('**/dashboard')
    // Vérifie que le mode démo est actif (badge "🕊️ Démo" dans le header)
    await expect(page.locator('text=🕊️ Démo')).toBeVisible({ timeout: 5000 })
  })

  test('clic "Commencer la visite guidée" ouvre le guide + navigue vers dashboard', async ({ page }) => {
    await page.goto('/demo-tour')
    await page.locator('.btn-primary').click()
    // Navigation vers le dashboard
    await page.waitForURL('**/dashboard')
    // Le guide flottant doit être visible
    const guide = page.locator('.demo-guide-card')
    await expect(guide).toBeVisible({ timeout: 5000 })
    // Le badge doit indiquer l'étape 1/9
    await expect(guide).toContainText('1/9')
  })

  test('navigation Suivant change la page et met à jour le compteur', async ({ page }) => {
    await page.goto('/demo-tour')
    await page.locator('.btn-primary').click()
    await page.waitForURL('**/dashboard')

    const guide = page.locator('.demo-guide-card')
    await expect(guide).toBeVisible()

    // Cliquer Suivant → on navigue vers /members
    await guide.locator('.guide-nav-next').click()
    await page.waitForURL('**/members')
    await expect(guide).toContainText('2/9')

    // Encore Suivant → /teams
    await guide.locator('.guide-nav-next').click()
    await page.waitForURL('**/teams')
    await expect(guide).toContainText('3/9')
  })

  test('les points de progression sont cliquables', async ({ page }) => {
    await page.goto('/demo-tour')
    await page.locator('.btn-primary').click()
    await page.waitForURL('**/dashboard')

    const guide = page.locator('.demo-guide-card')
    await expect(guide).toBeVisible()

    // Cliquer sur le 3e point (index 2)
    const dots = guide.locator('.guide-dot')
    await dots.nth(2).click()
    await page.waitForURL('**/members')
    await expect(guide).toContainText('3/9')
  })

  test('bouton réduire/agrandir fonctionne', async ({ page }) => {
    await page.goto('/demo-tour')
    await page.locator('.btn-primary').click()
    await page.waitForURL('**/dashboard')

    const guide = page.locator('.demo-guide-card')
    await expect(guide).toBeVisible()

    // Réduire
    await guide.locator('.guide-btn').first().click()
    await expect(guide).toHaveClass(/minimized/)

    // Agrandir
    await guide.locator('.guide-btn').first().click()
    await expect(guide).not.toHaveClass(/minimized/)
  })

  test('bouton fermer masque le guide', async ({ page }) => {
    await page.goto('/demo-tour')
    await page.locator('.btn-primary').click()
    await page.waitForURL('**/dashboard')

    const guide = page.locator('.demo-guide-card')
    await expect(guide).toBeVisible()

    // Fermer
    await guide.locator('.guide-close').click()
    await expect(guide).not.toBeVisible()
  })

  test('dernière étape montre "Explorer" et pas "Suivant"', async ({ page }) => {
    await page.goto('/demo-tour')
    await page.locator('.btn-primary').click()
    await page.waitForURL('**/dashboard')

    const guide = page.locator('.demo-guide-card')

    // Aller à la dernière étape
    for (let i = 0; i < 8; i++) {
      await guide.locator('.guide-nav-next').click()
      await page.waitForTimeout(500)
    }

    // Vérifier 9/9
    await expect(guide).toContainText('9/9')
    // Bouton "Explorer" au lieu de "Suivant"
    await expect(guide.locator('.guide-nav-finish')).toBeVisible()
    await expect(guide.locator('.guide-nav-finish')).toContainText('Explorer')
  })
})
