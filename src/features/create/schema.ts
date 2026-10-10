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

export const QuoteRequestSchema = z.object({
  mode: CreateModeSchema,
  aspectRatio: AspectRatioSchema,
  lengthSec: z.coerce.number().int().positive(),
});
export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;

// CONTRACT: unconfirmed. The API prices a generation; the client only shows it.
export const QuoteSchema = z.object({
  credits: z.number().int().nonnegative(),
});
export type Quote = z.infer<typeof QuoteSchema>;
