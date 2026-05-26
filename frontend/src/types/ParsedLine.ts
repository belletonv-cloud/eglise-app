export type ParsedLine =
  | { type: 'section'; label: string }
  | { type: 'plain'; text: string }
  | { type: 'chord-lyric'; parts: { chord: string; lyric: string }[] }
