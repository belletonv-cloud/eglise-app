import { test, expect } from '@playwright/test'

test.describe('MusicStand — Interactions complètes', () => {
  test('MusicStand loads with songs', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('locale', 'en')
      const songs = [
        { id: 1, title: 'Merveilleux', author: 'G. K.', arrangement_count: 2, has_chord_chart: 1 },
        { id: 2, title: 'Ton amour', author: 'Louange', arrangement_count: 1, has_chord_chart: 1 },
        { id: 3, title: 'Roi des rois', author: 'Cieux Ouverts', arrangement_count: 3, has_chord_chart: 1 },
        { id: 4, title: 'Plein de joie', author: 'J. M.', arrangement_count: 1, has_chord_chart: 1 },
        { id: 5, title: 'Je veux chanter', author: 'S. B.', arrangement_count: 2, has_chord_chart: 1 },
        { id: 6, title: 'Voici le jour', author: 'Collectif', arrangement_count: 1, has_chord_chart: 1 },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)
        if (url.endsWith('/api/songs') && method === 'GET') {
          return new Response(JSON.stringify(songs), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/\/api\/songs\/\d+$/.test(url) && method === 'GET') {
          return new Response(JSON.stringify(songs[0]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.includes('/api/me') && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/music-stand?demo=1')

    // Wait for songs to render — each has the 🎵 emoji
    const items = page.locator('.cursor-pointer', { hasText: '🎵' })
    await expect(items.first()).toBeVisible({ timeout: 15000 })

    // All 6 songs should appear
    await expect(items).toHaveCount(6)

    // Specific titles should be visible
    await expect(page.getByText('Merveilleux', { exact: true })).toBeVisible()
    await expect(page.getByText('Roi des rois', { exact: true })).toBeVisible()

    // Song count badge
    await expect(page.locator('.bg-indigo-100')).toContainText('6')
  })

  test('Select song opens viewer with ChordPro content', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('locale', 'en')
      const songs = [
        { id: 1, title: 'Merveilleux', author: 'G. K.', arrangement_count: 2, has_chord_chart: 1 },
      ]
      const songDetail = {
        id: 1,
        title: 'Merveilleux',
        author: 'G. K.',
        arrangements: [
          { id: 10, name: 'Original', key: 'A', tempo: 110, chord_chart: "[Verse]\nA        E          F#m\nMerveilleux est ton nom\nD         A          E\nÉlevé dans tout mon cœur\n[Chorus]\nA     D         E\nJe chante ta louange\nF#m    D        E\nTu es le roi des rois" },
          { id: 11, name: 'Version basse', key: 'G', tempo: 100, chord_chart: "[Verse]\nG        D          Em\nMerveilleux est ton nom\nC         G          D\nÉlevé dans tout mon cœur\n[Chorus]\nG     C         D\nJe chante ta louange\nEm     C        D\nTu es le roi des rois" },
        ],
      }

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)
        if (url.endsWith('/api/songs') && method === 'GET') {
          return new Response(JSON.stringify(songs), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/\/api\/songs\/\d+$/.test(url) && method === 'GET') {
          return new Response(JSON.stringify(songDetail), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.includes('/api/me') && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/music-stand?demo=1')
    const item = page.locator('.cursor-pointer', { hasText: '🎵' }).first()
    await expect(item).toBeVisible({ timeout: 15000 })
    await item.click()

    // MusicStandView renders with the song title in toolbar
    await expect(page.locator('.song-title')).toContainText('Merveilleux', { timeout: 10000 })

    // Key badge shows the original key
    await expect(page.locator('.key-badge')).toContainText('A')

    // ChordPro content should be rendered (lyrics rendered in .lyric spans)
    await expect(page.locator('.chart-container')).toBeVisible()
    await expect(page.locator('.chord').first()).toBeVisible()
    await expect(page.locator('.lyric').first()).toBeVisible()
  })

  test('Transposition changes key display', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('locale', 'en')
      const songs = [
        { id: 1, title: 'Merveilleux', author: 'G. K.', arrangement_count: 2, has_chord_chart: 1 },
      ]
      const songDetail = {
        id: 1,
        title: 'Merveilleux',
        author: 'G. K.',
        arrangements: [
          { id: 10, name: 'Original', key: 'C', tempo: 110, chord_chart: "[Verse]\nC         G          Am\nMerveilleux est ton nom\nF         C          G\nÉlevé dans tout mon cœur\n[Chorus]\nC      F         G\nJe chante ta louange\nAm     F        G\nTu es le roi des rois" },
        ],
      }

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)
        if (url.endsWith('/api/songs') && method === 'GET') {
          return new Response(JSON.stringify(songs), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/\/api\/songs\/\d+$/.test(url) && method === 'GET') {
          return new Response(JSON.stringify(songDetail), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.includes('/api/me') && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/music-stand?demo=1')
    const item = page.locator('.cursor-pointer', { hasText: '🎵' }).first()
    await expect(item).toBeVisible({ timeout: 15000 })
    await item.click()

    // Wait for viewer
    await expect(page.locator('.song-title')).toContainText('Merveilleux', { timeout: 10000 })

    // Original key badge should show C
    await expect(page.locator('.key-badge')).toContainText('C')

    // Click transpose up (+) button in toolbar
    const transposeUpBtn = page.locator('.toolbar-btn[title="+1 demi-ton"]')
    await expect(transposeUpBtn).toBeVisible()
    await transposeUpBtn.click()

    // Key should change to C# — but wait for Vue reactivity
    await expect(page.locator('.key-badge')).toContainText('C#', { timeout: 3000 })

    // Click transpose up again → D
    await transposeUpBtn.click()
    await expect(page.locator('.key-badge')).toContainText('D', { timeout: 3000 })

    // Click transpose down (−) once → C#
    const transposeDownBtn = page.locator('.toolbar-btn[title="-1 demi-ton"]')
    await transposeDownBtn.click()
    await expect(page.locator('.key-badge')).toContainText('C#', { timeout: 3000 })
  })

  test('Metronome panel opens and responds to controls', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('locale', 'en')
      const songs = [
        { id: 1, title: 'Merveilleux', author: 'G. K.', arrangement_count: 1, has_chord_chart: 1 },
      ]
      const songDetail = {
        id: 1,
        title: 'Merveilleux',
        author: 'G. K.',
        arrangements: [{ id: 10, name: 'Original', key: 'C', tempo: 110, chord_chart: 'Am C G\nMerveilleux' }],
      }

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)
        if (url.endsWith('/api/songs') && method === 'GET') {
          return new Response(JSON.stringify(songs), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/\/api\/songs\/\d+$/.test(url) && method === 'GET') {
          return new Response(JSON.stringify(songDetail), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.includes('/api/me') && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/music-stand/1?demo=1')
    await expect(page.locator('.song-title')).toContainText('Merveilleux', { timeout: 10000 })

    // Find and click the metronome toggle button (♩) in the toolbar
    const metroToggle = page.locator('.toolbar-btn[title="Métronome"]')
    await expect(metroToggle).toBeVisible()
    await metroToggle.click()

    // Metronome panel should appear
    await expect(page.locator('.metronome')).toBeVisible({ timeout: 3000 })

    // BPM display should show 110 (from arrangement.tempo)
    await expect(page.locator('.bpm-display')).toContainText('110')

    // Click play button (▶)
    const playBtn = page.locator('.metro-btn').first()
    await expect(playBtn).toBeVisible()
    await playBtn.click()

    // Playing state — button should show ⏸
    await expect(page.locator('.metro-btn').first()).toContainText('⏸')

    // Click pause
    await playBtn.click()
    await expect(page.locator('.metro-btn').first()).toContainText('▶')
  })

  test('Auto-scroll toggle is clickable', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('locale', 'en')
      const songs = [
        { id: 1, title: 'Merveilleux', author: 'G. K.', arrangement_count: 1, has_chord_chart: 1 },
      ]
      const songDetail = {
        id: 1,
        title: 'Merveilleux',
        author: 'G. K.',
        arrangements: [{ id: 10, name: 'Original', key: 'C', tempo: 120, chord_chart: 'Am C G\nMerveilleux' }],
      }

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)
        if (url.endsWith('/api/songs') && method === 'GET') {
          return new Response(JSON.stringify(songs), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/\/api\/songs\/\d+$/.test(url) && method === 'GET') {
          return new Response(JSON.stringify(songDetail), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.includes('/api/me') && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/music-stand/1?demo=1')
    await expect(page.locator('.song-title')).toContainText('Merveilleux', { timeout: 10000 })

    // Find auto-scroll button in toolbar (⟳)
    const autoScrollBtn = page.locator('.toolbar-btn[title="Auto-scroll OFF"]')
    await expect(autoScrollBtn).toBeVisible()

    // Click to enable auto-scroll
    await autoScrollBtn.click()

    // After clicking, button title should change to indicate active state
    const activeBtn = page.locator('.toolbar-btn.active')
    await expect(activeBtn).toHaveCount(1, { timeout: 3000 })
  })

  test('Stage mode toggle applies CSS class', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('locale', 'en')
      const songs = [
        { id: 1, title: 'Merveilleux', author: 'G. K.', arrangement_count: 1, has_chord_chart: 1 },
      ]
      const songDetail = {
        id: 1,
        title: 'Merveilleux',
        author: 'G. K.',
        arrangements: [{ id: 10, name: 'Original', key: 'C', tempo: 120, chord_chart: 'Am C G\nMerveilleux' }],
      }

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)
        if (url.endsWith('/api/songs') && method === 'GET') {
          return new Response(JSON.stringify(songs), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/\/api\/songs\/\d+$/.test(url) && method === 'GET') {
          return new Response(JSON.stringify(songDetail), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.includes('/api/me') && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/music-stand/1?demo=1')
    await expect(page.locator('.song-title')).toContainText('Merveilleux', { timeout: 10000 })

    // Find stage mode button (🌙)
    const stageBtn = page.locator('.toolbar-btn[title="Mode scène"]')
    await expect(stageBtn).toBeVisible()

    // Click to activate stage mode
    await stageBtn.click()

    // Stage mode button should have active class
    await expect(stageBtn).toHaveClass(/active/)

    // The music-stand container should have stage-mode class
    await expect(page.locator('.music-stand.stage-mode')).toBeVisible()

    // Click again to deactivate
    await stageBtn.click()
    await expect(stageBtn).not.toHaveClass(/active/)
  })

  test('Song search filters in list view', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('locale', 'en')
      const songs = [
        { id: 1, title: 'Merveilleux', author: 'G. K.', arrangement_count: 2, has_chord_chart: 1 },
        { id: 2, title: 'Ton amour', author: 'Louange', arrangement_count: 1, has_chord_chart: 1 },
        { id: 3, title: 'Roi des rois', author: 'Cieux Ouverts', arrangement_count: 3, has_chord_chart: 1 },
        { id: 4, title: 'Plein de joie', author: 'J. M.', arrangement_count: 1, has_chord_chart: 1 },
        { id: 5, title: 'Je veux chanter', author: 'S. B.', arrangement_count: 2, has_chord_chart: 1 },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)
        if (url.endsWith('/api/songs') && method === 'GET') {
          return new Response(JSON.stringify(songs), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.includes('/api/me') && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/music-stand?demo=1')
    const items = page.locator('.cursor-pointer', { hasText: '🎵' })
    await expect(items.first()).toBeVisible({ timeout: 15000 })

    // All 5 songs visible before search
    await expect(items).toHaveCount(5)

    // Type in the search input
    const searchInput = page.locator('input[type="text"]')
    await searchInput.fill('Merveilleux')
    await page.waitForTimeout(300)

    // Only the matching song should remain
    const itemsAfter = page.locator('.cursor-pointer', { hasText: '🎵' })
    await expect(itemsAfter).toHaveCount(1)

    // Search for something that doesn't match any song
    await searchInput.fill('zzz_impossible')
    await page.waitForTimeout(300)

    // Should show "no results" message
    await expect(page.getByText(/no_songs|zzz_impossible/)).toBeVisible({ timeout: 3000 })
  })

  test('Settings panel toggles font size and display options', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('locale', 'en')
      const songs = [
        { id: 1, title: 'Merveilleux', author: 'G. K.', arrangement_count: 1, has_chord_chart: 1 },
      ]
      const songDetail = {
        id: 1,
        title: 'Merveilleux',
        author: 'G. K.',
        arrangements: [{ id: 10, name: 'Original', key: 'C', tempo: 120, chord_chart: 'Am C G\nMerveilleux' }],
      }

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)
        if (url.endsWith('/api/songs') && method === 'GET') {
          return new Response(JSON.stringify(songs), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/\/api\/songs\/\d+$/.test(url) && method === 'GET') {
          return new Response(JSON.stringify(songDetail), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.includes('/api/me') && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/music-stand/1?demo=1')
    await expect(page.locator('.song-title')).toContainText('Merveilleux', { timeout: 10000 })

    // Click settings button (⚙)
    const settingsBtn = page.locator('.toolbar-btn[title="Taille du texte"]').or(
      page.locator('.toolbar-btn', { hasText: '⚙' })
    )
    await expect(settingsBtn).toBeVisible()
    await settingsBtn.click()

    // Settings panel should be visible
    await expect(page.locator('.settings-panel')).toBeVisible({ timeout: 3000 })

    // Display option toggles should be present (checkboxes)
    const checkboxes = page.locator('.settings-panel input[type="checkbox"]')
    await expect(checkboxes).toHaveCount(3)

    // Font size slider should exist
    const slider = page.locator('.settings-panel input[type="range"]')
    await expect(slider).toBeVisible()

    // Default font size shown
    await expect(page.locator('.settings-panel')).toContainText('22px')

    // Close settings by clicking the button again
    await settingsBtn.click()
    await expect(page.locator('.settings-panel')).not.toBeVisible()
  })
})
