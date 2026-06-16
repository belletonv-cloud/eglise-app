import { test, expect } from '@playwright/test'

test.describe('Songs — Gestion des chants', () => {
  test('Songs list loads with song titles', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('locale', 'en')
      const songs = [
        { id: 1, title: 'Merveilleux', author: 'G. K.', primary_key: 'A', themes: 'Louange,Action de grâce', last_used: '2026-05-15', last_edited: '2026-04-01', arrangement_count: 2, has_chord_chart: 1 },
        { id: 2, title: 'Ton amour', author: 'Louange', primary_key: 'D', themes: 'Adoration', last_used: '2026-06-01', last_edited: '2026-05-20', arrangement_count: 1, has_chord_chart: 1 },
        { id: 3, title: 'Roi des rois', author: 'Cieux Ouverts', primary_key: 'E', themes: 'Louange', last_used: '2026-05-28', last_edited: '2026-03-15', arrangement_count: 3, has_chord_chart: 1 },
        { id: 4, title: 'Plein de joie', author: 'J. M.', primary_key: 'C', themes: 'Joie,Action de grâce', last_used: '2026-05-10', last_edited: '2026-02-28', arrangement_count: 1, has_chord_chart: 1 },
        { id: 5, title: 'Je veux chanter', author: 'S. B.', primary_key: 'G', themes: 'Louange', last_used: null, last_edited: '2026-01-10', arrangement_count: 2, has_chord_chart: 1 },
        { id: 6, title: 'Source de vie', author: 'P. P.', primary_key: 'Bb', themes: 'Adoration', last_used: '2026-04-20', last_edited: '2026-04-20', arrangement_count: 0, has_chord_chart: 0 },
        { id: 7, title: 'Voici le jour', author: 'Collectif', primary_key: 'A', themes: 'Louange,Joie', last_used: '2026-06-05', last_edited: '2026-06-05', arrangement_count: 1, has_chord_chart: 1 },
      ]
      const teams = [
        { id: 1, name: 'Band', description: 'Louange principale', service_type: 'worship', member_count: 4 },
        { id: 2, name: 'Audio', description: 'Son', service_type: 'sound', member_count: 2 },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)

        // GET /api/songs — list
        if (url.endsWith('/api/songs') && method === 'GET') {
          return new Response(JSON.stringify(songs), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        // GET /api/teams — list
        if (url.endsWith('/api/teams') && method === 'GET') {
          return new Response(JSON.stringify(teams), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        // GET /api/songs/:id — detail
        const detailMatch = url.match(/\/api\/songs\/(\d+)$/)
        if (detailMatch && method === 'GET') {
          const id = parseInt(detailMatch[1], 10)
          const base = songs.find(s => s.id === id)
          if (!base) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
          const arrangements: Record<number, any[]> = {
            1: [
              { id: 10, name: 'Original', key: 'A', tempo: 110, chord_chart: "[Verse]\nA        E          F#m\nMerveilleux est ton nom\nD         A          E\nÉlevé dans tout mon cœur\n[Chorus]\nA     D         E\nJe chante ta louange\nF#m    D        E\nTu es le roi des rois", pco_updated_at: '2026-03-01' },
              { id: 11, name: 'Version basse', key: 'G', tempo: 100, chord_chart: "[Verse]\nG        D          Em\nMerveilleux est ton nom\nC         G          D\nÉlevé dans tout mon cœur\n[Chorus]\nG     C         D\nJe chante ta louange\nEm     C        D\nTu es le roi des rois", pco_updated_at: '2026-03-15' },
            ],
            2: [
              { id: 20, name: 'Original', key: 'D', tempo: 120, chord_chart: "[Verse]\nD        G          A\nTon amour est si grand\nBm       G          A\nIl remplit tout mon être\n[Chorus]\nD     G          A\nJe t'adore Seigneur\nBm    G          A\nTu es mon rocher", pco_updated_at: '2026-04-10' },
            ],
            3: [
              { id: 30, name: 'Original', key: 'E', tempo: 130, chord_chart: "[Verse]\nE           B         C#m\nRoi des rois, Seigneur des seigneurs\nA           E           B\nTu règnes dans la majesté\n[Chorus]\nC#m      A         E\nToute la terre se prosterne\nB         A         E\nDevant toi, Dieu tout-puissant", pco_updated_at: '2026-05-01' },
              { id: 31, name: 'Haut', key: 'F', tempo: 135, chord_chart: "[Verse]\nF           C         Dm\nRoi des rois, Seigneur des seigneurs\nBb          F           C\nTu règnes dans la majesté\n[Chorus]\nDm       Bb        F\nToute la terre se prosterne\nC         Bb        F\nDevant toi, Dieu tout-puissant", pco_updated_at: '2026-05-10' },
              { id: 32, name: 'Acoustique', key: 'D', tempo: 90, chord_chart: "[Verse]\nD           A         Bm\nRoi des rois, Seigneur des seigneurs\nG           D           A\nTu règnes dans la majesté\n[Chorus]\nBm       G         D\nToute la terre se prosterne\nA         G         D\nDevant toi, Dieu tout-puissant", pco_updated_at: '2026-05-12' },
            ],
            4: [
              { id: 40, name: 'Original', key: 'C', tempo: 140, chord_chart: "[Verse]\nC         G          Am\nPlein de joie je me lève\nF         C          G\nTon amour me délivre\n[Chorus]\nC      F          G\nAlléluia, je chante\nAm     F         G\nTa bonté chaque jour", pco_updated_at: '2026-03-20' },
            ],
            5: [
              { id: 50, name: 'Original', key: 'G', tempo: 115, chord_chart: "[Verse]\nG        D          Em\nJe veux chanter ta gloire\nC         G          D\nProclamer ta victoire\n[Chorus]\nG     C         D\nDans la joie et la paix\nEm    C        D\nJe célèbre ta beauté", pco_updated_at: '2026-05-05' },
              { id: 51, name: 'Ballade', key: 'G', tempo: 80, chord_chart: "[Verse]\nG        D/F#      Em\nJe veux chanter ta gloire\nC         G          D\nProclamer ta victoire\n[Chorus]\nG     C         D\nDans la joie et la paix\nEm    C        D\nJe célèbre ta beauté", pco_updated_at: '2026-05-06' },
            ],
            7: [
              { id: 70, name: 'Original', key: 'A', tempo: 125, chord_chart: "[Verse]\nA        E          F#m\nVoici le jour du Seigneur\nD         A          E\nRéjouissons-nous en lui\n[Chorus]\nA     D         E\nOuvrons les portes\nF#m    D        E\nLe roi entre dans nos cœurs", pco_updated_at: '2026-06-01' },
            ],
          }
          return new Response(JSON.stringify({ ...base, arrangements: arrangements[id] || [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        // GET /api/arrangements/:id/media
        if (/\/api\/arrangements\/\d+\/media$/.test(url) && method === 'GET') {
          return new Response(JSON.stringify([
            { id: 100, arrangement_id: 10, filename: 'merveilleux-demo.mp3', file_type: 'audio', file_url: 'https://example.com/merveilleux.mp3' },
            { id: 101, arrangement_id: 10, filename: 'merveilleux-grille.pdf', file_type: 'pdf', file_url: 'https://example.com/merveilleux.pdf' },
          ]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        // DELETE /api/songs/:id
        if (/\/api\/songs\/\d+$/.test(url) && method === 'DELETE') {
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        // DELETE /api/attachments/:id
        if (/\/api\/attachments\/\d+$/.test(url) && method === 'DELETE') {
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        // POST /api/songs — create
        if (url.endsWith('/api/songs') && method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}')
          return new Response(JSON.stringify({ id: 99, ...body }), { status: 201, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.includes('/api/me') && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/songs?demo=1')

    // Wait for the songs table to render
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 })

    // Verify multiple song titles are visible
    await expect(page.getByText('Merveilleux', { exact: true })).toBeVisible()
    await expect(page.getByText('Ton amour', { exact: true })).toBeVisible()
    await expect(page.getByText('Roi des rois', { exact: true })).toBeVisible()

    // Song count badge should show correct number
    await expect(page.getByText(/7 songs/)).toBeVisible()
  })

  test('Song search filters results', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('locale', 'en')
      const songs = [
        { id: 1, title: 'Merveilleux', author: 'G. K.', primary_key: 'A', themes: 'Louange,Action de grâce', last_used: '2026-05-15', last_edited: '2026-04-01', arrangement_count: 2, has_chord_chart: 1 },
        { id: 2, title: 'Ton amour', author: 'Louange', primary_key: 'D', themes: 'Adoration', last_used: '2026-06-01', last_edited: '2026-05-20', arrangement_count: 1, has_chord_chart: 1 },
        { id: 3, title: 'Roi des rois', author: 'Cieux Ouverts', primary_key: 'E', themes: 'Louange', last_used: '2026-05-28', last_edited: '2026-03-15', arrangement_count: 3, has_chord_chart: 1 },
        { id: 4, title: 'Plein de joie', author: 'J. M.', primary_key: 'C', themes: 'Joie,Action de grâce', last_used: '2026-05-10', last_edited: '2026-02-28', arrangement_count: 1, has_chord_chart: 1 },
        { id: 5, title: 'Je veux chanter', author: 'S. B.', primary_key: 'G', themes: 'Louange', last_used: null, last_edited: '2026-01-10', arrangement_count: 2, has_chord_chart: 1 },
        { id: 7, title: 'Voici le jour', author: 'Collectif', primary_key: 'A', themes: 'Louange,Joie', last_used: '2026-06-05', last_edited: '2026-06-05', arrangement_count: 1, has_chord_chart: 1 },
      ]
      const teams = [
        { id: 1, name: 'Band', description: 'Louange principale', service_type: 'worship', member_count: 4 },
        { id: 2, name: 'Audio', description: 'Son', service_type: 'sound', member_count: 2 },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)
        if (url.endsWith('/api/songs') && method === 'GET') {
          return new Response(JSON.stringify(songs), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.endsWith('/api/teams') && method === 'GET') {
          return new Response(JSON.stringify(teams), { status: 200, headers: { 'Content-Type': 'application/json' } })
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

    await page.goto('/songs?demo=1')
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 })

    // Verify all songs visible before search
    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(6)

    // Type in search
    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill('Merveilleux')
    await page.waitForTimeout(300)

    // Only matching song should remain
    await expect(rows).toHaveCount(1)
    await expect(page.getByText('Merveilleux', { exact: true })).toBeVisible()
  })

  test('Song detail view loads arrangement details', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('locale', 'en')
      const songs = [
        { id: 1, title: 'Merveilleux', author: 'G. K.', primary_key: 'A', themes: 'Louange,Action de grâce', last_used: '2026-05-15', last_edited: '2026-04-01', arrangement_count: 2, has_chord_chart: 1 },
        { id: 2, title: 'Ton amour', author: 'Louange', primary_key: 'D', themes: 'Adoration', last_used: '2026-06-01', last_edited: '2026-05-20', arrangement_count: 1, has_chord_chart: 1 },
        { id: 3, title: 'Roi des rois', author: 'Cieux Ouverts', primary_key: 'E', themes: 'Louange', last_used: '2026-05-28', last_edited: '2026-03-15', arrangement_count: 3, has_chord_chart: 1 },
      ]
      const teams = [
        { id: 1, name: 'Band', description: 'Louange principale', service_type: 'worship', member_count: 4 },
      ]

      const songDetail = {
        id: 1,
        title: 'Merveilleux',
        author: 'G. K.',
        ccli_number: '123456',
        themes: 'Louange,Action de grâce',
        notes: 'Chant d\'ouverture pour les célébrations',
        arrangements: [
          { id: 10, name: 'Original', key: 'A', tempo: 110, chord_chart: "[Verse]\nA        E          F#m\nMerveilleux est ton nom\nD         A          E\nÉlevé dans tout mon cœur\n[Chorus]\nA     D         E\nJe chante ta louange\nF#m    D        E\nTu es le roi des rois", pco_updated_at: '2026-03-01' },
          { id: 11, name: 'Version basse', key: 'G', tempo: 100, chord_chart: "[Verse]\nG        D          Em\nMerveilleux est ton nom\nC         G          D\nÉlevé dans tout mon cœur\n[Chorus]\nG     C         D\nJe chante ta louange\nEm     C        D\nTu es le roi des rois", pco_updated_at: '2026-03-15' },
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
        if (url.endsWith('/api/teams') && method === 'GET') {
          return new Response(JSON.stringify(teams), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/\/api\/songs\/\d+$/.test(url) && method === 'GET') {
          return new Response(JSON.stringify(songDetail), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/\/api\/arrangements\/\d+\/media$/.test(url) && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.includes('/api/me') && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/songs?demo=1')
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 })

    // Click the first song row (Merveilleux)
    const firstRow = page.locator('table tbody tr').first()
    await firstRow.click()

    // Wait for detail page — song title should be visible as h1
    await expect(page.locator('.song-detail h1')).toContainText('Merveilleux', { timeout: 10000 })

    // Author should be visible
    await expect(page.getByText('G. K.')).toBeVisible()

    // CCLI number should be visible
    await expect(page.getByText('123456')).toBeVisible()

    // Arrangement table should list arrangements
    await expect(page.getByRole('cell', { name: 'Original' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Version basse' })).toBeVisible()

    // Arrangement details: keys and BPM
    await expect(page.getByRole('cell', { name: '110 BPM' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '100 BPM' })).toBeVisible()

    // Chord chart section should be rendered
    const chartContent = page.locator('.chart-content')
    await expect(chartContent).toBeVisible()
    await expect(chartContent).toContainText('Merveilleux est ton nom')
  })

  test('Song creation form has all required elements', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('locale', 'en')
      const songs: any[] = []
      const teams = [
        { id: 1, name: 'Band', description: 'Louange principale', service_type: 'worship', member_count: 4 },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)
        if (url.endsWith('/api/songs') && method === 'GET') {
          return new Response(JSON.stringify(songs), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.endsWith('/api/teams') && method === 'GET') {
          return new Response(JSON.stringify(teams), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.includes('/api/me') && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/songs?demo=1')
    // Wait for loading to finish (empty state since no songs)
    await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 10000 })

    // Click "New Song" button
    const newSongBtn = page.locator('button', { hasText: '+' })
    await expect(newSongBtn).toBeVisible()
    await newSongBtn.click()

    // Wait for the modal to appear
    const modal = page.locator('.fixed.inset-0.z-50')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Verify form elements are present
    await expect(modal.getByText('Song Title')).toBeVisible()
    await expect(modal.getByText('Author')).toBeVisible()
    await expect(modal.getByText('CCLI')).toBeVisible()
    await expect(modal.getByText('Themes')).toBeVisible()

    // Input fields should be present
    const inputs = modal.locator('input')
    await expect(inputs).toHaveCount(4)

    // Cancel and Create buttons
    await expect(modal.getByText('Cancel')).toBeVisible()
    await expect(modal.getByText('Create Song')).toBeVisible()
  })

  test('Song detail delete media triggers confirmation dialog', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('locale', 'en')
      const songs: any[] = []
      const teams = [
        { id: 1, name: 'Band', description: 'Louange principale', service_type: 'worship', member_count: 4 },
      ]

      const songDetail = {
        id: 1,
        title: 'Merveilleux',
        author: 'G. K.',
        ccli_number: '123456',
        themes: 'Louange',
        arrangements: [
          { id: 10, name: 'Original', key: 'A', tempo: 110, chord_chart: "[Verse]\nA        E          F#m\nMerveilleux est ton nom", pco_updated_at: '2026-03-01' },
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
        if (url.endsWith('/api/teams') && method === 'GET') {
          return new Response(JSON.stringify(teams), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/\/api\/songs\/\d+$/.test(url) && method === 'GET') {
          return new Response(JSON.stringify(songDetail), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/\/api\/arrangements\/\d+\/media$/.test(url) && method === 'GET') {
          return new Response(JSON.stringify([
            { id: 100, arrangement_id: 10, filename: 'merveilleux-demo.mp3', file_type: 'audio', file_url: 'https://example.com/x.mp3' },
          ]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/\/api\/attachments\/\d+$/.test(url) && method === 'DELETE') {
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.includes('/api/me') && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/songs?demo=1')
    // Navigate directly to song detail
    await page.goto('/song/1?demo=1')

    // Wait for song header
    await expect(page.locator('.song-detail h1')).toContainText('Merveilleux', { timeout: 10000 })

    // Media section should list the audio file
    const mediaDeleteBtn = page.locator('button[title="Delete"]')
    await expect(mediaDeleteBtn).toBeVisible({ timeout: 5000 })

    // Click delete — confirm dialog should appear
    await mediaDeleteBtn.click()
    await expect(page.locator('.confirm-overlay')).toBeVisible({ timeout: 3000 })

    // Confirm dialog has cancel and confirm buttons
    await expect(page.getByText('Annuler')).toBeVisible()
    await expect(page.getByText('Confirmer')).toBeVisible()
  })
})
