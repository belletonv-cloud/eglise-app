import { test, expect } from '@playwright/test';

test.describe('Présences - Check-in invité', () => {
  test('Ajout d’un invité manuel', async ({ page }) => {
    await page.addInitScript(() => {
      const plans = [{
        id: 1, service_type_id: 10, service_type_name: 'Culte',
        date: new Date(Date.now() + 3600000).toISOString().slice(0, 10),
        time: new Date(Date.now() + 3600000).toISOString().slice(11, 16),
        theme: 'Culte du matin', status: 'published', items: [], created_at: '2099-12-01T08:00:00Z'
      }];
      const attendances: any[] = [];

      const origFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const method = init?.method || 'GET';

        if (!url.includes('/api/')) return origFetch(input, init);

        if (url.endsWith('/api/plans') && method === 'GET') {
          return new Response(JSON.stringify(plans), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (url.endsWith('/api/members') && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (url.endsWith('/api/members') && method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          return new Response(JSON.stringify({ id: 999, ...body }), { status: 201, headers: { 'Content-Type': 'application/json' } });
        }
        if (/\/api\/plans\/\d+\/attendances$/.test(url) && method === 'GET') {
          return new Response(JSON.stringify(attendances), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (url.endsWith('/api/attendances') && method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          const att = { id: 1, ...body, first_name: 'Paul', last_name: 'Martin', check_in_time: new Date().toISOString() };
          attendances.push(att);
          return new Response(JSON.stringify(att), { status: 201, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
      };
    });

    await page.goto('/checkin');

    await page.waitForSelector('[data-testid="plan-item"]', { timeout: 15000 });

    await page.getByTestId('plan-item').first().click();

    await page.waitForSelector('[data-testid="open-manual-checkin"]', { timeout: 10000 });

    await page.click('[data-testid="open-manual-checkin"]');

    await page.fill('[data-testid="manual-first-name"]', 'Paul');
    await page.fill('[data-testid="manual-last-name"]', 'Martin');

    await page.click('[data-testid="manual-checkin-submit"]');

    // Wait for attendance item to appear (check-in completed + list reloaded)
    await expect(
      page.locator('[data-testid="attendance-item"]')
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.locator('[data-testid="attendance-item"]')
    ).toContainText(/Paul Martin/i);
  });
});
