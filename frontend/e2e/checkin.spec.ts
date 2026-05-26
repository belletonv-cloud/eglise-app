import { test, expect } from '@playwright/test';

test.describe('Présences - Check-in membre', () => {
  test('Check-in normal et check-out', async ({ page }) => {
    await page.goto('/checkin');
    // Sélection d’un plan
    await page.click('[data-testid="plan-item"]:nth-child(1)');

    // Recherche d’un membre
    await page.fill('[data-testid="search-input"]', 'Jean');
    await page.waitForTimeout(300); // debounce/requête

    // Check-in
    await page.click('[data-testid="checkin-button"]');
    // Vérifie le toast succès (aria-live sur [role="status"] ou [aria-live])
    await expect(page.locator('[role="status"], [aria-live]')).toContainText(/présence.*ajoutée/i);

    // Présence dans liste d’appel
    await expect(page.locator('[data-testid="attendance-item"]')).toContainText(/Jean/i);

    // Check-out
    await page.click('[data-testid="checkout-button"]');
    await expect(page.locator('[role="status"], [aria-live]')).toContainText(/présence.*retirée/i);
  });

  test('Empêche le doublon check-in', async ({ page }) => {
    await page.goto('/checkin');
    await page.click('[data-testid="plan-item"]:nth-child(1)');
    await page.fill('[data-testid="search-input"]', 'Jean');
    await page.waitForTimeout(300);
    await page.click('[data-testid="checkin-button"]');
    // Nouvelle tentative sur même personne
    await page.click('[data-testid="checkin-button"]');
    // Attente toast erreur
    await expect(page.locator('[role="status"], [aria-live]')).toContainText(/déjà.*pointé/i);
  });
});
