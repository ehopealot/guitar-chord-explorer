let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function pluckString(ctx: AudioContext, freq: number, startTime: number, volume = 1.0) {
  const sr = ctx.sampleRate;
  const N = Math.max(Math.round(sr / freq), 1);
  const duration = 4.0;
  const numSamples = Math.ceil(sr * duration);

  const audioBuffer = ctx.createBuffer(1, numSamples, sr);
  const data = audioBuffer.getChannelData(0);

  // Karplus-Strong: seed delay buffer with white noise
  const delay = new Float32Array(N);
  for (let i = 0; i < N; i++) delay[i] = Math.random() * 2 - 1;

  const decay = 0.997;
  for (let i = 0; i < numSamples; i++) {
    const idx = i % N;
    data[i] = delay[idx];
    delay[idx] = decay * 0.5 * (delay[idx] + delay[(idx + 1) % N]);
  }

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.75 * volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration - 0.1);

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(startTime);
}

// midiNotes should be in low-to-high string order for a natural strum
export function playChord(midiNotes: number[], strumMs = 28) {
  if (midiNotes.length === 0) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  midiNotes.forEach((midi, i) => {
    pluckString(ctx, midiToFreq(midi), now + (i * strumMs) / 1000);
  });
}

// Which beat indices (0-based) within a measure are unaccented (quieter).
// Beat 0 is always the downbeat.
const QUIET_BEATS: Record<number, Set<number>> = {
  2: new Set([1]),
  3: new Set([1, 2]),
  4: new Set([1, 3]),
  6: new Set([1, 2, 4, 5]),
};

const ACCENT_VOLUME = 1.0;
const QUIET_VOLUME  = 0.45;

// Lookahead scheduler for progression playback.
// Audio is scheduled precisely via AudioContext clock; UI callbacks use
// setTimeout (visual jitter is acceptable).
const LOOKAHEAD_S = 0.2;
const TICK_MS     = 25;

let _stopPlayback: (() => void) | null = null;

export function startProgressionPlayback(
  chords: number[][],
  bpm: number,
  beatsPerMeasure: number,
  onChordIndex: (i: number) => void,
): void {
  stopProgressionPlayback();
  if (chords.length === 0) return;

  const ctx = getCtx();
  const secPerBeat = 60 / bpm;
  const quietBeats = QUIET_BEATS[beatsPerMeasure] ?? QUIET_BEATS[4];
  let nextTime = ctx.currentTime + 0.05;
  let nextBeat = 0;
  let stopped = false;

  function tick() {
    if (stopped) return;
    const now = ctx.currentTime;
    while (nextTime < now + LOOKAHEAD_S) {
      const beatInMeasure = nextBeat % beatsPerMeasure;
      const chordIdx = Math.floor(nextBeat / beatsPerMeasure) % chords.length;
      const isUpstroke = nextBeat % 2 === 1;
      const volume = quietBeats.has(beatInMeasure) ? QUIET_VOLUME : ACCENT_VOLUME;
      const notes = chords[chordIdx];
      const ordered = isUpstroke ? [...notes].reverse() : notes;
      ordered.forEach((midi, i) => {
        pluckString(ctx, midiToFreq(midi), nextTime + i * 0.018, volume);
      });
      // Fire UI callback on the first beat of each chord
      if (beatInMeasure === 0) {
        const delay = Math.max(0, (nextTime - now) * 1000);
        const captured = chordIdx;
        setTimeout(() => { if (!stopped) onChordIndex(captured); }, delay);
      }
      nextTime += secPerBeat;
      nextBeat++;
    }
  }

  tick();
  const id = setInterval(tick, TICK_MS);
  _stopPlayback = () => {
    stopped = true;
    clearInterval(id);
    _stopPlayback = null;
  };
}

export function stopProgressionPlayback(): void {
  _stopPlayback?.();
}
