import {
  type FrameRef,
  type GenerationKind,
  type Shot,
  type ShotAction,
  type StoryboardDetail,
  type Take,
} from "./schema";

/**
 * Pure timeline logic, shared by the route handlers (the source of truth
 * until the API exists) and the client (optimistic updates). No I/O here, so
 * every rule is unit tested.
 */

/** Credits above this need an explicit confirmation (PRODUCT.md, "Credits"). */
export const CONFIRM_ABOVE_CREDITS = 200;

/** The shortest piece a split may leave on either side, in seconds. */
export const MIN_SHOT_SEC = 1;

export type PlacedShot = {
  readonly shot: Shot;
  readonly sheetId: string;
  readonly sheetTitle: string;
  readonly number: number;
  readonly startSec: number;
  readonly endSec: number;
};

export type ActionResult =
  | { readonly ok: true; readonly detail: StoryboardDetail }
  | { readonly ok: false; readonly reason: string };

type ShotFields = {
  readonly id: string;
  readonly durationSec: number;
  readonly prompt: string;
  readonly characterIds: string[];
  readonly firstFrame: FrameRef | null;
  readonly lastFrame: FrameRef | null;
  readonly takes: Take[];
  readonly selectedTakeId: string | null;
};

const round = (value: number): number => Math.round(value * 10) / 10;

/** Every shot in play order, with its place on the track. */
export function placeShots(detail: StoryboardDetail): PlacedShot[] {
  const placed: PlacedShot[] = [];
  let cursor = 0;
  for (const sheet of detail.sheets) {
    for (const shot of sheet.shots) {
      placed.push({
        shot,
        sheetId: sheet.id,
        sheetTitle: sheet.title,
        number: placed.length + 1,
        startSec: cursor,
        endSec: round(cursor + shot.durationSec),
      });
      cursor = round(cursor + shot.durationSec);
    }
  }
  return placed;
}

export function totalDuration(detail: StoryboardDetail): number {
  return placeShots(detail).at(-1)?.endSec ?? 0;
}

/** The shot under the playhead; the last shot once the playhead runs off the end. */
export function shotAt(detail: StoryboardDetail, sec: number): PlacedShot | undefined {
  const placed = placeShots(detail);
  return placed.find((item) => sec >= item.startSec && sec < item.endSec) ?? placed.at(-1);
}

export function selectedTake(shot: Shot): Take | undefined {
  return shot.takes.find((take) => take.id === shot.selectedTakeId);
}

function fieldsOf(shot: Shot): ShotFields {
  return {
    id: shot.id,
    durationSec: shot.durationSec,
    prompt: shot.prompt,
    characterIds: shot.characterIds,
    firstFrame: shot.firstFrame,
    lastFrame: shot.lastFrame,
    takes: shot.takes,
    selectedTakeId: shot.selectedTakeId,
  };
}

/** A shot settles to ready when it has a take, and back to queued only through a job. */
function settled(fields: ShotFields, state: "ready" | "flagged" | "locked"): Shot {
  return { ...fields, state };
}

/** What a shot allows. One table, read by the toolbar, the inspector and the API. */
export function shotAbilities(shot: Shot) {
  const busy = shot.state === "queued" || shot.state === "generating";
  const hasTake = shot.takes.length > 0;
  return {
    flag: (shot.state === "ready" || shot.state === "flagged") && hasTake,
    lock:
      (shot.state === "ready" || shot.state === "flagged" || shot.state === "locked") && hasTake,
    regenerate: shot.state === "ready" || shot.state === "flagged" || shot.state === "failed",
    edit: !busy && shot.state !== "locked",
    continueFrom: !busy && hasTake,
  };
}

type Located = { readonly sheetIndex: number; readonly shotIndex: number; readonly shot: Shot };

function locate(detail: StoryboardDetail, shotId: string): Located | undefined {
  for (const [sheetIndex, sheet] of detail.sheets.entries()) {
    const shotIndex = sheet.shots.findIndex((shot) => shot.id === shotId);
    const shot = sheet.shots[shotIndex];
    if (shot) return { sheetIndex, shotIndex, shot };
  }
  return undefined;
}

