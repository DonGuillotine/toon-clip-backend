import {
  type FixRecord,
  newFixRecord,
  retriedRecord,
  viewFix,
} from "@/features/segment-fixes/mocks";
import { type SegmentFix, type SegmentFixRequest } from "@/features/segment-fixes/schema";

/**
 * In-memory stand-in for segment fixes. Lives on `globalThis` so every route
 * bundle shares it. Deleted when the backend lands.
 */
type Store = {
  records: FixRecord[];
  /** Idempotency keys already answered, so a retried request is not a second fix. */
  keys: Map<string, string>;
};

const scope: typeof globalThis & { toonClipSegmentFixStore?: Store } = globalThis;

function store(): Store {
  scope.toonClipSegmentFixStore ??= { records: [], keys: new Map() };
  return scope.toonClipSegmentFixStore;
}

export function listFixes(projectId: string): SegmentFix[] {
  const now = Date.now();
  return store()
    .records.filter((record) => record.request.projectId === projectId)
    .map((record) => viewFix(record, now));
}

export function createFix(request: SegmentFixRequest, idempotencyKey: string | null): SegmentFix {
  const current = store();
  const now = Date.now();
  const known = idempotencyKey === null ? undefined : current.keys.get(idempotencyKey);
  const existing = current.records.find((record) => record.id === known);
  if (existing !== undefined) return viewFix(existing, now);

  const record = newFixRecord(
    `fix_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`,
    request,
    now,
    current.records.length,
  );
  current.records = [...current.records, record];
  if (idempotencyKey !== null) current.keys.set(idempotencyKey, record.id);
  return viewFix(record, now);
}

/** The retried fix, or null when there is no failed fix with that id. */
export function retryFix(id: string): SegmentFix | null {
  const current = store();
  const now = Date.now();
  const record = current.records.find((item) => item.id === id);
  if (record === undefined || viewFix(record, now).state !== "failed") return null;
  const next = retriedRecord(record, now);
  current.records = current.records.map((item) => (item.id === id ? next : item));
  return viewFix(next, now);
}
