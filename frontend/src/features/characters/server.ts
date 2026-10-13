import "server-only";

import { characterSheetsFixture } from "./mocks";
import {
  type CharacterDraft,
  CharacterSheetSchema,
  type CharacterSheet,
  type CharacterSummary,
} from "./schema";
import { duplicateDraft, toSummary } from "./sheet";

/**
 * The in-memory stand-in for the character API. Route handlers and server
 * prefetches both read it, so they can never disagree. State lives on
 * `globalThis` so every route bundle shares it. When the backend lands, the
 * functions here proxy to it and the map goes.
 */
type Store = {
  readonly sheets: Map<string, CharacterSheet>;
  counter: number;
};

const scope: typeof globalThis & { toonClipCharacterStore?: Store } = globalThis;

function store(): Store {
  scope.toonClipCharacterStore ??= {
    sheets: new Map(characterSheetsFixture.map((sheet) => [sheet.id, sheet])),
    counter: 0,
  };
  return scope.toonClipCharacterStore;
}

function nextId(): string {
  const s = store();
  s.counter += 1;
  return `ch_${Date.now().toString(36)}${String(s.counter)}`;
}

export type SheetWriteResult =
  | { readonly ok: true; readonly sheet: CharacterSheet }
  | { readonly ok: false; readonly status: 403 | 404; readonly message: string };

/** The cast, sample first, then the most recently edited. */
export function listCharacters(): readonly CharacterSummary[] {
  return [...store().sheets.values()]
    .sort((a, b) => {
      if (a.isSample !== b.isSample) return a.isSample ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    })
    .map(toSummary);
}

export function getCharacter(id: string): CharacterSheet | null {
  return store().sheets.get(id) ?? null;
}

export function createCharacter(draft: CharacterDraft): CharacterSheet {
  const sheet = CharacterSheetSchema.parse({
    ...draft,
    id: nextId(),
    isSample: false,
    updatedAt: new Date().toISOString(),
  });
  store().sheets.set(sheet.id, sheet);
  return sheet;
}

export function updateCharacter(id: string, draft: CharacterDraft): SheetWriteResult {
  const current = getCharacter(id);
  if (!current) return { ok: false, status: 404, message: "No character with that id." };
  if (current.isSample) {
    return { ok: false, status: 403, message: "Sample characters are read-only. Duplicate it." };
  }
  const sheet = CharacterSheetSchema.parse({
    ...draft,
    id,
    isSample: false,
    updatedAt: new Date().toISOString(),
  });
  store().sheets.set(id, sheet);
  return { ok: true, sheet };
}

export function deleteCharacter(id: string): SheetWriteResult {
  const current = getCharacter(id);
  if (!current) return { ok: false, status: 404, message: "No character with that id." };
  if (current.isSample) {
    return { ok: false, status: 403, message: "Sample characters cannot be deleted." };
  }
  store().sheets.delete(id);
  return { ok: true, sheet: current };
}

export function duplicateCharacter(id: string): SheetWriteResult {
  const current = getCharacter(id);
  if (!current) return { ok: false, status: 404, message: "No character with that id." };
  const taken = [...store().sheets.values()].map((sheet) => sheet.name);
  return { ok: true, sheet: createCharacter(duplicateDraft(current, taken)) };
}
