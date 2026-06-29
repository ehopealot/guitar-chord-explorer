import { useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { useFretboard } from './hooks/useFretboard';
import { useChordDetection } from './hooks/useChordDetection';
import { Fretboard } from './components/Fretboard/Fretboard';
import { ChordDisplay } from './components/ChordDisplay/ChordDisplay';
import { DraggableVoicingCard } from './components/VoicingCard/DraggableVoicingCard';
import { VoicingCard } from './components/VoicingCard/VoicingCard';
import { Controls } from './components/Controls/Controls';
import { ProgressionArea } from './components/Progression/ProgressionArea';
import type { ProgressionItem } from './components/Progression/ProgressionArea';
import { ChordBuilder } from './components/ChordBuilder/ChordBuilder';
import { TUNINGS, DEFAULT_TUNING } from './constants/tunings';
import type { Tuning } from './constants/tunings';
import type { NamedVoicing } from './types';
import './App.css';

const MAX_DISPLAY = 24;
const SLIDER_MAX = 15;

export default function App() {
  const [tuning, setTuning] = useState<Tuning>(DEFAULT_TUNING);
  const [activeTab, setActiveTab] = useState<'fretboard' | 'builder'>('fretboard');
  const [startFret, setStartFret] = useState(1);
  const [progression, setProgression] = useState<ProgressionItem[]>([]);
  const [activeDrag, setActiveDrag] = useState<NamedVoicing | null>(null);

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
    useChordDetection(positions, tuning);

  const displayedVoicings = alternativeVoicings
    .filter((v) => v.position.baseFret >= startFret)
    .slice(0, MAX_DISPLAY);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleTuningChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = TUNINGS.find((t) => t.id === e.target.value) ?? DEFAULT_TUNING;
    setTuning(next);
  }

  function handleDragStart(event: DragStartEvent) {
    const voicing = event.active.data.current?.voicing as NamedVoicing | undefined;
    setActiveDrag(voicing ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const source = active.data.current?.source as string | undefined;

    if (source === 'alternatives') {
      const onZone = over.id === 'progression-zone';
      const onItem = progression.some((p) => p.uid === over.id.toString());
      if (onZone || onItem) {
        const voicing = active.data.current?.voicing as NamedVoicing | undefined;
        if (voicing) {
          setProgression((prev) => [
            ...prev,
            { uid: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, voicing },
          ]);
        }
      }
    } else if (source === 'progression') {
      if (active.id !== over.id) {
        setProgression((prev) => {
          const oldIdx = prev.findIndex((p) => p.uid === active.id);
          const newIdx = prev.findIndex((p) => p.uid === over.id);
          if (oldIdx < 0 || newIdx < 0) return prev;
          return arrayMove(prev, oldIdx, newIdx);
        });
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <>
        <div className="app">
          <header className="app-header">
            <h1>Guitar Chord Explorer</h1>
          </header>

          {/* Global controls: tuning + tabs */}
          <div className="app-controls">
            <div className="tuning-bar">
              <label htmlFor="tuning-select" className="tuning-label">Tuning</label>
              <select
                id="tuning-select"
                className="tuning-select"
                value={tuning.id}
                onChange={handleTuningChange}
              >
                {TUNINGS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.notes}
                  </option>
                ))}
              </select>
            </div>

            <div className="tab-bar" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'fretboard'}
                className={`tab-btn${activeTab === 'fretboard' ? ' tab-btn--active' : ''}`}
                onClick={() => setActiveTab('fretboard')}
              >
                Fretboard
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'builder'}
                className={`tab-btn${activeTab === 'builder' ? ' tab-btn--active' : ''}`}
                onClick={() => setActiveTab('builder')}
              >
                Chord Search
              </button>
            </div>
          </div>

          <main className="app-main">
            {activeTab === 'fretboard' && (
              <>
                <section className="fretboard-section">
                  <div className="fretboard-container">
                    <Fretboard
                      positions={positions}
                      viewportFret={viewportFret}
                      stringNames={tuning.stringNames}
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
                          <DraggableVoicingCard key={i} voicing={v} dragId={`alt-${i}`} />
                        ))}
                      </div>
                    ) : (
                      <p className="voicings-empty">No voicings found from fret {startFret}</p>
                    )}
                  </section>
                )}
              </>
            )}

            {activeTab === 'builder' && (
              <ChordBuilder openMidi={tuning.midi} />
            )}
          </main>
        </div>

        <ProgressionArea
          items={progression}
          onRemove={(uid) => setProgression((prev) => prev.filter((p) => p.uid !== uid))}
          onClear={() => setProgression([])}
        />

        <DragOverlay dropAnimation={null}>
          {activeDrag && (
            <div className="drag-overlay-card">
              <VoicingCard voicing={activeDrag} />
            </div>
          )}
        </DragOverlay>
      </>
    </DndContext>
  );
}
