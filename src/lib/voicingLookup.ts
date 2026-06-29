import guitarDb from '@tombatossals/chords-db/lib/guitar.json';
import { get as getChord } from '@tonaljs/chord';
import type { DetectedChord, NamedVoicing, VoicingPosition } from '../types';
import { STRING_COUNT_COLORS, TONIC_TO_DB_KEY, MINI_VISIBLE_FRETS } from '../constants/guitar';
import { generateVoicings, effectiveFingers } from './voicingGenerator';

type DbChordEntry = { key: string; suffix: string; positions: VoicingPosition[] };
type DbChords = Record<string, DbChordEntry[]>;

const dbChords = guitarDb.chords as unknown as DbChords;
const dbSuffixes = new Set(guitarDb.suffixes as string[]);

// Standard tuning MIDI — DB voicings are only valid for this
const STANDARD_MIDI = [40, 45, 50, 55, 59, 64];

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

// The generator works in a capo-relative frame (open = 0 = capo note, fret N = N above capo).
// We need to fix baseFret so the nut bar shows correctly, while keeping the capo-relative
// fret numbers (so "022000" stays "022000" not "133111").
function applyCapo(pos: VoicingPosition, capo: number): VoicingPosition {
  if (capo === 0) return pos;

  const capoRelAbs = pos.frets.map(f => {
    if (f < 0) return f;
    if (f === 0) return 0;
    return pos.baseFret + (f - 1);
  });

  const hasOpen = capoRelAbs.some(f => f === 0);
  const fretted = capoRelAbs.filter(f => f > 0);
  const minFretted = fretted.length > 0 ? Math.min(...fretted) : 1;
  // Use baseFret=1 (show capo bar) only when fretted notes fit within the mini diagram.
  // If fretted notes are too high, fall back to minFretted so dots render correctly.
  const newBaseFret = (hasOpen && minFretted <= MINI_VISIBLE_FRETS) ? 1 : minFretted;

  const newFrets = capoRelAbs.map(f => {
    if (f < 0) return f;
    if (f === 0) return 0;
    return f - newBaseFret + 1;
  });

  return { ...pos, frets: newFrets, baseFret: newBaseFret };
}

export function lookupVoicings(
  detectedChords: DetectedChord[],
  openMidi: readonly number[],
  capo = 0,
): NamedVoicing[] {
  const voicings: NamedVoicing[] = [];
  const seenKeys = new Set<string>();
  const isStandard = openMidi.every((m, i) => m === STANDARD_MIDI[i]);

  function push(pos: VoicingPosition, chord: DetectedChord, suffix: string) {
    const k = absKey(pos);
    if (seenKeys.has(k)) return;
    seenKeys.add(k);
    const soundingCount = pos.frets.filter(f => f !== -1).length;
    const color = STRING_COUNT_COLORS[soundingCount] ?? '#6b7280';
    voicings.push({ position: pos, chordKey: chord.tonic, suffix, color });
  }

  for (const chord of detectedChords.slice(0, 4)) {
    const dbKey = TONIC_TO_DB_KEY[chord.tonic];
    const suffix = resolveDbSuffix(chord);

    // Phase 1: curated DB positions (standard tuning + matched suffix only)
    if (isStandard && dbKey && suffix) {
      const entries = dbChords[dbKey] ?? [];
      const matched = entries.find((e) => e.suffix === suffix);
      for (const pos of matched?.positions ?? []) {
        push(pos, chord, suffix);
      }
    }

    // Phase 2: algorithmically generated positions
    const chordData = getChord(chord.name);
    if (!chordData.empty && chordData.notes.length >= 2) {
      const displaySuffix = suffix ?? chord.type;
      for (const raw of generateVoicings(chordData.notes, openMidi)) {
        push(applyCapo(raw, capo), chord, displaySuffix);
      }
    }
  }

  // Sort: baseFret ascending, then effective fingers ascending, then fewer mutes first
  voicings.sort((a, b) => {
    if (a.position.baseFret !== b.position.baseFret) return a.position.baseFret - b.position.baseFret;
    const aFingers = effectiveFingers(a.position.frets);
    const bFingers = effectiveFingers(b.position.frets);
    if (aFingers !== bFingers) return aFingers - bFingers;
    const aMutes = a.position.frets.filter(f => f === -1).length;
    const bMutes = b.position.frets.filter(f => f === -1).length;
    return aMutes - bMutes;
  });

  return voicings;
}

// Convert chords-db relative fret to absolute fret number
export function resolveAbsoluteFret(baseFret: number, fret: number): number {
  if (fret <= 0) return fret;
  return baseFret + fret - 1;
}
