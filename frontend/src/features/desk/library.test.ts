import { describe, expect, it } from "vitest";

import {
  addStyle,
  normaliseDefault,
  normaliseHex,
  removePalette,
  removeStyle,
  updatePalette,
  updateStyle,
} from "./library";
import { deskLibraryFixture } from "./mocks";
import { applyOptimistic } from "./mutations";
import { type StylePresetDraft } from "./schema";

const library = deskLibraryFixture;
const defaults = (lib: typeof library) => lib.styles.filter((style) => style.isDefault);

describe("normaliseHex", () => {
  it("accepts six or three digits, with or without #", () => {
    expect(normaliseHex("F4C430")).toBe("#f4c430");
    expect(normaliseHex(" #abc ")).toBe("#aabbcc");
    expect(normaliseHex("#12345")).toBeNull();
    expect(normaliseHex("red")).toBeNull();
  });
});

describe("palettes", () => {
  it("edits and deletes by id, and misses unknown ids", () => {
    const edited = updatePalette(library, "pl_torch", {
      name: "Torch",
      swatches: [{ hex: "#000000", role: "Line" }],
    });
    expect(edited.ok && edited.library.palettes[0]?.name).toBe("Torch");
    expect(updatePalette(library, "pl_none", { name: "x", swatches: [] }).ok).toBe(false);
    const removed = removePalette(library, "pl_torch");
    expect(removed.ok && removed.library.palettes).toHaveLength(library.palettes.length - 1);
  });
});

describe("style defaults", () => {
  const draft: StylePresetDraft = {
    name: "Noir",
    description: "",
    art: "rain",
    recipeId: null,
    isDefault: true,
  };

  it("a new default replaces the old one", () => {
    const next = addStyle(library, "st_noir", draft);
    expect(defaults(next).map((style) => style.id)).toEqual(["st_noir"]);
  });

  it("a non-default add leaves the default alone", () => {
    const next = addStyle(library, "st_noir", { ...draft, isDefault: false });
    expect(defaults(next).map((style) => style.id)).toEqual(["st_anime"]);
  });

  it("the default cannot be switched off directly", () => {
    const result = updateStyle(library, "st_anime", { ...draft, isDefault: false });
    expect(result.ok).toBe(false);
  });

  it("deleting the default promotes the first remaining style", () => {
    const result = removeStyle(library, "st_anime");
    expect(result.ok && defaults(result.library).map((style) => style.id)).toEqual(["st_mafiki"]);
  });

  it("normaliseDefault keeps exactly one default", () => {
    const styles = library.styles.map((style) => ({ ...style, isDefault: true }));
    expect(normaliseDefault(styles, null).filter((style) => style.isDefault)).toHaveLength(1);
    expect(normaliseDefault([], null)).toEqual([]);
  });
});

describe("applyOptimistic", () => {
  it("applies the same rules the server does", () => {
    const next = applyOptimistic(library, { kind: "deleteStyle", id: "st_anime" });
    expect(next && defaults(next).map((style) => style.id)).toEqual(["st_mafiki"]);
    expect(applyOptimistic(library, { kind: "deletePalette", id: "pl_none" })).toBeNull();
  });
});
