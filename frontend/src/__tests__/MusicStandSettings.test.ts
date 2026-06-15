import { describe, it, expect } from 'vitest'
import { mount } from './setup'
import MusicStandSettings from '../components/musicstand/MusicStandSettings.vue'

describe('MusicStandSettings', () => {
  const baseProps = {
    visible: true,
    showChords: true,
    showLyrics: false,
    showSections: true,
    fontSize: 28,
  }

  it('renders with showChords/Lyrics/Sections checkboxes', () => {
    const wrapper = mount(MusicStandSettings, { props: baseProps })
    expect(wrapper.find('.settings-panel').exists()).toBe(true)
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes).toHaveLength(3)
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false)
    expect((checkboxes[2].element as HTMLInputElement).checked).toBe(true)
  })

  it('checkbox changes emit update events', async () => {
    const wrapper = mount(MusicStandSettings, { props: baseProps })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')

    await checkboxes[0].setValue(false)
    expect(wrapper.emitted('update:showChords')).toBeTruthy()
    expect(wrapper.emitted('update:showChords')![0][0]).toBe(false)

    await checkboxes[1].setValue(true)
    expect(wrapper.emitted('update:showLyrics')).toBeTruthy()
    expect(wrapper.emitted('update:showLyrics')![0][0]).toBe(true)

    await checkboxes[2].setValue(false)
    expect(wrapper.emitted('update:showSections')).toBeTruthy()
    expect(wrapper.emitted('update:showSections')![0][0]).toBe(false)
  })

  it('font size slider emits update:fontSize', async () => {
    const wrapper = mount(MusicStandSettings, { props: baseProps })
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue(36)
    expect(wrapper.emitted('update:fontSize')).toBeTruthy()
    expect(wrapper.emitted('update:fontSize')![0][0]).toBe(36)
  })

  it('displays current fontSize value', () => {
    const wrapper = mount(MusicStandSettings, { props: baseProps })
    expect(wrapper.text()).toContain('28px')
  })

  it('renders nothing when visible is false', () => {
    const wrapper = mount(MusicStandSettings, {
      props: { ...baseProps, visible: false },
    })
    expect(wrapper.find('.settings-panel').exists()).toBe(false)
  })
})
