import type { NamedVoicing, VoicingPosition } from '../../types';
import { resolveAbsoluteFret } from '../../lib/voicingLookup';
import { playChord } from '../../lib/audioEngine';

const STANDARD_MIDI = [40, 45, 50, 55, 59, 64];

function getMidi(pos: VoicingPosition): number[] {
  if (pos.midi.length > 0) return pos.midi;
  return pos.frets
    .map((f, si) => {
      if (f === -1) return null;
      const abs = f === 0 ? 0 : pos.baseFret + f - 1;
      return STANDARD_MIDI[si] + abs;
    })
    .filter((m): m is number => m !== null);
}
import {
  MINI_STRING_SPACING, MINI_FRET_SPACING, MINI_DOT_RADIUS,
  MINI_NUT_HEIGHT, MINI_MARGIN_H,
  MINI_VISIBLE_FRETS, MINI_SVG_WIDTH, MINI_SVG_HEIGHT, NUM_STRINGS,
} from '../../constants/guitar';
import { BarreIndicator } from './BarreIndicator';

interface VoicingCardProps {
  voicing: NamedVoicing;
}

export function VoicingCard({ voicing }: VoicingCardProps) {
  const { position, chordKey, suffix, color } = voicing;

  const getX = (si: number) => MINI_MARGIN_H + si * MINI_STRING_SPACING;
  const getY = (relFret: number) =>
    MINI_NUT_HEIGHT + (relFret - 0.5) * MINI_FRET_SPACING;

  const label = suffix === 'major' ? chordKey : `${chordKey} ${suffix}`;
  const isAtNut = position.baseFret === 1;
  const fretboardBottom = MINI_NUT_HEIGHT + MINI_VISIBLE_FRETS * MINI_FRET_SPACING;

  return (
    <div
      className="voicing-card"
      style={{ borderColor: color }}
    >
      <div className="voicing-card-label" style={{ color }}>
        {label}
      </div>
      <svg width={MINI_SVG_WIDTH} height={MINI_SVG_HEIGHT}>
        {/* Nut or base fret label */}
        {isAtNut ? (
          <rect
            x={MINI_MARGIN_H - 2}
            y={MINI_NUT_HEIGHT - 5}
            width={(NUM_STRINGS - 1) * MINI_STRING_SPACING + 4}
            height={5}
            rx={1}
            fill="#2a2a2a"
          />
        ) : (
          <text x={4} y={MINI_NUT_HEIGHT + 6} fontSize={9} fill="#666">
            {position.baseFret}fr
          </text>
        )}

        {/* Fret lines */}
        {Array.from({ length: MINI_VISIBLE_FRETS + 1 }, (_, i) => (
          <line
            key={i}
            x1={MINI_MARGIN_H}
            y1={MINI_NUT_HEIGHT + i * MINI_FRET_SPACING}
            x2={MINI_MARGIN_H + (NUM_STRINGS - 1) * MINI_STRING_SPACING}
            y2={MINI_NUT_HEIGHT + i * MINI_FRET_SPACING}
            stroke="#ddd"
            strokeWidth={1}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: NUM_STRINGS }, (_, i) => (
          <line
            key={i}
            x1={getX(i)}
            y1={MINI_NUT_HEIGHT}
            x2={getX(i)}
            y2={fretboardBottom}
            stroke="#bbb"
            strokeWidth={1}
          />
        ))}

        {/* Barre indicators */}
        {position.barres.map((barreRelFret) => (
          <BarreIndicator
            key={barreRelFret}
            barreRelFret={barreRelFret}
            frets={position.frets}
            getX={getX}
            getY={getY}
            color={color}
          />
        ))}

        {/* Per-string indicators */}
        {position.frets.map((relFret, si) => {
          const x = getX(si);
          if (relFret === -1) {
            return (
              <text key={si} x={x} y={MINI_NUT_HEIGHT - 4} textAnchor="middle" fontSize={10} fill="#999">
                ×
              </text>
            );
          }
          if (relFret === 0) {
            return (
              <circle key={si} cx={x} cy={MINI_NUT_HEIGHT - 8} r={4} fill="none" stroke="#999" strokeWidth={1.5} />
            );
          }
          // Skip dots that are part of a barre — the BarreIndicator covers them
          if (position.barres.includes(relFret)) return null;

          // Only draw dots within the visible fret range
          const absFret = resolveAbsoluteFret(position.baseFret, relFret);
          const relToBase = absFret - position.baseFret + 1;
          if (relToBase < 1 || relToBase > MINI_VISIBLE_FRETS) return null;

          return (
            <circle key={si} cx={x} cy={getY(relFret)} r={MINI_DOT_RADIUS} fill={color} />
          );
        })}

      </svg>
      <div className="voicing-card-footer">
        <div className="voicing-fret-label" style={{ color: '#999' }}>
          {position.frets.map((f) => (f === -1 ? 'x' : String(f))).join(' ')}
        </div>
        <button
          className="voicing-play-btn"
          style={{ color }}
          onClick={(e) => { e.stopPropagation(); playChord(getMidi(position)); }}
          title="Play"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
