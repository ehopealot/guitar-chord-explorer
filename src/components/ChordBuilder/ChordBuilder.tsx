import { useMemo, useRef, useState } from 'react';
import { get as getChord } from '@tonaljs/chord';
import { lookupVoicings } from '../../lib/voicingLookup';
import { DraggableVoicingCard } from '../VoicingCard/DraggableVoicingCard';
import type { DetectedChord } from '../../types';

const MAX_DISPLAY = 24;
const SLIDER_MAX = 15;

// [display label, value to append] — or just a string for both
type Key = string | [string, string];

const GROUPS: { label: string; keys: Key[] }[] = [
  { label: 'Root',       keys: ['A','B','C','D','E','F','G'] },
  { label: 'Accidental', keys: [['♯','#'], ['♭','b']] },
  { label: 'Quality',    keys: ['m', 'maj', 'aug', 'dim', '5'] },
  { label: 'Extension',  keys: ['7', '9', '11', '13'] },
  { label: 'Suspension', keys: ['sus2', 'sus4'] },
  { label: 'Added',      keys: ['6', 'add6', ['6/9','69'], 'add9', 'add11'] },
  { label: 'Altered',    keys: [['b5','b5'],['♯5','#5'],['b9','b9'],['♯9','#9'],['♯11','#11'],['b13','b13']] },
];

interface ChordBuilderProps {
  openMidi: readonly number[];
}

export function ChordBuilder({ openMidi }: ChordBuilderProps) {
  const [text, setText] = useState('');
  const [startFret, setStartFret] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  function append(val: string) {
    setText(prev => prev + val);
    inputRef.current?.focus();
  }

  function backspace() {
    setText(prev => prev.slice(0, -1));
    inputRef.current?.focus();
  }

  function clear() {
    setText('');
    inputRef.current?.focus();
  }

  const chordInfo = useMemo(() => {
    const sym = text.trim();
    if (!sym) return null;
    const d = getChord(sym);
    return d.empty || !d.tonic ? null : d;
  }, [text]);

  const allVoicings = useMemo(() => {
    if (!chordInfo) return [];
    const detected: DetectedChord = {
      name: chordInfo.name,
      tonic: chordInfo.tonic!,
      type: chordInfo.type,
      aliases: chordInfo.aliases,
      displayName: text.trim(),
    };
    return lookupVoicings([detected], openMidi);
  }, [chordInfo, openMidi, text]);

  const displayed = allVoicings
    .filter(v => v.position.baseFret >= startFret)
    .slice(0, MAX_DISPLAY);

  return (
    <div className="chord-builder">
      {/* Text input */}
      <div className="chord-input-row">
        <input
          ref={inputRef}
          className="chord-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="e.g. Gmaj7, Bb7b5, Am9…"
          spellCheck={false}
          autoComplete="off"
          autoFocus
        />
        {text && (
          <button className="chord-input-clear" onClick={clear} aria-label="Clear">×</button>
        )}
      </div>

      {/* Chord name readout */}
      {chordInfo ? (
        <div className="builder-chord-info">
          <span className="builder-chord-name">{chordInfo.name || text}</span>
          <span className="builder-chord-notes">{chordInfo.notes.join(' · ')}</span>
        </div>
      ) : text.trim() ? (
        <div className="builder-chord-info builder-chord-info--unknown">
          <span className="builder-chord-name builder-chord-name--unknown">Unknown chord</span>
        </div>
      ) : null}

      {/* Button keyboard */}
      <div className="builder-keyboard">
        {GROUPS.map(({ label, keys }) => (
          <div key={label} className="builder-group">
            <span className="builder-group-label">{label}</span>
            <div className="builder-buttons">
              {keys.map(k => {
                const [display, val] = Array.isArray(k) ? k : [k, k];
                return (
                  <button key={display} className="builder-btn" onClick={() => append(val)}>
                    {display}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

      </div>

      {/* Voicings */}
      {allVoicings.length > 0 && (
        <section className="voicings-section">
          <div className="voicings-header">
            <h2>Voicings</h2>
            <div className="voicings-fret-filter">
              <label htmlFor="builder-fret-slider">
                From fret <span className="fret-value">{startFret}</span>
              </label>
              <input
                id="builder-fret-slider"
                type="range"
                min={1}
                max={SLIDER_MAX}
                value={startFret}
                onChange={e => setStartFret(Number(e.target.value))}
                className="fret-slider"
              />
            </div>
          </div>
          {displayed.length > 0 ? (
            <div className="voicings-grid">
              {displayed.map((v, i) => (
                <DraggableVoicingCard key={i} voicing={v} dragId={`builder-${i}`} />
              ))}
            </div>
          ) : (
            <p className="voicings-empty">No voicings from fret {startFret}</p>
          )}
        </section>
      )}
    </div>
  );
}
