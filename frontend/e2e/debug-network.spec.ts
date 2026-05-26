import { test } from '@playwright/test';

test('Debug réseau – URL plans', async ({ page }) => {

  // Log toutes les requêtes réseau
  page.on('request', req => {
    console.log('➡️  REQUEST:', req.method(), req.url());
  });

  await page.goto('/checkin');

  // Login démo si présent
  if (await page.getByText('Démo connectée').isVisible()) {
    await page.getByText('Démo connectée').click();
    await page.goto('/checkin');
  }

  // Attendre un peu pour laisser la SPA faire ses fetch
  await page.waitForTimeout(3000);
});
