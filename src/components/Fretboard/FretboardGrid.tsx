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
  capo: number;
}

export function FretboardGrid({ viewportFret, stringNames, capo }: FretboardGridProps) {
  const gradId = 'fretboard-wood';

  // Wire index within the viewport where the capo sits (fret N wire = index N - viewportFret + 1)
  const capoWireIndex = capo > 0 ? capo - viewportFret + 1 : -1;
  const capoInView = capoWireIndex >= 1 && capoWireIndex <= VISIBLE_FRETS;

  // Fret rows above the capo wire are behind the capo and should be shaded
  // If capo is above the viewport, shade the entire board
  const shadedRows = capo > 0
    ? (capo < viewportFret ? VISIBLE_FRETS : Math.min(Math.max(capoWireIndex - 1, 0), VISIBLE_FRETS))
    : 0;

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

      {/* Inlay position markers */}
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

      {/* Fret lines */}
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

      {/* Shading over frets behind the capo */}
      {shadedRows > 0 && (
        <rect
          x={MARGIN_LEFT - 1}
          y={NUT_Y}
          width={FRETBOARD_WIDTH + 2}
          height={shadedRows * FRET_SPACING}
          fill="rgba(0,0,0,0.45)"
          pointerEvents="none"
        />
      )}

      {/* Capo bar */}
      {capoInView && (
        <g>
          <rect
            x={MARGIN_LEFT - 6}
            y={NUT_Y + capoWireIndex * FRET_SPACING - 5}
            width={FRETBOARD_WIDTH + 12}
            height={10}
            rx={5}
            ry={5}
            fill="#1a1a2e"
            stroke="#4a4a6a"
            strokeWidth={1}
          />
          <text
            x={MARGIN_LEFT + FRETBOARD_WIDTH + 14}
            y={NUT_Y + capoWireIndex * FRET_SPACING + 1}
            dominantBaseline="central"
            fontSize={9}
            fontWeight="700"
            fill="#888"
            letterSpacing="0"
          >
            {capo}
          </text>
        </g>
      )}

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
