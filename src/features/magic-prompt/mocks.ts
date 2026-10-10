import { type CharacterSummary } from "@/features/characters/schema";

import {
  type Change,
  type MagicPromptRequest,
  type MagicPromptResult,
  MagicPromptResultSchema,
  type Segment,
} from "./schema";

/**
 * A stand-in for the Magic Prompt pipeline (spec 7.4) so the interface can be
 * built against real-looking output. It applies a few anti-slop rules by
 * pattern. The backend replaces all of this with recipe retrieval.
 */

type Rule = {
  readonly pattern: RegExp;
  /** Replacements; "Try another" walks through them. Empty string removes. */
  readonly options: readonly string[];
  readonly reason: string;
};

const RULES: readonly Rule[] = [
  {
    pattern: /\bepic\b/i,
    options: ["dust-swept, low-angle", "storm-lit, low-angle"],
    reason: '"Epic" is vague. A low angle and moving air give scale you can see.',
  },
  {
    pattern: /\bbeautiful\b/i,
    options: ["rim-lit", "sun-warmed"],
    reason: '"Beautiful" says nothing to the model. Light on a surface does.',
  },
  {
    pattern: /\b(amazing|awesome|cool)\b/i,
    options: ["sharply silhouetted", "crisply outlined"],
    reason: "Hype words are filler. A clear silhouette is what reads on screen.",
  },
  {
    pattern: /\b(an )?army of soldiers\b/i,
    options: ["a line of armoured soldiers", "a dozen soldiers in a narrow corridor"],
    reason: "A countable group reads clearly in one shot; an army turns to noise.",
  },
  {
    pattern: /(,\s*)?\b(4k|8k|masterpiece|best quality|ultra detailed|hyper realistic)\b/i,
    options: [""],
    reason: "Quality keyword stacks add noise, not detail.",
  },
];

const DISALLOWED = /\b(nude|naked|gore|gory|sexual|beheading)\b/i;
const CAMERA = /\b(shot|angle|lens|close[- ]?up|wide|push|pan|tracking|dolly)\b/i;
const LIGHT = /\b(light|lit|dusk|dawn|night|noon|sunset|sunrise|glare|torch|shadow)\b/i;
const MULTI_ACTION = /\b(and then|then|after that)\b/i;

const CAMERA_OPTIONS: readonly string[] = [
  "medium tracking shot at shoulder height, 35mm lens feel",
  "handheld close-up that pulls back to a wide",
];
const LIGHT_OPTIONS: readonly string[] = [
  "warm torchlight against cool dusk shadows",
  "hard midday sun with deep cobalt shade",
];
const SETTING_OPTIONS: readonly string[] = [
  "in a busy Lagos street at dusk",
  "in a dusty Kano courtyard at sunset",
];

const COLOUR =
  "red|blue|green|black|white|grey|gray|silver|gold|golden|yellow|orange|purple|pink|brown|blonde|indigo|cobalt";
const TRAIT =
  "hair|eyes|jacket|coat|scarf|robe|agbada|wrapper|headwrap|cape|shirt|boots|mask|vest|bomber|hoodie|headband";
const COLOURED_TRAIT = new RegExp(`\\b(${COLOUR})\\s+(${TRAIT})\\b`, "gi");

/**
 * Traits the prompt and a character sheet disagree on, such as "red jacket"
 * in the prompt against "indigo jacket" on the sheet. The sheet wins
 * (spec 7.4: conflicting inputs default to the sheet), and the user is told.
 */
export function traitConflicts(
  prompt: string,
  character: CharacterSummary,
): { readonly trait: string; readonly said: string; readonly sheet: string }[] {
  const sheet = new Map<string, string>();
  for (const match of character.look.matchAll(COLOURED_TRAIT)) {
    const [, colour, trait] = match;
    if (colour && trait) sheet.set(trait.toLowerCase(), colour.toLowerCase());
  }
  const conflicts: { trait: string; said: string; sheet: string }[] = [];
  for (const match of prompt.matchAll(COLOURED_TRAIT)) {
    const [, colour, trait] = match;
    if (!colour || !trait) continue;
    const onSheet = sheet.get(trait.toLowerCase());
    if (onSheet !== undefined && onSheet !== colour.toLowerCase()) {
      conflicts.push({ trait: trait.toLowerCase(), said: colour.toLowerCase(), sheet: onSheet });
    }
  }
  return conflicts;
}

const pick = (options: readonly string[], attempt: number): string =>
  options[attempt % options.length] ?? "";

