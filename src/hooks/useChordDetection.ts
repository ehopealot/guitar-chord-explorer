import { useMemo } from 'react';
import type { FretboardPositions } from '../types';
import { positionsToNotes } from '../lib/noteUtils';
import { detectChords } from '../lib/chordDetection';
import { lookupVoicings } from '../lib/voicingLookup';

export function useChordDetection(
  positions: FretboardPositions,
  tuningMidi: readonly number[],    // raw tuning — absolute fret → note
  effectiveMidi: readonly number[], // capo-shifted — for voicing generation
  capo: number,
) {
  // Open strings (pos 0) sound at the capo fret, not the nut
  const adjustedPositions = useMemo(
    () => capo === 0 ? positions : positions.map(p => (p === 0 ? capo : p)),
    [positions, capo],
  );

  const notes = useMemo(
    () => positionsToNotes(adjustedPositions, tuningMidi),
    [adjustedPositions, tuningMidi],
  );

  const detectedChords = useMemo(() => detectChords(notes), [notes]);

  const primaryChord = detectedChords[0] ?? null;

  const alternativeVoicings = useMemo(
    () => (primaryChord ? lookupVoicings(detectedChords, effectiveMidi, capo) : []),
    [detectedChords, primaryChord, effectiveMidi, capo],
  );

  return { notes, detectedChords, primaryChord, alternativeVoicings };
}
