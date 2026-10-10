import { REFERENCE_LIMITS, type ReferenceKind } from "./schema";

export type Reference = {
  readonly id: string;
  readonly kind: ReferenceKind;
  /** How the prompt names it, such as `@image2`. */
  readonly tag: string;
  readonly name: string;
  /** A client-side object URL (CONTRACT: uploads are not sent yet). */
  readonly url: string;
};

export function countByKind(references: readonly Reference[]): Record<ReferenceKind, number> {
  const counts = { image: 0, video: 0, audio: 0 } satisfies Record<ReferenceKind, number>;
  for (const reference of references) counts[reference.kind] += 1;
  return counts;
}

export function remaining(references: readonly Reference[], kind: ReferenceKind): number {
  return Math.max(0, REFERENCE_LIMITS[kind] - countByKind(references)[kind]);
}

/** The lowest free tag number for a kind, so removing @image2 frees it. */
export function nextTag(references: readonly Reference[], kind: ReferenceKind): string {
  const used = new Set(references.filter((ref) => ref.kind === kind).map((ref) => ref.tag));
  let n = 1;
  while (used.has(`@${kind}${String(n)}`)) n += 1;
  return `@${kind}${String(n)}`;
}

/** Every `@tag` written in the prompt, in order, without repeats. */
export function tagsInPrompt(prompt: string): readonly string[] {
  const found = prompt.match(/@[a-z]+\d+/g) ?? [];
  return [...new Set(found)];
}

/** Tags written in the prompt that match no attached reference. */
export function unknownTags(prompt: string, references: readonly Reference[]): readonly string[] {
  const known = new Set(references.map((ref) => ref.tag));
  return tagsInPrompt(prompt).filter((tag) => !known.has(tag));
}

/** Insert a tag at the caret, with spaces so it never glues onto a word. */
export function insertTag(
  prompt: string,
  tag: string,
  caret: number,
): { readonly text: string; readonly caret: number } {
  const at = Math.min(Math.max(caret, 0), prompt.length);
  const before = prompt.slice(0, at);
  const after = prompt.slice(at);
  const lead = before.length === 0 || before.endsWith(" ") ? "" : " ";
  const trail = after.startsWith(" ") ? "" : " ";
  const inserted = `${lead}${tag}${trail}`;
  return { text: before + inserted + after, caret: at + inserted.length };
}

/** Exchange first and last frame slots. */
export function swapFrames<T>(frames: { readonly first: T | null; readonly last: T | null }): {
  readonly first: T | null;
  readonly last: T | null;
} {
  return { first: frames.last, last: frames.first };
}
