import { useMemo, useState } from 'react';
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
import type { NamedVoicing, SavedProgression } from './types';
import { playChord } from './lib/audioEngine';
import './App.css';

// Simple = ≤3 strings actually fretted (pressed above the nut)
function isSimpleVoicing(frets: readonly number[]): boolean {
  return frets.filter(f => f > 0).length <= 3;
}

const SLIDER_MAX = 15;

export default function App() {
  const [tuning, setTuning] = useState<Tuning>(DEFAULT_TUNING);
  const [capo, setCapo] = useState(0);
  const [activeTab, setActiveTab] = useState<'fretboard' | 'builder'>('fretboard');
  const [startFret, setStartFret] = useState(0);
  const [simpleOnly, setSimpleOnly] = useState(true);
  const [progression, setProgression] = useState<ProgressionItem[]>([]);
  const [activeDrag, setActiveDrag] = useState<NamedVoicing | null>(null);
  const [savedProgressions, setSavedProgressions] = useState<SavedProgression[]>(() => {
    try { return JSON.parse(localStorage.getItem('guitar-chord-progressions') ?? '[]'); }
    catch { return []; }
  });
  const [progressionName, setProgressionName] = useState('New Progression');
  const [activeProgressionId, setActiveProgressionId] = useState<string | null>(null);
  const [bpm, setBpm] = useState(80);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);

  const effectiveMidi = useMemo(
    () => tuning.midi.map(m => m + capo) as unknown as readonly number[],
    [tuning, capo],
  );

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
    useChordDetection(positions, tuning.midi, effectiveMidi, capo);

  const displayedVoicings = alternativeVoicings
    .filter((v) => v.position.baseFret >= startFret)
    .filter((v) => !simpleOnly || isSimpleVoicing(v.position.frets));

  const fretboardMidi = useMemo(() =>
    positions
      .map((pos, si) => {
        if (pos === null || pos === -1) return null;
        const sounding = pos === 0 ? capo : pos;
        return tuning.midi[si] + sounding;
      })
      .filter((m): m is number => m !== null),
    [positions, tuning.midi, capo],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleTuningChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = TUNINGS.find((t) => t.id === e.target.value) ?? DEFAULT_TUNING;
    setTuning(next);
    clearAll();
  }

  function handleCapoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newCapo = Number(e.target.value);
    setCapo(newCapo);
    setStartFret(prev => Math.max(prev, newCapo));
    clearAll();
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

  function handleSaveProgression() {
    const snapshot = { name: progressionName, items: progression, bpm, beatsPerMeasure };
    let newSaved: SavedProgression[];
    if (activeProgressionId) {
      newSaved = savedProgressions.map((p) =>
        p.id === activeProgressionId ? { ...p, ...snapshot } : p
      );
    } else {
      const id = `${Date.now()}`;
      newSaved = [...savedProgressions, { id, ...snapshot }];
      setActiveProgressionId(id);
    }
    setSavedProgressions(newSaved);
    localStorage.setItem('guitar-chord-progressions', JSON.stringify(newSaved));
  }

  function handleLoadProgression(saved: SavedProgression) {
    setProgression(saved.items.map((item) => ({
      ...item,
      uid: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    })));
    setProgressionName(saved.name);
    setActiveProgressionId(saved.id);
    if (saved.bpm) setBpm(saved.bpm);
    if (saved.beatsPerMeasure) setBeatsPerMeasure(saved.beatsPerMeasure);
  }

  function handleDoneProgression() {
    const snapshot = { name: progressionName, items: progression, bpm, beatsPerMeasure };
    let newSaved: SavedProgression[];
    if (activeProgressionId) {
      newSaved = savedProgressions.map((p) =>
        p.id === activeProgressionId ? { ...p, ...snapshot } : p
      );
    } else {
      newSaved = [...savedProgressions, { id: `${Date.now()}`, ...snapshot }];
    }
    setSavedProgressions(newSaved);
    localStorage.setItem('guitar-chord-progressions', JSON.stringify(newSaved));
    setProgression([]);
    setActiveProgressionId(null);
    setProgressionName('New Progression');
  }

  function handleDuplicateProgressionItem(uid: string) {
    setProgression((prev) => {
      const idx = prev.findIndex((p) => p.uid === uid);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], uid: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
  }

  function handleDeleteSavedProgression(id: string) {
    const newSaved = savedProgressions.filter((p) => p.id !== id);
    setSavedProgressions(newSaved);
    localStorage.setItem('guitar-chord-progressions', JSON.stringify(newSaved));
    if (activeProgressionId === id) {
      setProgression([]);
      setActiveProgressionId(null);
      setProgressionName('New Progression');
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
            <div className="tuning-capo-bar">
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
              <div className="tuning-bar">
                <label htmlFor="capo-select" className="tuning-label">Capo</label>
                <select
                  id="capo-select"
                  className="tuning-select"
                  value={capo}
                  onChange={handleCapoChange}
                >
                  <option value={0}>None</option>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>Fret {n}</option>
                  ))}
                </select>
              </div>
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
                      capo={capo}
                      onFretClick={handleFretClick}
                      onStringHeaderClick={handleStringHeaderClick}
                    />
                    <Controls
                      onClear={clearAll}
                      onScrollUp={scrollUp}
                      onScrollDown={scrollDown}
                      onPlay={() => playChord(fretboardMidi)}
                      canPlay={fretboardMidi.length > 0}
                      viewportFret={viewportFret}
                    />
                  </div>
                  <div className="fretboard-hint">
                    Click a string header to toggle open or muted
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
                      <div className="voicings-filters">
                        <div className="voicings-fret-filter">
                          <label htmlFor="start-fret-slider">
                            From fret <span className="fret-value">{startFret}</span>
                          </label>
                          <input
                            id="start-fret-slider"
                            type="range"
                            min={capo}
                            max={SLIDER_MAX}
                            value={startFret}
                            onChange={(e) => setStartFret(Number(e.target.value))}
                            className="fret-slider"
                          />
                        </div>
                        <div className="complexity-toggle">
                          <button
                            className={`complexity-btn${!simpleOnly ? ' complexity-btn--active' : ''}`}
                            onClick={() => setSimpleOnly(false)}
                          >All</button>
                          <button
                            className={`complexity-btn${simpleOnly ? ' complexity-btn--active' : ''}`}
                            onClick={() => setSimpleOnly(true)}
                          >Simple</button>
                        </div>
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
              <ChordBuilder
                openMidi={effectiveMidi}
                capo={capo}
                simpleOnly={simpleOnly}
                onSimpleOnlyChange={setSimpleOnly}
              />
            )}
          </main>
        </div>

        <ProgressionArea
          items={progression}
          onRemove={(uid) => setProgression((prev) => prev.filter((p) => p.uid !== uid))}
          onClear={() => setProgression([])}
          progressionName={progressionName}
          onNameChange={setProgressionName}
          onSave={handleSaveProgression}
          onDone={handleDoneProgression}
          savedProgressions={savedProgressions}
          onLoad={handleLoadProgression}
          onDeleteSaved={handleDeleteSavedProgression}
          onDuplicate={handleDuplicateProgressionItem}
          bpm={bpm}
          onBpmChange={setBpm}
          beatsPerMeasure={beatsPerMeasure}
          onBeatsPerMeasureChange={setBeatsPerMeasure}
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
