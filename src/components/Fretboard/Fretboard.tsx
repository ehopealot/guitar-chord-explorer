import type { FretboardPositions } from '../../types';
import {
  SVG_WIDTH, SVG_HEIGHT, MARGIN_LEFT, MARGIN_TOP, NUT_AREA_HEIGHT,
  STRING_SPACING, FRET_SPACING, VISIBLE_FRETS, FRET_DOT_RADIUS, NUM_STRINGS,
} from '../../constants/guitar';
import { FretboardGrid } from './FretboardGrid';
import { StringHeader } from './StringHeader';
import { FingerDot } from './FingerDot';
import { FretLabel } from './FretLabel';

interface FretboardProps {
  positions: FretboardPositions;
  viewportFret: number;
  onFretClick: (stringIdx: number, fretNum: number) => void;
  onStringHeaderClick: (stringIdx: number) => void;
}

const NUT_Y = MARGIN_TOP + NUT_AREA_HEIGHT;

export function Fretboard({
  positions,
  viewportFret,
  onFretClick,
  onStringHeaderClick,
}: FretboardProps) {
  const getX = (si: number) => MARGIN_LEFT + si * STRING_SPACING;
  const getY = (fretWithinViewport: number) =>
    NUT_Y + (fretWithinViewport - 0.5) * FRET_SPACING;

  return (
    <svg
      width={SVG_WIDTH}
      height={SVG_HEIGHT}
      style={{ userSelect: 'none', display: 'block' }}
    >
      <FretLabel viewportFret={viewportFret} />

      {/* String headers: click to cycle open/muted/unplayed */}
      {Array.from({ length: NUM_STRINGS }, (_, i) => (
        <StringHeader
          key={i}
          stringIdx={i}
          position={positions[i]}
          x={getX(i)}
          y={MARGIN_TOP + NUT_AREA_HEIGHT / 2}
          onClick={() => onStringHeaderClick(i)}
        />
      ))}

      <FretboardGrid viewportFret={viewportFret} />

      {/* Clickable cells and selected dots */}
      {Array.from({ length: VISIBLE_FRETS }, (_, fi) => {
        const actualFret = viewportFret + fi;
        return Array.from({ length: NUM_STRINGS }, (_, si) => {
          const x = getX(si);
          const y = getY(fi + 1);
          const isSelected = positions[si] === actualFret;
          return (
            <g key={`${si}-${fi}`}>
              <rect
                x={x - STRING_SPACING / 2}
                y={NUT_Y + fi * FRET_SPACING}
                width={STRING_SPACING}
                height={FRET_SPACING}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => onFretClick(si, actualFret)}
              />
              {isSelected && (
                <FingerDot x={x} y={y} radius={FRET_DOT_RADIUS} color="#2563eb" />
              )}
            </g>
          );
        });
      })}
    </svg>
  );
}
