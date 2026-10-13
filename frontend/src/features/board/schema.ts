import { z } from "zod";

import { CoverArtSchema, ShotStateSchema } from "@/features/storyboards/schema";

const HexColourSchema = z.string().regex(/^#[0-9a-f]{6}$/i, "Expected a #rrggbb colour");

export const BoardPageSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
});
export type BoardPage = z.infer<typeof BoardPageSchema>;

/**
 * A group is a labelled container of tiles. `x` and `y` are world
 * coordinates of its top-left corner; its size is derived from what it holds
 * (see `layout.ts`), so the API never has to agree with the client on pixels.
 */
export const BoardGroupSchema = z.object({
  id: z.string(),
  pageId: z.string(),
  parentId: z.string().nullable(),
  title: z.string().min(1),
  x: z.number(),
  y: z.number(),
  columns: z.number().int().min(1).max(6),
});
export type BoardGroup = z.infer<typeof BoardGroupSchema>;

const NodeBase = z.object({
  id: z.string(),
  pageId: z.string(),
  /** In a group, the tile sits in the group's grid and `x`/`y` are ignored. */
  groupId: z.string().nullable(),
  x: z.number(),
  y: z.number(),
  label: z.string(),
  /** The same media is on the storyboard timeline: shows a link badge. */
  usedInTimeline: z.boolean(),
});

// CONTRACT: unconfirmed. A board node, discriminated on `kind`.
export const BoardNodeSchema = z.discriminatedUnion("kind", [
  NodeBase.extend({
    kind: z.literal("image"),
    art: CoverArtSchema,
    state: ShotStateSchema,
  }),
  NodeBase.extend({
    kind: z.literal("video"),
    art: CoverArtSchema,
    state: ShotStateSchema,
    durationSec: z.number().positive(),
  }),
  NodeBase.extend({ kind: z.literal("text"), text: z.string() }),
  NodeBase.extend({
    kind: z.literal("palette"),
    colours: z.array(HexColourSchema).min(1).max(6),
  }),
  NodeBase.extend({ kind: z.literal("character"), characterId: z.string() }),
]);
export type BoardNode = z.infer<typeof BoardNodeSchema>;
export type BoardNodeKind = BoardNode["kind"];
export type MediaNode = Extract<BoardNode, { kind: "image" | "video" }>;

/** Provenance: the tiles in `to` were made from the tiles in `from`. */
export const BoardEdgeSchema = z.object({
  id: z.string(),
  pageId: z.string(),
  from: z.string(),
  to: z.string(),
  label: z.string().nullable(),
});
export type BoardEdge = z.infer<typeof BoardEdgeSchema>;

// CONTRACT: unconfirmed. One board per storyboard.
export const BoardSchema = z.object({
  id: z.string(),
  storyboardId: z.string(),
  title: z.string(),
  pages: z.array(BoardPageSchema).min(1),
  groups: z.array(BoardGroupSchema),
  nodes: z.array(BoardNodeSchema),
  edges: z.array(BoardEdgeSchema),
});
export type Board = z.infer<typeof BoardSchema>;

/** Actions the API performs. Compare and download stay in the client. */
export const BoardActionSchema = z.enum([
  "regenerate",
  "restyle",
  "animate",
  "use-first-frame",
  "use-last-frame",
  "stitch",
  "send-to-timeline",
  "delete",
]);
export type BoardAction = z.infer<typeof BoardActionSchema>;

// CONTRACT: unconfirmed.
export const BoardActionRequestSchema = z.object({
  action: BoardActionSchema,
  nodeIds: z.array(z.string()).min(1),
});
export type BoardActionRequest = z.infer<typeof BoardActionRequestSchema>;

// CONTRACT: unconfirmed. The updated board plus one line to tell the creator.
export const BoardActionResultSchema = z.object({
  board: BoardSchema,
  message: z.string(),
});
export type BoardActionResult = z.infer<typeof BoardActionResultSchema>;

/** The actions that spend credits. */
export const PaidActionSchema = z.enum(["regenerate", "restyle", "animate", "stitch"]);
export type PaidAction = z.infer<typeof PaidActionSchema>;

// CONTRACT: unconfirmed. The API prices each paid action for a selection.
export const BoardQuoteSchema = z.object({
  regenerate: z.number().int().nonnegative(),
  restyle: z.number().int().nonnegative(),
  animate: z.number().int().nonnegative(),
  stitch: z.number().int().nonnegative(),
});
export type BoardQuote = z.infer<typeof BoardQuoteSchema>;

// CONTRACT: unconfirmed. POST /api/boards/:id/timeline. Send a timeline shot to the board.
export const SendShotRequestSchema = z.object({
  shotId: z.string(),
  label: z.string().min(1),
  art: CoverArtSchema,
  state: ShotStateSchema,
  durationSec: z.number().positive(),
});
export type SendShotRequest = z.infer<typeof SendShotRequestSchema>;
