import { type PlacedShot } from "./timeline";

/**
 * The continuity check (spec 7.5). It compares neighbouring shots that share
 * a character and suggests a fix when their prompts disagree on costume, time
 * of day or a prop's state. It only suggests: nothing here blocks a
 * generation. A stand-in for the backend check, which will read the takes.
 */

export type ContinuityKind = "costume" | "time" | "prop";

export type ContinuityNote = {
  readonly id: string;
  readonly kind: ContinuityKind;
  /** The shot the note is about: the later of the two. */
  readonly shotId: string;
  readonly shotNumber: number;
  readonly previousShotNumber: number;
  readonly message: string;
  /** A prompt for the later shot with the mismatch resolved to the earlier one. */
  readonly suggestedPrompt: string;
};

type Vocabulary = {
  readonly kind: ContinuityKind;
  /** Mutually exclusive words: two shots naming different ones disagree. */
  readonly groups: readonly (readonly string[])[];
};

const VOCABULARY: readonly Vocabulary[] = [
  {
    kind: "time",
    groups: [
      [
        "dawn",
        "sunrise",
        "morning",
        "noon",
        "midday",
        "afternoon",
        "dusk",
        "sunset",
        "night",
        "midnight",
      ],
    ],
  },
  {
    kind: "costume",
    groups: [
      ["vest", "jacket", "coat", "hoodie", "bomber", "agbada", "robe", "shirt"],
      ["headband", "cap", "hat", "headwrap", "hood"],
    ],
  },
  {
    kind: "prop",
    groups: [
      ["sword drawn", "sword sheathed"],
      ["staff raised", "staff lowered"],
      ["lantern lit", "lantern out"],
      ["bag open", "bag closed"],
    ],
  },
];

const LABEL = {
  time: "Time of day",
  costume: "Costume",
  prop: "Prop",
} satisfies Record<ContinuityKind, string>;

function find(prompt: string, words: readonly string[]): string | null {
  const lower = prompt.toLowerCase();
  let best: { readonly word: string; readonly at: number } | null = null;
  for (const word of words) {
    const match = new RegExp(`\\b${word}\\b`).exec(lower);
    if (match && (best === null || match.index < best.at)) best = { word, at: match.index };
  }
  return best?.word ?? null;
}

function replaceWord(prompt: string, from: string, to: string): string {
  return prompt.replace(new RegExp(`\\b${from}\\b`, "i"), to);
}

/** Every suggestion for a storyboard, in play order. */
export function continuityNotes(shots: readonly PlacedShot[]): ContinuityNote[] {
  const notes: ContinuityNote[] = [];
  for (let index = 1; index < shots.length; index += 1) {
    const before = shots[index - 1];
    const after = shots[index];
    if (!before || !after) continue;
    const shared = after.shot.characterIds.some((id) => before.shot.characterIds.includes(id));
    for (const { kind, groups } of VOCABULARY) {
      // Time of day holds for a scene whether or not a character carries over.
      if (kind !== "time" && !shared) continue;
      for (const group of groups) {
        const was = find(before.shot.prompt, group);
        const now = find(after.shot.prompt, group);
        if (was === null || now === null || was === now) continue;
        notes.push({
          id: `${after.shot.id}_${kind}_${was}_${now}`,
          kind,
          shotId: after.shot.id,
          shotNumber: after.number,
          previousShotNumber: before.number,
          message: `${LABEL[kind]}: shot ${String(before.number)} says "${was}", shot ${String(after.number)} says "${now}".`,
          suggestedPrompt: replaceWord(after.shot.prompt, now, was),
        });
      }
    }
  }
  return notes;
}
