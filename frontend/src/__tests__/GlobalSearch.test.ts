import { describe, it, expect, vi } from 'vitest'
import { mount } from './setup'

vi.mock('../firebase', () => ({
  default: {},
  auth: { onAuthStateChanged: vi.fn() },
}))

import GlobalSearch from '../components/GlobalSearch.vue'

describe('GlobalSearch', () => {
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
})
