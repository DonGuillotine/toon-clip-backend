import { recentStoryboardsFixture } from "@/features/storyboards/mocks";

import { DEFAULT_PSD_OPTIONS, layerStructure, outputSize, partsFor } from "./options";
import {
  type ExportJob,
  ExportJobSchema,
  type ExportKind,
  type ExportQuote,
  ExportQuoteSchema,
  type ExportRequest,
  type ExportsResponse,
  ExportsResponseSchema,
  type ExportShot,
  type UploadAccount,
  type UploadDetails,
  type UploadStatus,
} from "./schema";

/**
 * A stand-in export service. Jobs live in memory for the life of the dev
 * server and move through their states on a clock, so polling has something
 * to watch. Only route handlers (through `server.ts`) read this file.
 */

const PREPARE_MS = 3_000;
const RENDER_MS = 12_000;
const UPLOAD_MS = 6_000;
const LINK_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
/** Platforms are an open decision, so the spec's placeholder stands in. */
export const UPLOAD_PLATFORM = "[PLATFORM]";

export type UploadTarget = UploadAccount & { readonly details: UploadDetails };

export type ExportRecord = {
  readonly id: string;
  readonly storyboardId: string;
  readonly kind: ExportKind;
  readonly summary: string;
  readonly fileName: string;
  readonly audioFileName: string | null;
  readonly subtitleFileName: string | null;
  /** Numbered files a large PSD is split into; 1 for everything else. */
  readonly parts: number;
  /** Set when the video uploads after it renders. */
  readonly upload: UploadTarget | null;
  /** When the current attempt started, in ms. A retry resets it. */
  readonly startedAt: number;
  /** Set when this attempt is going to fail, with the reason the API gives. */
  readonly failWith: string | null;
};

/** Where a record is at `now`. Pure, so the state machine is testable. */
export function advanceExport(record: ExportRecord, now: number): ExportJob {
  const base = {
    id: record.id,
    storyboardId: record.storyboardId,
    kind: record.kind,
    summary: record.summary,
    createdAt: new Date(record.startedAt).toISOString(),
  };
  const elapsed = now - record.startedAt;
  if (elapsed < PREPARE_MS) return ExportJobSchema.parse({ ...base, status: "preparing" });
  if (elapsed < PREPARE_MS + RENDER_MS) {
    const progress = Math.round(((elapsed - PREPARE_MS) / RENDER_MS) * 100);
    return ExportJobSchema.parse({ ...base, status: "rendering", progress });
  }
  if (record.failWith !== null) {
    return ExportJobSchema.parse({ ...base, status: "failed", reason: record.failWith });
  }
  const expiresAt = record.startedAt + PREPARE_MS + RENDER_MS + LINK_LIFETIME_MS;
  return ExportJobSchema.parse({
    ...base,
    status: "ready",
    downloadUrl: `/api/exports/${encodeURIComponent(record.id)}/download`,
    fileName: record.fileName,
    expiresAt: new Date(expiresAt).toISOString(),
    expired: now >= expiresAt,
    audioFileName: record.audioFileName,
    subtitleFileName: record.subtitleFileName,
    parts: record.parts,
    upload: uploadStatus(record.upload, elapsed - PREPARE_MS - RENDER_MS),
  });
}

/** Where an upload is, `afterRender` ms after the render finished. */
function uploadStatus(target: UploadTarget | null, afterRender: number): UploadStatus | null {
  if (target === null) return null;
  if (afterRender < UPLOAD_MS / 6) return { state: "waiting", platform: target.platform };
  if (afterRender < UPLOAD_MS) {
    return {
      state: "uploading",
      platform: target.platform,
      progress: Math.round((afterRender / UPLOAD_MS) * 100),
    };
  }
  return {
    state: "published",
    platform: target.platform,
    handle: target.handle,
    title: target.details.title,
    visibility: target.details.visibility,
  };
}

const SHEET_SIZE = 3;

