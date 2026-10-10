import { z } from "zod";

const HexColourSchema = z.string().regex(/^#[0-9a-f]{6}$/i, "Expected a #rrggbb colour");

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
