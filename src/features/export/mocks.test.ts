import { describe, expect, it } from "vitest";

import { advanceExport, type ExportRecord } from "./mocks";
import { hasActiveExport } from "./queries";

const record: ExportRecord = {
  id: "ex_1",
  storyboardId: "sb_courtyard",
  kind: "video",
  summary: "MP4",
  fileName: "clip.mp4",
  audioFileName: null,
  startedAt: 0,
  failWith: null,
};

describe("advanceExport", () => {
  it("moves from preparing to rendering to ready", () => {
    expect(advanceExport(record, 1_000).status).toBe("preparing");
    const rendering = advanceExport(record, 9_000);
    expect(rendering.status).toBe("rendering");
    if (rendering.status === "rendering") expect(rendering.progress).toBe(50);
    const ready = advanceExport(record, 20_000);
    expect(ready.status).toBe("ready");
    if (ready.status === "ready") {
      const lifetime = Date.parse(ready.expiresAt) - 15_000;
      expect(lifetime).toBe(7 * 24 * 60 * 60 * 1000);
    }
  });

  it("fails with the reason when the attempt is set to fail", () => {
    const failed = advanceExport({ ...record, failWith: "No take" }, 20_000);
    expect(failed).toMatchObject({ status: "failed", reason: "No take" });
  });

  it("only polls while something is moving", () => {
    expect(hasActiveExport([advanceExport(record, 1_000)])).toBe(true);
    expect(hasActiveExport([advanceExport(record, 20_000)])).toBe(false);
  });
});
