import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { NamedVoicing, SavedProgression, VoicingPosition } from '../../types';
import { VoicingCard } from '../VoicingCard/VoicingCard';
import { startProgressionPlayback, stopProgressionPlayback } from '../../lib/audioEngine';

export type ProgressionItem = {
  uid: string;
  voicing: NamedVoicing;
};

const STANDARD_MIDI = [40, 45, 50, 55, 59, 64];

function getMidi(pos: VoicingPosition): number[] {
  if (pos.midi.length > 0) return pos.midi;
  return pos.frets
    .map((f, si) => {
      if (f === -1) return null;
      const abs = f === 0 ? 0 : pos.baseFret + f - 1;
      return STANDARD_MIDI[si] + abs;
    })
    .filter((m): m is number => m !== null);
}

interface SortableCardProps {
  item: ProgressionItem;
  active: boolean;
  onRemove: () => void;
  onDuplicate: () => void;
}

function SortableCard({ item, active, onRemove, onDuplicate }: SortableCardProps) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({
    id: item.uid,
    data: { source: 'progression', voicing: item.voicing },
  });

  return (
    <div
      ref={setNodeRef}
      className={`progression-card-wrapper${active ? ' progression-card-wrapper--active' : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        flexShrink: 0,
      }}
    >
      <button
        className="progression-duplicate"
        onClick={onDuplicate}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Duplicate"
        title="Duplicate"
      >+</button>
      <button
        className="progression-remove"
        onClick={onRemove}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Remove"
      >
        ×
      </button>
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      >
        <VoicingCard voicing={item.voicing} />
      </div>
    </div>
  );
}

interface ProgressionAreaProps {
  items: ProgressionItem[];
  onRemove: (uid: string) => void;
  onClear: () => void;
  progressionName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onDone: () => void;
  savedProgressions: SavedProgression[];
  onLoad: (saved: SavedProgression) => void;
  onDeleteSaved: (id: string) => void;
  onDuplicate: (uid: string) => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  beatsPerMeasure: number;
  onBeatsPerMeasureChange: (beats: number) => void;
}

export function ProgressionArea({
  items,
  onRemove,
  onClear,
  progressionName,
  onNameChange,
  onSave,
  onDone,
  savedProgressions,
  onLoad,
  onDeleteSaved,
  onDuplicate,
  bpm,
  onBpmChange,
  beatsPerMeasure,
  onBeatsPerMeasureChange,
}: ProgressionAreaProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'progression-zone' });
  const sectionRef = useRef<HTMLElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const update = () =>
      document.documentElement.style.setProperty(
        '--progression-height',
        `${el.offsetHeight}px`,
      );
    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();
    return () => observer.disconnect();
  }, []);

  // Stop playback when chord count drops below 2
  useEffect(() => {
    if (items.length < 2 && isPlayingRef.current) {
      stopProgressionPlayback();
      setIsPlaying(false);
      setActiveIndex(null);
    }
  }, [items.length]);

  // Cleanup on unmount
  useEffect(() => () => { stopProgressionPlayback(); }, []);

  function startPlayback(currentBpm: number, currentBeats: number) {
    const chords = items.map(item => getMidi(item.voicing.position));
    startProgressionPlayback(chords, currentBpm, currentBeats, (idx) => setActiveIndex(idx));
    setIsPlaying(true);
  }

  function stopPlayback() {
    stopProgressionPlayback();
    setIsPlaying(false);
    setActiveIndex(null);
  }

  function togglePlay() {
    if (isPlaying) stopPlayback();
    else startPlayback(bpm, beatsPerMeasure);
  }

  function handleBpmChange(newBpm: number) {
    onBpmChange(newBpm);
    if (isPlayingRef.current) {
      stopProgressionPlayback();
      const chords = items.map(item => getMidi(item.voicing.position));
      startProgressionPlayback(chords, newBpm, beatsPerMeasure, (idx) => setActiveIndex(idx));
    }
  }

  function handleBeatsChange(newBeats: number) {
    onBeatsPerMeasureChange(newBeats);
    if (isPlayingRef.current) {
      stopProgressionPlayback();
      const chords = items.map(item => getMidi(item.voicing.position));
      startProgressionPlayback(chords, bpm, newBeats, (idx) => setActiveIndex(idx));
    }
  }

  return (
    <section className="progression-section" ref={sectionRef}>
      <div className="progression-inner">

        {/* Left: name + drag area */}
        <div className="progression-main">
          <div className="progression-bar">

            {/* Playback controls */}
            <div className="playback-controls">
              <button
                className={`btn--play-prog${isPlaying ? ' btn--play-prog--active' : ''}`}
                onClick={togglePlay}
                disabled={items.length < 2}
                title={isPlaying ? 'Stop' : 'Play progression'}
              >
                {isPlaying ? '■' : '▶'}
              </button>
              <div className="bpm-control">
                <span className="bpm-label">♩ {bpm}</span>
                <input
                  type="range"
                  min={40}
                  max={200}
                  value={bpm}
                  onChange={(e) => handleBpmChange(Number(e.target.value))}
                  className="bpm-slider"
                />
              </div>
              <div className="beats-control">
                {[2, 3, 4, 6].map(n => (
                  <button
                    key={n}
                    className={`beats-btn${beatsPerMeasure === n ? ' beats-btn--active' : ''}`}
                    onClick={() => handleBeatsChange(n)}
                  >{n}</button>
                ))}
              </div>
            </div>

            <input
              className="progression-name-input"
              value={progressionName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Progression name"
            />
            <div className="progression-bar-actions">
              <button
                className="btn btn--save-prog"
                onClick={onSave}
                disabled={items.length === 0}
              >
                Save
              </button>
              <button
                className="btn btn--done-prog"
                onClick={onDone}
                disabled={items.length === 0}
              >
                Done
              </button>
              {items.length > 0 && (
                <button className="btn btn--clear-prog" onClick={() => { stopPlayback(); onClear(); }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          <SortableContext
            items={items.map((i) => i.uid)}
            strategy={horizontalListSortingStrategy}
          >
            <div
              ref={setNodeRef}
              className={`progression-area${isOver ? ' progression-area--over' : ''}`}
            >
              {items.length === 0 ? (
                <p className="progression-placeholder">
                  Drag voicings here to build a progression
                </p>
              ) : (
                items.map((item, i) => (
                  <SortableCard
                    key={item.uid}
                    item={item}
                    active={isPlaying && activeIndex === i}
                    onRemove={() => onRemove(item.uid)}
                    onDuplicate={() => onDuplicate(item.uid)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </div>

        {/* Right: library */}
        <div className="progression-library">
          <div className="library-title">Library</div>
          {savedProgressions.length === 0 ? (
            <p className="library-empty">No saved progressions</p>
          ) : (
            <ul className="library-list">
              {savedProgressions.map((sp) => (
                <li key={sp.id} className="library-item">
                  <button
                    className="library-item-name"
                    onClick={() => onLoad(sp)}
                    title={`Load "${sp.name}"`}
                  >
                    {sp.name}
                  </button>
                  <button
                    className="library-item-delete"
                    onClick={() => onDeleteSaved(sp.id)}
                    aria-label="Delete"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </section>
  );
}
