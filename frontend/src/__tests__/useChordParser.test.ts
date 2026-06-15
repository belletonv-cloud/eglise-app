import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useChordParser } from '../composables/useChordParser'

function createParser(chart, semitones = 0, showChords = true, showLyrics = true, showSections = true) {
  const chordChart = ref(chart)
  const semitonesRef = ref(semitones)
  const showChordsRef = ref(showChords)
  const showLyricsRef = ref(showLyrics)
  const showSectionsRef = ref(showSections)
  return useChordParser(chordChart, semitonesRef, showChordsRef, showLyricsRef, showSectionsRef)
}

describe('useChordParser', () => {
  it('returns empty array for null chart', () => {
    const { parsedLines } = createParser(null)
    expect(parsedLines.value).toEqual([])
  })

  it('returns empty array for empty chart', () => {
    const { parsedLines } = createParser('')
    expect(parsedLines.value).toEqual([])
  })

  it('parses plain text lines', () => {
    const { parsedLines } = createParser('Hello world\nThis is a song')
    expect(parsedLines.value).toHaveLength(2)
    expect(parsedLines.value[0].type).toBe('plain')
    expect(parsedLines.value[0].text).toBe('Hello world')
  })

  it('parses section headers from curly braces', () => {
    const { parsedLines } = createParser('{Verse 1}\nSome lyrics')
    expect(parsedLines.value).toHaveLength(2)
    expect(parsedLines.value[0].type).toBe('section')
    expect(parsedLines.value[0].label).toBe('Verse 1')
  })

  it('parses section headers from brackets', () => {
    const { parsedLines } = createParser('[Chorus]\nSing loud')
    expect(parsedLines.value).toHaveLength(2)
    expect(parsedLines.value[0].type).toBe('section')
  })

  it('hides sections when showSections is false', () => {
    const { parsedLines } = createParser('[Chorus]\nSing loud', 0, true, true, false)
    expect(parsedLines.value).toHaveLength(1)
    expect(parsedLines.value[0].type).toBe('plain')
  })

  it('parses inline chord-lyric lines with [Chord] syntax', () => {
    const { parsedLines } = createParser('[C]Hello [G]world')
    expect(parsedLines.value).toHaveLength(1)
    expect(parsedLines.value[0].type).toBe('chord-lyric')
  })

  it('transposes chords in inline format', () => {
    const { parsedLines } = createParser('[C]Hello [G]world', 2)
    expect(parsedLines.value[0].type).toBe('chord-lyric')
    const parts = parsedLines.value[0].parts
    expect(parts[0].chord).toBe('D')
    expect(parts[1].chord).toBe('A')
  })

  it('parses two-line chord format (chord line + lyric line)', () => {
    const { parsedLines } = createParser('C   G   Am\nHello world!')
    expect(parsedLines.value).toHaveLength(1)
    const line = parsedLines.value[0]
    expect(line.type).toBe('chord-lyric')
    expect(line.parts).toHaveLength(3)
  })

  it('hides chords when showChords is false', () => {
    const { parsedLines } = createParser('[C]Hello', 0, false, true)
    expect(parsedLines.value[0].parts[0].chord).toBe('')
    expect(parsedLines.value[0].parts[0].lyric).toBe('Hello')
  })

  it('hides lyrics when showLyrics is false', () => {
    const { parsedLines } = createParser('[C]Hello', 0, true, false)
    expect(parsedLines.value[0].parts[0].lyric).toBe('')
  })
})