/** Replace the shots of one sheet, bumping the revision. */
function withShots(
  detail: StoryboardDetail,
  sheetIndex: number,
  replace: (shots: Shot[]) => Shot[],
): StoryboardDetail {
  return {
    ...detail,
    revision: detail.revision + 1,
    sheets: detail.sheets.map((sheet, index) =>
      index === sheetIndex ? { ...sheet, shots: replace(sheet.shots) } : sheet,
    ),
  };
}

/**
 * Apply a free edit. `newId` mints ids for shots that split or duplicate.
 * `restore` needs revision history, so it lives with the store, not here.
 */
export function applyAction(
  detail: StoryboardDetail,
  action: Exclude<ShotAction, { type: "restore" }>,
  newId: (prefix: string) => string,
): ActionResult {
  const found = locate(detail, action.shotId);
  if (!found) return { ok: false, reason: "That shot is no longer on the timeline." };
  const { sheetIndex, shotIndex, shot } = found;
  const can = shotAbilities(shot);
  const replaceAt = (next: Shot[]) =>
    withShots(detail, sheetIndex, (shots) => [
      ...shots.slice(0, shotIndex),
      ...next,
      ...shots.slice(shotIndex + 1),
    ]);

  switch (action.type) {
    case "flag": {
      if (!can.flag) return { ok: false, reason: "Only a ready shot can be flagged." };
      return {
        ok: true,
        detail: replaceAt([settled(fieldsOf(shot), action.flagged ? "flagged" : "ready")]),
      };
    }
    case "lock": {
      if (!can.lock) return { ok: false, reason: "Only a ready shot can be locked." };
      return {
        ok: true,
        detail: replaceAt([settled(fieldsOf(shot), action.locked ? "locked" : "ready")]),
      };
    }
    case "selectTake": {
      if (!shot.takes.some((take) => take.id === action.takeId)) {
        return { ok: false, reason: "That take is not part of this shot." };
      }
      if (shot.state === "locked") {
        return { ok: false, reason: "Unlock the shot to change its take." };
      }
      return { ok: true, detail: replaceAt([{ ...shot, selectedTakeId: action.takeId }]) };
    }
    case "split": {
      if (!can.edit) return { ok: false, reason: "This shot cannot be split right now." };
      const head = round(action.atSec);
      const tail = round(shot.durationSec - head);
      if (head < MIN_SHOT_SEC || tail < MIN_SHOT_SEC) {
        return { ok: false, reason: "Move the playhead further into the shot to split it." };
      }
      return {
        ok: true,
        detail: replaceAt([
          { ...shot, durationSec: head, lastFrame: null },
          { ...shot, id: newId("shot"), durationSec: tail, firstFrame: null },
        ]),
      };
    }
    case "duplicate": {
      if (shot.state === "queued" || shot.state === "generating") {
        return { ok: false, reason: "Wait for this shot to finish before duplicating it." };
      }
      const copy: Shot = shot.state === "locked" ? settled(fieldsOf(shot), "ready") : { ...shot };
      return { ok: true, detail: replaceAt([shot, { ...copy, id: newId("shot") }]) };
    }
    case "merge": {
      const sheet = detail.sheets[sheetIndex];
      const next = sheet?.shots[shotIndex + 1];
      if (!next) return { ok: false, reason: "There is no next shot in this sheet to merge with." };
      if (!can.edit || !shotAbilities(next).edit) {
        return { ok: false, reason: "Both shots must be unlocked and finished to merge." };
      }
      // Nothing is lost: the merged shot keeps both shots' takes.
      const merged: Shot = {
        ...shot,
        durationSec: round(shot.durationSec + next.durationSec),
        lastFrame: next.lastFrame,
        takes: [...shot.takes, ...next.takes],
      };
      return {
        ok: true,
        detail: withShots(detail, sheetIndex, (shots) => [
          ...shots.slice(0, shotIndex),
          merged,
          ...shots.slice(shotIndex + 2),
        ]),
      };
    }
  }
}

