import { z } from "zod";

import { AspectRatioSchema } from "@/features/storyboards/schema";

export const CreateModeSchema = z.enum(["storyboard", "image", "video", "audio"]);
export const CREATE_MODES = CreateModeSchema.options;
export type CreateMode = z.infer<typeof CreateModeSchema>;

export const StylePresetSchema = z.enum(["2D anime", "Manga ink", "Mafiki", "Painterly"]);
export const STYLE_PRESETS = StylePresetSchema.options;
export type StylePreset = z.infer<typeof StylePresetSchema>;

export const TARGET_LENGTHS: readonly [15, 30, 60] = [15, 30, 60];
export type TargetLength = (typeof TARGET_LENGTHS)[number];

/** Quick create tabs (spec 7.2). The tab lives in the URL. */
export const QuickTabSchema = z.enum(["image", "video", "audio", "composition", "stitch"]);
export const QUICK_TABS = QuickTabSchema.options;
export type QuickTab = z.infer<typeof QuickTabSchema>;

/** The two ways to steer a video: references, or first and last frames. */
export const VideoInputSchema = z.enum(["reference", "frames"]);
export const VIDEO_INPUTS = VideoInputSchema.options;
export type VideoInput = z.infer<typeof VideoInputSchema>;

export const ResolutionSchema = z.enum(["480p", "720p", "1080p"]);
export const RESOLUTIONS = ResolutionSchema.options;
export type Resolution = z.infer<typeof ResolutionSchema>;

export const ReferenceKindSchema = z.enum(["image", "video", "audio"]);
export const REFERENCE_KINDS = ReferenceKindSchema.options;
export type ReferenceKind = z.infer<typeof ReferenceKindSchema>;

/** Reference limits per kind (spec 7.2, Reference mode). */
export const REFERENCE_LIMITS = { image: 9, video: 3, audio: 3 } satisfies Record<
  ReferenceKind,
  number
>;

export const CapabilitySchema = z.enum(["reference", "firstFrame", "lastFrame", "audio"]);
export const CAPABILITIES = CapabilitySchema.options;
export type Capability = z.infer<typeof CapabilitySchema>;

// CONTRACT: unconfirmed. Each model declares what it supports; the UI reads
// this to enable or disable controls and never assumes a capability.
export const ModelSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  vendor: z.string().min(1),
  tabs: z.array(QuickTabSchema).min(1),
  capabilities: z.array(CapabilitySchema),
  durations: z.array(z.number().int().positive()),
  resolutions: z.array(ResolutionSchema),
  aspectRatios: z.array(AspectRatioSchema).min(1),
});
export type Model = z.infer<typeof ModelSchema>;
export const ModelsSchema = z.array(ModelSchema);

/** Everything the API can price: the home composer modes plus quick create tabs. */
export const QuoteKindSchema = z.enum([
  "storyboard",
  "image",
  "video",
  "audio",
  "composition",
  "stitch",
]);
export type QuoteKind = z.infer<typeof QuoteKindSchema>;

export const QuoteRequestSchema = z.object({
  mode: QuoteKindSchema,
  aspectRatio: AspectRatioSchema,
  lengthSec: z.coerce.number().int().positive(),
  model: z.string().min(1).optional(),
  resolution: ResolutionSchema.optional(),
  highQuality: z.stringbool().optional(),
});
export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;

// CONTRACT: unconfirmed. The API prices a generation and says whether it is
// large enough to confirm first; the client only shows it.
export const QuoteSchema = z.object({
  credits: z.number().int().nonnegative(),
  requiresConfirmation: z.boolean(),
});
export type Quote = z.infer<typeof QuoteSchema>;

export const ReferenceInputSchema = z.object({
  kind: ReferenceKindSchema,
  tag: z.string().regex(/^@[a-z]+\d+$/),
  name: z.string(),
});
export type ReferenceInput = z.infer<typeof ReferenceInputSchema>;

// CONTRACT: unconfirmed. Uploads are client-side object URLs for now, so only
// file names travel. The real API will take uploaded asset ids instead.
export const GenerationRequestSchema = z.object({
  tab: QuickTabSchema,
  prompt: z.string(),
  model: z.string().nullable(),
  aspectRatio: AspectRatioSchema,
  resolution: ResolutionSchema.nullable(),
  durationSec: z.number().int().positive().nullable(),
  videoInput: VideoInputSchema.nullable(),
  references: z.array(ReferenceInputSchema),
  firstFrame: z.string().nullable(),
  lastFrame: z.string().nullable(),
});
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;

const GenerationBase = z.object({
  id: z.string(),
  tab: QuickTabSchema,
  prompt: z.string(),
  modelName: z.string().nullable(),
  credits: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
});

// CONTRACT: unconfirmed. One quick create result, discriminated on `status`.
export const GenerationSchema = z.discriminatedUnion("status", [
  GenerationBase.extend({
    status: z.literal("queued"),
    positionInQueue: z.number().int().positive(),
  }),
  GenerationBase.extend({
    status: z.literal("generating"),
    progress: z.number().min(0).max(100),
  }),
  GenerationBase.extend({ status: z.literal("ready") }),
  GenerationBase.extend({
    status: z.literal("failed"),
    reason: z.string(),
    creditsRefunded: z.number().int().nonnegative(),
  }),
]);
export type Generation = z.infer<typeof GenerationSchema>;
export const GenerationsSchema = z.array(GenerationSchema);

export const ShotStyleSchema = z.enum(["Cinematic", "Dynamic action", "Slow and still"]);
export const SHOT_STYLES = ShotStyleSchema.options;
export type ShotStyle = z.infer<typeof ShotStyleSchema>;

export const LookSchema = z.enum(["Soft daylight", "Golden hour", "Moody night"]);
export const LOOKS = LookSchema.options;
export type Look = z.infer<typeof LookSchema>;

export const PlanAudioSchema = z.enum(["None", "Music", "Music and effects"]);
export const PLAN_AUDIO = PlanAudioSchema.options;
export type PlanAudio = z.infer<typeof PlanAudioSchema>;

// CONTRACT: unconfirmed. Storyboard from an idea (spec 7.3): the AI director
// expands the idea into sheets and returns the new storyboard's id.
export const PlanRequestSchema = z.object({
  idea: z.string().trim().min(1),
  style: StylePresetSchema,
  aspectRatio: AspectRatioSchema,
  lengthSec: z.number().int().positive(),
  shotStyle: ShotStyleSchema,
  look: LookSchema,
  audio: PlanAudioSchema,
  highQuality: z.boolean(),
  characterIds: z.array(z.string()),
});
export type PlanRequest = z.infer<typeof PlanRequestSchema>;

export const PlanSchema = z.object({
  storyboardId: z.string().min(1),
  title: z.string().min(1),
});
export type Plan = z.infer<typeof PlanSchema>;
