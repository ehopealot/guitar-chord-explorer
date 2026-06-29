import type { FretPosition } from '../../types';

interface StringHeaderProps {
  stringIdx: number;
  position: FretPosition;
  x: number;
  y: number;
  onClick: () => void;
}

export function StringHeader({ stringIdx: _stringIdx, position, x, y, onClick }: StringHeaderProps) {
  const isOpen = position === 0;
  const isMuted = position === -1;
  const isUnset = position === null;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <circle cx={x} cy={y} r={13} fill="transparent" />
      {isUnset && (
        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={18} fill="#ccc">
          ·
        </text>
      )}
      {isOpen && (
        <circle cx={x} cy={y} r={8} fill="none" stroke="#555" strokeWidth={2} />
      )}
      {isMuted && (
        <g stroke="#888" strokeWidth={2} strokeLinecap="round">
          <line x1={x - 6} y1={y - 6} x2={x + 6} y2={y + 6} />
          <line x1={x + 6} y1={y - 6} x2={x - 6} y2={y + 6} />
        </g>
      )}
    </g>
  );
}
