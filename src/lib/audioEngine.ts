let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function pluckString(ctx: AudioContext, freq: number, startTime: number) {
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
  gain.gain.setValueAtTime(0.75, startTime);
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
