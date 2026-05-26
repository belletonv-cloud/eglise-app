import { test } from '@playwright/test';

test('Debug DOM – Check-in', async ({ page }) => {

  // Log réseau
  page.on('request', req => console.log('➡️ REQUEST:', req.method(), req.url()));
  page.on('response', res => console.log('⬅️ RESPONSE:', res.status(), res.url()));
  page.on('requestfailed', req => console.log('❌ FAILED:', req.url(), req.failure()?.errorText));

  // Log console
  page.on('console', msg => console.log('🟦 CONSOLE:', msg.type(), msg.text()));

  // Mocks actuels
  await page.route('**/api/plans', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          service_type_id: 10,
          date: '2025-05-25',
          time: '10:00',
          theme: 'Culte du matin',
          status: 'published',
          items: [],
          created_at: '2025-05-20T08:00:00Z'
        }
      ])
    });
  });

  await page.route('**/api/members', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  // Navigation
  await page.goto('/checkin');

  // Login démo si nécessaire
  if (await page.getByText('Démo connectée').isVisible()) {
    await page.getByText('Démo connectée').click();
    await page.goto('/checkin');
  }

  // Attendre 4 secondes pour laisser la SPA rendre
  await page.waitForTimeout(4000);

  // Dump DOM complet
  const html = await page.content();
  console.log('📄 DOM snapshot (2000 chars):', html.slice(0, 2000));

  // Screenshot
  await page.screenshot({ path: 'debug-checkin.png', fullPage: true });
});
