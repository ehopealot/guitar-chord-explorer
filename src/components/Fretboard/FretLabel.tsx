import {
  MARGIN_LEFT, MARGIN_TOP, NUT_AREA_HEIGHT,
  STRING_SPACING, NUM_STRINGS, FRET_SPACING,
} from '../../constants/guitar';

const NUT_Y = MARGIN_TOP + NUT_AREA_HEIGHT;
const FRETBOARD_WIDTH = (NUM_STRINGS - 1) * STRING_SPACING;

interface FretLabelProps {
  viewportFret: number;
}

export function FretLabel({ viewportFret }: FretLabelProps) {
  if (viewportFret === 1) {
    // Draw the nut
    return (
      <rect
        x={MARGIN_LEFT - 2}
        y={NUT_Y - 5}
        width={FRETBOARD_WIDTH + 4}
        height={6}
        rx={2}
        fill="#2a2a2a"
      />
    );
  }

  return (
    <text
      x={MARGIN_LEFT - 8}
      y={MARGIN_TOP + NUT_AREA_HEIGHT + FRET_SPACING * 0.5}
      textAnchor="end"
      dominantBaseline="central"
      fontSize={12}
      fill="#666"
    >
      {viewportFret}fr
    </text>
  );
}
