import { z } from "zod";

import { CoverArtSchema } from "@/features/storyboards/schema";

const HexColourSchema = z.string().regex(/^#[0-9a-f]{6}$/i, "Expected a #rrggbb colour");

// CONTRACT: unconfirmed. A named colour set.
export const PaletteSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  colours: z.array(HexColourSchema).min(1).max(8),
});
export type Palette = z.infer<typeof PaletteSchema>;

// CONTRACT: unconfirmed. A named look.
export const StylePresetSummarySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  art: CoverArtSchema,
  isDefault: z.boolean(),
});
export type StylePresetSummary = z.infer<typeof StylePresetSummarySchema>;

// CONTRACT: unconfirmed. The project library shown on the Director's desk.
export const DeskLibrarySchema = z.object({
  palettes: z.array(PaletteSchema),
  styles: z.array(StylePresetSummarySchema),
});
export type DeskLibrary = z.infer<typeof DeskLibrarySchema>;
