import { test, expect } from '@playwright/test'

test.describe('Navigation - HTTP Status', () => {
  test('dashboard returns 200', async ({ page }) => {
    const res = await page.goto('/dashboard')
    expect(res?.status()).toBe(200)
  })

  test('members page returns 200', async ({ page }) => {
    const res = await page.goto('/members')
    expect(res?.status()).toBe(200)
  })

  test('songs page returns 200', async ({ page }) => {
    const res = await page.goto('/songs')
    expect(res?.status()).toBe(200)
  })

  test('historique returns 200', async ({ page }) => {
    const res = await page.goto('/historique')
    expect(res?.status()).toBe(200)
  })

  test('annuaire returns 200', async ({ page }) => {
    const res = await page.goto('/annuaire')
    expect(res?.status()).toBe(200)
  })

  test('sondages returns 200', async ({ page }) => {
    const res = await page.goto('/sondages')
    expect(res?.status()).toBe(200)
  })

  test('annonces returns 200', async ({ page }) => {
    const res = await page.goto('/annonces')
    expect(res?.status()).toBe(200)
  })

  test('checkin returns 200', async ({ page }) => {
    const res = await page.goto('/checkin')
    expect(res?.status()).toBe(200)
  })

  test('home (plans) returns 200', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)
  })
})
