/**
 * A deterministic stand-in waveform. No real audio exists yet, so each clip
 * gets a shape seeded from its id: the same clip always draws the same bars,
 * on the server and in the browser, so hydration never disagrees.
 */

/** FNV-1a, a small stable string hash. */
function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/** Mulberry32, a seeded generator: same seed, same sequence. */
function generator(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Bar heights between 0.15 and 1 for `seed`. Neighbouring bars are smoothed
 * so the shape reads as sound, not noise, and the ends taper.
 */
export function waveform(seed: string, bars: number): readonly number[] {
  if (bars <= 0) return [];
  const next = generator(hash(seed));
  const raw = Array.from({ length: bars }, () => next());
  return raw.map((value, index) => {
    const previous = raw[index - 1] ?? value;
    const following = raw[index + 1] ?? value;
    const smooth = (previous + value * 2 + following) / 4;
    const position = bars === 1 ? 0.5 : index / (bars - 1);
    const taper = Math.min(1, Math.sin(Math.PI * position) * 1.6 + 0.25);
    const height = 0.15 + 0.85 * smooth * taper;
    return Math.round(Math.min(1, Math.max(0.15, height)) * 100) / 100;
  });
}

/** How many bars of `bars` are played at `fraction` (0 to 1) of the way through. */
export function playedBars(bars: number, fraction: number): number {
  const clamped = Math.min(1, Math.max(0, fraction));
  return Math.floor(clamped * bars);
}
