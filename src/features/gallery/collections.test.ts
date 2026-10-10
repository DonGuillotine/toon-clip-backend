import { describe, expect, it } from "vitest";

import {
  applyGalleryAction,
  nameTaken,
  shareUrl,
  worksIn,
  type ActionContext,
} from "./collections";
import { collectionsFixture } from "./mocks";
import { type Collection, GalleryActionSchema } from "./schema";

const context: ActionContext = {
  now: "2026-10-10T12:00:00.000Z",
  newId: "col_new",
  workIds: new Set(["sb_courtyard", "sb_rooftop", "sb_market", "gen_market"]),
};

function ok(outcome: ReturnType<typeof applyGalleryAction>) {
  if (!outcome.ok) throw new Error(`expected success, got ${outcome.message}`);
  return outcome;
}

describe("gallery collections", () => {
  it("creates a collection at the top, optionally with a first piece", () => {
    const result = ok(
      applyGalleryAction(
        collectionsFixture,
        { type: "create", name: "  Pitch  ", visibility: "public", itemId: "gen_market" },
        context,
      ),
    );
    expect(result.collectionId).toBe("col_new");
    expect(result.collections[0]).toMatchObject({
      id: "col_new",
      name: "Pitch",
      visibility: "public",
      itemIds: ["gen_market"],
    });
    expect(result.collections).toHaveLength(collectionsFixture.length + 1);
  });

  it("refuses a duplicate name, ignoring case", () => {
    const outcome = applyGalleryAction(
      collectionsFixture,
      { type: "create", name: "showreel", visibility: "private", itemId: null },
      context,
    );
    expect(outcome).toMatchObject({ ok: false, status: 409 });
    expect(nameTaken(collectionsFixture, "SHOWREEL")).toBe(true);
    expect(nameTaken(collectionsFixture, "Showreel", "col_showreel")).toBe(false);
  });

  it("renames, but not onto another collection's name", () => {
    const renamed = ok(
      applyGalleryAction(
        collectionsFixture,
        { type: "rename", collectionId: "col_drafts", name: "Later" },
        context,
      ),
    );
    expect(renamed.collections.find((c) => c.id === "col_drafts")?.name).toBe("Later");
    const clash = applyGalleryAction(
      collectionsFixture,
      { type: "rename", collectionId: "col_drafts", name: "Showreel" },
      context,
    );
    expect(clash).toMatchObject({ ok: false, status: 409 });
  });

  it("changes visibility and stamps the update", () => {
    const result = ok(
      applyGalleryAction(
        collectionsFixture,
        { type: "setVisibility", collectionId: "col_lagos", visibility: "public" },
        context,
      ),
    );
    expect(result.collections.find((c) => c.id === "col_lagos")).toMatchObject({
      visibility: "public",
      updatedAt: context.now,
    });
  });

  it("adds work once, and removes it", () => {
    const added = ok(
      applyGalleryAction(
        collectionsFixture,
        { type: "addItem", collectionId: "col_drafts", itemId: "sb_market" },
        context,
      ),
    );
    const again = ok(
      applyGalleryAction(
        added.collections,
        { type: "addItem", collectionId: "col_drafts", itemId: "sb_market" },
        context,
      ),
    );
    expect(again.collections.find((c) => c.id === "col_drafts")?.itemIds).toEqual(["sb_market"]);
    const removed = ok(
      applyGalleryAction(
        again.collections,
        { type: "removeItem", collectionId: "col_drafts", itemId: "sb_market" },
        context,
      ),
    );
    expect(removed.collections.find((c) => c.id === "col_drafts")?.itemIds).toEqual([]);
  });

  it("refuses unknown work and unknown collections", () => {
    expect(
      applyGalleryAction(
        collectionsFixture,
        { type: "addItem", collectionId: "col_drafts", itemId: "nope" },
        context,
      ),
    ).toMatchObject({ ok: false, status: 404 });
    expect(
      applyGalleryAction(collectionsFixture, { type: "delete", collectionId: "nope" }, context),
    ).toMatchObject({ ok: false, status: 404 });
  });

  it("deletes a collection without touching others", () => {
    const result = ok(
      applyGalleryAction(
        collectionsFixture,
        { type: "delete", collectionId: "col_lagos" },
        context,
      ),
    );
    expect(result.collectionId).toBeNull();
    expect(result.collections.map((c) => c.id)).toEqual(["col_showreel", "col_drafts"]);
  });

  it("resolves work in collection order and skips missing ids", () => {
    const collection: Collection = {
      id: "col_order",
      name: "Order",
      description: "",
      visibility: "private",
      itemIds: ["b", "missing", "a"],
      createdAt: context.now,
      updatedAt: context.now,
    };
    expect(worksIn(collection, [{ id: "a" }, { id: "b" }]).map((work) => work.id)).toEqual([
      "b",
      "a",
    ]);
  });

  it("builds a share link that reopens the collection", () => {
    expect(shareUrl("https://toonclip.example", "col_showreel")).toBe(
      "https://toonclip.example/gallery?collection=col_showreel",
    );
  });

  it("validates names at the boundary", () => {
    expect(
      GalleryActionSchema.safeParse({ type: "rename", collectionId: "c", name: "   " }).success,
    ).toBe(false);
    expect(
      GalleryActionSchema.safeParse({ type: "rename", collectionId: "c", name: "x".repeat(61) })
        .success,
    ).toBe(false);
  });
});
