import { CHROMATIC } from '../constants/guitar';
import type { VoicingPosition } from '../types';

// @tonaljs/chord returns flat names; CHROMATIC is all-sharps
const ENHARMONIC: Record<string, string> = {
  Bb: 'A#', Cb: 'B', Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#',
  'B#': 'C', 'E#': 'F',
};

function normalize(note: string): string {
  return ENHARMONIC[note] ?? note;
}

// How many independent finger placements does this voicing need?
// Strings sharing the lowest fretted position can be covered by one barre finger.
export function effectiveFingers(absFrets: number[]): number {
  const fretted = absFrets.filter((f) => f > 0);
  if (fretted.length === 0) return 0;
  const minF = Math.min(...fretted);

  // Count contiguous groups of strings at a given fret value.
  // isMin=true: a barre at the lowest fret can span over higher-fretted strings
  //   (those fingers override it), so only open strings (0) break the span.
  // isMin=false: any string that isn't muted (-1) breaks a partial barre.
  function countGroups(fretValue: number, isMin: boolean): number {
    let groups = 0;
    let inGroup = false;
    for (const f of absFrets) {
      if (f === fretValue) {
        if (!inGroup) { groups++; inGroup = true; }
      } else {
        const breaks = isMin ? f === 0 : f !== -1;
        if (breaks) inGroup = false;
      }
    }
    return groups;
  }

  const distinctAboveFrets = [...new Set(fretted.filter((f) => f > minF))];
  const aboveFingers = distinctAboveFrets.reduce((sum, fv) => sum + countGroups(fv, false), 0);
  return countGroups(minF, true) + aboveFingers;
}

// Reject voicings whose fret sequence zigzags in both directions —
// e.g. 4,2,1,4,4,2 reverses direction twice (down→down→UP→down) which
// no hand position can form. One reversal (like a barre shape) is fine.
function isShapePlayable(absFrets: number[]): boolean {
  const fretted = absFrets.filter((f) => f > 0);
  if (fretted.length <= 2) return true;
  let reversals = 0;
  let lastDir = 0; // -1 down, +1 up
  for (let i = 1; i < fretted.length; i++) {
    const diff = fretted[i] - fretted[i - 1];
    if (diff === 0) continue;
    const dir = diff > 0 ? 1 : -1;
    if (lastDir !== 0 && dir !== lastDir) reversals++;
    lastDir = dir;
  }
  return reversals < 2;
}

const NUM_STRINGS = 6;
const WINDOW_SIZE = 4;    // each window spans [w, w+3]
const MAX_SPAN = 3;        // max - min of fretted notes ≤ 3
const MAX_WINDOW_START = 17;
const MIN_SOUNDING = 4;   // at least 4 strings must sound
const MAX_FINGERS = 4;

export function generateVoicings(
  chordNotes: string[],
  openMidi: readonly number[],
): VoicingPosition[] {
  const requiredPcs = new Set(chordNotes.map(normalize));
  if (requiredPcs.size === 0) return [];

  function noteAt(si: number, absFret: number): string {
    return CHROMATIC[((openMidi[si] + absFret) % 12 + 12) % 12];
  }

  const seen = new Set<string>();
  const results: VoicingPosition[] = [];
  const buf = new Array<number>(NUM_STRINGS);

  let windowStart = 1;

  function dfs(
    si: number,
    minF: number,
    maxF: number,
    soundingStarted: boolean,
    soundingCount: number,
  ): void {
    if (soundingCount + (NUM_STRINGS - si) < MIN_SOUNDING) return;

    if (si === NUM_STRINGS) {
      commit();
      return;
    }

    // Mute — only allowed before any sounding string has been placed
    if (!soundingStarted) {
      buf[si] = -1;
      dfs(si + 1, minF, maxF, false, soundingCount);
    }

    // Open string — only if its note is a chord tone
    {
      const note = noteAt(si, 0);
      if (requiredPcs.has(note)) {
        buf[si] = 0;
        dfs(si + 1, minF, maxF, true, soundingCount + 1);
      }
    }

    // Fretted within the current window [windowStart, windowStart + WINDOW_SIZE - 1]
    for (let df = 0; df < WINDOW_SIZE; df++) {
      const f = windowStart + df;
      const newMin = f < minF ? f : minF;
      const newMax = f > maxF ? f : maxF;
      if (newMax - newMin > MAX_SPAN) continue;

      const note = noteAt(si, f);
      if (!requiredPcs.has(note)) continue;

      buf[si] = f;
      dfs(si + 1, newMin, newMax, true, soundingCount + 1);
    }
  }

  function commit(): void {
    const present = new Set<string>();
    for (let si = 0; si < NUM_STRINGS; si++) {
      if (buf[si] !== -1) present.add(noteAt(si, buf[si]));
    }
    for (const pc of requiredPcs) {
      if (!present.has(pc)) return;
    }

    if (effectiveFingers(buf as number[]) > MAX_FINGERS) return;
    if (!isShapePlayable(buf as number[])) return;

    const key = buf.join(',');
    if (seen.has(key)) return;
    seen.add(key);

    results.push(buildPosition());
  }

  function buildPosition(): VoicingPosition {
    let baseFret = Infinity;
    for (let i = 0; i < NUM_STRINGS; i++) {
      if (buf[i] > 0 && buf[i] < baseFret) baseFret = buf[i];
    }
    if (!isFinite(baseFret)) baseFret = 1;

    const frets = buf.map((f) => {
      if (f === -1) return -1;
      if (f === 0) return 0;
      return f - baseFret + 1;
    });

    const midi: number[] = [];
    for (let si = 0; si < NUM_STRINGS; si++) {
      if (buf[si] !== -1) midi.push(openMidi[si] + buf[si]);
    }

    return { frets, fingers: [], baseFret, barres: [], midi };
  }

  for (windowStart = 1; windowStart <= MAX_WINDOW_START; windowStart++) {
    dfs(0, Infinity, -Infinity, false, 0);
  }

  results.sort((a, b) => {
    if (a.baseFret !== b.baseFret) return a.baseFret - b.baseFret;
    const aMutes = a.frets.filter((f) => f === -1).length;
    const bMutes = b.frets.filter((f) => f === -1).length;
    if (aMutes !== bMutes) return aMutes - bMutes;
    const aOpens = a.frets.filter((f) => f === 0).length;
    const bOpens = b.frets.filter((f) => f === 0).length;
    return aOpens - bOpens;
  });

  return results;
}
