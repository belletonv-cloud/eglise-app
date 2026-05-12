import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '../components/ConfirmDialog.vue'

describe('ConfirmDialog', () => {
  it('renders dialog component', () => {
    const wrapper = mount(ConfirmDialog)
    expect(wrapper.exists()).toBe(true)
  })
})
