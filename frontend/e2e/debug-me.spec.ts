import { test } from '@playwright/test';

test('Debug /api/me – capture URL réelle', async ({ page }) => {

  // 🔥 SUPER TRACE RÉSEAU AVANT TOUT MOCK
  page.on('request', req => {
    console.log('➡️ REQUEST:', req.method(), req.url());
  });

  page.on('response', res => {
    console.log('⬅️ RESPONSE:', res.status(), res.url());
  });

  page.on('requestfailed', req => {
    console.log('❌ FAILED:', req.url(), req.failure()?.errorText);
  });

  // 🚫 Aucun mock ici — on veut voir l’URL brute
  // Navigation directe
  await page.goto('/checkin');

  // Attendre un peu pour laisser la SPA faire ses appels
  await page.waitForTimeout(3000);
});
