import { OPEN_MIDI, CHROMATIC } from '../constants/guitar';
import type { FretboardPositions } from '../types';

function midiToNoteName(midi: number): string {
  return CHROMATIC[((midi % 12) + 12) % 12];
}

export function fretToNote(stringIndex: number, fret: number): string {
  return midiToNoteName(OPEN_MIDI[stringIndex] + fret);
}

export function positionsToNotes(positions: FretboardPositions): string[] {
  const notes: string[] = [];
  for (let i = 0; i < 6; i++) {
    const pos = positions[i];
    if (pos === null || pos === -1) continue;
    notes.push(fretToNote(i, pos));
  }
  return [...new Set(notes)];
}
