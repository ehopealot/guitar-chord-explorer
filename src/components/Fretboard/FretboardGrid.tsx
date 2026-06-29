import {
  MARGIN_LEFT, MARGIN_TOP, NUT_AREA_HEIGHT, STRING_SPACING,
  FRET_SPACING, NUM_STRINGS, VISIBLE_FRETS,
} from '../../constants/guitar';

const NUT_Y = MARGIN_TOP + NUT_AREA_HEIGHT;
const FRETBOARD_WIDTH = (NUM_STRINGS - 1) * STRING_SPACING;
const FRETBOARD_HEIGHT = VISIBLE_FRETS * FRET_SPACING;

const MARKER_FRETS = new Set([3, 5, 7, 9, 12, 15, 17, 19]);
const DOUBLE_MARKER_FRETS = new Set([12, 24]);

// Graduated widths: low E (thick) → high e (thin)
const STRING_WIDTHS = [2.6, 2.1, 1.7, 1.3, 0.9, 0.65];
// Wound strings (0-3) get a warm bronze tone; plain strings (4-5) silver
const STRING_COLORS = ['#b89050', '#c09a5a', '#c8a868', '#bfb060', '#c0c0c0', '#d8d8d8'];

interface FretboardGridProps {
  viewportFret: number;
  stringNames: readonly string[];
}

export function FretboardGrid({ viewportFret, stringNames }: FretboardGridProps) {
  const gradId = 'fretboard-wood';
  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#2a1208" />
          <stop offset="30%"  stopColor="#3d1c0c" />
          <stop offset="60%"  stopColor="#361608" />
          <stop offset="100%" stopColor="#2c1108" />
        </linearGradient>
      </defs>

      {/* Fretboard wood body */}
      <rect
        x={MARGIN_LEFT}
        y={NUT_Y}
        width={FRETBOARD_WIDTH}
        height={FRETBOARD_HEIGHT}
        fill={`url(#${gradId})`}
      />

      {/* Inlay position markers (inside the fretboard) */}
      {Array.from({ length: VISIBLE_FRETS }, (_, i) => {
        const actualFret = viewportFret + i;
        const isMarker = MARKER_FRETS.has(actualFret);
        const isDouble = DOUBLE_MARKER_FRETS.has(actualFret);
        if (!isMarker) return null;
        const cy = NUT_Y + (i + 0.5) * FRET_SPACING;
        const cx = MARGIN_LEFT + FRETBOARD_WIDTH / 2;
        return isDouble ? (
          <g key={i}>
            <circle cx={cx - STRING_SPACING * 0.7} cy={cy} r={5} fill="rgba(255,245,210,0.55)" />
            <circle cx={cx + STRING_SPACING * 0.7} cy={cy} r={5} fill="rgba(255,245,210,0.55)" />
          </g>
        ) : (
          <circle key={i} cx={cx} cy={cy} r={5} fill="rgba(255,245,210,0.55)" />
        );
      })}

      {/* Fret lines (metallic silver-gold wire) */}
      {Array.from({ length: VISIBLE_FRETS + 1 }, (_, i) => (
        <line
          key={i}
          x1={MARGIN_LEFT - 1}
          y1={NUT_Y + i * FRET_SPACING}
          x2={MARGIN_LEFT + FRETBOARD_WIDTH + 1}
          y2={NUT_Y + i * FRET_SPACING}
          stroke="#b8aa90"
          strokeWidth={2}
          strokeLinecap="round"
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
          stroke={STRING_COLORS[i]}
          strokeWidth={STRING_WIDTHS[i]}
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
          fontWeight="600"
          fill="#999"
          letterSpacing="0.5"
        >
          {stringNames[i]}
        </text>
      ))}

      {/* Fret number labels on left edge */}
      {Array.from({ length: VISIBLE_FRETS }, (_, i) => {
        const actualFret = viewportFret + i;
        if (actualFret % 2 !== 1 && actualFret !== 1) return null;
        return (
          <text
            key={i}
            x={MARGIN_LEFT - 28}
            y={NUT_Y + (i + 0.5) * FRET_SPACING}
            textAnchor="end"
            dominantBaseline="central"
            fontSize={10}
            fill="#aaa"
          >
            {actualFret}
          </text>
        );
      })}
    </g>
  );
}
