import type { DetectedChord } from '../../types';

const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']);

const TO_FLAT: Record<string, string> = {
  'A#': 'Bb', 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab',
};

function spellNotes(notes: string[], tonic: string | null): string[] {
  if (!tonic || !FLAT_KEYS.has(tonic)) return notes;
  return notes.map((n) => TO_FLAT[n] ?? n);
}

interface ChordDisplayProps {
  detectedChords: DetectedChord[];
  primaryChord: DetectedChord | null;
  notes: string[];
}

export function ChordDisplay({ detectedChords, primaryChord, notes }: ChordDisplayProps) {
  const displayNotes = spellNotes(notes, primaryChord?.tonic ?? null);

  if (notes.length === 0) {
    return (
      <div className="chord-display chord-display--empty">
        <p>Click frets on the board to identify a chord</p>
      </div>
    );
  }

  if (notes.length < 2) {
    return (
      <div className="chord-display chord-display--partial">
        <div className="chord-notes">Notes: {displayNotes.join(', ')}</div>
        <p className="chord-hint">Select at least 2 strings to detect a chord</p>
      </div>
    );
  }

  if (!primaryChord) {
    return (
      <div className="chord-display chord-display--unknown">
        <div className="chord-notes">Notes: {displayNotes.join(', ')}</div>
        <p className="chord-hint">No chord match found — try adjusting the fingering</p>
      </div>
    );
  }

  return (
    <div className="chord-display">
      <div className="chord-primary">
        <span className="chord-name">{primaryChord.displayName}</span>
        <span className="chord-notes-inline">{displayNotes.join(' – ')}</span>
      </div>
      {detectedChords.length > 1 && (
        <div className="chord-alternatives">
          <span className="chord-also">Also: </span>
          {detectedChords.slice(1, 4).map((c) => (
            <span key={c.name} className="chord-alt-name">{c.displayName}</span>
          ))}
        </div>
      )}
    </div>
  );
}
