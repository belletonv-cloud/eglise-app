import { ref, computed, type ComputedRef, type Ref } from 'vue'

export const CHORD_TOKEN_RE =
  /^[A-G][#b]?(m|dim|aug|sus[24]?|maj[79]?|[2679]|add[249]?)?(\/[A-G][#b]?(m|dim|aug|sus[24]?|maj[79]?|[2679]|add[249]?)?)?$/
export const CHORD_INLINE_RE =
  /([A-G][#b]?(?:m|dim|aug|sus[24]?|maj[79]?|[2679]|add[249]?)?(?:\/[A-G][#b]?(?:m|dim|aug|sus[24]?|maj[79]?|[2679]|add[249]?)?)?)/g

export const keyOptions = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
]

export function transposeChord(chord: string, semis: number): string {
  if (semis === 0) return chord
  const rootMatch = chord.match(/^([A-G][#b]?)(.*)/)
  if (!rootMatch || !rootMatch[1]) return chord
  const root = rootMatch[1]
  const suffix = rootMatch[2] || ''
  const idx = keyOptions.indexOf(root)
  if (idx === -1) return chord
  const newIdx = (idx + semis + 12) % 12
  return keyOptions[newIdx] + suffix
}

export function useTransposition(): {
  currentKey: ComputedRef<string>;
  semitones: Ref<number>;
  originalKey: Ref<string>;
  transpose: (delta: number) => void;
  transposeChord: (chord: string, semis: number) => string;
  setKey: (k: string) => void;
  keyOptions: string[];
} {
  const semitones = ref(0)
  const originalKey = ref('C')

  const currentKey = computed(() => {
    const origIdx = keyOptions.indexOf(originalKey.value)
    if (origIdx === -1) return originalKey.value
    return keyOptions[(origIdx + semitones.value + 12) % 12] ?? originalKey.value
  })

  function transpose(delta: number) {
    semitones.value = (semitones.value + delta + 12) % 12
  }

  function setKey(k: string) {
    const origIdx = keyOptions.indexOf(originalKey.value)
    const targetIdx = keyOptions.indexOf(k)
    if (origIdx !== -1 && targetIdx !== -1) {
      semitones.value = (targetIdx - origIdx + 12) % 12
    }
  }

  return { currentKey, semitones, originalKey, transpose, transposeChord, setKey, keyOptions }
}
