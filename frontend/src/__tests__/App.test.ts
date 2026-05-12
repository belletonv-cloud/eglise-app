import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {}, query: {} }),
  RouterLink: { template: '<a><slot /></a>' },
}))

// Mock firebase
vi.mock('../firebase', () => ({
  default: {},
  auth: { onAuthStateChanged: vi.fn() },
}))

describe('App', () => {
  it('can import App component', async () => {
    const App = await import('../App.vue')
    expect(App.default).toBeDefined()
  })
})