/** Queue a generation: regenerate this shot, or continue with a new shot after it. */
export function applyGenerate(
  detail: StoryboardDetail,
  shotId: string,
  kind: GenerationKind,
  jobId: string,
  newId: (prefix: string) => string,
): ActionResult {
  const found = locate(detail, shotId);
  if (!found) return { ok: false, reason: "That shot is no longer on the timeline." };
  const { sheetIndex, shotIndex, shot } = found;
  const can = shotAbilities(shot);

  switch (kind) {
    case "regenerate": {
      if (!can.regenerate) {
        return {
          ok: false,
          reason:
            shot.state === "locked"
              ? "Unlock the shot to regenerate it."
              : "This shot is already generating.",
        };
      }
      const queued: Shot = { ...fieldsOf(shot), state: "queued", jobId };
      return {
        ok: true,
        detail: withShots(detail, sheetIndex, (shots) =>
          shots.map((item, index) => (index === shotIndex ? queued : item)),
        ),
      };
    }
    case "continue": {
      if (!can.continueFrom) return { ok: false, reason: "This shot needs a take first." };
      const next: Shot = {
        id: newId("shot"),
        durationSec: shot.durationSec,
        prompt: `Continue from shot end: ${shot.prompt}`,
        characterIds: shot.characterIds,
        firstFrame: shot.lastFrame,
        lastFrame: null,
        takes: [],
        selectedTakeId: null,
        state: "queued",
        jobId,
      };
      return {
        ok: true,
        detail: withShots(detail, sheetIndex, (shots) => [
          ...shots.slice(0, shotIndex + 1),
          next,
          ...shots.slice(shotIndex + 1),
        ]),
      };
    }
  }
}

/**
 * Restore an older revision without losing work: any take made since, and
 * any shot still generating, carries over (PRODUCT.md, "Nothing is lost").
 */
export function restoreRevision(
  snapshot: StoryboardDetail,
  current: StoryboardDetail,
): StoryboardDetail {
  const live = new Map(placeShots(current).map((item) => [item.shot.id, item.shot]));
  return {
    ...snapshot,
    sheets: snapshot.sheets.map((sheet) => ({
      ...sheet,
      shots: sheet.shots.map((shot): Shot => {
        const now = live.get(shot.id);
        if (!now) return shot;
        if (now.state === "queued" || now.state === "generating") return now;
        const known = new Set(shot.takes.map((take) => take.id));
        const takes = [...shot.takes, ...now.takes.filter((take) => !known.has(take.id))];
        return { ...shot, takes, selectedTakeId: shot.selectedTakeId ?? takes[0]?.id ?? null };
      }),
    })),
  };
}

/** Settle a finished job: the new take becomes the selected take. */
export function completeJob(
  detail: StoryboardDetail,
  jobId: string,
  outcome:
    | { readonly status: "ready"; readonly take: Take }
    | { readonly status: "failed"; readonly reason: string; readonly creditsRefunded: number },
): StoryboardDetail {
  return {
    ...detail,
    sheets: detail.sheets.map((sheet) => ({
      ...sheet,
      shots: sheet.shots.map((shot): Shot => {
        if (shot.state !== "queued" && shot.state !== "generating") return shot;
        if (shot.jobId !== jobId) return shot;
        const fields = fieldsOf(shot);
        switch (outcome.status) {
          case "ready":
            return {
              ...fields,
              takes: [...fields.takes, outcome.take],
              selectedTakeId: outcome.take.id,
              state: "ready",
            };
          case "failed":
            return {
              ...fields,
              state: "failed",
              reason: outcome.reason,
              creditsRefunded: outcome.creditsRefunded,
            };
        }
      }),
    })),
  };
}

/** Moves the job from queued to generating as it is picked up. */
export function startJob(detail: StoryboardDetail, jobId: string): StoryboardDetail {
  return {
    ...detail,
    sheets: detail.sheets.map((sheet) => ({
      ...sheet,
      shots: sheet.shots.map((shot): Shot =>
        shot.state === "queued" && shot.jobId === jobId
          ? { ...fieldsOf(shot), state: "generating", jobId }
          : shot,
      ),
    })),
  };
}

/** J K L shuttle: J steps the rate back, K stops, L steps it forward. */
export const SHUTTLE_RATES: readonly number[] = [-4, -2, -1, 0, 1, 2, 4];

export function shuttle(rate: number, key: "j" | "k" | "l"): number {
  if (key === "k") return 0;
  const index = SHUTTLE_RATES.indexOf(rate);
  const from = index === -1 ? SHUTTLE_RATES.indexOf(0) : index;
  const step = key === "l" ? 1 : -1;
  // Reversing direction stops first, then picks up speed the other way.
  if ((key === "l" && rate < 0) || (key === "j" && rate > 0)) return 0;
  return SHUTTLE_RATES[Math.min(Math.max(from + step, 0), SHUTTLE_RATES.length - 1)] ?? 0;
}
