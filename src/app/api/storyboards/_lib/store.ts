import { storyboardDetailsFixture } from "@/features/storyboards/mocks";
import {
  type GenerationKind,
  type ShotAction,
  type ShotJob,
  type StoryboardDetail,
} from "@/features/storyboards/schema";
import {
  applyAction,
  applyGenerate,
  completeJob,
  placeShots,
  restoreRevision,
  startJob,
  type ActionResult,
} from "@/features/storyboards/timeline";

/**
 * The in-memory stand-in for the storyboard API. Only route handlers import
 * this file; when the backend lands, the handlers proxy to it and this file
 * is deleted. State lives on `globalThis` so every route bundle shares it.
 */

/** Simulated job timing, in milliseconds. */
const QUEUED_FOR = 2_000;
const GENERATING_FOR = 8_000;
/** Fixture price per second of shot. Only the API knows prices. */
const CREDITS_PER_SECOND = 30;

type JobRecord = {
  readonly storyboardId: string;
  readonly shotId: string;
  readonly startedAt: number;
  readonly notes: string | null;
  readonly credits: number;
  settled: boolean;
};

type Board = {
  current: StoryboardDetail;
  readonly revisions: Map<number, StoryboardDetail>;
  nextRevision: number;
};

type Store = {
  readonly boards: Map<string, Board>;
  readonly jobs: Map<string, JobRecord>;
  counter: number;
};

const scope: typeof globalThis & { toonClipStoryboardStore?: Store } = globalThis;

function createStore(): Store {
  const now = Date.now();
  const store: Store = { boards: new Map(), jobs: new Map(), counter: 0 };
  for (const detail of storyboardDetailsFixture) {
    store.boards.set(detail.id, {
      current: detail,
      revisions: new Map([[detail.revision, detail]]),
      nextRevision: detail.revision + 1,
    });
    // Fixture shots that start mid-generation get a job, so they finish.
    for (const { shot } of placeShots(detail)) {
      if (shot.state !== "queued" && shot.state !== "generating") continue;
      store.jobs.set(shot.jobId, {
        storyboardId: detail.id,
        shotId: shot.id,
        startedAt: shot.state === "generating" ? now - QUEUED_FOR : now,
        notes: null,
        credits: Math.round(shot.durationSec * CREDITS_PER_SECOND),
        settled: false,
      });
    }
  }
  return store;
}

function store(): Store {
  scope.toonClipStoryboardStore ??= createStore();
  return scope.toonClipStoryboardStore;
}

function newId(prefix: string): string {
  const s = store();
  s.counter += 1;
  return `${prefix}_${Date.now().toString(36)}${String(s.counter)}`;
}

function jobStatus(job: JobRecord, jobId: string, now: number): ShotJob {
  const elapsed = now - job.startedAt;
  if (elapsed < QUEUED_FOR) return { id: jobId, status: "queued", positionInQueue: 1 };
  if (elapsed < QUEUED_FOR + GENERATING_FOR) {
    const progress = Math.round(((elapsed - QUEUED_FOR) / GENERATING_FOR) * 100);
    return { id: jobId, status: "generating", progress };
  }
  return { id: jobId, status: "ready" };
}

/** Advance every job on a board to where the clock says it is. */
function tick(board: Board, now: number): void {
  for (const [jobId, job] of store().jobs) {
    if (job.settled || job.storyboardId !== board.current.id) continue;
    const status = jobStatus(job, jobId, now);
    if (status.status === "generating") {
      board.current = startJob(board.current, jobId);
    } else if (status.status === "ready") {
      const shot = placeShots(board.current).find((item) => item.shot.id === job.shotId)?.shot;
      const number = (shot?.takes.length ?? 0) + 1;
      const arts = ["burst", "rush", "dusk", "rain"] satisfies StoryboardDetail["cover"]["art"][];
      board.current = completeJob(board.current, jobId, {
        status: "ready",
        take: {
          id: `${job.shotId}_t${String(number)}_${jobId.slice(-4)}`,
          number,
          prompt: shot?.prompt ?? "",
          notes: job.notes,
          settings: {
            model: "Seedance 1.0 Pro",
            resolution: "1080p",
            durationSec: shot?.durationSec ?? 1,
            seed: Math.floor(job.startedAt % 100_000),
          },
          credits: job.credits,
          createdAt: new Date(job.startedAt + QUEUED_FOR + GENERATING_FOR).toISOString(),
          art: arts[number % arts.length] ?? "burst",
        },
      });
      job.settled = true;
    }
  }
}

export function getBoard(id: string, now = Date.now()): StoryboardDetail | undefined {
  const board = store().boards.get(id);
  if (!board) return undefined;
  tick(board, now);
  return board.current;
}

function commit(board: Board, result: ActionResult): ActionResult {
  if (!result.ok) return result;
  const revision = board.nextRevision;
  board.nextRevision += 1;
  const detail = { ...result.detail, revision, updatedAt: new Date().toISOString() };
  board.current = detail;
  board.revisions.set(revision, detail);
  return { ok: true, detail };
}

export function act(id: string, action: ShotAction): ActionResult | undefined {
  const board = store().boards.get(id);
  if (!board) return undefined;
  tick(board, Date.now());
  if (action.type === "restore") {
    const snapshot = board.revisions.get(action.revision);
    if (!snapshot) return { ok: false, reason: "That edit is too old to undo." };
    // Restoring does not mint a revision: redo returns to the later one.
    board.current = { ...restoreRevision(snapshot, board.current), revision: action.revision };
    return { ok: true, detail: board.current };
  }
  return commit(board, applyAction(board.current, action, newId));
}

/** The fixture price list. Only this file knows it. */
export function quote(id: string, shotId: string): number | undefined {
  const detail = getBoard(id);
  const shot = detail ? placeShots(detail).find((item) => item.shot.id === shotId) : undefined;
  return shot ? Math.round(shot.shot.durationSec * CREDITS_PER_SECOND) : undefined;
}

export function generate(
  id: string,
  shotId: string,
  kind: GenerationKind,
  notes: string | null,
): ActionResult | undefined {
  const board = store().boards.get(id);
  const credits = quote(id, shotId);
  if (!board || credits === undefined) return undefined;
  const jobId = newId("job");
  const result = commit(board, applyGenerate(board.current, shotId, kind, jobId, newId));
  if (!result.ok) return result;
  const placed = placeShots(result.detail);
  const target = placed.find(
    (item) =>
      (item.shot.state === "queued" || item.shot.state === "generating") &&
      item.shot.jobId === jobId,
  );
  store().jobs.set(jobId, {
    storyboardId: id,
    shotId: target?.shot.id ?? shotId,
    startedAt: Date.now(),
    notes,
    credits,
    settled: false,
  });
  return result;
}

export function getJob(id: string, jobId: string): ShotJob | undefined {
  const job = store().jobs.get(jobId);
  if (job?.storyboardId !== id) return undefined;
  const board = store().boards.get(id);
  if (board) tick(board, Date.now());
  return jobStatus(job, jobId, Date.now());
}
