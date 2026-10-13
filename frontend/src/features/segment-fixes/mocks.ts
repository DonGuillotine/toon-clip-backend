import { type SegmentFix, SegmentFixSchema, type SegmentFixRequest } from "./schema";

/**
 * The stand-in for segment fixes while the API has no endpoint (dev mode
 * only). A fix waits in the queue, renders for a while, then lands. Every
 * third fix fails, so the failed state and its retry can be seen.
 */

const QUEUED_MS = 2_000;
const RENDER_MS = 8_000;
/** The price the fixture charges: the API's revision price, by assumption. */
export const FIXTURE_FIX_CREDITS = 5;

export type FixRecord = {
  readonly id: string;
  readonly request: SegmentFixRequest;
  readonly startedAtMs: number;
  readonly createdAtMs: number;
  readonly fails: boolean;
};

export function newFixRecord(
  id: string,
  request: SegmentFixRequest,
  nowMs: number,
  ordinal: number,
): FixRecord {
  return { id, request, startedAtMs: nowMs, createdAtMs: nowMs, fails: ordinal % 3 === 2 };
}

/** A record restarted after a failure. A retried fix goes through. */
export function retriedRecord(record: FixRecord, nowMs: number): FixRecord {
  return { ...record, startedAtMs: nowMs, fails: false };
}

/** What a record looks like at `nowMs`, parsed like an API answer. */
export function viewFix(record: FixRecord, nowMs: number): SegmentFix {
  const elapsed = nowMs - record.startedAtMs;
  const base = {
    id: record.id,
    projectId: record.request.projectId,
    shotId: record.request.shotId,
    startSeconds: record.request.startSeconds,
    endSeconds: record.request.endSeconds,
    instruction: record.request.instruction,
    credits: FIXTURE_FIX_CREDITS,
    createdAt: Math.floor(record.createdAtMs / 1000),
  };
  if (elapsed < QUEUED_MS) return SegmentFixSchema.parse({ ...base, state: "queued" });
  if (elapsed < QUEUED_MS + RENDER_MS) {
    const progress = Math.min(0.99, (elapsed - QUEUED_MS) / RENDER_MS);
    return SegmentFixSchema.parse({ ...base, state: "generating", progress });
  }
  if (record.fails) {
    return SegmentFixSchema.parse({
      ...base,
      state: "failed",
      credits: 0,
      reason: "The render stopped partway. Your credits were refunded.",
    });
  }
  // The fixture cannot add a take to a live project, so it has none to name.
  return SegmentFixSchema.parse({ ...base, state: "ready", takeId: null });
}
