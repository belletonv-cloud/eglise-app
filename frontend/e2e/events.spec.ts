import { test, expect } from '@playwright/test';

test.describe('Événements — Gestion des événements', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const now = new Date('2026-06-15T12:00:00Z');
      const today = '2026-06-15';

      const churchEvents = [
        {
          id: 1, title: 'Concert de louange', description: 'Concert avec plusieurs groupes',
          location: 'Temple', start_date: '2026-06-20', start_time: '19:00',
          status: 'active', repeat_period: null, source: 'cieuxouverts.bzh',
          image_url: null, link: null, ticket_url: null, emoji: '🎵',
          exceptions: [], exception_count: 0,
        },
        {
          id: 2, title: 'Culte dominical', description: 'Culte du dimanche matin',
          location: 'Temple', start_date: '2026-06-07', start_time: '10:00',
          status: 'active', repeat_period: 'week', source: 'cieuxouverts.bzh',
          image_url: null, link: null, ticket_url: null, emoji: '🙏',
          exceptions: [], exception_count: 0,
        },
        {
          id: 3, title: 'Groupe de jeunes', description: 'Soirée jeunesse',
          location: 'Salle polyvalente', start_date: '2026-06-03', start_time: '18:30',
          status: 'active', repeat_period: 'week', source: 'cieuxouverts.bzh',
          image_url: null, link: null, ticket_url: null, emoji: '🔥',
          exceptions: [], exception_count: 0,
        },
        {
          id: 4, title: 'Réunion de prière', description: 'Prière collective',
          location: 'Salle polyvalente', start_date: '2026-07-01', start_time: '18:30',
          status: 'active', repeat_period: null, source: 'cieuxouverts.bzh',
          image_url: null, link: null, ticket_url: null, emoji: '🙏',
          exceptions: [], exception_count: 0,
        },
        {
          id: 5, title: 'Répétition chorale', description: 'Répétition de la chorale',
          location: 'Temple', start_date: '2026-06-18', start_time: '20:00',
          status: 'active', repeat_period: 'week', source: 'cieuxouverts.bzh',
          image_url: null, link: null, ticket_url: null, emoji: '🎤',
          exceptions: [], exception_count: 0,
        },
        {
          id: 6, title: 'Bible Study', description: 'Étude biblique',
          location: 'Salle 2', start_date: '2026-05-05', start_time: '14:00',
          status: 'active', repeat_period: 'week', source: 'cieuxouverts.bzh',
          image_url: null, link: null, ticket_url: null, emoji: '📖',
          exceptions: [], exception_count: 0,
        },
        {
          id: 7, title: 'Culte mensuel', description: 'Culte une fois par mois',
          location: 'Temple', start_date: '2026-05-01', start_time: '10:00',
          status: 'active', repeat_period: 'month', source: 'cieuxouverts.bzh',
          image_url: null, link: null, ticket_url: null, emoji: '📅',
          exceptions: [], exception_count: 0,
        },
        {
          id: 8, title: 'Anniversaire église', description: 'Fête anniversaire',
          location: 'Temple', start_date: '2026-12-25', start_time: '09:00',
          status: 'active', repeat_period: null, source: 'cieuxouverts.bzh',
          image_url: null, link: null, ticket_url: null, emoji: '🎉',
          exceptions: [], exception_count: 0,
        },
        {
          id: 9, title: 'Événement annulé', description: 'Annulé',
          location: 'Temple', start_date: '2026-06-20', start_time: '15:00',
          status: 'cancelled', repeat_period: null, source: 'cieuxouverts.bzh',
          image_url: null, link: null, ticket_url: null, emoji: '❌',
          exceptions: [], exception_count: 0,
        },
        {
          id: 10, title: 'Matinée café', description: 'Café rencontre',
          location: 'Hall', start_date: '2026-06-22', start_time: '09:00',
          status: 'active', repeat_period: null, source: 'other',
          image_url: null, link: null, ticket_url: null, emoji: '☕',
          exceptions: [], exception_count: 0,
        },
        {
          id: 11, title: 'Conférence', description: 'Conférence annuelle',
          location: 'Centre', start_date: '2026-08-15', start_time: '09:00',
          status: 'active', repeat_period: null, source: 'cieuxouverts.bzh',
          image_url: null, link: 'https://example.com', ticket_url: null, emoji: '🎤',
          exceptions: [], exception_count: 0,
        },
      ];

      const origFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const method = init?.method || 'GET';

        if (!url.includes('/api/')) return origFetch(input, init);

        if (url.includes('/api/church-events') && method === 'GET') {
          return new Response(JSON.stringify(churchEvents), {
            status: 200, headers: { 'Content-Type': 'application/json' },
          });
        }

        if (url.includes('/api/plans') && method === 'GET') {
          const plans = [
            { id: 1, service_type_id: 1, service_type_name: 'Culte', date: '2026-06-21', time: '10:00', theme: 'Culte dominical', status: 'published', items: [], created_at: '2026-01-01' },
          ];
          return new Response(JSON.stringify(plans), {
            status: 200, headers: { 'Content-Type': 'application/json' },
          });
        }

        if (/\/api\/church-events(\/\d+)?$/.test(url) && method === 'POST') {
          return new Response(JSON.stringify({ id: 999, success: true }), {
            status: 201, headers: { 'Content-Type': 'application/json' },
          });
        }

        if (/\/api\/church-events\/\d+/.test(url) && method === 'PUT') {
          return new Response(JSON.stringify({ success: true }), {
            status: 200, headers: { 'Content-Type': 'application/json' },
          });
        }

        if (url.includes('/api/service-types') && method === 'GET') {
          return new Response(JSON.stringify({ data: [{ id: 1, name: 'Culte' }], page: 1, size: 25, totalCount: 1 }), {
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

  test('Événements list loads — affiche les événements récurrents et ponctuels', async ({ page }) => {
    await page.goto('/events?demo=1');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Concert de louange')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Culte dominical').first()).toBeVisible();
    await expect(page.getByText('Répétition chorale').first()).toBeVisible();
  });

  test('Calendar view modes — Mois / Semaine / Cartes / Ordre du jour', async ({ page }) => {
    await page.goto('/calendar?demo=1');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('button', { name: 'Mois' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Semaine' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cartes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ordre du jour' })).toBeVisible();

    await page.getByRole('button', { name: 'Semaine' }).click();
    await page.getByRole('button', { name: 'Cartes' }).click();
    await expect(page.locator('article').first()).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Ordre du jour' }).click();
    await expect(page.getByText('Concert de louange')).toBeVisible({ timeout: 5000 });
  });

  test('Create event — ouvre le formulaire depuis le calendrier', async ({ page }) => {
    await page.goto('/calendar?demo=1');
    await page.waitForLoadState('domcontentloaded');

    const dayCells = page.locator('.grid-cols-7 > div[class*="cursor-pointer"]');
    const clickableDay = dayCells.filter({ hasText: /^15$/ }).first();
    await clickableDay.click();

    await expect(page.getByText('Nouveau service')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[type="time"]')).toBeVisible();
  });

  test('Event detail — modal de détail événement', async ({ page }) => {
    await page.goto('/calendar?demo=1');
    await page.waitForLoadState('domcontentloaded');

    const eventChip = page.locator('text=Concert de louange').first();
    await expect(eventChip).toBeVisible({ timeout: 10000 });
    await eventChip.click();

    await expect(page.getByText('19:00')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Temple')).toBeVisible();
  });

  test('Recurring events — les événements répétés sont affichés', async ({ page }) => {
    await page.goto('/events?demo=1');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText(/Chaque (Lun|Mar|Mer|Jeu|Ven|Sam|Dim)/i).first()).toBeVisible({ timeout: 10000 });

    const recurringSection = page.getByText('Récurrents').locator('..');
    await expect(recurringSection).toBeVisible();

    await expect(page.getByText('Culte dominical').first()).toBeVisible();
  });

  test('Event search/filter — filtre par source', async ({ page }) => {
    await page.goto('/events?demo=1');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Concert de louange')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Cieux Ouverts' }).click();

    await expect(page.getByText('Matinée café')).toHaveCount(0);
    await expect(page.getByText('Concert de louange')).toBeVisible();

    await page.getByRole('button', { name: 'Tout' }).click();
    await expect(page.getByText('Matinée café')).toBeVisible({ timeout: 5000 });
  });

  test('Navigation between months — boutons précédent/suivant', async ({ page }) => {
    await page.goto('/calendar?demo=1');
    await page.waitForLoadState('domcontentloaded');

    const prevButton = page.locator('button:has-text("←")');
    const nextButton = page.locator('button:has-text("→")');
    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();

    const initialLabel = await page.locator('h3').first().textContent();
    await nextButton.click();
    await page.waitForTimeout(500);
    const afterNext = await page.locator('h3').first().textContent();
    expect(afterNext).not.toBe(initialLabel);

    await prevButton.click();
    await page.waitForTimeout(500);
    const afterPrev = await page.locator('h3').first().textContent();
    expect(afterPrev).toBe(initialLabel);
  });
});
