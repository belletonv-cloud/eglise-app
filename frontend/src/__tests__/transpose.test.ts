import { describe, it, expect } from 'vitest'
import { transposeChord, transposeChordChart, getKeyOptions, getSemitonesFromC } from '../utils/transpose'

describe('transposeChord', () => {
  it('transposes C up by 1 semitone to C#', () => {
    expect(transposeChord('C', 1)).toBe('C#')
  })

  it('transposes C up by 2 semitones to D', () => {
    expect(transposeChord('C', 2)).toBe('D')
  })

  it('transposes C down by 1 semitone to B', () => {
    expect(transposeChord('C', -1)).toBe('B')
  })

  it('preserves chord suffixes (m, 7, sus4, etc.)', () => {
    expect(transposeChord('Am', 2)).toBe('Bm')
    expect(transposeChord('G7', 1)).toBe('G#7')
    expect(transposeChord('Dsus4', 3)).toBe('Fsus4')
    expect(transposeChord('Cmaj7', 2)).toBe('Dmaj7')
  })

  it('handles flat chords', () => {
    expect(transposeChord('Bb', 2)).toBe('C')
    expect(transposeChord('Eb', 1)).toBe('E')
    expect(transposeChord('Db', 1)).toBe('D')
  })

  it('wraps around at octave boundary', () => {
    expect(transposeChord('B', 1)).toBe('C')
    expect(transposeChord('C', -1)).toBe('B')
    expect(transposeChord('G', 5)).toBe('C')
    expect(transposeChord('C', -5)).toBe('G')
  })

  it('preserves bass notes partially (note transposed, suffix preserved)', () => {
    const result = transposeChord('C/E', 2)
    expect(result.startsWith('D')).toBe(true)
    expect(result).toContain('/')
  })

  it('returns original chord for 0 semitones', () => {
    expect(transposeChord('Am', 0)).toBe('Am')
  })
})

describe('getSemitonesFromC', () => {
  it('returns 0 for C', () => {
    expect(getSemitonesFromC('C')).toBe(0)
  })

  it('returns correct values for sharp keys', () => {
    expect(getSemitonesFromC('G')).toBe(7)
    expect(getSemitonesFromC('D')).toBe(2)
    expect(getSemitonesFromC('A')).toBe(9)
  })

  it('returns correct values for flat keys', () => {
    expect(getSemitonesFromC('F')).toBe(5)
    expect(getSemitonesFromC('Bb')).toBe(10)
    expect(getSemitonesFromC('Eb')).toBe(3)
  })

  it('returns 0 for unknown keys (includes minor keys)', () => {
    expect(getSemitonesFromC('Am')).toBe(0)
    expect(getSemitonesFromC('Em')).toBe(0)
  })
})

describe('getKeyOptions', () => {
  it('returns 12 key options as strings', () => {
    const options = getKeyOptions()
    expect(options).toHaveLength(12)
  })

  it('includes all standard keys', () => {
    const options = getKeyOptions()
    expect(options).toContain('C')
    expect(options).toContain('G')
    expect(options).toContain('D')
    expect(options).toContain('A')
    expect(options).toContain('E')
    expect(options).toContain('F')
  })
})

describe('transposeChordChart', () => {
  it('transposes an entire chord chart from one key to another', () => {
    const chart = `{key:C}
C    G    Am    F
C'est un chant`
    const result = transposeChordChart(chart, 'C', 'D')
    expect(result).toContain('{key:C}')
    expect(result).toContain('D    A    Bm    G')
  })

  it('preserves directive lines (starting with {)', () => {
    const chart = `{key:C}
{tempo:72}
C    G`
    const result = transposeChordChart(chart, 'C', 'D')
    expect(result).toContain('{key:C}')
    expect(result).toContain('{tempo:72}')
    expect(result).toContain('D    A')
  })

  it('transposes inline chords in lyrics', () => {
    const chart = `[C]Bon [G]soir`
    const result = transposeChordChart(chart, 'C', 'D')
    expect(result).toContain('[D]Bon [A]soir')
  })

  it('handles empty charts', () => {
    expect(transposeChordChart('', 'C', 'D')).toBe('')
  })

  it('returns original chart for unknown keys', () => {
    const chart = 'C    G'
    expect(transposeChordChart(chart, 'X', 'C')).toBe(chart)
  })
})
