import type { FretPosition } from '../../types';

interface StringHeaderProps {
  stringIdx: number;
  position: FretPosition;
  x: number;
  y: number;
  onClick: () => void;
}

export function StringHeader({ stringIdx: _stringIdx, position, x, y, onClick }: StringHeaderProps) {
  let label = '·';
  let color = '#aaa';

  if (position === 0) {
    label = 'O';
    color = '#333';
  } else if (position === -1) {
    label = 'X';
    color = '#333';
  }

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <circle cx={x} cy={y} r={12} fill="transparent" />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight="bold"
        fill={color}
      >
        {label}
      </text>
    </g>
  );
}
