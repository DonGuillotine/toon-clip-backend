import { seedJobs } from "@/features/jobs/mocks";
import { type JobRecord, retryJob, viewJobs } from "@/features/jobs/progress";
import { type Job } from "@/features/jobs/schema";

/**
 * In-memory stand-in for the job queue API. Lives on `globalThis` so every
 * route bundle shares it. Deleted when the backend lands.
 */
type Store = { records: JobRecord[] };

const scope: typeof globalThis & { toonClipJobStore?: Store } = globalThis;

function store(): Store {
  scope.toonClipJobStore ??= { records: seedJobs(Date.now()) };
  return scope.toonClipJobStore;
}

export function listJobs(): Job[] {
  return viewJobs(store().records, Date.now());
}

/** Returns the retried job, or null when there is no failed job with that id. */
export function retry(id: string): Job | null {
  const current = store();
  const now = Date.now();
  const result = retryJob(current.records, id, now);
  if (!result.retried) return null;
  current.records = result.records;
  return viewJobs(current.records, now).find((job) => job.id === id) ?? null;
}
