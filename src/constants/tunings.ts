export type Tuning = {
  id: string;
  name: string;
  notes: string;
  midi: readonly number[];
  stringNames: readonly string[];
  isStandard?: boolean;
};

export const TUNINGS: Tuning[] = [
  {
    id: 'standard',
    name: 'Standard',
    notes: 'E A D G B e',
    midi: [40, 45, 50, 55, 59, 64],
    stringNames: ['E', 'A', 'D', 'G', 'B', 'e'],
    isStandard: true,
  },
  {
    id: 'drop-d',
    name: 'Drop D',
    notes: 'D A D G B e',
    midi: [38, 45, 50, 55, 59, 64],
    stringNames: ['D', 'A', 'D', 'G', 'B', 'e'],
  },
  {
    id: 'open-g',
    name: 'Open G',
    notes: 'D G D G B D',
    midi: [38, 43, 50, 55, 59, 62],
    stringNames: ['D', 'G', 'D', 'G', 'B', 'D'],
  },
  {
    id: 'open-e',
    name: 'Open E',
    notes: 'E B E G# B E',
    midi: [40, 47, 52, 56, 59, 64],
    stringNames: ['E', 'B', 'E', 'G#', 'B', 'E'],
  },
  {
    id: 'open-d',
    name: 'Open D',
    notes: 'D A D F# A D',
    midi: [38, 45, 50, 54, 57, 62],
    stringNames: ['D', 'A', 'D', 'F#', 'A', 'D'],
  },
  {
    id: 'dadgad',
    name: 'DADGAD',
    notes: 'D A D G A D',
    midi: [38, 45, 50, 55, 57, 62],
    stringNames: ['D', 'A', 'D', 'G', 'A', 'D'],
  },
  {
    id: 'eb',
    name: 'Eb Standard',
    notes: 'Eb Ab Db Gb Bb Eb',
    midi: [39, 44, 49, 54, 58, 63],
    stringNames: ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'],
  },
  {
    id: 'd-std',
    name: 'D Standard',
    notes: 'D G C F A D',
    midi: [38, 43, 48, 53, 57, 62],
    stringNames: ['D', 'G', 'C', 'F', 'A', 'D'],
  },
];

export const DEFAULT_TUNING = TUNINGS[0];
