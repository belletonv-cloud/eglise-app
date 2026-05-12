import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('../firebase', () => ({
  default: {},
  auth: { onAuthStateChanged: vi.fn() },
}))

import Login from '../components/Login.vue'

describe('Login', () => {
  it('renders login button', () => {
    const wrapper = mount(Login)
    expect(wrapper.text()).toContain('Connexion')
  })

  it('has Google sign-in button', () => {
    const wrapper = mount(Login)
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
