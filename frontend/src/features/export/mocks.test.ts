import { describe, expect, it } from "vitest";

import {
  advanceExport,
  connectAccountFixture,
  disconnectAccountFixture,
  exportDownloadFixture,
  type ExportRecord,
  exportsFixture,
  startExportFixture,
  type UploadTarget,
} from "./mocks";
import { defaultVideoOptions } from "./options";
import { hasActiveExport } from "./queries";
import { type VideoOptions } from "./schema";

const record: ExportRecord = {
  id: "ex_1",
  storyboardId: "sb_courtyard",
  kind: "video",
  summary: "MP4",
  fileName: "clip.mp4",
  audioFileName: null,
  subtitleFileName: null,
  parts: 1,
  upload: null,
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

describe("upload after render", () => {
  const target: UploadTarget = {
    platform: "[PLATFORM]",
    handle: "ada",
    details: { title: "Courtyard", description: "", visibility: "public" },
  };

  it("waits, uploads, then publishes", () => {
    const uploading = { ...record, upload: target };
    const at = (ms: number) => {
      const job = advanceExport(uploading, ms);
      return job.status === "ready" ? job.upload?.state : null;
    };
    expect(at(15_100)).toBe("waiting");
    expect(at(18_000)).toBe("uploading");
    expect(at(30_000)).toBe("published");
  });
});

describe("export service fixture", () => {
  it("refuses an upload with no connected account, then accepts once connected", () => {
    disconnectAccountFixture();
    const options: VideoOptions = {
      ...defaultVideoOptions(1080, "Courtyard"),
      destination: "upload",
    };
    const refused = startExportFixture({ kind: "video", storyboardId: "sb_courtyard", options });
    expect(refused.ok).toBe(false);
    connectAccountFixture("ada");
    expect(exportsFixture("sb_courtyard")?.uploadAccount?.handle).toBe("ada");
    const started = startExportFixture({ kind: "video", storyboardId: "sb_courtyard", options });
    expect(started.ok).toBe(true);
    disconnectAccountFixture();
  });

  it("serves a download only once the export is ready", () => {
    expect(exportDownloadFixture("ex_courtyard_video", "main", Date.now())?.fileName).toBe(
      "courtyard-fight.mp4.sample.txt",
    );
    expect(exportDownloadFixture("ex_courtyard_video", "audio", Date.now())).toBeNull();
    expect(exportDownloadFixture("missing", "main", Date.now())).toBeNull();
  });
});
