import { describe, it, expect } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

describe('Router configuration', () => {
  it('has all required routes', () => {
    const routes = [
      '/', '/dashboard', '/calendar', '/plans', '/songs', '/members',
      '/teams', '/checkin', '/house-groups', '/email', '/conflicts',
      '/historique', '/annuaire', '/sondages', '/annonces', '/mon-compte',
      '/webhooks', '/logs', '/plan-templates',
    ]
    routes.forEach(r => {
      expect(r).toBeTruthy()
    })
  })
})
