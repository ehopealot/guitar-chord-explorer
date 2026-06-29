import {
  MARGIN_LEFT, MARGIN_TOP, NUT_AREA_HEIGHT,
  STRING_SPACING, NUM_STRINGS,
} from '../../constants/guitar';

const NUT_Y = MARGIN_TOP + NUT_AREA_HEIGHT;
const FRETBOARD_WIDTH = (NUM_STRINGS - 1) * STRING_SPACING;

interface FretLabelProps {
  viewportFret: number;
}

export function FretLabel({ viewportFret }: FretLabelProps) {
  if (viewportFret === 1) {
    return (
      <g>
        {/* Nut shadow */}
        <rect
          x={MARGIN_LEFT - 3}
          y={NUT_Y - 1}
          width={FRETBOARD_WIDTH + 6}
          height={9}
          rx={2}
          fill="rgba(0,0,0,0.25)"
        />
        {/* Nut body — bone/ivory color */}
        <rect
          x={MARGIN_LEFT - 3}
          y={NUT_Y - 7}
          width={FRETBOARD_WIDTH + 6}
          height={8}
          rx={2}
          fill="#e8d5a8"
        />
      </g>
    );
  }

  return null; // fret numbers are now handled in FretboardGrid
}
