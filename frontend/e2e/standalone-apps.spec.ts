import { test, expect } from '@playwright/test'

test.describe('Standalone app shells', () => {
  test('menu search surfaces shortcuts and members entry points', async ({ page }) => {
    await page.goto('/?demo=1')
    await page.waitForLoadState('domcontentloaded')

    const search = page.getByPlaceholder('Rechercher...')
    await expect(search).toBeVisible()
    await search.fill('memb')

    await expect(page.getByText('Membres').first()).toBeVisible()
  })

  test('services center teams tab renders planning center style boards', async ({ page }) => {
    await page.goto('/services-center?demo=1&tab=teams')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('button', { name: 'Order' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Teams' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Band' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Audio/Visual' })).toBeVisible()
  })

  test('serving schedule mobile chrome stays coherent with planning center nav', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/serving-schedule?demo=1')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('My Schedule').last()).toBeVisible()
    await expect(page.getByRole('button', { name: '📅 Schedule' })).toBeVisible()
    await expect(page.getByRole('button', { name: '🧾 Plans' })).toBeVisible()
    await expect(page.getByRole('button', { name: '🎵 Songs' })).toBeVisible()
    await expect(page.getByRole('button', { name: '📺 Media' })).toBeVisible()
    await expect(page.getByRole('button', { name: '👥 People' })).toBeVisible()
  })
})
