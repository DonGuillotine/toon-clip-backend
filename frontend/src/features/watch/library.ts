import { type Generation, type QuickTab } from "@/features/create/schema";
import { type CoverArt, type Shot, type StoryboardDetail } from "@/features/storyboards/schema";

import { type WatchItem, WatchItemSchema, type WatchSegment } from "./schema";

/**
 * Builds the watch library from storyboards and quick create results. Pure,
 * so the route handler and the tests share it. When the backend lands it
 * returns this list itself and only the route handler changes.
 */

/** Dialogue lines per storyboard, by shot position. Sample content. */
export type CaptionBook = Readonly<Record<string, readonly (string | null)[]>>;

const ART_CYCLE: readonly CoverArt[] = ["burst", "rush", "dusk", "rain"];

/** States whose selected take is good enough to watch. */
function isWatchable(shot: Shot): boolean {
  switch (shot.state) {
    case "ready":
    case "flagged":
    case "locked":
      return shot.selectedTakeId !== null;
    case "queued":
    case "generating":
    case "failed":
      return false;
  }
}

/**
 * A quick create result has no duration on the wire yet, so playback uses a
 * stand-in length per tab. Audio lives in Music and voices, not here.
 */
const GENERATION_LENGTH: Readonly<Record<QuickTab, number | null>> = {
  video: 5,
  stitch: 10,
  image: 4,
  composition: 4,
  audio: null,
};

/** One storyboard as a watchable clip, or `null` when no shot has a take yet. */
export function storyboardToWatchItem(
  detail: StoryboardDetail,
  captions: CaptionBook,
): WatchItem | null {
  const lines = captions[detail.id] ?? [];
  const segments: WatchSegment[] = [];
  let startSec = 0;
  let skippedShots = 0;
  let position = 0;

  for (const sheet of detail.sheets) {
    for (const shot of sheet.shots) {
      const index = position;
      position += 1;
      if (!isWatchable(shot)) {
        skippedShots += 1;
        continue;
      }
      const take = shot.takes.find((candidate) => candidate.id === shot.selectedTakeId);
      if (!take) {
        skippedShots += 1;
        continue;
      }
      segments.push({
        id: shot.id,
        label: `${sheet.title}, shot ${String(index + 1)}`,
        startSec,
        durationSec: shot.durationSec,
        art: take.art,
        caption: lines[index] ?? null,
      });
      startSec += shot.durationSec;
    }
  }

  if (segments.length === 0) return null;
  return WatchItemSchema.parse({
    id: detail.id,
    kind: "storyboard",
    title: detail.title,
    subtitle: detail.style,
    aspectRatio: detail.aspectRatio,
    updatedAt: detail.updatedAt,
    durationSec: startSec,
    cover: detail.cover,
    storyboardId: detail.id,
    skippedShots,
    segments,
  });
}

/** One finished quick create result as a single-segment clip. */
export function generationToWatchItem(generation: Generation, index: number): WatchItem | null {
  if (generation.status !== "ready") return null;
  const length = GENERATION_LENGTH[generation.tab];
  if (length === null) return null;
  const art = ART_CYCLE[index % ART_CYCLE.length] ?? "burst";
  return WatchItemSchema.parse({
    id: generation.id,
    kind: "generation",
    title: generation.prompt,
    subtitle: generation.modelName ?? "Quick create",
    aspectRatio: "16:9",
    updatedAt: generation.createdAt,
    durationSec: length,
    cover: { art, sfx: null },
    storyboardId: null,
    skippedShots: 0,
    segments: [
      {
        id: `${generation.id}_clip`,
        label: "Quick create",
        startSec: 0,
        durationSec: length,
        art,
        caption: null,
      },
    ],
  });
}

/** Everything that can be played, newest first. */
export function buildWatchLibrary(
  storyboards: readonly StoryboardDetail[],
  generations: readonly Generation[],
  captions: CaptionBook,
): WatchItem[] {
  const items: WatchItem[] = [];
  for (const detail of storyboards) {
    const item = storyboardToWatchItem(detail, captions);
    if (item) items.push(item);
  }
  generations.forEach((generation, index) => {
    const item = generationToWatchItem(generation, index);
    if (item) items.push(item);
  });
  return items.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}
