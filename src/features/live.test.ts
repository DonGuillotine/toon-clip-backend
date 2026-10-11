import { describe, expect, it } from "vitest";

import { CatalogSchema } from "@/features/catalog/schema";
import { BalanceSchema, isPaid, PaymentIntentSchema } from "@/features/credits/schema";
import { isDevOnlyPath } from "@/features/dev-mode/paths";
import { projectCommandFor } from "@/features/projects/shortcuts";
import { characterFor, choiceFields, fieldLabel, pickSelection } from "@/features/catalog/choices";
import { ProjectSchema, ProjectsSchema } from "@/features/projects/schema";
import { selectedTake, shotState, takeName } from "@/features/projects/shots";
import { MediaUrlSchema, readableList } from "@/lib/api/schema-helpers";
import { formatSol, formatTokenAmount, shortAddress } from "@/lib/solana/payment";
import { z } from "zod";

/** Bodies recorded from the live API (https://toon-clip-api.onrender.com). */
const PRICES = {
  creditPack: {
    id: "credits-100",
    credits: 100,
    amount: "10",
    amountAtomic: 10000000,
    token: "USDC",
    decimals: 6,
  },
  createCredits: 10,
  revisionCredits: 5,
  exportCredits: 20,
};

const LIVE_CATALOG = {
  version: "1",
  contentMode: "demo",
  aiGenerationEnabled: false,
  billingMode: "credits",
  paymentsEnabled: true,
  network: "solana-devnet",
  prices: PRICES,
  exportFormats: ["mp4"],
  scenarios: [],
};

const LIVE_BALANCE = { balance: 0, prices: PRICES, network: "solana-devnet", history: [] };

const LIVE_PAYMENT = {
  id: "bce744bb70ee4c8ea19b86e0e716a984",
  packId: "credits-100",
  state: "pending",
  network: "solana-devnet",
  payer: "CVCtfM398kMp3msgzQwffKvE4dFQnLpJ2K1pAZnBvQpo",
  recipient: "FHBBpDTfzg6rKX3vHCGwNAgveGeExKKGwBvCwCeZFXb6",
  mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  amount: "10",
  amountAtomic: 10000000,
  credits: 100,
  reference: "FFtA4nuz7MR4cJ2YxczgXFdCothurWqriWVMkkjgRw5v",
  createdAt: 1791697562,
  expiresAt: 1791698462,
  creditsGranted: 0,
  paymentUrl: "solana:FHBB...",
};

const MEDIA = (id: string) => ({
  id,
  contentType: "video/mp4",
  url: `https://toon-clip-api.onrender.com/v1/media/${id}?expires=1&signature=a`,
  expiresAt: 1,
});

/** A catalogue scenario as `GET /v1/catalog` presents it (backend `main.py`). */
const SCENARIO = {
  id: "courtyard",
  title: "Courtyard",
  description: "Kaito turns.",
  isTour: false,
  choices: {
    character: [{ id: "kaito", label: "Kaito", assetId: "character", media: MEDIA("character") }],
    idea: [
      { id: "turn", label: "Turn", assetId: null },
      { id: "run", label: "Run", assetId: null },
      { id: "unused", label: "Unused", assetId: null },
    ],
  },
  selections: [
    {
      id: "kaito-turn",
      values: { character: "kaito", idea: "turn" },
      prompt: { original: "o", improved: "i", changes: ["c"] },
      shots: [],
    },
    {
      id: "kaito-run",
      values: { character: "kaito", idea: "run" },
      prompt: { original: "o", improved: "i", changes: ["c"] },
      shots: [],
    },
  ],
};

const TAKE = (id: string, source: string) => ({
  id,
  sourceOptionId: source,
  assetId: source,
  prompt: "p",
  createdAt: 1,
  media: MEDIA(source),
});

/** A project as the API presents it after two revisions. */
const PROJECT = {
  id: "p1",
  title: "Courtyard",
  scenarioId: "courtyard",
  selectionId: "kaito-turn",
  catalogVersion: "1",
  contentMode: "demo",
  values: { character: "kaito", idea: "turn" },
  prompt: { original: "o", improved: "i", changes: ["c"] },
  createdAt: 1,
  revision: 3,
  isTour: false,
  exportVariants: [],
  exportAvailable: true,
  shots: [
    {
      id: "shot-1",
      label: "Shot 1",
      durationSeconds: 6,
      flagged: false,
      locked: false,
      selectedTakeId: "t2",
      takes: [TAKE("t0", "original"), TAKE("t1", "alternate"), TAKE("t2", "alternate")],
      revisionOptions: [
        {
          id: "original",
          label: "Original",
          assetId: "original",
          prompt: "p",
          media: MEDIA("original"),
        },
        {
          id: "alternate",
          label: "Alternate",
          assetId: "alternate",
          prompt: "p",
          media: MEDIA("alternate"),
        },
      ],
    },
  ],
};

describe("live contracts", () => {
  it("parses the live catalogue", () => {
    const catalog = CatalogSchema.parse(LIVE_CATALOG);
    expect(catalog.scenarios).toEqual({ items: [], unreadable: 0 });
    expect(catalog.prices.createCredits).toBe(10);
  });

  it("parses the live balance and its history", () => {
    expect(BalanceSchema.parse(LIVE_BALANCE).balance).toBe(0);
    const history = BalanceSchema.parse({
      ...LIVE_BALANCE,
      history: [{ delta: -10, reason: "create", created: 1 }],
    }).history;
    expect(history.items[0]?.delta).toBe(-10);
  });

  it("parses a live payment intent and reads paid from credits granted", () => {
    const intent = PaymentIntentSchema.parse(LIVE_PAYMENT);
    expect(isPaid(intent)).toBe(false);
    expect(isPaid({ creditsGranted: 100 })).toBe(true);
  });

  it("counts catalogue entries it cannot read instead of failing the list", () => {
    const catalog = CatalogSchema.parse({
      ...LIVE_CATALOG,
      scenarios: [SCENARIO, { title: "no id" }],
    });
    expect(catalog.scenarios.items.map((item) => item.id)).toEqual(["courtyard"]);
    expect(catalog.scenarios.unreadable).toBe(1);
  });
});

