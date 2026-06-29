import { useMemo } from 'react';
import type { FretboardPositions } from '../types';
import type { Tuning } from '../constants/tunings';
import { positionsToNotes } from '../lib/noteUtils';
import { detectChords } from '../lib/chordDetection';
import { lookupVoicings } from '../lib/voicingLookup';

export function useChordDetection(positions: FretboardPositions, tuning: Tuning) {
  const notes = useMemo(
    () => positionsToNotes(positions, tuning.midi),
    [positions, tuning],
  );

  const detectedChords = useMemo(() => detectChords(notes), [notes]);

  const primaryChord = detectedChords[0] ?? null;

  const alternativeVoicings = useMemo(
    () => (primaryChord ? lookupVoicings(detectedChords, tuning.midi) : []),
    [detectedChords, primaryChord, tuning],
  );

  return { notes, detectedChords, primaryChord, alternativeVoicings };
}