function exportShots(storyboardId: string): readonly ExportShot[] | null {
  const storyboard = recentStoryboardsFixture.find((item) => item.id === storyboardId);
  if (!storyboard) return null;
  return storyboard.shots.map((shot, index) => ({
    id: shot.id,
    sheet: Math.floor(index / SHEET_SIZE) + 1,
    shot: (index % SHEET_SIZE) + 1,
    durationSec: shot.durationSec,
  }));
}

const slug = (title: string): string => title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** The one-line summary the API writes for an export. */
export function summarise(request: ExportRequest): string {
  if (request.kind === "psd") {
    const { organizeBy, frameRate, shotIds } = request.options;
    const range = shotIds === null ? "all shots" : `${String(shotIds.length)} shots`;
    const by = { panel: "by panel", shot: "by shot", sequence: "one sequence" }[organizeBy];
    return `Layered PSD, ${by}, ${String(frameRate)} fps, ${range}`;
  }
  const { preset, resolution, customSize, format, audio, subtitles } = request.options;
  const size = outputSize(preset, resolution, customSize);
  const parts = [
    format.toUpperCase(),
    `${String(size.width)} x ${String(size.height)}`,
    audio === "mixed" ? "with audio" : "silent",
  ];
  if (subtitles === "burned") parts.push("subtitles burned in");
  if (subtitles === "separate") parts.push("subtitles as a file");
  return parts.join(", ");
}

const now = Date.now();
const seed: readonly ExportRecord[] = [
  {
    id: "ex_courtyard_video",
    storyboardId: "sb_courtyard",
    kind: "video",
    summary: "MP4, 1920 x 1080, with audio",
    fileName: "courtyard-fight.mp4",
    audioFileName: null,
    subtitleFileName: null,
    parts: 1,
    upload: null,
    startedAt: now - 2 * 24 * 60 * 60 * 1000,
    failWith: null,
  },
  {
    id: "ex_courtyard_psd",
    storyboardId: "sb_courtyard",
    kind: "psd",
    summary: "Layered PSD, by panel, 12 fps, all shots",
    fileName: "courtyard-fight-psd.zip",
    audioFileName: "courtyard-fight-audio.wav",
    subtitleFileName: null,
    parts: 1,
    upload: null,
    startedAt: now - 3 * 60 * 60 * 1000,
    failWith:
      "Shot 6 has no ready take yet, so its panel could not be built. Wait for it, or leave it out of the range.",
  },
];
/**
 * In-memory state on `globalThis`, so every route bundle (list, start, retry,
 * download, account) sees the same exports and the same connected account.
 */
type ExportStore = {
  readonly records: Map<string, ExportRecord>;
  account: UploadAccount | null;
  sequence: number;
};

const scope: typeof globalThis & { toonClipExportStore?: ExportStore } = globalThis;

function exportStore(): ExportStore {
  scope.toonClipExportStore ??= {
    records: new Map(seed.map((record) => [record.id, record])),
    account: null,
    sequence: 0,
  };
  return scope.toonClipExportStore;
}

export function exportsFixture(storyboardId: string): ExportsResponse | null {
  const storyboard = recentStoryboardsFixture.find((item) => item.id === storyboardId);
  const shots = exportShots(storyboardId);
  if (!storyboard || !shots) return null;
  const at = Date.now();
  const { records, account } = exportStore();
  const exports = [...records.values()]
    .filter((record) => record.storyboardId === storyboardId)
    .sort((a, b) => b.startedAt - a.startedAt)
    .map((record) => advanceExport(record, at));
  return ExportsResponseSchema.parse({
    storyboard: {
      id: storyboard.id,
      title: storyboard.title,
      maxResolution: storyboard.aspectRatio === "9:16" ? 720 : 1080,
      shots,
    },
    watermark: "Your plan adds a small Toon Clip mark in the bottom corner.",
    uploadAccount: account,
    exports,
  });
}

export type StartResult =
  | { readonly ok: true; readonly job: ExportJob }
  | { readonly ok: false; readonly status: 404 | 422; readonly message: string };

