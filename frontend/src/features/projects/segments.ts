import { type Beat } from "@/features/catalog/beats";

/**
 * Cutting a shot into segments. A cut is a point in the shot, in seconds
 * from its start; the segments are what lies between the cuts. Cuts are a
 * view on the shot, kept in the URL: the API keeps the shot whole.
 */

/** The shortest piece a cut may leave on either side, in seconds. */
export const MIN_SEGMENT_SECONDS = 0.5;

export type Segment = {
  /** 1-based, as people count them. */
  readonly number: number;
  readonly startSeconds: number;
  readonly endSeconds: number;
};

export type CutResult =
  | { readonly ok: true; readonly cuts: readonly number[] }
  | { readonly ok: false; readonly reason: string };

/** Tenths of a second: as fine as anyone can place a cut by hand. */
export function roundCut(seconds: number): number {
  return Math.round(seconds * 10) / 10;
}

/** Sorted, de-duplicated, rounded, and inside the shot. */
export function normaliseCuts(cuts: readonly number[], durationSeconds: number): number[] {
  const inside = cuts
    .map(roundCut)
    .filter((cut) => Number.isFinite(cut) && cut > 0 && cut < durationSeconds);
  return [...new Set(inside)].sort((a, b) => a - b);
}

export function segmentsOf(durationSeconds: number, cuts: readonly number[]): Segment[] {
  const points = [0, ...normaliseCuts(cuts, durationSeconds), durationSeconds];
  const segments: Segment[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const startSeconds = points[index] ?? 0;
    const endSeconds = points[index + 1] ?? durationSeconds;
    segments.push({ number: index + 1, startSeconds, endSeconds });
  }
  return segments;
}

/** The segment playing at `seconds`. The end of the shot belongs to the last one. */
export function segmentAt(segments: readonly Segment[], seconds: number): Segment | null {
  return (
    segments.find((segment) => seconds >= segment.startSeconds && seconds < segment.endSeconds) ??
    segments.at(-1) ??
    null
  );
}

/** Adds a cut at `seconds`, refusing one that would leave a sliver. */
export function addCut(
  cuts: readonly number[],
  seconds: number,
  durationSeconds: number,
): CutResult {
  const at = roundCut(seconds);
  const current = normaliseCuts(cuts, durationSeconds);
  if (current.includes(at)) return { ok: false, reason: "There is already a cut here." };
  const segment = segmentAt(segmentsOf(durationSeconds, current), at);
  if (
    segment === null ||
    at - segment.startSeconds < MIN_SEGMENT_SECONDS ||
    segment.endSeconds - at < MIN_SEGMENT_SECONDS
  ) {
    return {
      ok: false,
      reason:
        "Move the playhead further from the nearest cut. A segment is at least half a second.",
    };
  }
  return { ok: true, cuts: normaliseCuts([...current, at], durationSeconds) };
}

/** Joins a segment to the next one by removing the cut between them. */
export function joinWithNext(
  cuts: readonly number[],
  segment: Segment,
  durationSeconds: number,
): CutResult {
  const current = normaliseCuts(cuts, durationSeconds);
  if (!current.includes(segment.endSeconds)) {
    return { ok: false, reason: "This is the last segment: there is nothing after it to join." };
  }
  return { ok: true, cuts: current.filter((cut) => cut !== segment.endSeconds) };
}

/**
 * Cuts where a prompt's beats change, scaled to the shot when the beats and
 * the clip disagree slightly about its length.
 */
export function beatCuts(beats: readonly Beat[], durationSeconds: number): number[] {
  const last = beats.at(-1);
  if (last === undefined) return [];
  const scale = last.endSeconds > 0 ? durationSeconds / last.endSeconds : 1;
  // Scale only a small disagreement; a big one means the beats describe another clip.
  const factor = Math.abs(scale - 1) <= 0.1 ? scale : 1;
  return normaliseCuts(
    beats.slice(1).map((beat) => beat.startSeconds * factor),
    durationSeconds,
  ).filter((cut) => cut >= MIN_SEGMENT_SECONDS && durationSeconds - cut >= MIN_SEGMENT_SECONDS);
}

/** True when two cut lists hold the same cuts. */
export function sameCuts(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((cut, index) => cut === b[index]);
}

/**
 * The cuts of every shot, in the URL as `shotId:3,6.5;otherShot:2`. Shot ids
 * are `[A-Za-z0-9_-]`, so the separators never clash with them.
 */
export type CutMap = Readonly<Record<string, readonly number[]>>;

export function serialiseCutMap(map: CutMap): string {
  return Object.entries(map)
    .filter(([, cuts]) => cuts.length > 0)
    .map(([shotId, cuts]) => `${shotId}:${cuts.map((cut) => String(roundCut(cut))).join(",")}`)
    .join(";");
}

/** Parses the URL form. Anything unreadable is dropped, never thrown. */
export function parseCutMap(value: string): CutMap | null {
  const map: Record<string, number[]> = {};
  for (const entry of value.split(";")) {
    const [shotId = "", list = ""] = entry.split(":");
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(shotId)) continue;
    const cuts = list
      .split(",")
      .map(Number)
      .filter((cut) => Number.isFinite(cut) && cut > 0);
    if (cuts.length > 0) map[shotId] = [...new Set(cuts.map(roundCut))].sort((a, b) => a - b);
  }
  return Object.keys(map).length === 0 ? null : map;
}
