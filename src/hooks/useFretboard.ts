import { useState, useCallback } from 'react';
import type { FretboardPositions } from '../types';
import { VISIBLE_FRETS, MAX_FRET } from '../constants/guitar';

const INITIAL: FretboardPositions = [null, null, null, null, null, null];

export function useFretboard() {
  const [positions, setPositions] = useState<FretboardPositions>(INITIAL);
  const [viewportFret, setViewportFret] = useState(1);

  const handleFretClick = useCallback((stringIdx: number, fretNum: number) => {
    setPositions((prev) => {
      const next = [...prev] as FretboardPositions;
      next[stringIdx] = prev[stringIdx] === fretNum ? null : fretNum;
      return next;
    });
  }, []);

  // Cycle: null → 0 (open) → -1 (muted) → null
  const handleStringHeaderClick = useCallback((stringIdx: number) => {
    setPositions((prev) => {
      const next = [...prev] as FretboardPositions;
      const cur = prev[stringIdx];
      if (cur === null) next[stringIdx] = 0;
      else if (cur === 0) next[stringIdx] = -1;
      else next[stringIdx] = null;
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setPositions(INITIAL);
    setViewportFret(1);
  }, []);

  const scrollUp = useCallback(() => {
    setViewportFret((v) => Math.max(1, v - 1));
  }, []);

  const scrollDown = useCallback(() => {
    setViewportFret((v) => Math.min(MAX_FRET - VISIBLE_FRETS + 1, v + 1));
  }, []);

  return {
    positions,
    viewportFret,
    handleFretClick,
    handleStringHeaderClick,
    clearAll,
    scrollUp,
    scrollDown,
  };
}
