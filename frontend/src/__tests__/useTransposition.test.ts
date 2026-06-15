import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useTransposition, transposeChord, keyOptions } from '../composables/useTransposition'

describe('useTransposition', () => {
  it('initializes with default values', () => {
    const hook = useTransposition()
    expect(hook.semitones.value).toBe(0)
    expect(hook.originalKey.value).toBe('C')
    expect(hook.currentKey.value).toBe('C')
    expect(hook.keyOptions).toHaveLength(12)
  })

  it('transposes up by delta', () => {
    const hook = useTransposition()
    hook.transpose(2)
    expect(hook.semitones.value).toBe(2)
    expect(hook.currentKey.value).toBe('D')
  })

  it('transposes down by delta', () => {
    const hook = useTransposition()
    hook.transpose(-1)
    expect(hook.semitones.value).toBe(11)
    expect(hook.currentKey.value).toBe('B')
  })

  it('wraps around at 12 semitones', () => {
    const hook = useTransposition()
    hook.transpose(7)
    hook.transpose(7)
    expect(hook.semitones.value).toBe(2)
    expect(hook.currentKey.value).toBe('D')
  })

  it('sets key from original', () => {
    const hook = useTransposition()
    hook.setKey('G')
    expect(hook.semitones.value).toBe(7)
    expect(hook.currentKey.value).toBe('G')
  })

  it('resets semitones to 0 when setting original key again', () => {
    const hook = useTransposition()
    hook.transpose(3)
    hook.setKey('C')
    expect(hook.semitones.value).toBe(0)
    expect(hook.currentKey.value).toBe('C')
  })
})

describe('transposeChord standalone function', () => {
  it('transposes C up by 1 to C#', () => {
    expect(transposeChord('C', 1)).toBe('C#')
  })

  it('transposes C down by 1 to B', () => {
    expect(transposeChord('C', -1)).toBe('B')
  })

  it('preserves chord suffixes', () => {
    expect(transposeChord('Am', 2)).toBe('Bm')
    expect(transposeChord('G7', 1)).toBe('G#7')
    expect(transposeChord('Dsus4', 3)).toBe('Fsus4')
  })

  it('returns original for 0 semitones', () => {
    expect(transposeChord('F', 0)).toBe('F')
  })

  it('handles bass notes (transposes root only)', () => {
    const result = transposeChord('C/E', 2)
    expect(result).toBe('D/E')
  })
})
