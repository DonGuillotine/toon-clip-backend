import { type Job } from "./schema";

/**
 * Pure job timing for the fixture queue. A running job waits in the queue,
 * then generates, then leaves the queue once its take is ready. Kept pure so
 * the route handler and the tests agree on what "now" means.
 */

/** Simulated queue wait, in milliseconds. */
export const QUEUED_FOR_MS = 20_000;
/** Simulated generation time, in milliseconds. */
export const GENERATING_FOR_MS = 90_000;

export type JobIdentity = {
  readonly id: string;
  readonly storyboardId: string;
  readonly storyboardTitle: string;
  readonly shotNumber: number;
  readonly takeNumber: number;
};

export type JobRecord =
  | (JobIdentity & { readonly phase: "running"; readonly startedAt: number })
  | (JobIdentity & {
      readonly phase: "failed";
      readonly reason: string;
      readonly creditsRefunded: number;
    });

type Placed =
  | { readonly kind: "queued"; readonly record: JobIdentity }
  | { readonly kind: "generating"; readonly record: JobIdentity; readonly elapsed: number }
  | { readonly kind: "done" };

function place(record: JobRecord & { phase: "running" }, now: number): Placed {
  const elapsed = Math.max(0, now - record.startedAt);
  if (elapsed < QUEUED_FOR_MS) return { kind: "queued", record };
  if (elapsed < QUEUED_FOR_MS + GENERATING_FOR_MS) {
    return { kind: "generating", record, elapsed: elapsed - QUEUED_FOR_MS };
  }
  return { kind: "done" };
}

/**
 * The visible queue at `now`. Finished jobs drop out; queued jobs are
 * numbered in the order they started; failed jobs stay until retried.
 */
export function viewJobs(records: readonly JobRecord[], now: number): Job[] {
  const jobs: Job[] = [];
  let position = 0;
  const queuedFirst = [...records].sort((a, b) => {
    const at = a.phase === "running" ? a.startedAt : Number.POSITIVE_INFINITY;
    const bt = b.phase === "running" ? b.startedAt : Number.POSITIVE_INFINITY;
    return at - bt;
  });
  for (const record of queuedFirst) {
    const { id, storyboardId, storyboardTitle, shotNumber, takeNumber } = record;
    const base = { id, storyboardId, storyboardTitle, shotNumber, takeNumber };
    if (record.phase === "failed") {
      jobs.push({
        ...base,
        status: "failed",
        reason: record.reason,
        creditsRefunded: record.creditsRefunded,
      });
      continue;
    }
    const placed = place(record, now);
    switch (placed.kind) {
      case "done":
        break;
      case "queued":
        position += 1;
        jobs.push({ ...base, status: "queued", positionInQueue: position });
        break;
      case "generating": {
        const progress = Math.min(100, (placed.elapsed / GENERATING_FOR_MS) * 100);
        jobs.push({
          ...base,
          status: "generating",
          progress: Math.round(progress * 10) / 10,
          secondsLeft: Math.ceil((GENERATING_FOR_MS - placed.elapsed) / 1000),
        });
        break;
      }
    }
  }
  // Generating first, then the line, then failures: the order people read.
  const rank = { generating: 0, queued: 1, failed: 2 } satisfies Record<Job["status"], number>;
  return jobs.sort((a, b) => rank[a.status] - rank[b.status]);
}

/**
 * Retry a failed job: it re-enters the queue as a new take. Running jobs and
 * unknown ids are returned unchanged with `retried: false`.
 */
export function retryJob(
  records: readonly JobRecord[],
  id: string,
  now: number,
): { readonly records: JobRecord[]; readonly retried: boolean } {
  let retried = false;
  const next = records.map((record): JobRecord => {
    if (record.id !== id || record.phase !== "failed") return record;
    retried = true;
    return {
      id: record.id,
      storyboardId: record.storyboardId,
      storyboardTitle: record.storyboardTitle,
      shotNumber: record.shotNumber,
      takeNumber: record.takeNumber + 1,
      phase: "running",
      startedAt: now,
    };
  });
  return { records: next, retried };
}
