import { test, expect } from '@playwright/test'

/**
 * Tests E2E ciblant le site déployé https://eglise-app.pages.dev/
 * Exécutés avec la variable d'env EGLISE_APP_SITE (sinon https://eglise-app.pages.dev)
 * ou directement avec les URLs absolues ci-dessous.
 */

const SITE = process.env.EGLISE_APP_SITE || 'https://eglise-app.pages.dev'

test.describe('Site déployé — Navigation globale', () => {
  const routes = [
    { path: '/', label: 'accueil' },
    { path: '/dashboard', label: 'dashboard' },
    { path: '/music-stand', label: 'music-stand liste' },
    { path: '/members', label: 'membres' },
    { path: '/songs', label: 'chants' },
    { path: '/annonces', label: 'annonces' },
    { path: '/sondages', label: 'sondages' },
    { path: '/checkin', label: 'check-in' },
  ]

  for (const { path, label } of routes) {
    test(`${label} (${path}) retourne 200`, async ({ page }) => {
      const res = await page.goto(`${SITE}${path}`)
      expect(res?.status()).toBe(200)
    })
  }
})

test.describe('Site déployé — Chargement UI', () => {
  test('la page racine rend du contenu visible', async ({ page }) => {
    await page.goto(SITE)
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).not.toBeEmpty()
    // Pas d'erreur "Cannot read properties of undefined" dans la console
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.waitForTimeout(1000)
    const jsErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('Cannot read') || e.includes('undefined')
    )
    expect(jsErrors, `Erreurs JS: ${jsErrors.join('\n')}`).toHaveLength(0)
  })

  test('aucune page critique ne redirige vers une 404', async ({ page }) => {
    for (const path of ['/music-stand', '/songs', '/members']) {
      await page.goto(`${SITE}${path}`)
      const url = page.url()
      expect(url).not.toContain('404')
      expect(url).not.toContain('error')
    }
  })

  test('le SPA ne crash pas au chargement (pas de white screen)', async ({ page }) => {
    await page.goto(SITE)
    await page.waitForLoadState('networkidle')
    // Au moins un élément au-delà du body doit exister
    const appEl = page.locator('#app').or(page.locator('[data-v-app]')).or(page.locator('nav')).or(page.locator('main'))
    await expect(appEl.first()).toBeAttached({ timeout: 5000 })
  })
})

test.describe('Site déployé — Mode démo', () => {
  test('music-stand en mode démo affiche des chants mock', async ({ page }) => {
    await page.goto(`${SITE}/music-stand?demo=1`)
    await page.waitForLoadState('networkidle')

    // Le mock retourne 1 chant "Mock song"
    const items = page.locator('.cursor-pointer').filter({ hasText: '🎵' })
    await expect(items.first()).toBeVisible({ timeout: 8000 })
  })

  test('aperçu mobile (iframe) fonctionne sur le site déployé', async ({ page }) => {
    await page.goto(`${SITE}/?demo=1`)

    await page.getByTitle('Aperçu responsive (desktop/tablette/mobile)').click()
    await page.getByRole('button', { name: '📲 Mobile' }).click()

    await expect(page.getByText('Aperçu')).toBeVisible()
    const frame = page.locator('iframe')
    await expect(frame).toBeVisible()
    await expect(frame).toHaveAttribute('src', /preview=true/)
    await expect(frame).toHaveAttribute('src', /device=mobile/)

    await page.getByRole('button', { name: 'Fermer ✕' }).click()
    await expect(page.getByText('Aperçu')).toBeHidden()
  })

  test('aperçu tablette (iframe) fonctionne sur le site déployé', async ({ page }) => {
    await page.goto(`${SITE}/?demo=1`)

    await page.getByTitle('Aperçu responsive (desktop/tablette/mobile)').click()
    await page.getByRole('button', { name: '📱 Tablette' }).click()

    await expect(page.getByText('Aperçu')).toBeVisible()
    const frame = page.locator('iframe')
    await expect(frame).toBeVisible()
    await expect(frame).toHaveAttribute('src', /preview=true/)
    await expect(frame).toHaveAttribute('src', /device=tablet/)
  })
})
