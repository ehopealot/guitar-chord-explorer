interface ControlsProps {
  onClear: () => void;
  onScrollUp: () => void;
  onScrollDown: () => void;
  viewportFret: number;
}

export function Controls({ onClear, onScrollUp, onScrollDown, viewportFret }: ControlsProps) {
  return (
    <div className="controls">
      <button className="btn btn--ghost" onClick={onScrollUp} disabled={viewportFret === 1}>
        ↑
      </button>
      <button className="btn btn--ghost" onClick={onScrollDown}>
        ↓
      </button>
      <button className="btn btn--clear" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}
