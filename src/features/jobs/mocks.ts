import { GENERATING_FOR_MS, type JobRecord, QUEUED_FOR_MS } from "./progress";

/**
 * The fixture queue, seeded relative to server start so it moves: one shot
 * generating, two waiting, one failed and refunded. Only the jobs route
 * handler imports this.
 */
export function seedJobs(now: number): JobRecord[] {
  return [
    {
      id: "job_1",
      phase: "running",
      // 64% through generation.
      startedAt: now - QUEUED_FOR_MS - GENERATING_FOR_MS * 0.64,
      storyboardId: "sb_courtyard",
      storyboardTitle: "Courtyard fight",
      shotNumber: 3,
      takeNumber: 2,
    },
    {
      id: "job_2",
      phase: "running",
      startedAt: now - 2_000,
      storyboardId: "sb_courtyard",
      storyboardTitle: "Courtyard fight",
      shotNumber: 6,
      takeNumber: 1,
    },
    {
      id: "job_3",
      phase: "running",
      startedAt: now,
      storyboardId: "sb_nightbus",
      storyboardTitle: "Night bus to Kano",
      shotNumber: 1,
      takeNumber: 1,
    },
    {
      id: "job_4",
      phase: "failed",
      storyboardId: "sb_market",
      storyboardTitle: "Harmattan market",
      shotNumber: 3,
      takeNumber: 1,
      reason: "The model timed out",
      creditsRefunded: 24,
    },
  ];
}
