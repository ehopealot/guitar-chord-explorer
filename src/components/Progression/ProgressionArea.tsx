import { useLayoutEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { NamedVoicing, SavedProgression } from '../../types';
import { VoicingCard } from '../VoicingCard/VoicingCard';

export type ProgressionItem = {
  uid: string;
  voicing: NamedVoicing;
};

interface SortableCardProps {
  item: ProgressionItem;
  onRemove: () => void;
}

function SortableCard({ item, onRemove }: SortableCardProps) {
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
      className="progression-card-wrapper"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        flexShrink: 0,
      }}
    >
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
}: ProgressionAreaProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'progression-zone' });
  const sectionRef = useRef<HTMLElement>(null);

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

  return (
    <section className="progression-section" ref={sectionRef}>
      <div className="progression-inner">

        {/* Left: name + drag area */}
        <div className="progression-main">
          <div className="progression-bar">
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
                <button className="btn btn--clear-prog" onClick={onClear}>
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
                items.map((item) => (
                  <SortableCard
                    key={item.uid}
                    item={item}
                    onRemove={() => onRemove(item.uid)}
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
