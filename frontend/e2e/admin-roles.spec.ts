import { test, expect } from '@playwright/test'

test.describe('Admin Roles', () => {
  test('gère une réponse paginée {items} pour /api/members et permet de changer un rôle', async ({ page }) => {
    await page.route('**/api/members?**', async route => {
      const url = route.request().url()
      // Only intercept the call made by AdminRoles.vue
      if (!url.includes('page=1') || !url.includes('size=100')) return route.continue()

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 123,
              first_name: 'Jean',
              last_name: 'Dupont',
              email: 'jean@test.tld',
              role: 'member',
            },
          ],
          totalCount: 1,
        }),
      })
    })

    await page.route('**/api/members/123/role', async route => {
      expect(route.request().method()).toBe('PUT')
      const body = JSON.parse(route.request().postData() || '{}')
      expect(body.role).toBe('admin')

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })

    await page.goto('/admin/roles?demo=1')

    await expect(page.getByText('Gestion des rôles')).toBeVisible()
    await expect(page.getByText('jean@test.tld')).toBeVisible()

    const card = page.locator('div', { hasText: 'jean@test.tld' }).first()
    await card.locator('select').selectOption('admin')

    const btn = card.getByRole('button', { name: 'Mettre à jour' })
    await expect(btn).toBeEnabled()
    await btn.click()

    await expect(card.getByText(/Rôle actuel: admin/)).toBeVisible()
  })
})
