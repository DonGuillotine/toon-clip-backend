import { describe, expect, it } from "vitest";

import { characterSheetsFixture } from "./mocks";
import { CharacterDraftSchema, hasUploads, type SheetImage } from "./schema";
import {
  copyName,
  draftFromSheet,
  duplicateDraft,
  emptyDraft,
  labelFromFileName,
  sheetImages,
  sheetImageUrl,
  toSummary,
} from "./sheet";

const kaito = characterSheetsFixture[0];
if (!kaito) throw new Error("The fixture lost Kaito.");

describe("toSummary", () => {
  it("derives counts from the sheet, never stores them", () => {
    const summary = toSummary(kaito);
    expect(summary.outfitCount).toBe(kaito.outfits.length);
    expect(summary.expressionCount).toBe(kaito.expressions.length);
    expect(summary.isSample).toBe(true);
  });
});

describe("copyName", () => {
  it("adds copy, then numbers further copies", () => {
    expect(copyName("Kaito", ["Kaito"])).toBe("Kaito copy");
    expect(copyName("Kaito", ["Kaito", "Kaito copy"])).toBe("Kaito copy 2");
    expect(copyName("Kaito", ["Kaito copy", "Kaito copy 2"])).toBe("Kaito copy 3");
  });
});

describe("duplicateDraft", () => {
  it("keeps every image and renames the copy", () => {
    const draft = duplicateDraft(kaito, ["Kaito"]);
    expect(draft.name).toBe("Kaito copy");
    expect(draft.expressions).toEqual(kaito.expressions);
    expect(CharacterDraftSchema.safeParse(draft).success).toBe(true);
  });
});

describe("rights confirmation", () => {
  const upload: SheetImage = {
    id: "img_up",
    label: "Front",
    source: { kind: "upload", fileName: "front.png", url: "blob:x" },
  };

  it("is required once any image is an upload", () => {
    const draft = { ...emptyDraft(), name: "Ife", turnarounds: [upload] };
    expect(hasUploads(draft)).toBe(true);
    expect(CharacterDraftSchema.safeParse(draft).success).toBe(false);
    expect(CharacterDraftSchema.safeParse({ ...draft, rightsConfirmed: true }).success).toBe(true);
  });

  it("is not asked for placeholder art", () => {
    const draft = draftFromSheet(kaito);
    expect(hasUploads(draft)).toBe(false);
    expect(CharacterDraftSchema.safeParse(draft).success).toBe(true);
  });
});

describe("labelFromFileName", () => {
  it("turns a file name into words", () => {
    expect(labelFromFileName("front_view-final.png")).toBe("front view final");
    expect(labelFromFileName(".png")).toBe("Untitled");
  });
});

describe("sheet images as frames", () => {
  it("lists every image with its set, turnarounds first", () => {
    const all = sheetImages(kaito);
    expect(all).toHaveLength(
      kaito.turnarounds.length + kaito.expressions.length + kaito.outfits.length,
    );
    expect(all[0]?.set).toBe("turnarounds");
  });

  it("draws placeholder art as a labelled SVG and passes uploads through", () => {
    const image = kaito.turnarounds[0];
    if (!image) throw new Error("Kaito has no turnaround.");
    const url = sheetImageUrl(kaito, image);
    expect(url.startsWith("data:image/svg+xml")).toBe(true);
    expect(decodeURIComponent(url)).toContain("Sample content");
    expect(
      sheetImageUrl(kaito, {
        id: "u",
        label: "Up",
        source: { kind: "upload", fileName: "a.png", url: "blob:abc" },
      }),
    ).toBe("blob:abc");
  });
});
