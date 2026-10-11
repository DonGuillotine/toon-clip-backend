import { type Shot, type Take } from "./schema";

/**
 * The states a shot can be in on the live API. Takes are prepared, so a shot
 * is never queued, generating, or failed here; those states stay in the
 * fixture-backed timeline.
 */
export type LiveShotState = "ready" | "flagged" | "locked";

/** Locked wins: a locked shot cannot be revised, which matters more than a flag. */
export function shotState(shot: Pick<Shot, "flagged" | "locked">): LiveShotState {
  if (shot.locked) return "locked";
  if (shot.flagged) return "flagged";
  return "ready";
}

/** The take a shot shows: the selected one, or its first take. */
export function selectedTake(shot: Pick<Shot, "selectedTakeId" | "takes">): Take | null {
  return shot.takes.find((take) => take.id === shot.selectedTakeId) ?? shot.takes[0] ?? null;
}

/**
 * A take's name: the prepared option it came from ("Original",
 * "Alternate"), numbered when the shot holds that option more than once.
 */
export function takeName(shot: Pick<Shot, "takes" | "revisionOptions">, take: Take): string {
  const source = shot.revisionOptions.find((option) => option.id === take.sourceOptionId);
  const base = source?.label ?? `Take ${String(shot.takes.indexOf(take) + 1)}`;
  const same = shot.takes.filter((item) => item.sourceOptionId === take.sourceOptionId);
  if (source === undefined || same.length < 2) return base;
  return `${base} ${String(same.indexOf(take) + 1)}`;
}

/** Seconds as "6s" or "6.5s". */
export function formatSeconds(seconds: number): string {
  return `${String(Math.round(seconds * 10) / 10)}s`;
}
