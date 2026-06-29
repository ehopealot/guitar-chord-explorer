interface ControlsProps {
  onClear: () => void;
  onScrollUp: () => void;
  onScrollDown: () => void;
  onPlay: () => void;
  canPlay: boolean;
  viewportFret: number;
}

export function Controls({ onClear, onScrollUp, onScrollDown, onPlay, canPlay, viewportFret }: ControlsProps) {
  return (
    <div className="controls">
      <button className="btn btn--ghost" onClick={onScrollUp} disabled={viewportFret === 1}>
        ↑
      </button>
      <button className="btn btn--ghost" onClick={onScrollDown}>
        ↓
      </button>
      <button className="btn btn--play" onClick={onPlay} disabled={!canPlay} title="Play chord">
        ▶
      </button>
      <button className="btn btn--clear" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}
