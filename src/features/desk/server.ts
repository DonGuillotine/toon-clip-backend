import "server-only";

import {
  addPalette,
  addStyle,
  type LibraryEdit,
  removePalette,
  removeStyle,
  updatePalette,
  updateStyle,
} from "./library";
import { deskLibraryFixture } from "./mocks";
import {
  DeskLibrarySchema,
  type DeskLibrary,
  type PaletteDraft,
  type StylePresetDraft,
} from "./schema";

/**
 * The in-memory stand-in for the desk library API, on `globalThis` so every
 * route bundle shares it. The rules live in `library.ts`; this file only
 * holds the current value and hands out ids.
 */
type Store = { library: DeskLibrary; counter: number };

const scope: typeof globalThis & { toonClipDeskStore?: Store } = globalThis;

function store(): Store {
  scope.toonClipDeskStore ??= { library: deskLibraryFixture, counter: 0 };
  return scope.toonClipDeskStore;
}

function nextId(prefix: "pl" | "st"): string {
  const s = store();
  s.counter += 1;
  return `${prefix}_${Date.now().toString(36)}${String(s.counter)}`;
}

function commit(edit: LibraryEdit): LibraryEdit {
  if (edit.ok) store().library = DeskLibrarySchema.parse(edit.library);
  return edit;
}

export function getDeskLibrary(): DeskLibrary {
  return store().library;
}

export function createPalette(draft: PaletteDraft): DeskLibrary {
  const library = addPalette(store().library, nextId("pl"), draft);
  commit({ ok: true, library });
  return store().library;
}

export function editPalette(id: string, draft: PaletteDraft): LibraryEdit {
  return commit(updatePalette(store().library, id, draft));
}

export function deletePalette(id: string): LibraryEdit {
  return commit(removePalette(store().library, id));
}

export function createStyle(draft: StylePresetDraft): DeskLibrary {
  const library = addStyle(store().library, nextId("st"), draft);
  commit({ ok: true, library });
  return store().library;
}

export function editStyle(id: string, draft: StylePresetDraft): LibraryEdit {
  return commit(updateStyle(store().library, id, draft));
}

export function deleteStyle(id: string): LibraryEdit {
  return commit(removeStyle(store().library, id));
}
