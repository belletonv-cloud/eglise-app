import { test, expect } from '@playwright/test'

// Rendre ces tests plus tolérants : augmenter timeout global pour ce fichier
test.setTimeout(120_000)

test.describe('Demo Tour', () => {
  // Utilitaire pour désactiver animations/transitions qui rendent les tests instables
  async function disableAnimations(page) {
    await page.addStyleTag({ content: `*{transition:none!important;animation:none!important}` })
  }

  test('page de démo se charge avec le titre et les boutons', async ({ page }) => {
    await disableAnimations(page)
    await page.goto('/demo-tour')
    await expect(page.locator('h1')).toContainText('Église App')
    await expect(page.locator('.btn-primary')).toContainText('visite guidée')
    await expect(page.locator('.btn-secondary')).toContainText('Dashboard')
  })

  test('clic "Accéder au Dashboard" active le mode démo et navigue', async ({ page }) => {
    await disableAnimations(page)
    await page.goto('/demo-tour')
    await page.locator('.btn-secondary').click()
    // Accept either root "/" or "/dashboard" (routing can map / to dashboard)
    await page.waitForFunction(() => location.pathname === '/' || location.pathname.startsWith('/dashboard'), { timeout: 10000 })
    // Vérifie que le mode démo est actif (badge "🕊️ Démo" dans le header)
    await page.locator('text=🕊️ Démo').waitFor({ state: 'visible', timeout: 10000 })
  })

  test('clic "Commencer la visite guidée" ouvre le guide + navigue vers dashboard', async ({ page }) => {
    await disableAnimations(page)
    await page.goto('/demo-tour')
    await page.locator('.btn-primary').click()
    // Navigation vers le dashboard (ou /)
    await page.waitForFunction(() => location.pathname === '/' || location.pathname.startsWith('/dashboard'), { timeout: 10000 })
    // Le guide flottant doit être visible
    const guide = page.locator('.demo-guide-card')
    await guide.waitFor({ state: 'visible', timeout: 10000 })
    // Le badge doit indiquer l'étape 1/9
    await expect(guide).toContainText('1/9')
  })

  test('navigation Suivant change la page et met à jour le compteur', async ({ page }) => {
    await disableAnimations(page)
    await page.goto('/demo-tour')
    await page.locator('.btn-primary').click()
    // Navigation vers le dashboard (ou /)
    await page.waitForFunction(() => location.pathname === '/' || location.pathname.startsWith('/dashboard'), { timeout: 10000 })

    const guide = page.locator('.demo-guide-card')
    await guide.waitFor({ state: 'visible', timeout: 10000 })

    // Cliquer Suivant → on navigue vers /members
    await guide.locator('.guide-nav-next').click()
    await page.waitForFunction(() => location.pathname.startsWith('/members'), { timeout: 10000 })
    await guide.waitFor({ state: 'visible', timeout: 10000 })
    // Debug: (removed) guide content logged during triage
    await expect(guide).toContainText('2/9')

    // Encore Suivant → /teams
    await guide.locator('.guide-nav-next').click()
    await page.waitForFunction(() => location.pathname.startsWith('/teams'), { timeout: 10000 })
    await guide.waitFor({ state: 'visible', timeout: 10000 })
    // Debug: (removed) guide content logged during triage
    await expect(guide).toContainText('3/9')
  })

  test('les points de progression sont cliquables', async ({ page }) => {
    await disableAnimations(page)
    await page.goto('/demo-tour')
    await page.locator('.btn-primary').click()
    await page.waitForFunction(() => location.pathname === '/' || location.pathname.startsWith('/dashboard'), { timeout: 10000 })

    const guide = page.locator('.demo-guide-card')
    await guide.waitFor({ state: 'visible', timeout: 10000 })

    // Cliquer sur le 3e point (index 2)
    const dots = guide.locator('.guide-dot')
    await dots.nth(2).click()
    // 3rd dot is index 2 → route '/teams'
    await page.waitForFunction(() => location.pathname.startsWith('/teams'), { timeout: 10000 })
    await guide.waitFor({ state: 'visible', timeout: 10000 })
    await expect(guide).toContainText('3/9')
  })

  test('bouton réduire/agrandir fonctionne', async ({ page }) => {
    await disableAnimations(page)
    await page.goto('/demo-tour')
    await page.locator('.btn-primary').click()
    await page.waitForFunction(() => location.pathname === '/' || location.pathname.startsWith('/dashboard'), { timeout: 10000 })

    const guide = page.locator('.demo-guide-card')
    await guide.waitFor({ state: 'visible', timeout: 10000 })

    // Réduire → le corps du guide doit être masqué
    await guide.locator('.guide-btn').first().click()
    await expect(guide.locator('.guide-body')).not.toBeVisible({ timeout: 5000 })

    // Agrandir → le corps du guide doit réapparaître
    await guide.locator('.guide-btn').first().click()
    await expect(guide.locator('.guide-body')).toBeVisible({ timeout: 5000 })
  })

  test('bouton fermer masque le guide', async ({ page }) => {
    await disableAnimations(page)
    await page.goto('/demo-tour')
    await page.locator('.btn-primary').click()
    await page.waitForFunction(() => location.pathname === '/' || location.pathname.startsWith('/dashboard'), { timeout: 10000 })

    const guide = page.locator('.demo-guide-card')
    await guide.waitFor({ state: 'visible', timeout: 10000 })

    // Fermer
    await guide.locator('.guide-close').click()
    await expect(guide).not.toBeVisible()
  })

  test('dernière étape montre "Explorer" et pas "Suivant"', async ({ page }) => {
    await disableAnimations(page)
    await page.goto('/demo-tour')
    await page.locator('.btn-primary').click()
    await page.waitForFunction(() => location.pathname === '/' || location.pathname.startsWith('/dashboard'), { timeout: 10000 })

    const guide = page.locator('.demo-guide-card')
    await guide.waitFor({ state: 'visible', timeout: 10000 })

    // Aller à la dernière étape
    for (let i = 0; i < 8; i++) {
      await guide.locator('.guide-nav-next').click()
      // attendre la navigation + la visibilité du guide
      await page.waitForTimeout(200) // petite pause pour laisser la navigation initier
      await guide.waitFor({ state: 'visible', timeout: 10000 })
    }

    // Vérifier 9/9
    await expect(guide).toContainText('9/9')
    // Bouton "Explorer" au lieu de "Suivant"
    await guide.locator('.guide-nav-finish').waitFor({ state: 'visible', timeout: 10000 })
    await expect(guide.locator('.guide-nav-finish')).toContainText('Explorer')
  })
})
