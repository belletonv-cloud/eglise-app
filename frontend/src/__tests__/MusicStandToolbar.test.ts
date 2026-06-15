import { describe, it, expect } from 'vitest'
import { mount } from './setup'
import MusicStandToolbar from '../components/musicstand/MusicStandToolbar.vue'

describe('MusicStandToolbar', () => {
  const baseProps = {
    songTitle: 'Monument',
    arrangement: { id: 10, key: 'E' },
    currentKey: 'E',
    prevSongId: null,
    nextSongId: null,
    setlistSongs: [],
    showSetlist: false,
    metronomePlaying: false,
    autoScrollActive: false,
    stageMode: false,
    showNotes: false,
    canvasActive: false,
  }

  it('renders song title', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: baseProps,
    })
    expect(wrapper.text()).toContain('Monument')
  })

  it('renders key badge', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: baseProps,
    })
    expect(wrapper.find('.key-badge').exists()).toBe(true)
    expect(wrapper.find('.key-badge').text()).toBe('E')
  })

  it('renders transposition buttons', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: baseProps,
    })
    expect(wrapper.text()).toContain('−')
    expect(wrapper.text()).toContain('+')
  })

  it('emits transpose with -1 on minus button', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: baseProps,
    })
    const minusBtn = wrapper.findAll('.toolbar-btn').find(
      b => b.text() === '−'
    )
    expect(minusBtn).toBeTruthy()
    minusBtn!.trigger('click')
    expect(wrapper.emitted('transpose')).toBeTruthy()
    expect(wrapper.emitted('transpose')![0][0]).toBe(-1)
  })

  it('emits transpose with 1 on plus button', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: baseProps,
    })
    const plusBtn = wrapper.findAll('.toolbar-btn').find(
      b => b.text() === '+'
    )
    expect(plusBtn).toBeTruthy()
    plusBtn!.trigger('click')
    expect(wrapper.emitted('transpose')![0][0]).toBe(1)
  })

  it('does not show prev/next buttons when ids are null', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: baseProps,
    })
    expect(wrapper.text()).not.toContain('⏮')
    expect(wrapper.text()).not.toContain('⏭')
  })

  it('shows prev button when prevSongId is set', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: { ...baseProps, prevSongId: 1 },
    })
    expect(wrapper.text()).toContain('⏮')
  })

  it('shows next button when nextSongId is set', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: { ...baseProps, nextSongId: 2 },
    })
    expect(wrapper.text()).toContain('⏭')
  })

  it('emits go-prev on prev button click', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: { ...baseProps, prevSongId: 1 },
    })
    const prevBtn = wrapper.findAll('.toolbar-btn').find(
      b => b.text() === '⏮'
    )
    expect(prevBtn).toBeTruthy()
    prevBtn!.trigger('click')
    expect(wrapper.emitted('go-prev')).toBeTruthy()
  })

  it('emits go-next on next button click', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: { ...baseProps, nextSongId: 2 },
    })
    const nextBtn = wrapper.findAll('.toolbar-btn').find(
      b => b.text() === '⏭'
    )
    expect(nextBtn).toBeTruthy()
    nextBtn!.trigger('click')
    expect(wrapper.emitted('go-next')).toBeTruthy()
  })

  it('emits back on back button click', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: baseProps,
    })
    const backBtn = wrapper.findAll('.toolbar-btn').find(
      b => b.text() === '←'
    )
    expect(backBtn).toBeTruthy()
    backBtn!.trigger('click')
    expect(wrapper.emitted('back')).toBeTruthy()
  })

  it('emits toggle-metronome on metronome button click', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: baseProps,
    })
    const metroBtn = wrapper.findAll('.toolbar-btn').find(
      b => b.text() === '♩'
    )
    expect(metroBtn).toBeTruthy()
    metroBtn!.trigger('click')
    expect(wrapper.emitted('toggle-metronome')).toBeTruthy()
  })

  it('emits toggle-auto-scroll on auto-scroll button click', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: baseProps,
    })
    const scrollBtn = wrapper.findAll('.toolbar-btn').find(
      b => b.text() === '⟳'
    )
    expect(scrollBtn).toBeTruthy()
    scrollBtn!.trigger('click')
    expect(wrapper.emitted('toggle-auto-scroll')).toBeTruthy()
  })

  it('emits toggle-stage-mode on stage mode button click', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: baseProps,
    })
    const stageBtn = wrapper.findAll('.toolbar-btn').find(
      b => b.text() === '🌙'
    )
    expect(stageBtn).toBeTruthy()
    stageBtn!.trigger('click')
    expect(wrapper.emitted('toggle-stage-mode')).toBeTruthy()
  })

  it('emits toggle-setlist when setlist button is visible and clicked', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: { ...baseProps, setlistSongs: [{ id: 1 }] },
    })
    const setlistBtn = wrapper.findAll('.toolbar-btn').find(
      b => b.text() === '☰'
    )
    expect(setlistBtn).toBeTruthy()
    setlistBtn!.trigger('click')
    expect(wrapper.emitted('toggle-setlist')).toBeTruthy()
  })

  it('shows notes and canvas buttons when arrangement is provided', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: baseProps,
    })
    expect(wrapper.text()).toContain('📝')
    expect(wrapper.text()).toContain('✏️')
  })

  it('hides notes and canvas buttons when arrangement is null', () => {
    const wrapper = mount(MusicStandToolbar, {
      props: { ...baseProps, arrangement: null },
    })
    expect(wrapper.text()).not.toContain('📝')
    expect(wrapper.text()).not.toContain('✏️')
  })
})
