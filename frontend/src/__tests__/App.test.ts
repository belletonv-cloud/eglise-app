import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {}, query: {} }),
  RouterLink: { template: '<a><slot /></a>' },
  createRouter: () => ({ push: vi.fn(), beforeEach: vi.fn() }),
  createWebHistory: () => ({}),
}))

// Mock firebase
vi.mock('../firebase', () => ({
  default: {},
  auth: {},
  googleProvider: {},
  firebaseReady: false,
}))

describe('App', () => {
  it('can import App component', async () => {
    const App = await import('../App.vue')
    expect(App.default).toBeDefined()
  })
})
