import { z } from "zod";

import { StrengthSchema } from "@/features/magic-prompt/schema";
import { AspectRatioSchema } from "@/features/storyboards/schema";

export const ThemeSchema = z.enum(["light", "dark"]);
export const THEMES = ThemeSchema.options;
export type Theme = z.infer<typeof ThemeSchema>;

// CONTRACT: unconfirmed. Defaults the account carries across devices.
export const PreferencesSchema = z.object({
  theme: ThemeSchema,
  defaultAspectRatio: AspectRatioSchema,
  defaultStrength: StrengthSchema,
});
export type Preferences = z.infer<typeof PreferencesSchema>;

// CONTRACT: unconfirmed. The plan decides the export watermark (spec 7.7).
export const PlanSchema = z.object({
  name: z.string().min(1),
  watermark: z.boolean(),
  /** One sentence the profile shows next to the plan name. */
  summary: z.string(),
});
export type AccountPlan = z.infer<typeof PlanSchema>;

// CONTRACT: unconfirmed. Shape the frontend expects from the account endpoint.
export const AccountSchema = z.object({
  id: z.string(),
  displayName: z.string().min(1),
  handle: z.string().min(1),
  email: z.string(),
  /** Whole credits. The client never computes this; it only shows it. */
  credits: z.number().int().nonnegative(),
  hasCompletedTour: z.boolean(),
  plan: PlanSchema,
  preferences: PreferencesSchema,
  /** Opted in to sharing prompting craft with the recipe library (spec 7.4). */
  contributor: z.boolean(),
});
export type Account = z.infer<typeof AccountSchema>;

/* ── Credits ledger ─────────────────────────────────────────────────────── */

export const LedgerKindSchema = z.enum(["spend", "refund", "top-up"]);
export type LedgerKind = z.infer<typeof LedgerKindSchema>;

// CONTRACT: unconfirmed. One movement of credits. `amount` is always
// positive; `kind` says which way it went.
export const LedgerEntrySchema = z.object({
  id: z.string(),
  kind: LedgerKindSchema,
  amount: z.number().int().positive(),
  reason: z.string().min(1),
  at: z.iso.datetime(),
  /** Balance right after this entry. */
  balance: z.number().int().nonnegative(),
});
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

export const LedgerSchema = z.array(LedgerEntrySchema);

// CONTRACT: unconfirmed. A credit pack on sale.
export const CreditPackSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  credits: z.number().int().positive(),
  /** Display price, formatted by the API in the buyer's currency. */
  price: z.string().min(1),
  note: z.string().nullable(),
});
export type CreditPack = z.infer<typeof CreditPackSchema>;
export const CreditPacksSchema = z.array(CreditPackSchema);

export const TopUpRequestSchema = z.object({ packId: z.string().min(1) });
export type TopUpRequest = z.infer<typeof TopUpRequestSchema>;

/* ── Edits ──────────────────────────────────────────────────────────────── */

export const ProfileUpdateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Add a display name.")
    .max(40, "Keep it under 40 characters."),
  handle: z
    .string()
    .trim()
    .min(2, "A handle needs at least 2 characters.")
    .max(24, "Keep it under 24 characters.")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers and underscores."),
});
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;

export const ContributorUpdateSchema = z.object({ contributor: z.boolean() });
export type ContributorUpdate = z.infer<typeof ContributorUpdateSchema>;

/* ── Contributed recipes (spec 7.4, prompt knowledge base) ─────────────── */

export const RecipeScopeSchema = z.enum(["camera", "lighting", "character", "action", "style"]);
export const RECIPE_SCOPES = RecipeScopeSchema.options;
export type RecipeScope = z.infer<typeof RecipeScopeSchema>;

export const RecipeStatusSchema = z.enum(["in-review", "live", "withdrawn"]);
export type RecipeStatus = z.infer<typeof RecipeStatusSchema>;

// CONTRACT: unconfirmed. A recipe the creator submitted. Raw text is only
// ever shown back to its author; others see distilled rules.
export const RecipeSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  scope: RecipeScopeSchema,
  status: RecipeStatusSchema,
  version: z.number().int().positive(),
  /** How many Magic Prompt results have used this recipe. */
  adoptions: z.number().int().nonnegative(),
  submittedAt: z.iso.datetime(),
  linkedWork: z.string().nullable(),
});
export type Recipe = z.infer<typeof RecipeSchema>;
export const RecipesSchema = z.array(RecipeSchema);

export const RecipeSubmissionSchema = z.object({
  title: z.string().trim().min(3, "Give the recipe a short title.").max(60, "Keep it short."),
  scope: RecipeScopeSchema,
  prompt: z.string().trim().min(10, "Paste the prompt that worked."),
  steps: z.string().trim().min(1, "List the steps you took, one per line."),
  notes: z.string().trim().max(500, "Keep notes under 500 characters."),
  /** A storyboard id, or empty for none. */
  linkedWork: z.string(),
  /** Contributed recipes are screened for copyrighted text (spec 12). */
  ownWork: z.literal(true, { error: "Confirm this is your own prompting work." }),
});
export type RecipeSubmission = z.infer<typeof RecipeSubmissionSchema>;

/* ── Feedback ───────────────────────────────────────────────────────────── */

export const FeedbackTopicSchema = z.enum(["idea", "problem", "praise"]);
export const FEEDBACK_TOPICS = FeedbackTopicSchema.options;
export type FeedbackTopic = z.infer<typeof FeedbackTopicSchema>;

export const FeedbackSchema = z.object({
  topic: FeedbackTopicSchema,
  message: z
    .string()
    .trim()
    .min(5, "Tell us a little more.")
    .max(2000, "Keep it under 2000 characters."),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

export const FeedbackReceiptSchema = z.object({ id: z.string() });
