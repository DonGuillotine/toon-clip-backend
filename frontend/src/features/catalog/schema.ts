import { z } from "zod";

import { readableList, UnixSecondsSchema } from "@/lib/api/schema-helpers";

/*
 * Shapes from the backend source (github.com/DonGuillotine/toon-clip-backend,
 * `main.py`): the catalogue models and `GET /v1/catalog`.
 */

/** An API id: the pattern every id in the API follows. */
export const ApiIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);

/** Prices, from `billing.PRICES`. */
export const PricesSchema = z.object({
  creditPack: z.object({
    id: z.string().min(1),
    credits: z.number().int().positive(),
    /** Human amount, as text so it is never rounded: "10". */
    amount: z.string().min(1),
    amountAtomic: z.number().int().positive(),
    token: z.string().min(1),
    decimals: z.number().int().nonnegative(),
  }),
  createCredits: z.number().int().nonnegative(),
  revisionCredits: z.number().int().nonnegative(),
  exportCredits: z.number().int().nonnegative(),
});

export type Prices = z.infer<typeof PricesSchema>;

/**
 * A signed media link. Links expire after fifteen minutes, so queries that
 * carry them refetch before then.
 */
export const MediaSchema = z.object({
  id: z.string().min(1),
  contentType: z.string().min(1),
  url: z.url({ protocol: /^https?$/ }),
  expiresAt: UnixSecondsSchema,
});

export type Media = z.infer<typeof MediaSchema>;

/** One option for one choice field, such as the character "Kaito". */
export const ChoiceSchema = z.object({
  id: ApiIdSchema,
  label: z.string().min(1),
  assetId: ApiIdSchema.nullable(),
  /** Present when the option has an image. */
  media: MediaSchema.optional(),
});

export type Choice = z.infer<typeof ChoiceSchema>;

/** The saved Magic Prompt result for a selection. */
export const PromptSchema = z.object({
  original: z.string().min(1),
  improved: z.string().min(1),
  /** Each change Magic Prompt made, explained. */
  changes: z.array(z.string().min(1)),
});

export type Prompt = z.infer<typeof PromptSchema>;

/** One prepared version of a shot in an example, such as "Improved prompt version". */
export const CatalogTakeSchema = z.object({
  id: ApiIdSchema,
  label: z.string().min(1),
  prompt: z.string().min(1),
  durationSeconds: z.number().positive().nullable().optional(),
});

/** A shot the example's project starts with, and the versions prepared for it. */
export const CatalogShotSchema = z.object({
  id: ApiIdSchema,
  label: z.string().min(1),
  durationSeconds: z.number().positive(),
  defaultTakeId: ApiIdSchema,
  takes: z.array(CatalogTakeSchema).min(1),
});

export type CatalogShot = z.infer<typeof CatalogShotSchema>;

/**
 * A supported combination of choices: one value per choice field. Only
 * these combinations can become projects.
 */
export const SelectionSchema = z.object({
  id: ApiIdSchema,
  values: z.record(z.string(), z.string()),
  prompt: PromptSchema,
  /** The shots a project from this selection starts with. Observed, not in the OpenAPI schema. */
  shots: readableList(CatalogShotSchema).optional(),
});

export type Selection = z.infer<typeof SelectionSchema>;

/** A prepared example. A tour example is free and cannot be exported. */
export const ScenarioSchema = z.object({
  id: ApiIdSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  isTour: z.boolean(),
  /** Choice fields in the API's order, such as character, idea, settings. */
  choices: z.record(z.string(), z.array(ChoiceSchema)),
  selections: z.array(SelectionSchema).min(1),
});

export type Scenario = z.infer<typeof ScenarioSchema>;

/** `GET /v1/catalog`. */
export const CatalogSchema = z.object({
  version: z.string(),
  contentMode: z.string(),
  aiGenerationEnabled: z.boolean(),
  billingMode: z.string(),
  paymentsEnabled: z.boolean(),
  network: z.string().min(1),
  prices: PricesSchema,
  exportFormats: z.array(z.string()),
  scenarios: readableList(ScenarioSchema),
});

export type Catalog = z.infer<typeof CatalogSchema>;

/** `POST /v1/prompt-previews` and `POST /v1/projects` request body. */
export type SelectionRequest = {
  readonly scenarioId: string;
  readonly selectionId: string;
};

/** `POST /v1/prompt-previews`: the selection's saved prompt. Free. */
export const PromptPreviewSchema = PromptSchema;

export type PromptPreview = Prompt;
