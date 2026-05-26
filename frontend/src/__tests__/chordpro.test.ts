import { describe, it, expect } from 'vitest'
import { parseChordPro } from '../utils/chordpro'

describe('parseChordPro', () => {
  it('returns empty array for empty input', () => {
    const result = parseChordPro('')
    expect(result).toEqual([])
  })

  it('returns empty array for null/undefined input', () => {
    expect(parseChordPro(null as any)).toEqual([])
    expect(parseChordPro(undefined as any)).toEqual([])
  })

  it('parses empty lines as empty type', () => {
    const result = parseChordPro('\n')
    expect(result[0].type).toBe('empty')
  })

  it('detects standalone chord lines with inline brackets', () => {
    const result = parseChordPro('[C]  [G]  [Am]')
    expect(result[0].type).toBe('standalone')
    expect(result[0].segments).toHaveLength(3)
  })

  it('detects lyrics lines with inline chords', () => {
    const result = parseChordPro("[C]C'est un [G]chant")
    expect(result[0].type).toBe('normal')
    expect(result[0].segments).toBeDefined()
    expect(result[0].segments[0].chord).toBe('C')
    expect(result[0].lyrics).toContain("C'est un")
  })

  it('treats lines without brackets as normal lyrics', () => {
    const result = parseChordPro('C   G   Am')
    expect(result[0].type).toBe('normal')
    expect(result[0].segments).toHaveLength(0)
    expect(result[0].lyrics).toBe('C   G   Am')
  })

  it('handles multiple lines', () => {
    const chart = `[Am]C'est un [G]chant\nC   G   Am`
    const result = parseChordPro(chart)
    expect(result).toHaveLength(2)
    expect(result[0].type).toBe('normal')
    expect(result[0].segments.length).toBeGreaterThan(0)
    expect(result[1].type).toBe('normal')
  })
})