describe("schema helpers", () => {
  it("keeps readable entries and counts the rest", () => {
    const list = readableList(z.number()).parse([1, "x", 2]);
    expect(list).toEqual({ items: [1, 2], unreadable: 1 });
  });

  it("resolves media links against the API origin", () => {
    expect(MediaUrlSchema.parse("/v1/media/a?expires=1&signature=b")).toBe(
      "https://api.test/v1/media/a?expires=1&signature=b",
    );
    expect(MediaUrlSchema.parse("https://cdn.test/a.mp4")).toBe("https://cdn.test/a.mp4");
  });

  it("refuses links that are not http", () => {
    expect(MediaUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });
});

describe("dev mode", () => {
  it("marks fixture routes and nothing else", () => {
    expect(isDevOnlyPath("/storyboards")).toBe(true);
    expect(isDevOnlyPath("/storyboards/abc/board")).toBe(true);
    expect(isDevOnlyPath("/projects")).toBe(false);
    expect(isDevOnlyPath("/")).toBe(false);
    expect(isDevOnlyPath("/creditsx")).toBe(false);
    expect(isDevOnlyPath("/creates")).toBe(false);
  });
});

describe("project shortcuts", () => {
  const key = (k: string, shiftKey = false) => ({
    key: k,
    shiftKey,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
  });

  it("maps keys to commands", () => {
    expect(projectCommandFor(key(" "))).toBe("play");
    expect(projectCommandFor(key("f"))).toBe("flag");
    expect(projectCommandFor(key("L", true))).toBe("lock");
    expect(projectCommandFor(key("l"))).toBeNull();
    expect(projectCommandFor(key("]"))).toBe("next");
    expect(projectCommandFor(key("["))).toBe("previous");
    expect(projectCommandFor(key("r"))).toBe("revise");
  });

  it("leaves modified keys to the browser", () => {
    expect(projectCommandFor({ ...key("f"), metaKey: true })).toBeNull();
  });
});

describe("choices", () => {
  const scenario = CatalogSchema.parse({ ...LIVE_CATALOG, scenarios: [SCENARIO] }).scenarios
    .items[0];
  if (scenario === undefined) throw new Error("Scenario did not parse");
  const [first, second] = scenario.selections;
  if (first === undefined || second === undefined) throw new Error("Selections missing");

  it("labels fields and keeps only options a selection uses", () => {
    expect(fieldLabel("camera_move")).toBe("Camera move");
    const fields = choiceFields(scenario);
    expect(fields.map((field) => field.field)).toEqual(["character", "idea"]);
    expect(fields[1]?.options.map((option) => option.id)).toEqual(["turn", "run"]);
  });

  it("moves to the selection that keeps the other picks", () => {
    expect(pickSelection(scenario, first, "idea", "run")?.id).toBe(second.id);
    expect(pickSelection(scenario, second, "idea", "turn")?.id).toBe(first.id);
  });

  it("finds the character and its image", () => {
    expect(characterFor(scenario, first)).toEqual({
      name: "Kaito",
      imageUrl: "https://toon-clip-api.onrender.com/v1/media/character?expires=1&signature=a",
    });
  });
});

describe("projects", () => {
  const project = ProjectSchema.parse(PROJECT);
  const shot = project.shots[0];
  if (shot === undefined) throw new Error("Shot missing");

  it("parses a project as the API presents it", () => {
    expect(project.exportAvailable).toBe(true);
    expect(
      ProjectsSchema.parse([{ id: "p", title: "T", createdAt: 1, revision: 1 }]).items,
    ).toHaveLength(1);
  });

  it("puts locked before flagged", () => {
    expect(shotState({ flagged: true, locked: true })).toBe("locked");
    expect(shotState({ flagged: true, locked: false })).toBe("flagged");
    expect(shotState({ flagged: false, locked: false })).toBe("ready");
  });

  it("shows the selected take", () => {
    expect(selectedTake(shot)?.id).toBe("t2");
  });

  it("names takes after their prepared option, numbered when repeated", () => {
    const [a, b, c] = shot.takes;
    if (a === undefined || b === undefined || c === undefined) throw new Error("Takes missing");
    expect(takeName(shot, a)).toBe("Original");
    expect(takeName(shot, b)).toBe("Alternate 1");
    expect(takeName(shot, c)).toBe("Alternate 2");
  });
});

describe("payment formatting", () => {
  it("formats token amounts without rounding up", () => {
    expect(formatTokenAmount(10_000_000n, 6)).toBe("10");
    expect(formatTokenAmount(12_500_000n, 6)).toBe("12.5");
    expect(formatTokenAmount(0n, 6)).toBe("0");
  });

  it("formats SOL", () => {
    expect(formatSol(0)).toBe("0");
    expect(formatSol(1_500_000_000)).toBe("1.5");
  });

  it("shortens addresses", () => {
    expect(shortAddress("CVCtfM398kMp3msgzQwffKvE4dFQnLpJ2K1pAZnBvQpo")).toBe("CVCt…vQpo");
  });
});
