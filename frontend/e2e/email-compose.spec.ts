import { test, expect } from '@playwright/test'

test.describe('Email — Composition et envoi', () => {
  test('Email compose form loads', async ({ page }) => {
    await page.addInitScript(() => {
      const teams = [
        { id: 1, name: 'Louange/Adoration', description: 'Équipe de louange', service_type: 'worship', member_count: 5 },
        { id: 2, name: 'Audio', description: 'Sonorisation', service_type: 'sound', member_count: 2 },
      ]
      const plans = [
        { id: 1, service_type_id: 1, service_type_name: 'Culte', date: '2026-06-21', time: '10:00', theme: 'Culte dominical', status: 'published', items_count: 5, people_count: 8, created_at: '2026-06-01T08:00:00Z' },
        { id: 2, service_type_id: 2, service_type_name: 'Jeunes', date: '2026-06-19', time: '14:00', theme: 'Soirée jeunes', status: 'draft', items_count: 3, people_count: 0, created_at: '2026-06-03T08:00:00Z' },
      ]
      const emailLogs = [
        { id: 1, recipient_email: 'jean@example.com', subject: 'Bienvenue', status: 'sent', created_at: '2026-06-15T10:00:00Z' },
        { id: 2, recipient_email: 'marie@example.com', subject: 'Rappel concert', status: 'sent', created_at: '2026-06-14T15:30:00Z' },
        { id: 3, recipient_email: 'pierre@example.com', subject: 'Test échec', status: 'failed', created_at: '2026-06-13T09:00:00Z' },
      ]
      const emailTemplates = [
        { id: 1, name: 'Bienvenue', subject: 'Bienvenue à l\'église', body: 'Bonjour {{name}}, bienvenue parmi nous !' },
        { id: 2, name: 'Rappel', subject: 'Rappel de répétition', body: 'Bonjour {{name}}, rappel de la répétition demain.' },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)

        const parsed = new URL(url)
        const path = parsed.pathname

        if (path === '/api/teams' && method === 'GET') {
          return new Response(JSON.stringify(teams), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/plans' && method === 'GET') {
          return new Response(JSON.stringify({ data: plans, totalCount: plans.length }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/email-logs' && method === 'GET') {
          return new Response(JSON.stringify(emailLogs), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/email-templates' && method === 'GET') {
          return new Response(JSON.stringify(emailTemplates), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/email?demo=1')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Bienvenue').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Rappel').first()).toBeVisible()

    const emailForm = page.locator('form')
    await expect(emailForm).toBeVisible()

    await expect(emailForm.locator('input[type="email"]')).toBeVisible()
    await expect(emailForm.locator('input[type="text"]').first()).toBeVisible()
    await expect(emailForm.locator('textarea')).toBeVisible()
    await expect(emailForm.locator('button[type="submit"]')).toBeVisible()
  })

  test('Email logs display sent messages', async ({ page }) => {
    await page.addInitScript(() => {
      const teams: any[] = []
      const plans: any[] = []
      const emailLogs = [
        { id: 1, recipient_email: 'jean@example.com', subject: 'Bienvenue', status: 'sent', created_at: '2026-06-15T10:00:00Z' },
        { id: 2, recipient_email: 'marie@example.com', subject: 'Rappel concert', status: 'sent', created_at: '2026-06-14T15:30:00Z' },
        { id: 3, recipient_email: 'pierre@example.com', subject: 'Test échec', status: 'failed', created_at: '2026-06-13T09:00:00Z' },
      ]

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)

        const parsed = new URL(url)
        const path = parsed.pathname

        if (path === '/api/teams' && method === 'GET') {
          return new Response(JSON.stringify(teams), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/plans' && method === 'GET') {
          return new Response(JSON.stringify({ data: plans, totalCount: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/email-logs' && method === 'GET') {
          return new Response(JSON.stringify(emailLogs), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/email?demo=1')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('jean@example.com').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('marie@example.com').first()).toBeVisible()
    await expect(page.getByText('Bienvenue').first()).toBeVisible()
    await expect(page.getByText('Rappel concert').first()).toBeVisible()
    await expect(page.getByText('Test échec').first()).toBeVisible()
  })

  test('Recipient type selector changes form', async ({ page }) => {
    await page.addInitScript(() => {
      const teams = [
        { id: 1, name: 'Louange/Adoration', member_count: 5 },
        { id: 2, name: 'Audio', member_count: 2 },
      ]
      const plans: any[] = []
      const emailLogs: any[] = []

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const method = init?.method || 'GET'
        if (!url.includes('/api/')) return origFetch(input, init)

        const parsed = new URL(url)
        const path = parsed.pathname

        if (path === '/api/teams' && method === 'GET') {
          return new Response(JSON.stringify(teams), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/plans' && method === 'GET') {
          return new Response(JSON.stringify({ data: plans, totalCount: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (path === '/api/email-logs' && method === 'GET') {
          return new Response(JSON.stringify(emailLogs), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    })

    await page.goto('/email?demo=1')
    await page.waitForLoadState('networkidle')

    const selects = page.locator('form select')
    await expect(selects.first()).toBeVisible({ timeout: 10000 })

    await selects.first().selectOption('team')

    await expect(selects.nth(1)).toBeVisible({ timeout: 5000 })
    await expect(selects.nth(1)).toContainText('Louange/Adoration')
  })
})
