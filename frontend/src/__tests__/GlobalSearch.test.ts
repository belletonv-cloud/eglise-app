import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from './setup'

vi.mock('../firebase', () => ({
  default: {},
  auth: {},
  googleProvider: {},
  firebaseReady: false,
}))

import GlobalSearch from '../components/GlobalSearch.vue'

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(globalThis.fetch).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders search input', () => {
    const wrapper = mount(GlobalSearch)
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('Rechercher...')
  })

  it('has search styling', () => {
    const wrapper = mount(GlobalSearch)
    expect(wrapper.find('.rounded-lg').exists()).toBe(true)
  })

  it('calls the authenticated search endpoint and merges quick links', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 42,
            type: 'member',
            first_name: 'Belle',
            last_name: 'Ton',
            email: 'belle@example.com',
          },
        ],
      }),
    } as Response)

    const wrapper = mount(GlobalSearch)
    await wrapper.find('input').setValue('memb')
    await vi.advanceTimersByTimeAsync(300)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/search?q=memb'),
      expect.any(Object),
    )
    expect(wrapper.text()).toContain('Membres')
    expect(wrapper.text()).toContain('Belle Ton')
  })
})
