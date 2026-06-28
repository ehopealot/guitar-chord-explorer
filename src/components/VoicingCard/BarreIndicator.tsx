import { MINI_STRING_SPACING, MINI_DOT_RADIUS } from '../../constants/guitar';

interface BarreIndicatorProps {
  barreRelFret: number;
  frets: number[];
  getX: (si: number) => number;
  getY: (relFret: number) => number;
  color: string;
}

export function BarreIndicator({ barreRelFret, frets, getX, getY, color }: BarreIndicatorProps) {
  // Find the range of strings covered by this barre
  const barreFretStrings = frets.reduce<number[]>((acc, f, i) => {
    if (f === barreRelFret) acc.push(i);
    return acc;
  }, []);

  if (barreFretStrings.length < 2) return null;

  const firstStr = barreFretStrings[0];
  const lastStr = barreFretStrings[barreFretStrings.length - 1];
  const x1 = getX(firstStr);
  const x2 = getX(lastStr);
  const y = getY(barreRelFret);
  const width = x2 - x1 + MINI_STRING_SPACING * 0.4;

  return (
    <rect
      x={x1 - MINI_STRING_SPACING * 0.2}
      y={y - MINI_DOT_RADIUS}
      width={width}
      height={MINI_DOT_RADIUS * 2}
      rx={MINI_DOT_RADIUS}
      fill={color}
    />
  );
}
