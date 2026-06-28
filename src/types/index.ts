// null = unplayed/gray, -1 = muted (X), 0 = open, 1+ = fret number
export type FretPosition = null | number;

export type FretboardPositions = [
  FretPosition, FretPosition, FretPosition,
  FretPosition, FretPosition, FretPosition
];

export interface VoicingPosition {
  frets: number[];
  fingers: number[];
  baseFret: number;
  barres: number[];
  capo?: boolean;
  midi: number[];
}

export interface NamedVoicing {
  position: VoicingPosition;
  chordKey: string;
  suffix: string;
  color: string;
}

export interface DetectedChord {
  name: string;
  tonic: string;
  type: string;
  aliases: string[];
  displayName: string;
}
