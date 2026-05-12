import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Toasts from '../components/Toasts.vue'
import { useToast } from '../stores/toast'

beforeEach(() => {
  const { state } = useToast()
  state.items.splice(0)
})

describe('Toasts', () => {
  it('renders toasts container', () => {
    const wrapper = mount(Toasts)
    expect(wrapper.find('.fixed').exists()).toBe(true)
  })

  it('displays toast messages', () => {
    const { show, state } = useToast()
    show('Test message', 'success')
    expect(state.items.length).toBeGreaterThan(0)
    expect(state.items[0].message).toBe('Test message')
  })

  it('removes toast after timeout', () => {
    vi.useFakeTimers()
    const { show, state } = useToast()
    show('Auto dismiss', 'success', 100)
    expect(state.items.length).toBe(1)
    vi.advanceTimersByTime(200)
    expect(state.items.length).toBe(0)
    vi.useRealTimers()
  })
})
