import { test, expect } from '@playwright/test'

test.describe('Plans flow', () => {

  test('1. Plans list loads', async ({ page }) => {
    await page.addInitScript(() => {
      const now = new Date()
      const Y = now.getFullYear()
      const M = String(now.getMonth() + 1).padStart(2, '0')
      const d = (day: number) => `${Y}-${M}-${String(day).padStart(2, '0')}`

      const plans = [
        { id: 1, service_type_id: 1, service_type_name: 'Culte', date: d(28), time: '10:00', theme: 'Louange et adoration', status: 'published', items_count: 5, people_count: 8, created_at: '2026-06-01T08:00:00Z' },
        { id: 2, service_type_id: 1, service_type_name: 'Culte', date: d(21), time: '10:00', theme: 'Espérance et renouveau', status: 'published', items_count: 7, people_count: 6, created_at: '2026-06-02T08:00:00Z' },
        { id: 3, service_type_id: 2, service_type_name: 'Jeunes', date: d(19), time: '14:00', theme: 'Soirée jeunes', status: 'draft', items_count: 3, people_count: 0, created_at: '2026-06-03T08:00:00Z' },
        { id: 4, service_type_id: 1, service_type_name: 'Culte', date: d(25), time: '10:00', theme: 'Actions de grâces', status: 'published', items_count: 6, people_count: 10, created_at: '2026-06-04T08:00:00Z' },
        { id: 5, service_type_id: 3, service_type_name: 'Étude', date: d(10), time: '18:30', theme: 'Étude biblique', status: 'completed', items_count: 2, people_count: 5, created_at: '2026-06-05T08:00:00Z' },
        { id: 6, service_type_id: 1, service_type_name: 'Culte', date: d(7), time: '10:00', theme: 'La foi qui sauve', status: 'completed', items_count: 5, people_count: 12, created_at: '2026-06-06T08:00:00Z' },
        { id: 7, service_type_id: 2, service_type_name: 'Jeunes', date: d(5), time: '14:00', theme: 'Louange jeunes', status: 'cancelled', items_count: 4, people_count: 0, created_at: '2026-06-07T08:00:00Z' },
        { id: 8, service_type_id: 1, service_type_name: 'Culte', date: d(1), time: '09:30', theme: 'Culte spécial', status: 'completed', items_count: 8, people_count: 20, created_at: '2026-06-08T08:00:00Z' },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)

        const parsed = new URL(url)
        const path = parsed.pathname

        if (path === '/api/plans' && method === 'GET') {
          return new Response(JSON.stringify({ data: plans, totalCount: plans.length }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/service-types' && method === 'GET') {
          return new Response(JSON.stringify({ data: [{ id: 1, name: 'Culte' }, { id: 2, name: 'Jeunes' }, { id: 3, name: 'Étude' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/plan-templates' && method === 'GET') {
          return new Response(JSON.stringify({ data: [{ id: 1, name: 'Culte type', item_count: 5 }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/me' && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/plans?demo=1')
    await page.waitForSelector('table', { timeout: 15000 })

    await expect(page.getByText('Louange et adoration').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Espérance et renouveau').first()).toBeVisible()
    await expect(page.getByText('Soirée jeunes').first()).toBeVisible()
    await expect(page.getByText('Actions de grâces').first()).toBeVisible()

    const rows = page.locator('table tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('2. Plan detail view', async ({ page }) => {
    await page.addInitScript(() => {
      const now = new Date()
      const Y = now.getFullYear()
      const M = String(now.getMonth() + 1).padStart(2, '0')
      const d = (day: number) => `${Y}-${M}-${String(day).padStart(2, '0')}`

      const plan = { id: 1, service_type_id: 1, service_type_name: 'Culte', date: d(21), time: '10:00', theme: 'Espérance et renouveau', status: 'published', notes: 'Prévoir les feuilles de chant', created_at: '2026-06-02T08:00:00Z' }

      const items = [
        { id: 1, plan_id: 1, type: 'song', title: "Chant d'ouverture", song_title: 'Mighty to Save', description: '', length_minutes: 5, position: 1, arrangement_id: 1, song_id: 1, transposed_key: null, color: null },
        { id: 2, plan_id: 1, type: 'header', title: 'Annonces', description: 'Information sur les événements à venir', length_minutes: 2, position: 2, song_title: null },
        { id: 3, plan_id: 1, type: 'song', title: 'Chant de louange', song_title: 'Way Maker', description: '', length_minutes: 8, position: 3, arrangement_id: 2, song_id: 2, transposed_key: 'D', color: '#6366f1' },
        { id: 4, plan_id: 1, type: 'announcement', title: 'Collecte', description: 'Offrande', length_minutes: 1, position: 4, song_title: null },
        { id: 5, plan_id: 1, type: 'song', title: 'Chant final', song_title: 'Great Are You Lord', description: '', length_minutes: 6, position: 5, arrangement_id: 3, song_id: 3, transposed_key: null, color: null },
      ]

      const checklistItems = [
        { id: 1, plan_id: 1, label: 'Préparer la sonorisation', done: false, position: 0 },
        { id: 2, plan_id: 1, label: 'Vérifier les micros', done: true, position: 1 },
        { id: 3, plan_id: 1, label: 'Imprimer les feuilles de chant', done: false, position: 2 },
      ]

      const scheduledPeople = [
        { id: 1, plan_id: 1, member_id: 1, team_id: 1, team_name: 'Louange/Adoration', first_name: 'Jean', last_name: 'Dupont', position: 'Chant', status: 'confirmed' },
        { id: 2, plan_id: 1, member_id: 2, team_id: 1, team_name: 'Louange/Adoration', first_name: 'Marie', last_name: 'Laurent', position: 'Guitare', status: 'pending' },
        { id: 3, plan_id: 1, member_id: 3, team_id: 1, team_name: 'Louange/Adoration', first_name: 'Pierre', last_name: 'Dubois', position: 'Batterie', status: 'declined' },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)

        const parsed = new URL(url)
        const path = parsed.pathname

        if (path === '/api/plans' && method === 'GET') {
          return new Response(JSON.stringify({ data: [plan], totalCount: 1 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify(plan), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/items$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/checklist$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify(checklistItems), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/scheduled-people$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify(scheduledPeople), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/attendances$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/members' && method === 'GET') {
          return new Response(JSON.stringify([{ id: 1, first_name: 'Jean', last_name: 'Dupont' }, { id: 2, first_name: 'Marie', last_name: 'Laurent' }, { id: 3, first_name: 'Pierre', last_name: 'Dubois' }]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/teams' && method === 'GET') {
          return new Response(JSON.stringify([{ id: 1, name: 'Louange/Adoration', member_count: 5 }]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/me' && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'Démo', email: 'admin@demo.church' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/service-types' && method === 'GET') {
          return new Response(JSON.stringify({ data: [{ id: 1, name: 'Culte' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/plan-templates' && method === 'GET') {
          return new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/member-exceptions' && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/plans/1?demo=1')
    await page.waitForSelector('text=Mighty to Save', { timeout: 15000 })

    await expect(page.getByText('Mighty to Save').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Way Maker').first()).toBeVisible()
    await expect(page.getByText('Great Are You Lord').first()).toBeVisible()
    await expect(page.getByText('Prévoir les feuilles de chant').first()).toBeVisible()
  })

  test('3. Plan creation form', async ({ page }) => {
    await page.addInitScript(() => {
      const now = new Date()
      const Y = now.getFullYear()
      const M = String(now.getMonth() + 1).padStart(2, '0')
      const d = (day: number) => `${Y}-${M}-${String(day).padStart(2, '0')}`

      const plans = [
        { id: 1, service_type_id: 1, service_type_name: 'Culte', date: d(28), time: '10:00', theme: 'Louange et adoration', status: 'published', items_count: 5, people_count: 8, created_at: '2026-06-01T08:00:00Z' },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)

        const parsed = new URL(url)
        const path = parsed.pathname

        if (path === '/api/plans' && method === 'GET') {
          return new Response(JSON.stringify({ data: plans, totalCount: plans.length }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/plans' && method === 'POST') {
          return new Response(JSON.stringify({ id: 999, ...JSON.parse(init?.body as string || '{}') }), { status: 201, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/service-types' && method === 'GET') {
          return new Response(JSON.stringify({ data: [{ id: 1, name: 'Culte' }, { id: 2, name: 'Jeunes' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/plan-templates' && method === 'GET') {
          return new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/me' && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/plans?demo=1')
    await page.waitForSelector('table', { timeout: 15000 })

    await page.getByText('Nouveau service').click()

    const modal = page.locator('.fixed.inset-0.bg-black\\/50')
    await expect(modal).toBeVisible({ timeout: 5000 })

    await expect(modal.locator('select').first()).toBeVisible()
    await expect(modal.locator('input[type="date"]')).toBeVisible()
    await expect(modal.locator('input[type="time"]')).toBeVisible()
    await expect(modal.locator('textarea')).toBeVisible()
    await expect(modal.getByText('Créer')).toBeVisible()
  })

  test('4. Plan checklist', async ({ page }) => {
    await page.addInitScript(() => {
      const now = new Date()
      const Y = now.getFullYear()
      const M = String(now.getMonth() + 1).padStart(2, '0')
      const d = (day: number) => `${Y}-${M}-${String(day).padStart(2, '0')}`

      const plan = { id: 1, service_type_id: 1, service_type_name: 'Culte', date: d(21), time: '10:00', theme: 'Espérance et renouveau', status: 'published', notes: '', created_at: '2026-06-02T08:00:00Z' }
      const items: any[] = []
      const checklistItems = [
        { id: 1, plan_id: 1, label: 'Préparer la sonorisation', done: false, position: 0 },
        { id: 2, plan_id: 1, label: 'Vérifier les micros', done: true, position: 1 },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)

        const parsed = new URL(url)
        const path = parsed.pathname

        if (/^\/api\/plans\/\d+$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify(plan), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/items$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/checklist$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify(checklistItems), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plan-checklists\/\d+$/.test(path) && method === 'PUT') {
          const body = JSON.parse(init?.body as string || '{}')
          const id = parseInt(path.split('/').pop()!)
          const updated = { id, ...body }
          if (body.done) updated.done = true
          return new Response(JSON.stringify(updated), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/scheduled-people$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/attendances$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/members' && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/teams' && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/me' && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'Démo', email: 'admin@demo.church' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/member-exceptions' && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/plans/1?demo=1')
    await page.waitForSelector('text=Préparer la sonorisation', { timeout: 15000 })

    await expect(page.getByText('Préparer la sonorisation').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Vérifier les micros').first()).toBeVisible()

    const checkbox = page.locator('input[type="checkbox"]').first()
    await expect(checkbox).toBeVisible()
    await checkbox.click()
  })

  test('5. Plan team assignment', async ({ page }) => {
    await page.addInitScript(() => {
      const now = new Date()
      const Y = now.getFullYear()
      const M = String(now.getMonth() + 1).padStart(2, '0')
      const d = (day: number) => `${Y}-${M}-${String(day).padStart(2, '0')}`

      const plan = { id: 1, service_type_id: 1, service_type_name: 'Culte', date: d(21), time: '10:00', theme: 'Espérance et renouveau', status: 'published', notes: '', created_at: '2026-06-02T08:00:00Z' }
      const items: any[] = []

      const scheduledPeople = [
        { id: 1, plan_id: 1, member_id: 1, team_id: 1, team_name: 'Louange/Adoration', first_name: 'Jean', last_name: 'Dupont', position: 'Chant', status: 'confirmed' },
        { id: 2, plan_id: 1, member_id: 2, team_id: 1, team_name: 'Louange/Adoration', first_name: 'Marie', last_name: 'Laurent', position: 'Guitare', status: 'pending' },
        { id: 3, plan_id: 1, member_id: 3, team_id: 1, team_name: 'Louange/Adoration', first_name: 'Pierre', last_name: 'Dubois', position: 'Batterie', status: 'declined' },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)

        const parsed = new URL(url)
        const path = parsed.pathname

        if (/^\/api\/plans\/\d+$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify(plan), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/items$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/scheduled-people$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify(scheduledPeople), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/checklist$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/attendances$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/members' && method === 'GET') {
          return new Response(JSON.stringify([{ id: 1, first_name: 'Jean', last_name: 'Dupont' }, { id: 2, first_name: 'Marie', last_name: 'Laurent' }, { id: 3, first_name: 'Pierre', last_name: 'Dubois' }]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/teams' && method === 'GET') {
          return new Response(JSON.stringify([{ id: 1, name: 'Louange/Adoration', member_count: 5 }]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/me' && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'Démo', email: 'admin@demo.church' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/member-exceptions' && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/plans/1?demo=1')
    await page.waitForSelector('text=Jean Dupont', { timeout: 15000 })

    await expect(page.getByText('Jean Dupont').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Marie Laurent').first()).toBeVisible()
    await expect(page.getByText('Pierre Dubois').first()).toBeVisible()
  })

  test('6. Plan song assignment', async ({ page }) => {
    await page.addInitScript(() => {
      const now = new Date()
      const Y = now.getFullYear()
      const M = String(now.getMonth() + 1).padStart(2, '0')
      const d = (day: number) => `${Y}-${M}-${String(day).padStart(2, '0')}`

      const plan = { id: 1, service_type_id: 1, service_type_name: 'Culte', date: d(21), time: '10:00', theme: 'Espérance et renouveau', status: 'published', notes: '', created_at: '2026-06-02T08:00:00Z' }
      let items: any[] = []

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)

        const parsed = new URL(url)
        const path = parsed.pathname

        if (/^\/api\/plans\/\d+$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify(plan), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/items$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/items$/.test(path) && method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}')
          const newItem = { id: 100, ...body, song_title: null, arrangement_name: null, transposed_key: null }
          items.push(newItem)
          return new Response(JSON.stringify(newItem), { status: 201, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/checklist$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/scheduled-people$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (/^\/api\/plans\/\d+\/attendances$/.test(path) && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/members' && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/teams' && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/me' && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'Démo', email: 'admin@demo.church' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/member-exceptions' && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/plans/1?demo=1')

    const addSongBtn = page.locator('button', { hasText: '+' }).first()
    await expect(addSongBtn).toBeVisible({ timeout: 15000 })
  })

  test('7. Plan status filter', async ({ page }) => {
    await page.addInitScript(() => {
      const now = new Date()
      const Y = now.getFullYear()
      const M = String(now.getMonth() + 1).padStart(2, '0')
      const d = (day: number) => `${Y}-${M}-${String(day).padStart(2, '0')}`

      const plans = [
        { id: 1, service_type_id: 1, service_type_name: 'Culte', date: d(28), time: '10:00', theme: 'Louange et adoration', status: 'published', items_count: 5, people_count: 8, created_at: '2026-06-01T08:00:00Z' },
        { id: 2, service_type_id: 2, service_type_name: 'Jeunes', date: d(22), time: '14:00', theme: 'Soirée jeunes', status: 'draft', items_count: 3, people_count: 0, created_at: '2026-06-03T08:00:00Z' },
        { id: 3, service_type_id: 3, service_type_name: 'Étude', date: d(20), time: '18:30', theme: 'Étude biblique', status: 'completed', items_count: 2, people_count: 5, created_at: '2026-06-05T08:00:00Z' },
        { id: 4, service_type_id: 2, service_type_name: 'Jeunes', date: d(18), time: '14:00', theme: 'Louange jeunes', status: 'cancelled', items_count: 4, people_count: 0, created_at: '2026-06-07T08:00:00Z' },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)

        const parsed = new URL(url)
        const path = parsed.pathname

        if (path === '/api/plans' && method === 'GET') {
          return new Response(JSON.stringify({ data: plans, totalCount: plans.length }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/service-types' && method === 'GET') {
          return new Response(JSON.stringify({ data: [{ id: 1, name: 'Culte' }, { id: 2, name: 'Jeunes' }, { id: 3, name: 'Étude' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/plan-templates' && method === 'GET') {
          return new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/plans?demo=1')
    await page.waitForSelector('table', { timeout: 15000 })

    const publishedBadges = page.locator('span:has-text("published")')
    const draftBadges = page.locator('span:has-text("draft")')
    const completedBadges = page.locator('span:has-text("Terminé")')
    const cancelledBadges = page.locator('span:has-text("Annulé")')

    const publishedCount = await publishedBadges.count()
    const draftCount = await draftBadges.count()
    const completedCount = await completedBadges.count()
    const cancelledCount = await cancelledBadges.count()

    expect(publishedCount + draftCount + completedCount + cancelledCount).toBeGreaterThanOrEqual(4)

    const statusSpans = page.locator('table tbody tr td span.inline-flex')
    const statusCount = await statusSpans.count()
    expect(statusCount).toBeGreaterThanOrEqual(4)
  })
})
