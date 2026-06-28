interface FingerDotProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  label?: string;
}

export function FingerDot({ x, y, radius, color, label }: FingerDotProps) {
  return (
    <g>
      <circle cx={x} cy={y} r={radius} fill={color} />
      {label && (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={radius * 1.1}
          fill="white"
          style={{ pointerEvents: 'none', fontWeight: 'bold' }}
        >
          {label}
        </text>
      )}
    </g>
  );
}
