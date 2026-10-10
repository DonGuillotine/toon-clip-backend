import "server-only";

import { refund, spend, topUp, type Wallet, type WalletResult } from "./ledger";
import { accountFixture, creditPacksFixture, ledgerFixture, recipesFixture } from "./mocks";
import {
  type Account,
  AccountSchema,
  type ContributorUpdate,
  type CreditPack,
  type Feedback,
  type LedgerEntry,
  type Preferences,
  type ProfileUpdate,
  type Recipe,
  RecipeSchema,
  type RecipeSubmission,
} from "./schema";

/**
 * The in-memory stand-in for the account API: profile, credits and ledger,
 * preferences, contributed recipes and feedback. Route handlers, server
 * prefetches and every paid endpoint read and write it through the functions
 * below, so they can never disagree. State lives on `globalThis` so every
 * route bundle shares one store. When the backend lands, this file proxies to
 * it and nothing else changes.
 */

type Profile = Omit<Account, "credits">;

type Store = {
  profile: Profile;
  wallet: Wallet;
  recipes: Recipe[];
  feedback: (Feedback & { readonly id: string; readonly at: string })[];
  counter: number;
};

const scope: typeof globalThis & { toonClipAccountStore?: Store } = globalThis;

function createStore(): Store {
  const { credits, ...profile } = accountFixture;
  return {
    profile,
    wallet: { balance: credits, ledger: ledgerFixture },
    recipes: [...recipesFixture],
    feedback: [],
    counter: 0,
  };
}

function store(): Store {
  scope.toonClipAccountStore ??= createStore();
  return scope.toonClipAccountStore;
}

function newId(prefix: string): string {
  const s = store();
  s.counter += 1;
  return `${prefix}_${Date.now().toString(36)}${String(s.counter)}`;
}

/* ── Reads ──────────────────────────────────────────────────────────────── */

export function getAccount(): Account {
  const s = store();
  return AccountSchema.parse({ ...s.profile, credits: s.wallet.balance });
}

export function getLedger(): readonly LedgerEntry[] {
  return store().wallet.ledger;
}

export function getCreditPacks(): readonly CreditPack[] {
  return creditPacksFixture;
}

export function getRecipes(): readonly Recipe[] {
  return store().recipes;
}

/* ── Credits ────────────────────────────────────────────────────────────── */

export type CreditOutcome =
  | { readonly ok: true; readonly balance: number }
  | { readonly ok: false; readonly balance: number; readonly message: string };

function settle(result: WalletResult): CreditOutcome {
  if (!result.ok) {
    return {
      ok: false,
      balance: result.balance,
      message:
        result.reason === "insufficient"
          ? "Insufficient credits. Top up, or choose something smaller."
          : "That amount of credits is not valid.",
    };
  }
  store().wallet = result.wallet;
  return { ok: true, balance: result.wallet.balance };
}

/** Reserve credits for paid work. Rejects without side effects if short. */
export function spendCredits(amount: number, reason: string): CreditOutcome {
  return settle(spend(store().wallet, { amount, reason, at: new Date(), id: newId("led") }));
}

/** Give credits back after a failed job, visible in the ledger. */
export function refundCredits(amount: number, reason: string): CreditOutcome {
  return settle(refund(store().wallet, { amount, reason, at: new Date(), id: newId("led") }));
}

/** Can the balance cover this, without spending it? */
export function canAfford(amount: number): boolean {
  return amount <= store().wallet.balance;
}

/** The 402 every paid endpoint sends when the balance is short. */
export function insufficientCredits(
  message = "Insufficient credits. Top up, or choose something smaller.",
): Response {
  return Response.json({ error: message, balance: store().wallet.balance }, { status: 402 });
}

export function topUpCredits(packId: string): CreditOutcome | null {
  const pack = creditPacksFixture.find((candidate) => candidate.id === packId);
  if (!pack) return null;
  return settle(
    topUp(store().wallet, {
      amount: pack.credits,
      reason: `Top up: ${pack.name}`,
      at: new Date(),
      id: newId("led"),
    }),
  );
}

/* ── Profile and preferences ────────────────────────────────────────────── */

export type ProfileOutcome =
  | { readonly ok: true; readonly account: Account }
  | { readonly ok: false; readonly message: string };

/** Handles other creators already use, in the fixture world. */
const TAKEN_HANDLES: ReadonlySet<string> = new Set(["tooncentral", "silver", "kaito", "admin"]);

export function updateProfile(update: ProfileUpdate): ProfileOutcome {
  if (TAKEN_HANDLES.has(update.handle)) {
    return { ok: false, message: `@${update.handle} is taken. Try another handle.` };
  }
  const s = store();
  s.profile = { ...s.profile, ...update };
  return { ok: true, account: getAccount() };
}

export function updatePreferences(preferences: Preferences): Account {
  const s = store();
  s.profile = { ...s.profile, preferences };
  return getAccount();
}

export function setContributor({ contributor }: ContributorUpdate): Account {
  const s = store();
  s.profile = { ...s.profile, contributor };
  return getAccount();
}

/** Finishing or skipping the tour both mark it done; replaying is always allowed. */
export function completeTour(): Account {
  const s = store();
  s.profile = { ...s.profile, hasCompletedTour: true };
  return getAccount();
}

/* ── Recipes ────────────────────────────────────────────────────────────── */

export type RecipeOutcome =
  | { readonly ok: true; readonly recipe: Recipe }
  | { readonly ok: false; readonly status: 403 | 404 | 409; readonly message: string };

/** Every submission goes into review before Magic Prompt can use it (spec 7.4). */
export function submitRecipe(submission: RecipeSubmission): RecipeOutcome {
  const s = store();
  if (!s.profile.contributor) {
    return { ok: false, status: 403, message: "Turn on contributing before you submit a recipe." };
  }
  const recipe = RecipeSchema.parse({
    id: newId("rcp"),
    title: submission.title,
    scope: submission.scope,
    status: "in-review",
    version: 1,
    adoptions: 0,
    submittedAt: new Date().toISOString(),
    linkedWork: submission.linkedWork === "" ? null : submission.linkedWork,
  });
  s.recipes = [recipe, ...s.recipes];
  return { ok: true, recipe };
}

/** A contributor can withdraw a recipe at any time; Magic Prompt stops using it. */
export function withdrawRecipe(id: string): RecipeOutcome {
  const s = store();
  const current = s.recipes.find((recipe) => recipe.id === id);
  if (!current) return { ok: false, status: 404, message: "That recipe does not exist." };
  if (current.status === "withdrawn") {
    return { ok: false, status: 409, message: "That recipe is already withdrawn." };
  }
  const recipe: Recipe = { ...current, status: "withdrawn" };
  s.recipes = s.recipes.map((item) => (item.id === id ? recipe : item));
  return { ok: true, recipe };
}

/* ── Feedback ───────────────────────────────────────────────────────────── */

export function recordFeedback(feedback: Feedback): { readonly id: string } {
  const id = newId("fbk");
  store().feedback.push({ ...feedback, id, at: new Date().toISOString() });
  return { id };
}
