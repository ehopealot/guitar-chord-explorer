import { detect } from '@tonaljs/chord-detect';
import { get as getChord } from '@tonaljs/chord';
import type { DetectedChord } from '../types';

export function detectChords(notes: string[]): DetectedChord[] {
  if (notes.length < 2) return [];

  const rawNames = detect(notes);

  return rawNames
    .map((name) => {
      const chord = getChord(name);
      if (!chord.tonic || chord.empty) return null;

      const meaningfulAlias = chord.aliases.find((a) => a !== '') ?? chord.type;
      const displayName =
        meaningfulAlias === 'major' || meaningfulAlias === 'M' || meaningfulAlias === ''
          ? `${chord.tonic} major`
          : `${chord.tonic} ${meaningfulAlias}`;

      return {
        name,
        tonic: chord.tonic,
        type: chord.type,
        aliases: chord.aliases,
        displayName,
      } satisfies DetectedChord;
    })
    .filter((c): c is DetectedChord => c !== null);
}
