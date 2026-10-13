import { describe, expect, it } from "vitest";

import { refund, spend, topUp, totalOf, type Wallet } from "./ledger";

const at = new Date("2026-10-01T10:00:00.000Z");
const empty: Wallet = { balance: 100, ledger: [] };

function move(amount: number, id = "e1") {
  return { amount, reason: "Test", at, id };
}

describe("spend", () => {
  it("takes credits and records a spend entry with the new balance", () => {
    const result = spend(empty, move(30));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.wallet.balance).toBe(70);
    expect(result.entry).toMatchObject({ kind: "spend", amount: 30, balance: 70 });
    expect(result.wallet.ledger).toHaveLength(1);
  });

  it("rejects a spend larger than the balance and changes nothing", () => {
    const result = spend(empty, move(101));
    expect(result).toEqual({ ok: false, reason: "insufficient", balance: 100 });
  });

  it("allows spending the exact balance", () => {
    const result = spend(empty, move(100));
    expect(result.ok && result.wallet.balance).toBe(0);
  });

  it("treats a free action as success without a ledger entry", () => {
    const result = spend(empty, move(0));
    expect(result).toEqual({ ok: true, wallet: empty, entry: null });
  });

  it("rejects negative and fractional amounts", () => {
    expect(spend(empty, move(-5)).ok).toBe(false);
    expect(spend(empty, move(1.5)).ok).toBe(false);
  });
});

describe("refund and top up", () => {
  it("refund adds credits back and keeps newest first", () => {
    const spent = spend(empty, move(40, "a"));
    if (!spent.ok) throw new Error("spend failed");
    const back = refund(spent.wallet, move(40, "b"));
    if (!back.ok) throw new Error("refund failed");
    expect(back.wallet.balance).toBe(100);
    expect(back.wallet.ledger.map((entry) => entry.id)).toEqual(["b", "a"]);
  });

  it("top up adds credits and refuses zero", () => {
    const added = topUp(empty, move(500));
    expect(added.ok && added.wallet.balance).toBe(600);
    expect(topUp(empty, move(0)).ok).toBe(false);
  });

  it("totals a kind across the ledger", () => {
    let wallet = empty;
    for (const step of [spend, spend, refund]) {
      const result = step(wallet, move(10));
      if (!result.ok) throw new Error("step failed");
      wallet = result.wallet;
    }
    expect(totalOf(wallet.ledger, "spend")).toBe(20);
    expect(totalOf(wallet.ledger, "refund")).toBe(10);
    expect(totalOf(wallet.ledger, "top-up")).toBe(0);
  });
});
