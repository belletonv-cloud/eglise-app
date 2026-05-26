import { test } from '@playwright/test';

test('Debug complet réseau – Check-in', async ({ page }) => {

  // Log toutes les requêtes
  page.on('request', req => {
    console.log('➡️ REQUEST:', req.method(), req.url());
  });

  // Log toutes les réponses
  page.on('response', res => {
    console.log('⬅️ RESPONSE:', res.status(), res.url());
  });

  // Log les requêtes échouées
  page.on('requestfailed', req => {
    console.log('❌ FAILED:', req.url(), req.failure()?.errorText);
  });

  await page.goto('/checkin');

  // Login démo si présent
  if (await page.getByText('Démo connectée').isVisible()) {
    await page.getByText('Démo connectée').click();
    await page.goto('/checkin');
  }

  // Laisser la SPA faire tous ses fetch
  await page.waitForTimeout(4000);

  // Dump du DOM visible
  const html = await page.content();
  console.log('📄 DOM snapshot:', html.slice(0, 2000));
});
