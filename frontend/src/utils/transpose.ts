// Utilitaire de transposition ChordPro
// Basé sur les demi-tons : C C# D D# E F F# G G# A A# B

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Mappage des notes avec # vers Flat et vice versa
const SHARP_TO_FLAT: Record<string, string> = {
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
};
const FLAT_TO_SHARP: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
};

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;
  
  const match = chord.match(/^([A-Ga-g][#b]?)(.*)/);
  if (!match) return chord;
  
  let note = match[1] ?? '';
  const rest = match[2] || '';
  
  if (!note) return chord;
  
  // Normaliser : si c'est un b (flat), convertir en note flat
  let noteIndex = NOTES_SHARP.indexOf(note);
  let usingSharps = true;
  
  if (noteIndex === -1) {
    noteIndex = NOTES_FLAT.indexOf(note);
    usingSharps = false;
  }
  
  if (noteIndex === -1) return chord; // Note inconnue
  
  // Calculer la nouvelle note
  let newIndex = (noteIndex + semitones) % 12;
  if (newIndex < 0) newIndex += 12;
  
  const newNote = usingSharps ? NOTES_SHARP[newIndex] : NOTES_FLAT[newIndex];
  
  return newNote + rest;
}

export function transposeLine(line: string, semitones: number): string {
  return line.replace(/\[([^\]]+)\]|([A-Ga-g][#b]?[^\s]*)/g, (match: string, inBrackets: string, alone: string) => {
    const chord: string = inBrackets || alone;
    const transposed = transposeChord(chord, semitones);
    return inBrackets ? `[${transposed}]` : transposed;
  });
}

export function transposeChordChart(chart: string, fromKey: string, toKey: string): string {
  // Calculer le nombre de demi-tons entre les deux tonalités
  const fromIndex = NOTES_SHARP.indexOf(fromKey) !== -1 
    ? NOTES_SHARP.indexOf(fromKey) 
    : NOTES_FLAT.indexOf(fromKey);
  
  if (fromIndex === -1) return chart; // Tonalité inconnue
  
  const toIndex = NOTES_SHARP.indexOf(toKey) !== -1 
    ? NOTES_SHARP.indexOf(toKey) 
    : NOTES_FLAT.indexOf(toKey);
  
  if (toIndex === -1) return chart;
  
  let semitones = toIndex - fromIndex;
  if (semitones < -6) semitones += 12;
  if (semitones > 6) semitones -= 12;
  
  // Transposer ligne par ligne
  return chart.split('\n').map(line => {
    // Ignorer les lignes de commentaires ou directives ChordPro
    if (line.trim().startsWith('{') || line.trim().startsWith('#')) {
      return line;
    }
    return transposeLine(line, semitones);
  }).join('\n');
}

// Obtenir le nombre de demi-tons depuis C
export function getSemitonesFromC(key: string): number {
  const index = NOTES_SHARP.indexOf(key) !== -1 
    ? NOTES_SHARP.indexOf(key) 
    : NOTES_FLAT.indexOf(key);
  return index === -1 ? 0 : index;
}

// Générer la liste des tonalités possibles
export function getKeyOptions(): string[] {
  return [...NOTES_SHARP]; // C, C#, D, D#, E, F, F#, G, G#, A, A#, B
}
