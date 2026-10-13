/**
 * Pre-rendered clips for an example's beats, served from `public/examples`.
 * The API does not send example video yet, so an example listed here shows
 * one clip per beat on the result step. An example that is not listed, or a
 * beat past the clip count, shows the beat text only.
 */
const BEAT_CLIP_COUNTS: Readonly<Record<string, number>> = {
  "big-chief-earth-shatter": 7,
};

/** The clip URL for a beat (1-based), or null when there is none. */
export function beatClipUrl(scenarioId: string, beatNumber: number): string | null {
  const count = BEAT_CLIP_COUNTS[scenarioId];
  if (count === undefined || beatNumber < 1 || beatNumber > count) return null;
  return `/examples/${scenarioId}/${String(beatNumber)}.mp4`;
}
