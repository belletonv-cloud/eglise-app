import { test, expect } from '@playwright/test'

const API_BASE = 'https://eglise-app.belletonv.workers.dev/api'
const SITE = 'https://eglise-app.pages.dev'

test.describe('Music Stand — API', () => {
  test('GET /api/songs returns a non-empty array', async ({ request }) => {
    const res = await request.get(`${API_BASE}/songs`)
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
  })

  test('GET /api/songs items have arrangement_count (integer)', async ({ request }) => {
    const res = await request.get(`${API_BASE}/songs`)
    const data = await res.json()
    expect(data.length).toBeGreaterThan(0)
    const first = data[0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('title')
    expect(first).toHaveProperty('arrangement_count')
    expect(typeof first.arrangement_count).toBe('number')
  })

  test('At least one song has arrangement_count > 0', async ({ request }) => {
    const res = await request.get(`${API_BASE}/songs`)
    const data = await res.json()
    const withArrangements = data.filter((s: any) => s.arrangement_count > 0)
    expect(withArrangements.length).toBeGreaterThan(0)
  })

  test('GET /api/songs/:id returns song with arrangements array', async ({ request }) => {
    // Pick first song that has arrangements
    const listRes = await request.get(`${API_BASE}/songs`)
    const list = await listRes.json()
    const song = list.find((s: any) => s.arrangement_count > 0)
    expect(song).toBeDefined()

    const res = await request.get(`${API_BASE}/songs/${song.id}`)
    expect(res.ok()).toBeTruthy()
    const detail = await res.json()
    expect(detail).toHaveProperty('id', song.id)
    expect(detail).toHaveProperty('title')
    expect(Array.isArray(detail.arrangements)).toBe(true)
    expect(detail.arrangements.length).toBeGreaterThan(0)
  })

  test('At least one arrangement has a non-null chord_chart', async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/songs`)
    const list = await listRes.json()
    const songsWithArr = list.filter((s: any) => s.arrangement_count > 0)
    expect(songsWithArr.length).toBeGreaterThan(0)

    // Check a few songs for chord_chart content
    let foundChart = false
    for (const song of songsWithArr.slice(0, 10)) {
      const res = await request.get(`${API_BASE}/songs/${song.id}`)
      const detail = await res.json()
      if (detail.arrangements?.some((a: any) => a.chord_chart && a.chord_chart.trim().length > 0)) {
        foundChart = true
        break
      }
    }
    expect(foundChart, 'Aucun arrangement ne contient de chord_chart dans les 10 premiers chants').toBe(true)
  })
})

test.describe('Music Stand — UI (site déployé)', () => {
  test('page /music-stand se charge correctement', async ({ page }) => {
    const res = await page.goto(`${SITE}/music-stand`)
    expect(res?.status()).toBe(200)
    await page.waitForLoadState('networkidle')
  })

  test('la liste des chants est non-vide', async ({ page }) => {
    await page.goto(`${SITE}/music-stand`)
    await page.waitForLoadState('networkidle')

    // Attendre que le spinner de chargement disparaisse
    await expect(page.locator('text=Chargement').or(page.locator('.animate-spin'))).toHaveCount(0, { timeout: 10000 })
      .catch(() => {}) // pas bloquant si le spinner n'existe pas

    // Au moins un chant doit s'afficher (les items ont une icône 🎵)
    const items = page.locator('.cursor-pointer').filter({ hasText: '🎵' })
    await expect(items.first()).toBeVisible({ timeout: 10000 })
    const count = await items.count()
    expect(count).toBeGreaterThan(0)
  })

  test('le compteur de chants affiche un nombre > 0', async ({ page }) => {
    await page.goto(`${SITE}/music-stand`)
    await page.waitForLoadState('networkidle')
    // Le badge de compteur est un span avec bg-indigo-100
    const badge = page.locator('.bg-indigo-100.text-indigo-700')
    await expect(badge).toBeVisible({ timeout: 10000 })
    const text = await badge.textContent()
    const count = parseInt(text?.trim() || '0', 10)
    expect(count).toBeGreaterThan(0)
  })

  test('cliquer sur un chant ouvre la vue Music Stand', async ({ page }) => {
    await page.goto(`${SITE}/music-stand`)
    await page.waitForLoadState('networkidle')

    const items = page.locator('.cursor-pointer').filter({ hasText: '🎵' })
    await expect(items.first()).toBeVisible({ timeout: 10000 })
    await items.first().click()

    // La vue music-stand (fond #1a1a2e) doit s'afficher
    await expect(page).toHaveURL(/\/music-stand\/\d+/, { timeout: 8000 })
  })

  test('la vue Music Stand affiche le titre du chant', async ({ page }) => {
    await page.goto(`${SITE}/music-stand`)
    await page.waitForLoadState('networkidle')

    // Récupère le titre du premier chant dans la liste
    const items = page.locator('.cursor-pointer').filter({ hasText: '🎵' })
    await expect(items.first()).toBeVisible({ timeout: 10000 })
    const titleEl = items.first().locator('.font-medium')
    const expectedTitle = (await titleEl.textContent())?.trim()
    expect(expectedTitle).toBeTruthy()

    await items.first().click()
    await page.waitForLoadState('networkidle')

    // Le titre doit apparaître dans la toolbar
    const songTitle = page.locator('.song-title')
    await expect(songTitle).toBeVisible({ timeout: 8000 })
    await expect(songTitle).toContainText(expectedTitle!.slice(0, 10))
  })

  test('la barre de recherche filtre les chants', async ({ page }) => {
    await page.goto(`${SITE}/music-stand`)
    await page.waitForLoadState('networkidle')

    const items = page.locator('.cursor-pointer').filter({ hasText: '🎵' })
    await expect(items.first()).toBeVisible({ timeout: 10000 })
    const totalBefore = await items.count()

    // Tape une chaîne improbable
    const searchInput = page.locator('input[type="text"]')
    await searchInput.fill('zzzzzzzzz_impossible_xyz')
    await page.waitForTimeout(300)

    // La liste doit être vide ou afficher "no_songs"
    const afterCount = await items.count()
    expect(afterCount).toBeLessThan(totalBefore)
  })
})
