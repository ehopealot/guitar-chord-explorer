import guitarDb from '@tombatossals/chords-db/lib/guitar.json';
import { get as getChord } from '@tonaljs/chord';
import type { DetectedChord, NamedVoicing, VoicingPosition } from '../types';
import { VOICING_COLORS, TONIC_TO_DB_KEY } from '../constants/guitar';
import { generateVoicings } from './voicingGenerator';

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

// Canonical dedup key using absolute frets so DB and generator entries compare correctly
function absKey(pos: VoicingPosition): string {
  return pos.frets.map((f) => (f <= 0 ? f : pos.baseFret + f - 1)).join(',');
}

export function lookupVoicings(detectedChords: DetectedChord[], limit = 100): NamedVoicing[] {
  const voicings: NamedVoicing[] = [];
  const seenKeys = new Set<string>();

  function push(pos: VoicingPosition, chord: DetectedChord, suffix: string): boolean {
    if (voicings.length >= limit) return false;
    const k = absKey(pos);
    if (seenKeys.has(k)) return false;
    seenKeys.add(k);
    voicings.push({
      position: pos,
      chordKey: chord.tonic,
      suffix,
      color: VOICING_COLORS[voicings.length % VOICING_COLORS.length],
    });
    return true;
  }

  for (const chord of detectedChords.slice(0, 4)) {
    const dbKey = TONIC_TO_DB_KEY[chord.tonic];
    const suffix = resolveDbSuffix(chord);
    if (!dbKey || !suffix) continue;

    // Phase 1: curated DB positions
    const entries = dbChords[dbKey] ?? [];
    const matched = entries.find((e) => e.suffix === suffix);
    for (const pos of matched?.positions ?? []) {
      if (!push(pos, chord, suffix)) break;
    }

    // Phase 2: algorithmically generated positions
    if (voicings.length < limit) {
      const chordData = getChord(chord.name);
      if (!chordData.empty && chordData.notes.length >= 2) {
        for (const pos of generateVoicings(chordData.notes)) {
          if (voicings.length >= limit) break;
          push(pos, chord, suffix);
        }
      }
    }

    if (voicings.length >= limit) break;
  }

  return voicings;
}

// Convert chords-db relative fret to absolute fret number
export function resolveAbsoluteFret(baseFret: number, fret: number): number {
  if (fret <= 0) return fret;
  return baseFret + fret - 1;
}
