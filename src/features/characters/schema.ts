import { z } from "zod";

import { CoverArtSchema } from "@/features/storyboards/schema";

export const HexColourSchema = z.string().regex(/^#[0-9a-f]{6}$/i, "Use a #rrggbb colour");

// CONTRACT: unconfirmed.
export const CharacterSummarySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  /** One line a reader would use to recognise them. */
  look: z.string(),
  palette: z.array(HexColourSchema).min(1).max(6),
  outfitCount: z.number().int().nonnegative(),
  expressionCount: z.number().int().nonnegative(),
  isSample: z.boolean(),
});
export type CharacterSummary = z.infer<typeof CharacterSummarySchema>;

export const CharactersSchema = z.array(CharacterSummarySchema);

/** The three image sets a character sheet keeps. */
export const SheetSetSchema = z.enum(["turnarounds", "expressions", "outfits"]);
export const SHEET_SETS = SheetSetSchema.options;
export type SheetSet = z.infer<typeof SheetSetSchema>;

// CONTRACT: unconfirmed. Where a sheet image comes from. Uploads are client
// object URLs until the upload endpoint exists; placeholders are drawn art.
export const SheetImageSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("placeholder"), art: CoverArtSchema }),
  z.object({ kind: z.literal("upload"), fileName: z.string().min(1), url: z.string().min(1) }),
]);
export type SheetImageSource = z.infer<typeof SheetImageSourceSchema>;

export const SheetImageSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1, "Give the image a name").max(60),
  source: SheetImageSourceSchema,
});
export type SheetImage = z.infer<typeof SheetImageSchema>;

/** The fields a creator edits. Shared by create and update. */
const SheetFieldsSchema = z.object({
  name: z.string().trim().min(1, "Give the character a name").max(40),
  look: z.string().trim().max(120),
  notes: z.string().max(2000),
  /** A voice from the library or an external link. Empty when none. */
  voice: z.string().trim().max(200),
  /** The desk palette this sheet follows, or `null` for its own colours. */
  paletteId: z.string().nullable(),
  palette: z.array(HexColourSchema).min(1, "Add at least one colour").max(6),
  turnarounds: z.array(SheetImageSchema).max(12),
  expressions: z.array(SheetImageSchema).max(24),
  outfits: z.array(SheetImageSchema).max(12),
  /** The creator confirms they may use every uploaded reference (spec 12). */
  rightsConfirmed: z.boolean(),
});

/** True when any image on the sheet was uploaded by the creator. */
export function hasUploads(fields: Record<SheetSet, readonly SheetImage[]>): boolean {
  return SHEET_SETS.some((set) => fields[set].some((image) => image.source.kind === "upload"));
}

// CONTRACT: unconfirmed. POST /api/characters and PUT /api/characters/:id.
export const CharacterDraftSchema = SheetFieldsSchema.refine(
  (draft) => !hasUploads(draft) || draft.rightsConfirmed,
  {
    path: ["rightsConfirmed"],
    message: "Confirm you have the right to use the uploaded images.",
  },
);
export type CharacterDraft = z.infer<typeof CharacterDraftSchema>;

// CONTRACT: unconfirmed. GET /api/characters/:id
export const CharacterSheetSchema = SheetFieldsSchema.extend({
  id: z.string(),
  isSample: z.boolean(),
  updatedAt: z.iso.datetime(),
});
export type CharacterSheet = z.infer<typeof CharacterSheetSchema>;
