import { CHROMATIC } from '../constants/guitar';
import type { FretboardPositions } from '../types';

function midiToNoteName(midi: number): string {
  return CHROMATIC[((midi % 12) + 12) % 12];
}

export function fretToNote(stringIndex: number, fret: number, openMidi: readonly number[]): string {
  return midiToNoteName(openMidi[stringIndex] + fret);
}

export function positionsToNotes(positions: FretboardPositions, openMidi: readonly number[]): string[] {
  const notes: string[] = [];
  for (let i = 0; i < 6; i++) {
    const pos = positions[i];
    if (pos === null || pos === -1) continue;
    notes.push(fretToNote(i, pos, openMidi));
  }
  return [...new Set(notes)];
}
