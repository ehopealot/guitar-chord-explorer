import { useState, useCallback } from 'react';
import type { FretboardPositions } from '../types';
import { VISIBLE_FRETS, MAX_FRET } from '../constants/guitar';

const INITIAL: FretboardPositions = [0, 0, 0, 0, 0, 0];

export function useFretboard() {
  const [positions, setPositions] = useState<FretboardPositions>(INITIAL);
  const [viewportFret, setViewportFret] = useState(1);

  const handleFretClick = useCallback((stringIdx: number, fretNum: number) => {
    setPositions((prev) => {
      const next = [...prev] as FretboardPositions;
      next[stringIdx] = prev[stringIdx] === fretNum ? 0 : fretNum;
      return next;
    });
  }, []);

  // Toggle: open (0) ↔ muted (-1)
  const handleStringHeaderClick = useCallback((stringIdx: number) => {
    setPositions((prev) => {
      const next = [...prev] as FretboardPositions;
      next[stringIdx] = prev[stringIdx] === -1 ? 0 : -1;
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
