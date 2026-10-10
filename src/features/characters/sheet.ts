import {
  type CharacterDraft,
  type CharacterSheet,
  type CharacterSummary,
  type SheetImage,
  type SheetSet,
  SHEET_SETS,
} from "./schema";

/** What each image set is called, and what one of its items is called. */
export const SHEET_SET_META = {
  turnarounds: {
    title: "Turnarounds",
    item: "turnaround",
    hint: "Front, side and back, so every angle stays on model.",
  },
  expressions: {
    title: "Expressions",
    item: "expression",
    hint: "The faces this character pulls. Magic Prompt reads these for acting beats.",
  },
  outfits: {
    title: "Outfits",
    item: "outfit",
    hint: "Costumes carry across shots, so continuity checks know what they wear.",
  },
} satisfies Record<SheetSet, { title: string; item: string; hint: string }>;

/** The neutral colours a new sheet starts with until the creator picks a palette. */
export const STARTER_PALETTE: readonly string[] = ["#2b2b2b", "#8a8a8a", "#e9e4da"];

/** A blank sheet for /characters/new. */
export function emptyDraft(): CharacterDraft {
  return {
    name: "",
    look: "",
    notes: "",
    voice: "",
    paletteId: null,
    palette: [...STARTER_PALETTE],
    turnarounds: [],
    expressions: [],
    outfits: [],
    rightsConfirmed: false,
  };
}

/** The editable part of a saved sheet. */
export function draftFromSheet(sheet: CharacterSheet): CharacterDraft {
  return {
    name: sheet.name,
    look: sheet.look,
    notes: sheet.notes,
    voice: sheet.voice,
    paletteId: sheet.paletteId,
    palette: [...sheet.palette],
    turnarounds: [...sheet.turnarounds],
    expressions: [...sheet.expressions],
    outfits: [...sheet.outfits],
    rightsConfirmed: sheet.rightsConfirmed,
  };
}

/** The row the cast, the desk and Magic Prompt read. Counts are derived, never stored. */
export function toSummary(sheet: CharacterSheet): CharacterSummary {
  return {
    id: sheet.id,
    name: sheet.name,
    look: sheet.look,
    palette: sheet.palette,
    outfitCount: sheet.outfits.length,
    expressionCount: sheet.expressions.length,
    isSample: sheet.isSample,
  };
}

/**
 * The name a copy gets: "Kaito copy", then "Kaito copy 2" and so on, so the
 * cast never shows two characters with the same name.
 */
export function copyName(name: string, taken: readonly string[]): string {
  const base = `${name} copy`;
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base} ${String(n)}`)) n += 1;
  return `${base} ${String(n)}`;
}

/** A sheet's draft with a fresh name, ready to save as the creator's own. */
export function duplicateDraft(
  sheet: CharacterSheet,
  takenNames: readonly string[],
): CharacterDraft {
  return { ...draftFromSheet(sheet), name: copyName(sheet.name, takenNames).slice(0, 40) };
}

/** "front_view-final.png" becomes "front view final". */
export function labelFromFileName(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, "");
  const words = stem
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (words.length > 0 ? words : "Untitled").slice(0, 60);
}

/** Every image on a sheet, in the order the editor shows them, with its set. */
export function sheetImages(
  sheet: Pick<CharacterSheet, SheetSet>,
): readonly { readonly set: SheetSet; readonly image: SheetImage }[] {
  return SHEET_SETS.flatMap((set) => sheet[set].map((image) => ({ set, image })));
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * A URL for a sheet image that can stand in as a first or last frame. Uploads
 * are already images. Placeholder art is drawn as a square SVG in the sheet's
 * palette (sample content, labelled as such) so a frame slot can hold it.
 */
export function sheetImageUrl(
  sheet: Pick<CharacterSheet, "name" | "palette">,
  image: SheetImage,
): string {
  if (image.source.kind === "upload") return image.source.url;
  const size = 1024;
  const band = size / sheet.palette.length;
  const bands = sheet.palette
    .map(
      (colour, index) =>
        `<rect x="${String(index * band)}" y="0" width="${String(band)}" height="${String(size)}" fill="${colour}"/>`,
    )
    .join("");
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(size)}" height="${String(size)}" viewBox="0 0 ${String(size)} ${String(size)}">`,
    bands,
    `<circle cx="512" cy="460" r="260" fill="#ffffff" fill-opacity="0.9"/>`,
    `<text x="512" y="550" text-anchor="middle" font-family="sans-serif" font-size="240" font-weight="700" fill="#111111">${escapeXml(sheet.name.charAt(0).toUpperCase())}</text>`,
    `<text x="512" y="880" text-anchor="middle" font-family="sans-serif" font-size="56" fill="#111111">${escapeXml(`${sheet.name}: ${image.label}`)}</text>`,
    `<text x="512" y="960" text-anchor="middle" font-family="sans-serif" font-size="36" fill="#111111">Sample content</text>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
