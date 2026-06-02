import { test, expect } from '@playwright/test';

function installCheckinMocks(page: any) {
  return page.addInitScript(() => {
    const plan = {
      id: 1,
      service_type_id: 10,
      service_type_name: 'Culte',
      date: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10),
      time: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(11, 16),
      theme: 'Culte du matin',
      status: 'published',
      items: [],
      created_at: '2099-12-01T08:00:00Z',
      attendance_count: 0,
    };

    const members = [
      { id: 1, first_name: 'Jean', last_name: 'Dupont', email: 'jean.dupont@test.local' },
      { id: 2, first_name: 'Jeanne', last_name: 'Martin', email: 'jeanne.martin@test.local' },
    ];

    const attendances: any[] = [];
    let nextAttendanceId = 1;

    const origFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = (init?.method || 'GET').toUpperCase();

      if (!url.includes('/api/')) return origFetch(input, init);

      // Plans
      if (url.endsWith('/api/plans') && method === 'GET') {
        return new Response(JSON.stringify([plan]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // Members
      if (url.includes('/api/members') && method === 'GET') {
        return new Response(JSON.stringify(members), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // Attendances list for a plan
      if (/\/api\/plans\/\d+\/attendances$/.test(url) && method === 'GET') {
        return new Response(JSON.stringify(attendances), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // Create attendance
      if (url.endsWith('/api/attendances') && method === 'POST') {
        const body = JSON.parse((init?.body as string) || '{}');
        const exists = attendances.some(a => a.plan_id === body.plan_id && a.member_id === body.member_id);
        if (exists) {
          return new Response(JSON.stringify({ error: 'duplicate' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
        }
        const member = members.find(m => m.id === body.member_id);
        const att = {
          id: nextAttendanceId++,
          ...body,
          first_name: member?.first_name || 'Jean',
          last_name: member?.last_name || 'Dupont',
          check_in_time: new Date().toISOString(),
        };
        attendances.push(att);
        return new Response(JSON.stringify(att), { status: 201, headers: { 'Content-Type': 'application/json' } });
      }

      // Delete attendance
      if (/\/api\/attendances\/\d+$/.test(url) && method === 'DELETE') {
        const id = Number(url.split('/').pop());
        const idx = attendances.findIndex(a => a.id === id);
        if (idx >= 0) attendances.splice(idx, 1);
        return new Response(JSON.stringify({ deleted: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
  });
}

test.describe('Présences - Check-in membre', () => {
  test('Check-in normal et check-out', async ({ page }) => {
    await installCheckinMocks(page);

    await page.goto('/checkin?demo=1');
    await page.click('[data-testid="plan-item"]:nth-child(1)');

    await page.fill('[data-testid="search-input"]', 'Jean');
    await page.waitForTimeout(300);

    await page.click('[data-testid="checkin-button"]');
    await expect(
      page.getByRole('status').filter({ hasText: /ajouté/i })
    ).toContainText(/ajouté.*succès/i);

    await expect(page.locator('[data-testid="attendance-item"]')).toContainText(/Jean/i);

    await page.click('[data-testid="checkout-button"]');
    await expect(
      page.getByRole('status').filter({ hasText: /retiré/i })
    ).toContainText(/retiré/i);
  });

  test('Empêche le doublon check-in', async ({ page }) => {
    await installCheckinMocks(page);

    await page.goto('/checkin?demo=1');
    await page.click('[data-testid="plan-item"]:nth-child(1)');

    await page.fill('[data-testid="search-input"]', 'Jean');
    await page.waitForTimeout(300);

    await page.click('[data-testid="checkin-button"]');
    await expect(page.locator('[data-testid="attendance-item"]')).toBeVisible({ timeout: 5000 });

    await page.click('[data-testid="checkin-button"]');
    await expect(
      page.getByRole('status').filter({ hasText: /déjà/i })
    ).toContainText(/déjà présent/i);
  });
});
