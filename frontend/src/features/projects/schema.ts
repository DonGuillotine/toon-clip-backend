import { z } from "zod";

import { ApiIdSchema, MediaSchema, PromptSchema } from "@/features/catalog/schema";
import { readableList, UnixSecondsSchema } from "@/lib/api/schema-helpers";

/*
 * Shapes from the backend source (`main.py`: `create_project`, `present`,
 * `create_export`). Every project write answers with the whole project.
 */

/** One result for a shot. A shot keeps every take; one is selected. */
export const TakeSchema = z.object({
  id: ApiIdSchema,
  /** The prepared option this take came from: the revision option's id. */
  sourceOptionId: ApiIdSchema,
  prompt: z.string().min(1),
  createdAt: UnixSecondsSchema,
  media: MediaSchema,
});

export type Take = z.infer<typeof TakeSchema>;

/** A prepared way to revise a shot: `revisionOptionId` in a revision. */
export const RevisionOptionSchema = z.object({
  id: ApiIdSchema,
  label: z.string().min(1),
  prompt: z.string().min(1),
  media: MediaSchema,
});

export type RevisionOption = z.infer<typeof RevisionOptionSchema>;

export const ShotSchema = z.object({
  id: ApiIdSchema,
  label: z.string().min(1),
  durationSeconds: z.number().positive(),
  flagged: z.boolean(),
  locked: z.boolean(),
  selectedTakeId: ApiIdSchema,
  takes: z.array(TakeSchema).min(1),
  revisionOptions: z.array(RevisionOptionSchema),
});

export type Shot = z.infer<typeof ShotSchema>;

export const ProjectSchema = z.object({
  id: ApiIdSchema,
  title: z.string().min(1),
  scenarioId: ApiIdSchema,
  selectionId: ApiIdSchema,
  prompt: PromptSchema,
  createdAt: UnixSecondsSchema,
  revision: z.number().int().positive(),
  isTour: z.boolean(),
  /** Whether a prepared MP4 exists for the takes selected right now. */
  exportAvailable: z.boolean(),
  shots: z.array(ShotSchema),
});

export type Project = z.infer<typeof ProjectSchema>;

/** `GET /v1/projects`: summaries only. */
export const ProjectSummarySchema = z.object({
  id: ApiIdSchema,
  title: z.string().min(1),
  createdAt: UnixSecondsSchema,
  revision: z.number().int().positive(),
});

export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;

export const ProjectsSchema = readableList(ProjectSummarySchema);

export const EXPORT_STATES: readonly ["queued", "processing", "ready", "failed"] = [
  "queued",
  "processing",
  "ready",
  "failed",
];

/**
 * `POST /v1/projects/{id}/exports` and `GET /v1/exports/{id}`. The demo API
 * answers `ready` at once; the other states are handled for when rendering
 * becomes real.
 */
export const ExportSchema = z.object({
  id: ApiIdSchema,
  projectId: ApiIdSchema,
  state: z.enum(EXPORT_STATES),
  createdAt: UnixSecondsSchema,
  download: MediaSchema.optional(),
});

export type ProjectExport = z.infer<typeof ExportSchema>;

/** `PATCH /v1/projects/{id}/shots/{shotId}`. Null values are refused, so they are left out. */
export type ShotPatch = {
  readonly flagged?: boolean;
  readonly locked?: boolean;
  readonly selectedTakeId?: string;
};
