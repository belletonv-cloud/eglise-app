import { describe, it, expect, vi } from 'vitest'
import { mount } from './setup'

vi.mock('../firebase', () => ({
  default: {},
  auth: {},
  googleProvider: {},
  firebaseReady: false,
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
