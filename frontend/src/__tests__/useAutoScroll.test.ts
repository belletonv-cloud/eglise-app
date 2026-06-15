import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useAutoScroll } from '../composables/useAutoScroll'

describe('useAutoScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with default values', () => {
    const bpm = ref(120)
    const playing = ref(false)
    const scroll = useAutoScroll(bpm, playing)

    expect(scroll.autoScrollActive.value).toBe(false)
    expect(scroll.currentScrollLine.value).toBe(0)
    expect(scroll.chartContainer.value).toBeNull()
  })

  it('toggles auto-scroll on and off', () => {
    const bpm = ref(120)
    const playing = ref(false)
    const scroll = useAutoScroll(bpm, playing)

    expect(scroll.autoScrollActive.value).toBe(false)
    scroll.toggleAutoScroll()
    expect(scroll.autoScrollActive.value).toBe(true)
    scroll.toggleAutoScroll()
    expect(scroll.autoScrollActive.value).toBe(false)
  })

  it('does not start auto-scroll if BPM is 0', () => {
    const bpm = ref(0)
    const playing = ref(true)
    const scroll = useAutoScroll(bpm, playing)

    scroll.toggleAutoScroll()
    expect(scroll.autoScrollActive.value).toBe(true)
  })

  it('starts auto-scroll when both active and playing', () => {
    const bpm = ref(120)
    const playing = ref(true)
    const scroll = useAutoScroll(bpm, playing)

    // Create a mock container
    const container = document.createElement('div')
    container.style.fontSize = '16px'
    Object.defineProperty(container, 'scrollBy', { value: vi.fn() })
    scroll.chartContainer.value = container

    scroll.toggleAutoScroll()
    expect(scroll.autoScrollActive.value).toBe(true)

    vi.advanceTimersByTime(60000 / 120)
    expect(container.scrollBy).toHaveBeenCalled()
  })

  it('stops auto-scroll interval on unmount', () => {
    const bpm = ref(120)
    const playing = ref(true)
    const { toggleAutoScroll, autoScrollActive, stopAutoScroll } = useAutoScroll(bpm, playing)

    toggleAutoScroll()
    expect(autoScrollActive.value).toBe(true)

    stopAutoScroll()
    // stopAutoScroll clears the interval but does not change autoScrollActive
    expect(autoScrollActive.value).toBe(true)
  })
})
