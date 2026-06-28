import guitarDb from '@tombatossals/chords-db/lib/guitar.json';
import type { DetectedChord, NamedVoicing, VoicingPosition } from '../types';
import { VOICING_COLORS, TONIC_TO_DB_KEY } from '../constants/guitar';

type DbChordEntry = { key: string; suffix: string; positions: VoicingPosition[] };
type DbChords = Record<string, DbChordEntry[]>;

const dbChords = guitarDb.chords as unknown as DbChords;
const dbSuffixes = new Set(guitarDb.suffixes as string[]);

function resolveDbSuffix(chord: DetectedChord): string | null {
  for (const alias of chord.aliases) {
    if (alias !== '' && dbSuffixes.has(alias)) return alias;
  }
  if (dbSuffixes.has(chord.type)) return chord.type;
  if (chord.type === 'major' || chord.aliases.includes('M')) return 'major';
  if (chord.type === 'minor' || chord.aliases.includes('m')) return 'minor';
  return null;
}

export function lookupVoicings(detectedChords: DetectedChord[], limit = 6): NamedVoicing[] {
  const voicings: NamedVoicing[] = [];

  for (const chord of detectedChords.slice(0, 2)) {
    const dbKey = TONIC_TO_DB_KEY[chord.tonic];
    const suffix = resolveDbSuffix(chord);
    if (!dbKey || !suffix) continue;

    const entries = dbChords[dbKey] ?? [];
    const matched = entries.find((e) => e.suffix === suffix);
    if (!matched) continue;

    for (const pos of matched.positions) {
      if (voicings.length >= limit) break;
      voicings.push({
        position: pos,
        chordKey: chord.tonic,
        suffix,
        color: VOICING_COLORS[voicings.length % VOICING_COLORS.length],
      });
    }
  }

  return voicings;
}

// Convert chords-db relative fret to absolute fret number.
// fret > 0: actual = baseFret + fret - 1
// fret === 0: open string
// fret === -1: muted
export function resolveAbsoluteFret(baseFret: number, fret: number): number {
  if (fret <= 0) return fret;
  return baseFret + fret - 1;
}
