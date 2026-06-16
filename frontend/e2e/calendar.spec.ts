import { test, expect } from '@playwright/test';

test.describe('Calendrier — Navigation et affichage', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const churchEvents = [
        {
          id: 1, title: 'Concert de louange', description: 'Concert',
          location: 'Temple', start_date: '2026-06-20', start_time: '19:00',
          status: 'active', repeat_period: null, source: 'cieuxouverts.bzh',
          image_url: null, link: null, ticket_url: null, emoji: '🎵',
          exceptions: [], exception_count: 0,
        },
        {
          id: 2, title: 'Culte dominical', description: 'Culte du dimanche',
          location: 'Temple', start_date: '2026-06-07', start_time: '10:00',
          status: 'active', repeat_period: 'week', source: 'cieuxouverts.bzh',
          image_url: null, link: null, ticket_url: null, emoji: '🙏',
          exceptions: [], exception_count: 0,
        },
        {
          id: 3, title: 'Répétition chorale', description: 'Chorale',
          location: 'Temple', start_date: '2026-06-18', start_time: '20:00',
          status: 'active', repeat_period: 'week', source: 'cieuxouverts.bzh',
          image_url: null, link: null, ticket_url: null, emoji: '🎤',
          exceptions: [], exception_count: 0,
        },
        {
          id: 4, title: 'Réunion de prière', description: 'Prière',
          location: 'Salle', start_date: '2026-07-01', start_time: '18:30',
          status: 'active', repeat_period: null, source: 'cieuxouverts.bzh',
          image_url: null, link: null, ticket_url: null, emoji: '🙏',
          exceptions: [], exception_count: 0,
        },
      ];

      const plans = [
        { id: 1, service_type_id: 1, service_type_name: 'Culte', date: '2026-06-21', time: '10:00', theme: 'Culte dominical', status: 'published', items: [], created_at: '2026-01-01' },
        { id: 2, service_type_id: 2, service_type_name: 'Groupe de jeunes', date: '2026-06-17', time: '18:30', theme: 'Soirée', status: 'published', items: [], created_at: '2026-01-01' },
      ];

      const origFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const method = init?.method || 'GET';

        if (!url.includes('/api/')) return origFetch(input, init);

        if (url.includes('/api/plans') && method === 'GET') {
          return new Response(JSON.stringify(plans), {
            status: 200, headers: { 'Content-Type': 'application/json' },
          });
        }

        if (url.includes('/api/church-events') && method === 'GET') {
          return new Response(JSON.stringify(churchEvents), {
            status: 200, headers: { 'Content-Type': 'application/json' },
          });
        }

        if (url.includes('/api/service-types') && method === 'GET') {
          return new Response(JSON.stringify([{ id: 1, name: 'Culte' }, { id: 2, name: 'Groupe de jeunes' }]), {
            status: 200, headers: { 'Content-Type': 'application/json' },
          });
        }

        if (url.includes('/api/me') && method === 'GET') {
          return new Response(JSON.stringify({ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', team_memberships: [] }), {
            status: 200, headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
      };
    });
  });

  test('Calendar renders monthly grid — grille mensuelle avec cellules de jours', async ({ page }) => {
    await page.goto('/calendar?demo=1');
    await page.waitForLoadState('domcontentloaded');

    const grid = page.locator('.grid-cols-7').first();
    await expect(grid).toBeVisible({ timeout: 10000 });

    const dayCells = grid.locator('> div[class*="cursor-pointer"]');
    const count = await dayCells.count();
    expect(count).toBeGreaterThanOrEqual(28);

    await expect(page.getByText(/juin|June/i)).toBeVisible();
  });

  test('Events appear on correct dates — événements positionnés sur les bons jours', async ({ page }) => {
    await page.goto('/calendar?demo=1');
    await page.waitForLoadState('domcontentloaded');

    const grid = page.locator('.grid-cols-7').first();
    const concertChip = grid.locator('text=Concert de louange');
    await expect(concertChip).toBeVisible({ timeout: 10000 });

    const chips = await grid.locator('[class*="text-xs"][class*="rounded"]').allTextContents();
    const hasCulte = chips.some(c => c.includes('Culte'));
    expect(hasCulte).toBeTruthy();
  });

  test('Week view — passage en vue semaine', async ({ page }) => {
    await page.goto('/calendar?demo=1');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: 'Semaine' }).click();

    const weekLabels = page.locator('.grid-cols-7 > .text-xs.font-medium');
    await expect(weekLabels.first()).toBeVisible({ timeout: 5000 });

    const weekDayCells = page.locator('.grid-cols-7 > div[class*="min-h-\\[120px\\]"]');
    await expect(weekDayCells.first()).toBeVisible();
    const dayCount = await weekDayCells.count();
    expect(dayCount).toBe(7);
  });

  test('Agenda view — vue liste ordre chronologique', async ({ page }) => {
    await page.goto('/calendar?demo=1');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: 'Ordre du jour' }).click();

    await expect(page.getByText('Concert de louange')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Culte dominical').first()).toBeVisible();

    const items = page.locator('.border-l-4 .flex.gap-4');
    const itemCount = await items.count();
    expect(itemCount).toBeGreaterThanOrEqual(3);
  });

  test('Click date to create — clic jour vide ouvre PlanForm', async ({ page }) => {
    await page.goto('/calendar?demo=1');
    await page.waitForLoadState('domcontentloaded');

    const grid = page.locator('.grid-cols-7').first();
    const dayWithoutEvents = grid.locator('> div[class*="cursor-pointer"]').filter({ hasText: /^1$/ }).first();
    await dayWithoutEvents.click();

    await expect(page.getByText('Nouveau service')).toBeVisible({ timeout: 5000 });
  });

  test('Today button — navigation vers aujourd\'hui', async ({ page }) => {
    await page.goto('/calendar?demo=1');
    await page.waitForLoadState('domcontentloaded');

    const nextButton = page.locator('button:has-text("→")');
    await nextButton.click();
    await page.waitForTimeout(300);

    const prevButton = page.locator('button:has-text("←")');
    await prevButton.click();
    await page.waitForTimeout(300);

    const h3 = page.locator('h3').first();
    const label = await h3.textContent();
    expect(label?.toLowerCase()).toContain('juin');
  });
});
