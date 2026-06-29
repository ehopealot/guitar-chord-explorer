import { OPEN_MIDI, CHROMATIC } from '../constants/guitar';
import type { VoicingPosition } from '../types';

// @tonaljs/chord returns flat names; CHROMATIC is all-sharps
const ENHARMONIC: Record<string, string> = {
  Bb: 'A#', Cb: 'B', Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#',
};

function normalize(note: string): string {
  return ENHARMONIC[note] ?? note;
}

function noteAt(si: number, absFret: number): string {
  return CHROMATIC[((OPEN_MIDI[si] + absFret) % 12 + 12) % 12];
}

const NUM_STRINGS = 6;
const WINDOW_SIZE = 4;   // each window spans [w, w+3]
const MAX_SPAN = 3;       // max - min of fretted notes ≤ 3
const MAX_WINDOW_START = 17;

export function generateVoicings(chordNotes: string[]): VoicingPosition[] {
  const requiredPcs = new Set(chordNotes.map(normalize));
  if (requiredPcs.size === 0) return [];

  const seen = new Set<string>();
  const results: VoicingPosition[] = [];
  // Reused buffer of absolute frets, one per string
  const buf = new Array<number>(NUM_STRINGS);

  let windowStart = 1;

  function dfs(
    si: number,
    minF: number,
    maxF: number,
    soundingStarted: boolean,
    soundingCount: number,
  ): void {
    // Prune: not enough strings left to reach minimum of 3 sounding
    if (soundingCount + (NUM_STRINGS - si) < 3) return;

    if (si === NUM_STRINGS) {
      commit();
      return;
    }

    // Mute — only allowed before any sounding string has been placed
    if (!soundingStarted) {
      buf[si] = -1;
      dfs(si + 1, minF, maxF, false, soundingCount);
    }

    // Open string (fret 0) — only if its note is a chord tone
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
    // All required pitch classes must be present
    const present = new Set<string>();
    for (let si = 0; si < NUM_STRINGS; si++) {
      if (buf[si] !== -1) present.add(noteAt(si, buf[si]));
    }
    for (const pc of requiredPcs) {
      if (!present.has(pc)) return;
    }

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
      if (buf[si] !== -1) midi.push(OPEN_MIDI[si] + buf[si]);
    }

    return { frets, fingers: [], baseFret, barres: [], midi };
  }

  for (windowStart = 1; windowStart <= MAX_WINDOW_START; windowStart++) {
    dfs(0, Infinity, -Infinity, false, 0);
  }

  results.sort((a, b) => {
    if (a.baseFret !== b.baseFret) return a.baseFret - b.baseFret;
    // Prefer fewer muted strings (fuller voicings first)
    const aMutes = a.frets.filter((f) => f === -1).length;
    const bMutes = b.frets.filter((f) => f === -1).length;
    if (aMutes !== bMutes) return aMutes - bMutes;
    // Prefer fewer open strings (more fretted = more distinctive shape)
    const aOpens = a.frets.filter((f) => f === 0).length;
    const bOpens = b.frets.filter((f) => f === 0).length;
    return aOpens - bOpens;
  });

  return results;
}
