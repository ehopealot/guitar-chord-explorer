interface FingerDotProps {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export function FingerDot({ x, y, radius, color }: FingerDotProps) {
  return (
    <g>
      {/* Drop shadow */}
      <circle cx={x} cy={y + 2} r={radius} fill="rgba(0,0,0,0.35)" />
      {/* White border ring */}
      <circle cx={x} cy={y} r={radius + 2} fill="white" />
      {/* Main dot */}
      <circle cx={x} cy={y} r={radius} fill={color} />
      {/* Subtle highlight glint */}
      <circle cx={x - radius * 0.3} cy={y - radius * 0.3} r={radius * 0.22} fill="rgba(255,255,255,0.4)" />
    </g>
  );
}
