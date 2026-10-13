import { z } from "zod";

import { CoverArtSchema } from "@/features/storyboards/schema";
import { WatchKindSchema } from "@/features/watch/schema";

export const VisibilitySchema = z.enum(["private", "public"]);
export const VISIBILITIES = VisibilitySchema.options;
export type Visibility = z.infer<typeof VisibilitySchema>;

export const COLLECTION_NAME_MAX = 60;

/** A collection name as the user types it: trimmed, present, and short. */
export const CollectionNameSchema = z
  .string()
  .trim()
  .min(1, "Give the collection a name.")
  .max(COLLECTION_NAME_MAX, `Keep it under ${String(COLLECTION_NAME_MAX)} characters.`);

/**
 * One piece of finished work in the gallery. The id is the same id the Watch
 * page plays, so a gallery tile can open the player directly.
 */
export const GalleryWorkSchema = z.object({
  id: z.string(),
  kind: WatchKindSchema,
  title: z.string().min(1),
  subtitle: z.string(),
  durationSec: z.number().positive(),
  updatedAt: z.iso.datetime(),
  cover: z.object({ art: CoverArtSchema, sfx: z.string().nullable() }),
});
export type GalleryWork = z.infer<typeof GalleryWorkSchema>;

// CONTRACT: unconfirmed. A curated, ordered set of finished work.
export const CollectionSchema = z.object({
  id: z.string(),
  name: CollectionNameSchema,
  description: z.string(),
  visibility: VisibilitySchema,
  /** Work ids in display order. Collections reference work; they never copy it. */
  itemIds: z.array(z.string()),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Collection = z.infer<typeof CollectionSchema>;

// CONTRACT: unconfirmed. GET /api/gallery
export const GallerySchema = z.object({
  works: z.array(GalleryWorkSchema),
  collections: z.array(CollectionSchema),
});
export type Gallery = z.infer<typeof GallerySchema>;

// CONTRACT: unconfirmed. POST /api/gallery/actions. Curation costs nothing.
export const GalleryActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create"),
    name: CollectionNameSchema,
    visibility: VisibilitySchema,
    /** Optional first piece of work, for "add to a new collection". */
    itemId: z.string().nullable(),
  }),
  z.object({ type: z.literal("rename"), collectionId: z.string(), name: CollectionNameSchema }),
  z.object({
    type: z.literal("setVisibility"),
    collectionId: z.string(),
    visibility: VisibilitySchema,
  }),
  z.object({ type: z.literal("delete"), collectionId: z.string() }),
  z.object({ type: z.literal("addItem"), collectionId: z.string(), itemId: z.string() }),
  z.object({ type: z.literal("removeItem"), collectionId: z.string(), itemId: z.string() }),
]);
export type GalleryAction = z.infer<typeof GalleryActionSchema>;

// CONTRACT: unconfirmed. The collections after an action, plus the collection
// it touched (`null` after a delete), so the client can open a new one.
export const GalleryActionResultSchema = z.object({
  collections: z.array(CollectionSchema),
  collectionId: z.string().nullable(),
});
export type GalleryActionResult = z.infer<typeof GalleryActionResultSchema>;
