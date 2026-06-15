import { describe, it, expect } from 'vitest'
import { mount } from './setup'
import ContextHelp from '../components/ContextHelp.vue'

describe('ContextHelp', () => {
  it('renders help button', () => {
    const wrapper = mount(ContextHelp, {
      props: { text: 'Help text here' },
    })
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('does not show help content initially', () => {
    const wrapper = mount(ContextHelp, {
      props: { text: 'Help text here' },
    })
    expect(wrapper.text()).not.toContain('Help text here')
  })

  it('shows help content when button is clicked', async () => {
    const wrapper = mount(ContextHelp, {
      props: { text: 'Help text here' },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('Help text here')
  })

  it('renders slot content when provided', async () => {
    const wrapper = mount(ContextHelp, {
      props: { text: 'Default text' },
      slots: { default: 'Slot content' },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('Slot content')
    expect(wrapper.text()).not.toContain('Default text')
  })

  it('hides content when show is toggled off', async () => {
    const wrapper = mount(ContextHelp, {
      props: { text: 'Help text here' },
    })
    const btn = wrapper.find('button')
    await btn.trigger('click')
    expect(wrapper.text()).toContain('Help text here')
    await btn.trigger('click')
    expect(wrapper.text()).not.toContain('Help text here')
  })
})
