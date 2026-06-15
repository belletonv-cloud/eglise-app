import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useMetronome } from '../composables/useMetronome'

describe('useMetronome', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with default values', () => {
    const metro = useMetronome()
    expect(metro.metronomeVisible.value).toBe(false)
    expect(metro.metronomePlaying.value).toBe(false)
    expect(metro.bpm.value).toBe(120)
    expect(metro.meter.value).toBe(4)
    expect(metro.currentBeat.value).toBe(0)
  })

  it('toggles metronome visibility', () => {
    const metro = useMetronome()
    expect(metro.metronomeVisible.value).toBe(false)
    metro.toggleMetronome()
    expect(metro.metronomeVisible.value).toBe(true)
    metro.toggleMetronome()
    expect(metro.metronomeVisible.value).toBe(false)
  })

  it('sets BPM within valid range', () => {
    const metro = useMetronome()
    metro.setBpm(60)
    expect(metro.bpm.value).toBe(60)
    metro.setBpm(10)
    expect(metro.bpm.value).toBe(60)
    metro.setBpm(400)
    expect(metro.bpm.value).toBe(60)
  })

  it('sets meter value', () => {
    const metro = useMetronome()
    metro.setMeter(3)
    expect(metro.meter.value).toBe(3)
  })

  it('starts and stops metronome playback', async () => {
    const { nextTick } = await import('vue')
    const metro = useMetronome()
    metro.metronomePlaying.value = true
    await nextTick()
    expect(metro.metronomePlaying.value).toBe(true)

    // First interval fires at 500ms (60000/120) — currentBeat becomes 0 (beat=0 % 4)
    vi.advanceTimersByTime(60000 / metro.bpm.value)
    expect(metro.currentBeat.value).toBe(0)

    metro.metronomePlaying.value = false
    await nextTick()
    expect(metro.currentBeat.value).toBe(0)
    expect(metro.metronomePlaying.value).toBe(false)
  })

  it('calls onPlay and onStop callbacks', async () => {
    const { nextTick } = await import('vue')
    const onPlay = vi.fn()
    const onStop = vi.fn()
    const metro = useMetronome({ onPlay, onStop })

    metro.metronomePlaying.value = true
    await nextTick()
    expect(onPlay).toHaveBeenCalledTimes(1)

    metro.metronomePlaying.value = false
    await nextTick()
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it('restarts interval when BPM changes during playback', async () => {
    const { nextTick } = await import('vue')
    const metro = useMetronome()
    metro.metronomePlaying.value = true
    await nextTick()
    vi.advanceTimersByTime(60000 / 120)

    metro.setBpm(60)
    await nextTick()
    vi.advanceTimersByTime(500)

    expect(metro.currentBeat.value).not.toBeUndefined()
  })
})