function fixArticle(before: string, next: string): string {
  const vowel = /^[aeiou]/i.test(next);
  return before.replace(/\b(a|an) $/i, (_match, article: string) => {
    const capital = article.startsWith("A");
    const fixed = vowel ? "an " : "a ";
    return capital ? fixed.charAt(0).toUpperCase() + fixed.slice(1) : fixed;
  });
}

export function improvePrompt(
  input: MagicPromptRequest,
  cast: readonly CharacterSummary[],
): MagicPromptResult {
  const prompt = input.prompt.trim();
  if (DISALLOWED.test(prompt)) {
    return MagicPromptResultSchema.parse({
      status: "declined",
      reason:
        "Magic Prompt cannot help with explicit or graphic content. Describe the scene without it and try again.",
    });
  }

  const changes: Change[] = [];
  const original: Segment[] = [];
  const suggestion: Segment[] = [];
  const add = (change: Omit<Change, "id">): number => {
    const id = changes.length + 1;
    changes.push({ id, ...change });
    return id;
  };

  // Replace vague words left to right.
  let rest = prompt;
  for (;;) {
    let best: { readonly rule: Rule; readonly index: number; readonly match: string } | null = null;
    for (const rule of RULES) {
      const found = rule.pattern.exec(rest);
      if (found && (best === null || found.index < best.index)) {
        best = { rule, index: found.index, match: found[0] };
      }
    }
    if (best === null) break;
    const after = pick(best.rule.options, input.attempt);
    // Keep "a" and "an" agreeing with whatever now follows them.
    const before = after ? fixArticle(rest.slice(0, best.index), after) : rest.slice(0, best.index);
    if (before) {
      original.push({ text: before, change: null });
      suggestion.push({ text: before, change: null });
    }
    const id = add({ before: best.match, after: after || null, reason: best.rule.reason });
    original.push({ text: best.match, change: id });
    if (after) suggestion.push({ text: after, change: id });
    rest = rest.slice(best.index + best.match.length);
  }
  if (rest) {
    original.push({ text: rest, change: null });
    suggestion.push({ text: rest, change: null });
  }

  const append = (text: string, reason: string) => {
    const id = add({ before: null, after: text, reason });
    suggestion.push({ text: ", ", change: null }, { text, change: id });
  };

  const assumptions: string[] = [];
  const warnings: string[] = [];
  const words = prompt.split(/\s+/).filter(Boolean).length;

  if (words < 6) {
    const setting = pick(SETTING_OPTIONS, input.attempt);
    assumptions.push(
      `Setting: ${setting.replace(/^in /, "")}.`,
      "One shot, about five seconds.",
      "Mood follows the action: tense if it is a fight, calm if not.",
    );
    append(setting, "The idea was short, so a setting was assumed. Change it if it is wrong.");
  }

  for (const character of cast) {
    append(
      `${character.name}: ${character.look.toLowerCase()}`,
      `Traits come from ${character.name}'s character sheet so they stay on model.`,
    );
  }

  if (input.strength !== "light") {
    if (!CAMERA.test(prompt)) {
      append(
        pick(CAMERA_OPTIONS, input.attempt),
        "Every shot gets framing, movement and lens feel.",
      );
    }
    if (!LIGHT.test(prompt)) {
      append(pick(LIGHT_OPTIONS, input.attempt), "Lighting ties the mood to a palette.");
    }
  }

  if (input.strength === "directed") {
    append(
      "one clear action, weight landing on every step",
      "Describing speed and weight keeps motion believable.",
    );
    append(
      "avoid extra limbs, warped hands and repeated quality keywords",
      "Negative guidance steers away from common artefacts.",
    );
  }

  if (cast.length === 0) {
    warnings.push(
      "No character sheet attached. Faces and outfits may drift between shots; attach one for consistency.",
    );
  }
  for (const character of cast) {
    for (const conflict of traitConflicts(prompt, character)) {
      warnings.push(
        `Your prompt says ${conflict.said} ${conflict.trait}, but ${character.name}'s sheet says ${conflict.sheet} ${conflict.trait}. The suggestion follows the sheet; edit it if you meant the change.`,
      );
    }
  }
  if (MULTI_ACTION.test(prompt)) {
    warnings.push("This idea has more than one action. Consider splitting it into separate shots.");
  }

  const improved = suggestion
    .map((segment) => segment.text)
    .join("")
    .replace(/\s+,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();

  return MagicPromptResultSchema.parse({
    status: "improved",
    improved,
    original,
    suggestion,
    changes,
    assumptions,
    warnings,
    recipes: ["anti-slop v1 (sample)", "action framing v1 (sample)"],
  });
}
