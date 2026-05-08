export interface ChordSegment {
  chord: string
  col: number
}

export interface ParsedLine {
  type: 'empty' | 'standalone' | 'normal'
  chordRow: string
  lyrics: string
  segments: ChordSegment[]
}

export function parseChordPro(text: string): ParsedLine[] {
  if (!text) return []

  return text.split('\n').map((line: string) => {
    if (line.trim() === '') return { type: 'empty' as const, chordRow: '', lyrics: '', segments: [] }

    const segments: ChordSegment[] = []
    let lyrics = line
    let offset = 0
    const regex = /\[([^\]]+)\]/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(line)) !== null) {
      const chord = match[1] || ''
      const posInLyrics = match.index - offset
      segments.push({ chord, col: posInLyrics })
      lyrics = lyrics.replace(match[0], '')
      offset += match[0].length
    }

    let chordRow = ''
    let lastCol = 0
    for (const { chord, col } of segments) {
      chordRow += ' '.repeat(Math.max(0, col - lastCol)) + chord
      lastCol = col + chord.length
    }

    const hasInlineChords = segments.length > 0
    const lyricsTrimmed = lyrics.trim()

    if (hasInlineChords && !lyricsTrimmed) {
      return { type: 'standalone' as const, chordRow, lyrics: '', segments }
    }
    if (!hasInlineChords) {
      return { type: 'normal' as const, chordRow: '', lyrics, segments }
    }
    return { type: 'normal' as const, chordRow, lyrics, segments }
  })
}