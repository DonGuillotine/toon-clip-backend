import { describe, expect, it } from "vitest";

import { newFixRecord, retriedRecord, viewFix } from "./mocks";

const REQUEST = {
  projectId: "p1",
  shotId: "full-clip",
  startSeconds: 3,
  endSeconds: 6,
  instruction: "Make the dust cloud bigger",
};

describe("segment fix fixture", () => {
  it("moves from queued to generating to ready", () => {
    const record = newFixRecord("f1", REQUEST, 0, 0);
    expect(viewFix(record, 1_000).state).toBe("queued");
    const generating = viewFix(record, 6_000);
    expect(generating.state).toBe("generating");
    if (generating.state === "generating") expect(generating.progress).toBeCloseTo(0.5);
    expect(viewFix(record, 20_000).state).toBe("ready");
  });

  it("fails every third fix, refunds it, and lets a retry through", () => {
    const record = newFixRecord("f3", REQUEST, 0, 2);
    const failed = viewFix(record, 20_000);
    expect(failed.state).toBe("failed");
    expect(failed.credits).toBe(0);
    expect(viewFix(retriedRecord(record, 20_000), 40_000).state).toBe("ready");
  });
});
