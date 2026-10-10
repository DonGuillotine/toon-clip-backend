import { JobsSchema, type Job } from "./schema";

export const jobsFixture: readonly Job[] = JobsSchema.parse([
  {
    id: "job_1",
    status: "generating",
    storyboardId: "sb_courtyard",
    storyboardTitle: "Courtyard fight",
    shotNumber: 3,
    takeNumber: 2,
    progress: 64,
    secondsLeft: 40,
  },
  {
    id: "job_2",
    status: "queued",
    storyboardId: "sb_courtyard",
    storyboardTitle: "Courtyard fight",
    shotNumber: 6,
    takeNumber: 1,
    positionInQueue: 1,
  },
  {
    id: "job_3",
    status: "queued",
    storyboardId: "sb_nightbus",
    storyboardTitle: "Night bus to Kano",
    shotNumber: 1,
    takeNumber: 1,
    positionInQueue: 2,
  },
  {
    id: "job_4",
    status: "failed",
    storyboardId: "sb_market",
    storyboardTitle: "Harmattan market",
    shotNumber: 3,
    takeNumber: 1,
    reason: "The model timed out",
    creditsRefunded: 24,
  },
]);
