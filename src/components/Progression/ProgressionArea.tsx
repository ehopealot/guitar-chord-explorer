import { useLayoutEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { NamedVoicing } from '../../types';
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
}

export function ProgressionArea({ items, onRemove, onClear }: ProgressionAreaProps) {
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
        <div className="progression-bar">
          <span className="progression-title">Progression</span>
          {items.length > 0 && (
            <button className="btn--ghost" onClick={onClear}>
              Clear
            </button>
          )}
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
    </section>
  );
}
