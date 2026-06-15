import { describe, it, expect } from 'vitest'
import { mount } from './setup'
import MusicStandMetronome from '../components/musicstand/MusicStandMetronome.vue'

describe('MusicStandMetronome', () => {
  const baseProps = {
    visible: true,
    playing: false,
    bpm: 120,
    meter: 4,
    editBpm: false,
    autoScrollActive: false,
    currentBeat: 0,
  }

  it('renders BPM display', () => {
    const wrapper = mount(MusicStandMetronome, {
      props: baseProps,
    })
    expect(wrapper.text()).toContain('120 BPM')
  })

  it('shows play button when not playing', () => {
    const wrapper = mount(MusicStandMetronome, {
      props: { ...baseProps, playing: false },
    })
    expect(wrapper.text()).toContain('▶')
  })

  it('shows pause button when playing', () => {
    const wrapper = mount(MusicStandMetronome, {
      props: { ...baseProps, playing: true },
    })
    expect(wrapper.text()).toContain('⏸')
  })

  it('does not render when visible is false', () => {
    const wrapper = mount(MusicStandMetronome, {
      props: { ...baseProps, visible: false },
    })
    expect(wrapper.find('.metronome').exists()).toBe(false)
  })

  it('emits close on close button click', () => {
    const wrapper = mount(MusicStandMetronome, {
      props: baseProps,
    })
    wrapper.findAll('button').find(b => b.text() === '✕')?.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits toggle-play on play/pause button click', () => {
    const wrapper = mount(MusicStandMetronome, {
      props: baseProps,
    })
    const playBtn = wrapper.findAll('button').find(b => b.text() === '▶')
    expect(playBtn).toBeTruthy()
    playBtn!.trigger('click')
    expect(wrapper.emitted('toggle-play')).toBeTruthy()
  })

  it('emits change-meter when meter button clicked', () => {
    const wrapper = mount(MusicStandMetronome, {
      props: baseProps,
    })
    const meterBtn = wrapper.findAll('button').find(b => b.text().includes('/4'))
    expect(meterBtn).toBeTruthy()
    meterBtn!.trigger('click')
    expect(wrapper.emitted('change-meter')).toBeTruthy()
  })

  it('renders correct number of beat dots', () => {
    const wrapper = mount(MusicStandMetronome, {
      props: { ...baseProps, meter: 3 },
    })
    const dots = wrapper.findAll('.beat-dot')
    expect(dots).toHaveLength(3)
  })

  it('highlights current beat dot when playing', () => {
    const wrapper = mount(MusicStandMetronome, {
      props: { ...baseProps, playing: true, currentBeat: 1 },
    })
    const dots = wrapper.findAll('.beat-dot')
    expect(dots[1].classes()).toContain('active')
    expect(dots[0].classes()).not.toContain('active')
  })
})
