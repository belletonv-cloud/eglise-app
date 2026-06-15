import { computed, type Ref } from 'vue'
import { CHORD_TOKEN_RE, CHORD_INLINE_RE, keyOptions, transposeChord } from './useTransposition'
import type { ParsedLine } from '../types/ParsedLine'

function isChordOnlyLine(line: string): boolean {
  if (!line.trim()) return false
  const tokens = line.trim().split(/\s+/)
  if (tokens.length === 0) return false
  return tokens.every((t) => CHORD_TOKEN_RE.test(t))
}

function buildTwoLineParts(
  chordLine: string,
  lyricLine: string,
  semis: number,
  showChords: boolean,
  showLyrics: boolean,
): { chord: string; lyric: string }[] {
  const chords: { chord: string; pos: number }[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(CHORD_INLINE_RE.source, 'g')
  while ((m = re.exec(chordLine)) !== null) {
    chords.push({
      chord: showChords ? transposeChord(m[0], semis) : '',
      pos: m.index,
    })
  }
  if (chords.length === 0) {
    return [
      {
        chord: '',
        lyric: showLyrics ? lyricLine : '',
      },
    ]
  }
  const parts: { chord: string; lyric: string }[] = []
  for (let i = 0; i < chords.length; i++) {
    const { chord, pos } = chords[i]!
    const nextPos =
      i < chords.length - 1
        ? chords[i + 1]!.pos
        : Math.max(chordLine.length, lyricLine.length)
    const lyric = lyricLine.slice(pos, nextPos).trim()
    parts.push({
      chord,
      lyric: showLyrics ? lyric : '',
    })
  }
  return parts
}

export function useChordParser(
  chordChart: Ref<string | null | undefined>,
  semitones: Ref<number>,
  showChords: Ref<boolean>,
  showLyrics: Ref<boolean>,
  showSections: Ref<boolean>,
) {
  const parsedLines = computed<ParsedLine[]>(() => {
    const chart = chordChart.value
    if (!chart) return []
    const lines = chart.split('\n')
    const result: ParsedLine[] = []
    const semis = semitones.value
    const chordsOn = showChords.value
    const lyricsOn = showLyrics.value
    const sectionsOn = showSections.value

    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      if (line === undefined) continue
      const trimmed = line.trim()
      i++
      if (!trimmed) continue

      // Section header: {section: Verse} or {chorus}, {verse}, etc.
      const sectionMatch = trimmed.match(/^\{([^}]+)\}/)
      if (sectionMatch && sectionsOn) {
        if (sectionMatch[1]) {
            let label = sectionMatch[1].replace(/\s{2,}/g, ' ').trim()
            result.push({ type: 'section', label })
          }
          continue
        }

        // Comment/directive: skip or show as plain
        if (
          trimmed.startsWith('[') &&
          trimmed.endsWith(']') &&
          trimmed.indexOf('[') === trimmed.lastIndexOf('[')
        ) {
          if (sectionsOn) {
            let label = trimmed
              .slice(1, -1)
              .replace(/\s{2,}/g, ' ')
              .trim()
            result.push({ type: 'section', label })
        }
        continue
      }

      // ChordPro line with chords: text[Chord]text
      if (/\[.*?\]/.test(trimmed)) {
        if (!chordsOn && !lyricsOn) continue
        const parts: { chord: string; lyric: string }[] = []
        let remaining = trimmed
        while (remaining.length > 0) {
          const chordIdx = remaining.indexOf('[')
          const closeIdx =
            chordIdx !== -1 ? remaining.indexOf(']', chordIdx) : -1

          if (chordIdx === -1 || closeIdx === -1) {
            if (remaining) {
              parts.push({
                chord: '',
                lyric: lyricsOn ? remaining : '',
              })
            }
            break
          }

          if (chordIdx > 0) {
            const lyric = remaining.slice(0, chordIdx)
            if (lyric)
              parts.push({
                chord: '',
                lyric: lyricsOn ? lyric : '',
              })
          }
          const chord = remaining.slice(chordIdx + 1, closeIdx)
          const transposed = transposeChord(chord, semis)
          let afterChord = remaining.slice(closeIdx + 1)
          let nextChordIdx = afterChord.indexOf('[')
          let lyric =
            nextChordIdx === -1
              ? afterChord
              : afterChord.slice(0, nextChordIdx)
          parts.push({
            chord: chordsOn ? transposed : '',
            lyric: lyricsOn ? lyric : '',
          })
          remaining =
            nextChordIdx === -1 ? '' : afterChord.slice(nextChordIdx)
        }
        if (parts.length > 0) {
          let MAX_PARTS = 100
          result.push({
            type: 'chord-lyric',
            parts: parts.slice(0, MAX_PARTS),
          })
        }
        continue
      }

      // Two-line ChordPro: chord-only line followed by lyrics
      if (isChordOnlyLine(trimmed)) {
        if (!chordsOn && !lyricsOn) continue
        let lyricLine = ''
        let skipIdx = -1
        for (let j = i; j < lines.length; j++) {
          const l = lines[j]
          if (l === undefined) continue
          const trimmedL = l.trim()
          if (!trimmedL) continue
          if (
            /^\{/.test(trimmedL) ||
            (trimmedL.startsWith('[') && trimmedL.endsWith(']')) ||
            isChordOnlyLine(trimmedL)
          )
            break
          lyricLine = l
          skipIdx = j
          break
        }
        if (lyricLine) {
          const parts = buildTwoLineParts(line, lyricLine, semis, chordsOn, lyricsOn)
          if (parts.length > 0)
            result.push({ type: 'chord-lyric', parts })
          i = skipIdx + 1
        } else {
          result.push({ type: 'plain', text: trimmed })
        }
        continue
      }

      // Plain text (lyrics only)
      result.push({ type: 'plain', text: trimmed })
    }

    return result
  })

  return { parsedLines }
}
