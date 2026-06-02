import { test, expect } from '@playwright/test'

test.describe('Navigation - HTTP Status', () => {
  test('dashboard returns 200', async ({ page }) => {
    const res = await page.goto('/dashboard?demo=1')
    expect(res?.status()).toBe(200)
  })

  test('members page returns 200', async ({ page }) => {
    const res = await page.goto('/members?demo=1')
    expect(res?.status()).toBe(200)
  })

  test('songs page returns 200', async ({ page }) => {
    const res = await page.goto('/songs?demo=1')
    expect(res?.status()).toBe(200)
  })

  test('historique returns 200', async ({ page }) => {
    const res = await page.goto('/historique?demo=1')
    expect(res?.status()).toBe(200)
  })

  test('annuaire returns 200', async ({ page }) => {
    const res = await page.goto('/annuaire?demo=1')
    expect(res?.status()).toBe(200)
  })

  test('sondages returns 200', async ({ page }) => {
    const res = await page.goto('/sondages?demo=1')
    expect(res?.status()).toBe(200)
  })

  test('annonces returns 200', async ({ page }) => {
    const res = await page.goto('/annonces?demo=1')
    expect(res?.status()).toBe(200)
  })

  test('checkin returns 200', async ({ page }) => {
    const res = await page.goto('/checkin?demo=1')
    expect(res?.status()).toBe(200)
  })

  test('home (plans) returns 200', async ({ page }) => {
    const res = await page.goto('/?demo=1')
    expect(res?.status()).toBe(200)
  })
})
