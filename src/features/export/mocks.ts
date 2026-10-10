import { recentStoryboardsFixture } from "@/features/storyboards/mocks";

import { outputSize } from "./options";
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
} from "./schema";

/**
 * A stand-in export service. Jobs live in memory for the life of the dev
 * server and move through their states on a clock, so polling has something
 * to watch. Only route handlers (through `server.ts`) read this file.
 */

const PREPARE_MS = 3_000;
const RENDER_MS = 12_000;
const LINK_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export type ExportRecord = {
  readonly id: string;
  readonly storyboardId: string;
  readonly kind: ExportKind;
  readonly summary: string;
  readonly fileName: string;
  readonly audioFileName: string | null;
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
  return ExportJobSchema.parse({
    ...base,
    status: "ready",
    downloadUrl: `/sample/${record.fileName}`,
    fileName: record.fileName,
    expiresAt: new Date(record.startedAt + PREPARE_MS + RENDER_MS + LINK_LIFETIME_MS).toISOString(),
    audioFileName: record.audioFileName,
  });
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
  const { preset, resolution, customSize, format, audio } = request.options;
  const size = outputSize(preset, resolution, customSize);
  return `${format.toUpperCase()}, ${String(size.width)} x ${String(size.height)}, ${audio === "mixed" ? "with audio" : "silent"}`;
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
    startedAt: now - 3 * 60 * 60 * 1000,
    failWith:
      "Shot 6 has no ready take yet, so its panel could not be built. Wait for it, or leave it out of the range.",
  },
];
const store = new Map<string, ExportRecord>(seed.map((record) => [record.id, record]));
let sequence = 0;

export function exportsFixture(storyboardId: string): ExportsResponse | null {
  const storyboard = recentStoryboardsFixture.find((item) => item.id === storyboardId);
  const shots = exportShots(storyboardId);
  if (!storyboard || !shots) return null;
  const at = Date.now();
  const exports = [...store.values()]
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
    uploadAccount: null,
    exports,
  });
}

export function startExportFixture(request: ExportRequest): ExportJob | null {
  const storyboard = recentStoryboardsFixture.find((item) => item.id === request.storyboardId);
  if (!storyboard) return null;
  sequence += 1;
  const name = slug(storyboard.title);
  const record: ExportRecord = {
    id: `ex_${String(Date.now())}_${String(sequence)}`,
    storyboardId: storyboard.id,
    kind: request.kind,
    summary: summarise(request),
    fileName: request.kind === "psd" ? `${name}-psd.zip` : `${name}.${request.options.format}`,
    audioFileName: request.kind === "psd" ? `${name}-audio.wav` : null,
    startedAt: Date.now(),
    failWith: null,
  };
  store.set(record.id, record);
  return advanceExport(record, Date.now());
}

export function retryExportFixture(id: string): ExportJob | null {
  const record = store.get(id);
  if (!record) return null;
  const retried: ExportRecord = { ...record, startedAt: Date.now(), failWith: null };
  store.set(id, retried);
  return advanceExport(retried, Date.now());
}

/** Exports cost nothing in the fixture; the real price comes from the API. */
export function exportQuoteFixture(): ExportQuote {
  return ExportQuoteSchema.parse({ credits: 0 });
}
