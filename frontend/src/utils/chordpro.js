export function parseChordPro(text) {
    if (!text)
        return [];
    return text.split('\n').map((line) => {
        if (line.trim() === '')
            return { type: 'empty', chordRow: '', lyrics: '', segments: [] };
        const segments = [];
        let lyrics = line;
        let offset = 0;
        const regex = /\[([^\]]+)\]/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
            const chord = match[1] || '';
            const posInLyrics = match.index - offset;
            segments.push({ chord, col: posInLyrics });
            lyrics = lyrics.replace(match[0], '');
            offset += match[0].length;
        }
        let chordRow = '';
        let lastCol = 0;
        for (const { chord, col } of segments) {
            chordRow += ' '.repeat(Math.max(0, col - lastCol)) + chord;
            lastCol = col + chord.length;
        }
        const hasInlineChords = segments.length > 0;
        const lyricsTrimmed = lyrics.trim();
        if (hasInlineChords && !lyricsTrimmed) {
            return { type: 'standalone', chordRow, lyrics: '', segments };
        }
        if (!hasInlineChords) {
            return { type: 'normal', chordRow: '', lyrics, segments };
        }
        return { type: 'normal', chordRow, lyrics, segments };
    });
}
