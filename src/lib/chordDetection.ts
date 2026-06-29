import { detect } from '@tonaljs/chord-detect';
import { get as getChord } from '@tonaljs/chord';
import type { DetectedChord } from '../types';

// Guitarists expect flat spellings for these roots
const PREFER_FLAT: Record<string, string> = {
  'A#': 'Bb', 'D#': 'Eb', 'G#': 'Ab',
};

// Lower = simpler / more common.
function typeComplexity(type: string): number {
  if (type === 'major' || type === 'minor') return 0;
  if (['dominant seventh', 'major seventh', 'minor seventh',
       'major sixth', 'minor sixth', 'dominant ninth',
       'major ninth', 'minor ninth'].includes(type)) return 1;
  if (['augmented', 'diminished', 'suspended second', 'suspended fourth',
       'half-diminished seventh', 'diminished seventh'].includes(type)) return 2;
  const alterations = (type.match(/[#b]/g) ?? []).length;
  return 3 + alterations;
}

function buildDetectedChord(name: string, slashBass?: string): DetectedChord | null {
  const chord = getChord(name);
  if (!chord.tonic || chord.empty) return null;

  const tonic = PREFER_FLAT[chord.tonic] ?? chord.tonic;
  const meaningfulAlias = chord.aliases.find((a) => a !== '') ?? chord.type;
  const baseName =
    meaningfulAlias === 'major' || meaningfulAlias === 'M' || meaningfulAlias === ''
      ? `${tonic} major`
      : `${tonic} ${meaningfulAlias}`;
  const displayName = slashBass ? `${baseName}/${slashBass}` : baseName;

  return { name, tonic, type: chord.type, aliases: chord.aliases, displayName };
}

export function detectChords(notes: string[], bassNote?: string): DetectedChord[] {
  if (notes.length < 2) return [];

  const rawNames = detect(notes);

  const chords = rawNames
    .map((name) => {
      // TonalJS sometimes returns slash chords like "Cmaj9/G"
      const slashIdx = name.lastIndexOf('/');
      if (slashIdx > 0) {
        const base = name.slice(0, slashIdx);
        const bass = name.slice(slashIdx + 1);
        return buildDetectedChord(base, bass);
      }
      return buildDetectedChord(name);
    })
    .filter((c): c is DetectedChord => c !== null)
    .sort((a, b) => {
      // Primary: simpler chord types first (G/B beats Bm#5)
      const ca = typeComplexity(a.type);
      const cb = typeComplexity(b.type);
      if (ca !== cb) return ca - cb;
      // Tiebreaker: prefer bass-rooted, then slash-bass, then unrelated
      const bassRank = (c: DetectedChord) => {
        if (!bassNote) return 2;
        if (c.tonic === bassNote) return 0;
        if (c.displayName.endsWith(`/${bassNote}`)) return 1;
        return 2;
      };
      return bassRank(a) - bassRank(b);
    });

  // If the top chord's root doesn't match the bass, synthesize a slash version
  if (bassNote && chords.length > 0 && chords[0].tonic !== bassNote &&
      !chords[0].displayName.endsWith(`/${bassNote}`)) {
    const top = chords[0];
    const slashChord: DetectedChord = {
      ...top,
      displayName: `${top.displayName}/${bassNote}`,
    };
    return [slashChord, ...chords];
  }

  return chords;
}
