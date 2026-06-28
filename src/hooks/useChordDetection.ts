import { useMemo } from 'react';
import type { FretboardPositions } from '../types';
import { positionsToNotes } from '../lib/noteUtils';
import { detectChords } from '../lib/chordDetection';
import { lookupVoicings } from '../lib/voicingLookup';

export function useChordDetection(positions: FretboardPositions) {
  const notes = useMemo(() => positionsToNotes(positions), [positions]);

  const detectedChords = useMemo(() => detectChords(notes), [notes]);

  const primaryChord = detectedChords[0] ?? null;

  const alternativeVoicings = useMemo(
    () => (primaryChord ? lookupVoicings(detectedChords) : []),
    [detectedChords, primaryChord],
  );

  return { notes, detectedChords, primaryChord, alternativeVoicings };
}
