// MIDI note numbers for open strings: E2 A2 D3 G3 B3 E4
export const OPEN_MIDI = [40, 45, 50, 55, 59, 64] as const;

export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'] as const;

export const CHROMATIC = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

export const NUM_STRINGS = 6;
export const VISIBLE_FRETS = 5;
export const MAX_FRET = 20;

// SVG layout — main interactive fretboard
export const STRING_SPACING = 54;
export const FRET_SPACING = 70;
export const FRET_DOT_RADIUS = 17;
export const NUT_AREA_HEIGHT = 50;
export const MARGIN_LEFT = 88;
export const MARGIN_RIGHT = 28;
export const MARGIN_TOP = 16;
export const MARGIN_BOTTOM = 16;

export const SVG_WIDTH =
  MARGIN_LEFT + (NUM_STRINGS - 1) * STRING_SPACING + MARGIN_RIGHT;
export const SVG_HEIGHT =
  MARGIN_TOP + NUT_AREA_HEIGHT + VISIBLE_FRETS * FRET_SPACING + MARGIN_BOTTOM;

// SVG layout — mini VoicingCard diagrams
export const MINI_STRING_SPACING = 20;
export const MINI_FRET_SPACING = 24;
export const MINI_DOT_RADIUS = 7;
export const MINI_NUT_HEIGHT = 18;
export const MINI_MARGIN_H = 16;
export const MINI_MARGIN_V = 8;
export const MINI_VISIBLE_FRETS = 4;

export const MINI_SVG_WIDTH =
  MINI_MARGIN_H * 2 + (NUM_STRINGS - 1) * MINI_STRING_SPACING;
export const MINI_SVG_HEIGHT =
  MINI_NUT_HEIGHT + MINI_VISIBLE_FRETS * MINI_FRET_SPACING + MINI_MARGIN_V + 16;

// Color by number of sounding strings (non-muted)
export const STRING_COUNT_COLORS: Record<number, string> = {
  3: '#f59e0b', // amber   — sparse / triadic
  4: '#3b82f6', // blue    — four-string
  5: '#10b981', // emerald — five-string
  6: '#8b5cf6', // violet  — full six-string
};

// Maps tonal tonic strings to chords-db keys (which use "C#", "F#", "Eb", "Ab", "Bb")
export const TONIC_TO_DB_KEY: Record<string, string> = {
  C: 'C',
  'C#': 'C#', Db: 'C#',
  D: 'D',
  'D#': 'Eb', Eb: 'Eb',
  E: 'E', Fb: 'E',
  F: 'F', 'E#': 'F',
  'F#': 'F#', Gb: 'F#',
  G: 'G',
  'G#': 'Ab', Ab: 'Ab',
  A: 'A',
  'A#': 'Bb', Bb: 'Bb',
  B: 'B', Cb: 'B',
};
