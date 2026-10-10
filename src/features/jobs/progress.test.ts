import { describe, expect, it } from "vitest";

import { seedJobs } from "./mocks";
import { GENERATING_FOR_MS, QUEUED_FOR_MS, retryJob, viewJobs } from "./progress";

describe("job queue", () => {
  const now = 1_000_000;

  it("shows generating first, then the line in order, then failures", () => {
    const jobs = viewJobs(seedJobs(now), now);
    expect(jobs.map((job) => job.status)).toEqual(["generating", "queued", "queued", "failed"]);
    const [, second, third] = jobs;
    expect(second?.status === "queued" ? second.positionInQueue : null).toBe(1);
    expect(third?.status === "queued" ? third.positionInQueue : null).toBe(2);
  });

  it("drops a job once its take is ready", () => {
    const later = now + QUEUED_FOR_MS + GENERATING_FOR_MS;
    expect(viewJobs(seedJobs(now), later).some((job) => job.id === "job_1")).toBe(false);
  });

  it("retries a failed job as a new queued take", () => {
    const result = retryJob(seedJobs(now), "job_4", now);
    expect(result.retried).toBe(true);
    const job = viewJobs(result.records, now).find((candidate) => candidate.id === "job_4");
    expect(job?.status).toBe("queued");
    expect(job?.takeNumber).toBe(2);
  });

  it("refuses to retry a running job", () => {
    expect(retryJob(seedJobs(now), "job_1", now).retried).toBe(false);
  });
});
