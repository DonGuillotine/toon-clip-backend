import { z } from "zod";

/** The two ways work leaves Toon Clip (spec 7.7). */
export const ExportKindSchema = z.enum(["psd", "video"]);
export const EXPORT_KINDS = ExportKindSchema.options;
export type ExportKind = z.infer<typeof ExportKindSchema>;

// Layered PSD options, defaults from spec 7.7.
export const PsdOrganizeSchema = z.enum(["panel", "shot", "sequence"]);
export const PSD_ORGANIZE = PsdOrganizeSchema.options;
export type PsdOrganize = z.infer<typeof PsdOrganizeSchema>;

export const BackgroundPlateSchema = z.enum(["per-panel", "per-frame"]);
export const BACKGROUND_PLATES = BackgroundPlateSchema.options;
export type BackgroundPlate = z.infer<typeof BackgroundPlateSchema>;

export const FrameRateSchema = z.union([z.literal(12), z.literal(24), z.literal(30)]);
export const FRAME_RATES: readonly FrameRate[] = [12, 24, 30];
export type FrameRate = z.infer<typeof FrameRateSchema>;

export const PsdOptionsSchema = z.object({
  organizeBy: PsdOrganizeSchema,
  separateBackground: z.boolean(),
  transparentCharacter: z.boolean(),
  backgroundPlate: BackgroundPlateSchema,
  frameRate: FrameRateSchema,
  paletteLayer: z.boolean(),
  /** `null` is every shot; otherwise the shot ids to include. */
  shotIds: z.array(z.string()).min(1).nullable(),
});
export type PsdOptions = z.infer<typeof PsdOptionsSchema>;

// Video options (spec 7.7).
export const VideoPresetSchema = z.enum(["16:9", "9:16", "1:1", "custom"]);
export const VIDEO_PRESETS = VideoPresetSchema.options;
export type VideoPreset = z.infer<typeof VideoPresetSchema>;

export const VideoFormatSchema = z.enum(["mp4", "webm"]);
export const VIDEO_FORMATS = VideoFormatSchema.options;
export type VideoFormat = z.infer<typeof VideoFormatSchema>;

export const ResolutionSchema = z.union([z.literal(480), z.literal(720), z.literal(1080)]);
export const RESOLUTIONS: readonly Resolution[] = [480, 720, 1080];
export type Resolution = z.infer<typeof ResolutionSchema>;

export const AudioModeSchema = z.enum(["mixed", "silent"]);
export type AudioMode = z.infer<typeof AudioModeSchema>;

export const SubtitleModeSchema = z.enum(["off", "burned", "separate"]);
export const SUBTITLE_MODES = SubtitleModeSchema.options;
export type SubtitleMode = z.infer<typeof SubtitleModeSchema>;

export const DestinationSchema = z.enum(["download", "upload"]);
export type Destination = z.infer<typeof DestinationSchema>;

export const CustomSizeSchema = z.object({
  width: z.number().int().min(256).max(4096),
  height: z.number().int().min(256).max(4096),
});
export type CustomSize = z.infer<typeof CustomSizeSchema>;

export const VideoOptionsSchema = z.object({
  preset: VideoPresetSchema,
  /** Only read when `preset` is custom. */
  customSize: CustomSizeSchema,
  format: VideoFormatSchema,
  resolution: ResolutionSchema,
  audio: AudioModeSchema,
  subtitles: SubtitleModeSchema,
  destination: DestinationSchema,
});
export type VideoOptions = z.infer<typeof VideoOptionsSchema>;

// CONTRACT: unconfirmed. What the client sends to start an export.
export const ExportRequestSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("psd"), storyboardId: z.string(), options: PsdOptionsSchema }),
  z.object({ kind: z.literal("video"), storyboardId: z.string(), options: VideoOptionsSchema }),
]);
export type ExportRequest = z.infer<typeof ExportRequestSchema>;

const ExportBase = z.object({
  id: z.string(),
  storyboardId: z.string(),
  kind: ExportKindSchema,
  /** One line describing the options, written by the API. */
  summary: z.string(),
  createdAt: z.iso.datetime(),
});

// CONTRACT: unconfirmed. An export job, discriminated on `status` (spec 7.7).
export const ExportJobSchema = z.discriminatedUnion("status", [
  ExportBase.extend({ status: z.literal("preparing") }),
  ExportBase.extend({ status: z.literal("rendering"), progress: z.number().min(0).max(100) }),
  ExportBase.extend({
    status: z.literal("ready"),
    downloadUrl: z.string(),
    fileName: z.string(),
    /** Download links last 7 days (spec 7.7, proposed). */
    expiresAt: z.iso.datetime(),
    /** PSD audio cannot live in the file, so it ships beside it. */
    audioFileName: z.string().nullable(),
  }),
  ExportBase.extend({ status: z.literal("failed"), reason: z.string() }),
]);
export type ExportJob = z.infer<typeof ExportJobSchema>;
export type ExportStatus = ExportJob["status"];

export const ExportShotSchema = z.object({
  id: z.string(),
  sheet: z.number().int().positive(),
  shot: z.number().int().positive(),
  durationSec: z.number().positive(),
});
export type ExportShot = z.infer<typeof ExportShotSchema>;

// CONTRACT: unconfirmed. Everything the export panel needs for one storyboard.
export const ExportsResponseSchema = z.object({
  storyboard: z.object({
    id: z.string(),
    title: z.string().min(1),
    /** Highest resolution the takes were generated at; upscaling is separate. */
    maxResolution: ResolutionSchema,
    shots: z.array(ExportShotSchema),
  }),
  /** `null` when the plan carries no watermark. */
  watermark: z.string().nullable(),
  /** `null` when no upload account is connected. Platforms are still open. */
  uploadAccount: z.object({ platform: z.string(), handle: z.string() }).nullable(),
  exports: z.array(ExportJobSchema),
});
export type ExportsResponse = z.infer<typeof ExportsResponseSchema>;

export const ExportQuoteRequestSchema = z.object({
  storyboardId: z.string(),
  kind: ExportKindSchema,
});
export type ExportQuoteRequest = z.infer<typeof ExportQuoteRequestSchema>;

// CONTRACT: unconfirmed. The API prices an export; the client only shows it.
export const ExportQuoteSchema = z.object({ credits: z.number().int().nonnegative() });
export type ExportQuote = z.infer<typeof ExportQuoteSchema>;
