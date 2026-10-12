import {
  type Account,
  AccountSchema,
  type CreditPack,
  CreditPacksSchema,
  type LedgerEntry,
  LedgerSchema,
  type Recipe,
  RecipesSchema,
} from "./schema";

/**
 * Fixtures for the account. Imported only by `server.ts`, which owns the
 * in-memory store the route handlers read.
 */
export const accountFixture: Account = AccountSchema.parse({
  id: "usr_satyam",
  displayName: "Satyam",
  handle: "satyam",
  email: "satyam@example.com",
  credits: 1240,
  plan: {
    name: "Starter (sample)",
    watermark: true,
    summary: "Exports carry a small Toon Clip mark. Top up packs never expire.",
  },
  preferences: {
    theme: "light",
    defaultAspectRatio: "16:9",
    defaultStrength: "standard",
  },
  contributor: false,
});

/** The history behind the fixture balance, newest first. Sums to 1,240. */
export const ledgerFixture: readonly LedgerEntry[] = LedgerSchema.parse([
  {
    id: "led_5",
    kind: "refund",
    amount: 30,
    reason: "Refund: quick create video failed (model timed out)",
    at: "2026-10-08T16:20:00.000Z",
    balance: 1240,
  },
  {
    id: "led_4",
    kind: "spend",
    amount: 30,
    reason: "Quick create video",
    at: "2026-10-08T16:12:00.000Z",
    balance: 1210,
  },
  {
    id: "led_3",
    kind: "spend",
    amount: 150,
    reason: "Regenerate shot 3, Lagos rooftop chase",
    at: "2026-10-07T11:40:00.000Z",
    balance: 1240,
  },
  {
    id: "led_2",
    kind: "spend",
    amount: 110,
    reason: "Storyboard from idea, Harmattan market",
    at: "2026-10-05T09:05:00.000Z",
    balance: 1390,
  },
  {
    id: "led_1",
    kind: "top-up",
    amount: 1500,
    reason: "Top up: Studio pack",
    at: "2026-10-01T08:00:00.000Z",
    balance: 1500,
  },
]);

/** Sample packs. Real prices come from the API in the buyer's currency. */
export const creditPacksFixture: readonly CreditPack[] = CreditPacksSchema.parse([
  { id: "pack_small", name: "Sketch pack", credits: 500, price: "₦4,000 (sample)", note: null },
  {
    id: "pack_medium",
    name: "Studio pack",
    credits: 1500,
    price: "₦10,500 (sample)",
    note: "Most picked",
  },
  {
    id: "pack_large",
    name: "Series pack",
    credits: 5000,
    price: "₦30,000 (sample)",
    note: "Best per credit",
  },
]);

export const recipesFixture: readonly Recipe[] = RecipesSchema.parse([
  {
    id: "rcp_low_angle",
    title: "Low angle hero entrance",
    scope: "camera",
    status: "live",
    version: 2,
    adoptions: 38,
    submittedAt: "2026-09-12T10:00:00.000Z",
    linkedWork: "sb_rooftop",
  },
  {
    id: "rcp_harmattan",
    title: "Harmattan haze at dusk",
    scope: "lighting",
    status: "in-review",
    version: 1,
    adoptions: 0,
    submittedAt: "2026-10-06T14:30:00.000Z",
    linkedWork: null,
  },
]);