export function startExportFixture(request: ExportRequest): StartResult {
  const storyboard = recentStoryboardsFixture.find((item) => item.id === request.storyboardId);
  if (!storyboard) return { ok: false, status: 404, message: "That storyboard does not exist." };
  const current = exportStore();
  const shots = exportShots(storyboard.id) ?? [];
  if (request.kind === "video" && request.options.destination === "upload") {
    if (current.account === null) {
      return { ok: false, status: 422, message: "Connect an account before uploading." };
    }
    if (request.options.upload.title.trim() === "") {
      return { ok: false, status: 422, message: "An upload needs a title." };
    }
  }
  current.sequence += 1;
  const name = slug(storyboard.title);
  const record: ExportRecord = {
    id: `ex_${String(Date.now())}_${String(current.sequence)}`,
    storyboardId: storyboard.id,
    kind: request.kind,
    summary: summarise(request),
    fileName: request.kind === "psd" ? `${name}-psd.zip` : `${name}.${request.options.format}`,
    audioFileName: request.kind === "psd" ? `${name}-audio.wav` : null,
    subtitleFileName:
      request.kind === "video" && request.options.subtitles === "separate" ? `${name}.srt` : null,
    parts:
      request.kind === "psd"
        ? Math.max(...layerStructure(shots, request.options).map(partsFor), 1)
        : 1,
    upload:
      request.kind === "video" &&
      request.options.destination === "upload" &&
      current.account !== null
        ? { ...current.account, details: request.options.upload }
        : null,
    startedAt: Date.now(),
    failWith: null,
  };
  current.records.set(record.id, record);
  return { ok: true, job: advanceExport(record, Date.now()) };
}

export function retryExportFixture(id: string): ExportJob | null {
  const { records } = exportStore();
  const record = records.get(id);
  if (!record) return null;
  const retried: ExportRecord = { ...record, startedAt: Date.now(), failWith: null };
  records.set(id, retried);
  return advanceExport(retried, Date.now());
}

/** Exports cost nothing in the fixture; the real price comes from the API. */
export function exportQuoteFixture(): ExportQuote {
  return ExportQuoteSchema.parse({ credits: 0 });
}

/** Finish the simulated OAuth round trip: the account is stored server-side. */
export function connectAccountFixture(handle: string): UploadAccount {
  const account: UploadAccount = { platform: UPLOAD_PLATFORM, handle: handle.trim() };
  exportStore().account = account;
  return account;
}

export function disconnectAccountFixture(): void {
  exportStore().account = null;
}

export type ExportDownload = { readonly fileName: string; readonly body: string };

/**
 * The bytes behind a download link. The fixture has no real renders, so it
 * serves a labelled sample manifest that lists what the real file will hold.
 * `null` when the export is unknown, not ready, expired, or has no such part.
 */
export function exportDownloadFixture(
  id: string,
  part: "main" | "audio" | "subtitles",
  now: number,
): ExportDownload | null {
  const record = exportStore().records.get(id);
  if (!record) return null;
  const job = advanceExport(record, now);
  if (job.status !== "ready" || job.expired) return null;
  const fileName =
    part === "main" ? job.fileName : part === "audio" ? job.audioFileName : job.subtitleFileName;
  if (fileName === null) return null;
  const lines = [
    "Toon Clip sample export",
    "This is sample content: the fixture API has no rendered media yet.",
    "",
    `File: ${fileName}`,
    `Export: ${job.summary}`,
    `Created: ${job.createdAt}`,
    `Link expires: ${job.expiresAt}`,
  ];
  if (part === "main" && record.kind === "psd") {
    const shots = exportShots(record.storyboardId) ?? [];
    lines.push("", "Layer structure (default options):");
    for (const file of layerStructure(shots, DEFAULT_PSD_OPTIONS)) {
      lines.push(`  ${file.fileName}`);
      for (const folder of file.folders) {
        lines.push(`    ${folder.name}/`);
        for (const layer of folder.layers) lines.push(`      ${layer}`);
        if (folder.moreFrames > 0) {
          lines.push(`      and ${String(folder.moreFrames)} more frame layers`);
        }
      }
    }
  }
  return { fileName: `${fileName}.sample.txt`, body: `${lines.join("\n")}\n` };
}
