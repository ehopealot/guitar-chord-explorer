import {
  MARGIN_LEFT, MARGIN_TOP, NUT_AREA_HEIGHT, STRING_SPACING,
  FRET_SPACING, NUM_STRINGS, VISIBLE_FRETS, STRING_NAMES,
} from '../../constants/guitar';

const NUT_Y = MARGIN_TOP + NUT_AREA_HEIGHT;
const FRETBOARD_WIDTH = (NUM_STRINGS - 1) * STRING_SPACING;

// Standard fret marker positions (single dots at these frets)
const MARKER_FRETS = new Set([3, 5, 7, 9, 12, 15, 17, 19]);
const DOUBLE_MARKER_FRETS = new Set([12, 24]);

interface FretboardGridProps {
  viewportFret: number;
}

export function FretboardGrid({ viewportFret }: FretboardGridProps) {
  return (
    <g>
      {/* Fret lines */}
      {Array.from({ length: VISIBLE_FRETS + 1 }, (_, i) => (
        <line
          key={i}
          x1={MARGIN_LEFT}
          y1={NUT_Y + i * FRET_SPACING}
          x2={MARGIN_LEFT + FRETBOARD_WIDTH}
          y2={NUT_Y + i * FRET_SPACING}
          stroke="#ccc"
          strokeWidth={1}
        />
      ))}

      {/* String lines */}
      {Array.from({ length: NUM_STRINGS }, (_, i) => (
        <line
          key={i}
          x1={MARGIN_LEFT + i * STRING_SPACING}
          y1={NUT_Y}
          x2={MARGIN_LEFT + i * STRING_SPACING}
          y2={NUT_Y + VISIBLE_FRETS * FRET_SPACING}
          stroke="#888"
          strokeWidth={i === 0 ? 2.5 : i === 5 ? 1 : 1.5}
        />
      ))}

      {/* String name labels at bottom */}
      {Array.from({ length: NUM_STRINGS }, (_, i) => (
        <text
          key={i}
          x={MARGIN_LEFT + i * STRING_SPACING}
          y={NUT_Y + VISIBLE_FRETS * FRET_SPACING + 18}
          textAnchor="middle"
          fontSize={11}
          fill="#888"
        >
          {STRING_NAMES[i]}
        </text>
      ))}

      {/* Fret position markers (dots on side) */}
      {Array.from({ length: VISIBLE_FRETS }, (_, i) => {
        const actualFret = viewportFret + i;
        const isMarker = MARKER_FRETS.has(actualFret);
        const isDouble = DOUBLE_MARKER_FRETS.has(actualFret);
        if (!isMarker) return null;
        const cy = NUT_Y + (i + 0.5) * FRET_SPACING;
        return isDouble ? (
          <g key={i}>
            <circle cx={MARGIN_LEFT - 18} cy={cy - 4} r={4} fill="#ddd" />
            <circle cx={MARGIN_LEFT - 18} cy={cy + 4} r={4} fill="#ddd" />
          </g>
        ) : (
          <circle key={i} cx={MARGIN_LEFT - 18} cy={cy} r={4} fill="#ddd" />
        );
      })}
    </g>
  );
}
