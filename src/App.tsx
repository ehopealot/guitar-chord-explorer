import { useState } from 'react';
import { useFretboard } from './hooks/useFretboard';
import { useChordDetection } from './hooks/useChordDetection';
import { Fretboard } from './components/Fretboard/Fretboard';
import { ChordDisplay } from './components/ChordDisplay/ChordDisplay';
import { VoicingCard } from './components/VoicingCard/VoicingCard';
import { Controls } from './components/Controls/Controls';
import './App.css';

const MAX_DISPLAY = 24;
const SLIDER_MAX = 15;

export default function App() {
  const {
    positions,
    viewportFret,
    handleFretClick,
    handleStringHeaderClick,
    clearAll,
    scrollUp,
    scrollDown,
  } = useFretboard();

  const { notes, detectedChords, primaryChord, alternativeVoicings } =
    useChordDetection(positions);

  const [startFret, setStartFret] = useState(1);

  const displayedVoicings = alternativeVoicings
    .filter((v) => v.position.baseFret >= startFret)
    .slice(0, MAX_DISPLAY);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Guitar Chord Explorer</h1>
        <p className="app-subtitle">Click frets to identify chords and explore voicings</p>
      </header>

      <main className="app-main">
        <section className="fretboard-section">
          <div className="fretboard-container">
            <Fretboard
              positions={positions}
              viewportFret={viewportFret}
              onFretClick={handleFretClick}
              onStringHeaderClick={handleStringHeaderClick}
            />
            <Controls
              onClear={clearAll}
              onScrollUp={scrollUp}
              onScrollDown={scrollDown}
              viewportFret={viewportFret}
            />
          </div>
          <div className="fretboard-hint">
            Click a string header (O / X / ·) to set open or muted
          </div>
        </section>

        <ChordDisplay
          detectedChords={detectedChords}
          primaryChord={primaryChord}
          notes={notes}
        />

        {alternativeVoicings.length > 0 && (
          <section className="voicings-section">
            <div className="voicings-header">
              <h2>Alternative voicings</h2>
              <div className="voicings-fret-filter">
                <label htmlFor="start-fret-slider">
                  From fret <span className="fret-value">{startFret}</span>
                </label>
                <input
                  id="start-fret-slider"
                  type="range"
                  min={1}
                  max={SLIDER_MAX}
                  value={startFret}
                  onChange={(e) => setStartFret(Number(e.target.value))}
                  className="fret-slider"
                />
              </div>
            </div>
            {displayedVoicings.length > 0 ? (
              <div className="voicings-grid">
                {displayedVoicings.map((v, i) => (
                  <VoicingCard key={i} voicing={v} />
                ))}
              </div>
            ) : (
              <p className="voicings-empty">No voicings found from fret {startFret}</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
