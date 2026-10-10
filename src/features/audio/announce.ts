import { type AudioClip } from "./schema";

/** Progress is announced at these steps, not on every poll. */
const STEPS: readonly number[] = [25, 50, 75];

function step(progress: number): number {
  return STEPS.filter((value) => progress >= value).length;
}

/**
 * What a screen reader should hear when the library changes from `before` to
 * `after`: a clip starting, passing a quarter mark, finishing or failing.
 * Pure, so the live region only renders what this returns.
 */
export function describeProgress(
  before: readonly AudioClip[],
  after: readonly AudioClip[],
): readonly string[] {
  const previous = new Map(before.map((clip) => [clip.id, clip]));
  const messages: string[] = [];
  for (const clip of after) {
    const was = previous.get(clip.id);
    // New rows and optimistic rows are announced by the toast that made them.
    if (!was) continue;
    switch (clip.status) {
      case "queued":
        break;
      case "generating":
        if (was.status !== "generating") {
          messages.push(`${clip.title} started generating.`);
        } else if (step(clip.progress) > step(was.progress)) {
          messages.push(`${clip.title} is ${String(clip.progress)}% done.`);
        }
        break;
      case "ready":
        if (was.status !== "ready") messages.push(`${clip.title} is ready to play.`);
        break;
      case "failed":
        if (was.status !== "failed") {
          messages.push(`${clip.title} failed. ${String(clip.refunded)} credits were refunded.`);
        }
        break;
    }
  }
  return messages;
}
