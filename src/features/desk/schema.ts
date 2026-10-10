import { z } from "zod";

import { HexColourSchema } from "@/features/characters/schema";
import { CoverArtSchema } from "@/features/storyboards/schema";

// CONTRACT: unconfirmed. One colour in a palette, with what it is for.
export const SwatchSchema = z.object({
  hex: HexColourSchema,
  /** "Skin", "Shadow", "Accent". Empty when the creator has not said. */
  role: z.string().trim().max(24),
});
export type Swatch = z.infer<typeof SwatchSchema>;

// CONTRACT: unconfirmed. POST /api/desk/palettes and PUT /api/desk/palettes/:id.
export const PaletteDraftSchema = z.object({
  name: z.string().trim().min(1, "Give the palette a name").max(40),
  swatches: z.array(SwatchSchema).min(1, "Add at least one colour").max(8),
});
export type PaletteDraft = z.infer<typeof PaletteDraftSchema>;

// CONTRACT: unconfirmed. A named colour set.
export const PaletteSchema = PaletteDraftSchema.extend({ id: z.string() });
export type Palette = z.infer<typeof PaletteSchema>;

// CONTRACT: unconfirmed. A Magic Prompt recipe a style can link to.
export const RecipeRefSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  version: z.number().int().positive(),
});
export type RecipeRef = z.infer<typeof RecipeRefSchema>;

// CONTRACT: unconfirmed. POST /api/desk/styles and PUT /api/desk/styles/:id.
export const StylePresetDraftSchema = z.object({
  name: z.string().trim().min(1, "Give the style a name").max(40),
  description: z.string().trim().max(160),
  art: CoverArtSchema,
  recipeId: z.string().nullable(),
  isDefault: z.boolean(),
});
export type StylePresetDraft = z.infer<typeof StylePresetDraftSchema>;

// CONTRACT: unconfirmed. A named look.
export const StylePresetSummarySchema = StylePresetDraftSchema.extend({ id: z.string() });
export type StylePresetSummary = z.infer<typeof StylePresetSummarySchema>;

// CONTRACT: unconfirmed. The project library shown on the Director's desk.
export const DeskLibrarySchema = z.object({
  palettes: z.array(PaletteSchema),
  styles: z.array(StylePresetSummarySchema),
  recipes: z.array(RecipeRefSchema),
});
export type DeskLibrary = z.infer<typeof DeskLibrarySchema>;
