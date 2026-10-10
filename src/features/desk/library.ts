import {
  type DeskLibrary,
  type Palette,
  type PaletteDraft,
  type StylePresetDraft,
  type StylePresetSummary,
} from "./schema";

/**
 * Pure edits to the desk library. The fixture store applies them on the
 * server and the mutations apply them optimistically on the client, so both
 * sides agree on the rules: exactly one default style, unknown ids are a miss.
 */

export type LibraryEdit =
  | { readonly ok: true; readonly library: DeskLibrary }
  | { readonly ok: false; readonly message: string };

export function addPalette(library: DeskLibrary, id: string, draft: PaletteDraft): DeskLibrary {
  return { ...library, palettes: [...library.palettes, { id, ...draft }] };
}

export function updatePalette(library: DeskLibrary, id: string, draft: PaletteDraft): LibraryEdit {
  if (!library.palettes.some((palette) => palette.id === id)) {
    return { ok: false, message: "That palette is gone. Reload the desk." };
  }
  return {
    ok: true,
    library: {
      ...library,
      palettes: library.palettes.map((palette): Palette =>
        palette.id === id ? { id, ...draft } : palette,
      ),
    },
  };
}

export function removePalette(library: DeskLibrary, id: string): LibraryEdit {
  if (!library.palettes.some((palette) => palette.id === id)) {
    return { ok: false, message: "That palette is gone. Reload the desk." };
  }
  return {
    ok: true,
    library: { ...library, palettes: library.palettes.filter((palette) => palette.id !== id) },
  };
}

/**
 * Exactly one style is the default whenever there is at least one style. A
 * new default clears the old one; losing the default promotes the first.
 */
export function normaliseDefault(
  styles: readonly StylePresetSummary[],
  preferId: string | null,
): StylePresetSummary[] {
  const wanted =
    (preferId !== null && styles.some((style) => style.id === preferId) ? preferId : null) ??
    styles.find((style) => style.isDefault)?.id ??
    styles[0]?.id ??
    null;
  return styles.map((style) => ({ ...style, isDefault: style.id === wanted }));
}

export function addStyle(library: DeskLibrary, id: string, draft: StylePresetDraft): DeskLibrary {
  const styles = [...library.styles, { id, ...draft }];
  return { ...library, styles: normaliseDefault(styles, draft.isDefault ? id : null) };
}

export function updateStyle(
  library: DeskLibrary,
  id: string,
  draft: StylePresetDraft,
): LibraryEdit {
  const current = library.styles.find((style) => style.id === id);
  if (!current) return { ok: false, message: "That style is gone. Reload the desk." };
  if (current.isDefault && !draft.isDefault) {
    return {
      ok: false,
      message: "One style is always the default. Make another style the default instead.",
    };
  }
  const styles = library.styles.map((style) => (style.id === id ? { id, ...draft } : style));
  return {
    ok: true,
    library: { ...library, styles: normaliseDefault(styles, draft.isDefault ? id : null) },
  };
}

export function removeStyle(library: DeskLibrary, id: string): LibraryEdit {
  if (!library.styles.some((style) => style.id === id)) {
    return { ok: false, message: "That style is gone. Reload the desk." };
  }
  const styles = library.styles.filter((style) => style.id !== id);
  return { ok: true, library: { ...library, styles: normaliseDefault(styles, null) } };
}

/** Lowercase `#rrggbb` from what a person types: "F4C430", "#f4c430", "#F4C430 ". */
export function normaliseHex(input: string): string | null {
  const trimmed = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed.replace(/./g, (c) => c + c)}`.toLowerCase();
  }
  if (/^[0-9a-f]{6}$/i.test(trimmed)) return `#${trimmed}`.toLowerCase();
  return null;
}
