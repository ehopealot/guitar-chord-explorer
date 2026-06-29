import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { NamedVoicing } from '../../types';
import { VoicingCard } from './VoicingCard';

interface DraggableVoicingCardProps {
  voicing: NamedVoicing;
  dragId: string;
}

export function DraggableVoicingCard({ voicing, dragId }: DraggableVoicingCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { source: 'alternatives', voicing },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.35 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      {...attributes}
      {...listeners}
    >
      <VoicingCard voicing={voicing} />
    </div>
  );
}
