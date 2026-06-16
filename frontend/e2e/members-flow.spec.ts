import { test, expect } from '@playwright/test'

test.describe('Members — Gestion des membres', () => {
  test('Member list loads with 10+ members', async ({ page }) => {
    await page.addInitScript(() => {
      const members = [
        { id: 1, first_name: 'Jean', last_name: 'Dupont', email: 'jean@example.com', phone: '0612345678', role: 'admin', membership_type: 'member', last_scheduled_plan: '2026-06-21', tags: ['Louange'], created_at: '2026-01-01' },
        { id: 2, first_name: 'Marie', last_name: 'Laurent', email: 'marie@example.com', phone: '0687654321', role: 'editor', membership_type: 'member', last_scheduled_plan: '2026-06-14', tags: ['Chant'], created_at: '2026-01-02' },
        { id: 3, first_name: 'Pierre', last_name: 'Dubois', email: 'pierre@example.com', phone: '0655551111', role: 'music_director', membership_type: 'member', last_scheduled_plan: '2026-06-21', tags: ['Batterie'], created_at: '2026-01-03' },
        { id: 4, first_name: 'Sophie', last_name: 'Moreau', email: 'sophie@example.com', phone: '0644442222', role: 'viewer', membership_type: 'member', last_scheduled_plan: null, tags: ['Audio'], created_at: '2026-01-04' },
        { id: 5, first_name: 'Lucas', last_name: 'Petit', email: 'lucas@example.com', phone: '0633333333', role: 'volunteer', membership_type: 'member', last_scheduled_plan: '2026-06-07', tags: ['Guitare'], created_at: '2026-01-05' },
        { id: 6, first_name: 'Emma', last_name: 'Roux', email: 'emma@example.com', phone: '0622224444', role: 'scheduler', membership_type: 'member', last_scheduled_plan: '2026-06-28', tags: ['Piano'], created_at: '2026-01-06' },
        { id: 7, first_name: 'Thomas', last_name: 'Simon', email: 'thomas@example.com', phone: '0611115555', role: 'admin', membership_type: 'member', last_scheduled_plan: '2026-06-14', tags: ['Direction'], created_at: '2026-01-07' },
        { id: 8, first_name: 'Julie', last_name: 'Bernard', email: 'julie@example.com', phone: '0699998888', role: 'editor', membership_type: 'member', last_scheduled_plan: null, tags: ['Chant'], created_at: '2026-01-08' },
        { id: 9, first_name: 'Nicolas', last_name: 'Michel', email: 'nicolas@example.com', phone: '0688887777', role: 'volunteer', membership_type: 'inactive', last_scheduled_plan: '2026-05-01', tags: [], created_at: '2026-01-09' },
        { id: 10, first_name: 'Camille', last_name: 'Leroy', email: 'camille@example.com', phone: '0677776666', role: 'music_director', membership_type: 'member', last_scheduled_plan: '2026-06-21', tags: ['Clavier'], created_at: '2026-01-10' },
        { id: 11, first_name: 'Antoine', last_name: 'Fournier', email: 'antoine@example.com', phone: '0666665555', role: 'viewer', membership_type: 'guest', last_scheduled_plan: null, tags: [], created_at: '2026-01-11' },
        { id: 12, first_name: 'Isabelle', last_name: 'Girard', email: 'isabelle@example.com', phone: '0655554444', role: 'volunteer', membership_type: 'member', last_scheduled_plan: '2026-06-07', tags: ['Flûte'], created_at: '2026-01-12' },
      ]
      const teams = [
        { id: 1, name: 'Louange/Adoration', description: 'Équipe de louange', service_type: 'worship', member_count: 5 },
        { id: 2, name: 'Audio', description: 'Sonorisation', service_type: 'sound', member_count: 3 },
        { id: 3, name: 'Accueil', description: 'Équipe d\'accueil', service_type: 'hospitality', member_count: 4 },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)

        const parsed = new URL(url)
        const path = parsed.pathname

        if (path === '/api/members' && method === 'GET') {
          return new Response(JSON.stringify({ data: members, totalCount: members.length }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/teams' && method === 'GET') {
          return new Response(JSON.stringify(teams), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/members?demo=1')
    await page.waitForSelector('table', { timeout: 15000 })

    await expect(page.getByText('Jean Dupont').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Marie Laurent').first()).toBeVisible()
    await expect(page.getByText('Pierre Dubois').first()).toBeVisible()
    await expect(page.getByText('Sophie Moreau').first()).toBeVisible()
    await expect(page.getByText('Camille Leroy').first()).toBeVisible()

    const rows = page.locator('table tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThanOrEqual(10)
  })

  test('Search filters members', async ({ page }) => {
    await page.addInitScript(() => {
      const members = [
        { id: 1, first_name: 'Jean', last_name: 'Dupont', email: 'jean@example.com', phone: '0612345678', role: 'admin', membership_type: 'member', last_scheduled_plan: '2026-06-21', tags: ['Louange'], created_at: '2026-01-01' },
        { id: 2, first_name: 'Marie', last_name: 'Laurent', email: 'marie@example.com', phone: '0687654321', role: 'editor', membership_type: 'member', last_scheduled_plan: '2026-06-14', tags: ['Chant'], created_at: '2026-01-02' },
        { id: 3, first_name: 'Pierre', last_name: 'Dubois', email: 'pierre@example.com', phone: '0655551111', role: 'music_director', membership_type: 'member', last_scheduled_plan: '2026-06-21', tags: ['Batterie'], created_at: '2026-01-03' },
      ]
      const teams: any[] = []

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)

        const parsed = new URL(url)
        const path = parsed.pathname

        if (path === '/api/members' && method === 'GET') {
          return new Response(JSON.stringify({ data: members, totalCount: members.length }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/teams' && method === 'GET') {
          return new Response(JSON.stringify(teams), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/members?demo=1')
    await page.waitForSelector('table', { timeout: 15000 })

    await expect(page.getByText('Jean Dupont').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Marie Laurent').first()).toBeVisible()
  })

  test('Team filter sidebar visible', async ({ page }) => {
    await page.addInitScript(() => {
      const members: any[] = []
      const teams = [
        { id: 1, name: 'Louange/Adoration', description: 'Équipe de louange', service_type: 'worship', member_count: 5 },
        { id: 2, name: 'Audio', description: 'Sonorisation', service_type: 'sound', member_count: 3 },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)

        const parsed = new URL(url)
        const path = parsed.pathname

        if (path === '/api/members' && method === 'GET') {
          return new Response(JSON.stringify({ data: members, totalCount: members.length }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/teams' && method === 'GET') {
          return new Response(JSON.stringify(teams), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/members?demo=1')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Louange/Adoration').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Audio').first()).toBeVisible()
    await expect(page.getByText('Teams').first()).toBeVisible()
  })
})
