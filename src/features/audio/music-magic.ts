import { type Change, type MagicPromptResult, type Segment } from "@/features/magic-prompt/schema";

import {
  MusicMagicPromptResultSchema,
  type Genre,
  type Mood,
  type MusicMagicPromptRequest,
} from "./schema";

/**
 * A stand-in for Magic Prompt's music recipes, so the music composer can show
 * a real suggestion with reasons. It applies a few rules by pattern; the
 * backend replaces it with recipe retrieval. Only the fixture API imports it.
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
    options: ["slow-building, big-room", "layered, swelling"],
    reason: '"Epic" is vague. Say how the music grows instead.',
  },
  {
    pattern: /\bbeautiful\b/i,
    options: ["warm, open-voiced", "soft, airy"],
    reason: '"Beautiful" says nothing to the model. Name the texture.',
  },
  {
    pattern: /\b(amazing|awesome|cool)\b/i,
    options: ["punchy", "crisp"],
    reason: "Hype words are filler. A sound quality is something the model can aim for.",
  },
  {
    pattern: /(,\s*)?\b(high quality|best quality|masterpiece|hi-?fi|studio quality)\b/i,
    options: [""],
    reason: "Quality keywords add noise, not fidelity.",
  },
];

const DISALLOWED = /\b(nude|naked|gore|sexual)\b/i;
const IMITATION = /\b(in the style of|sounds like|by [A-Z][a-z]+)\b/;
const TEMPO = /\b(\d{2,3}\s?bpm|tempo|fast|slow|mid-tempo|uptempo)\b/i;
const INSTRUMENTS =
  /\b(drums?|guitar|piano|strings|kora|synths?|bass|shekere|horns?|flute|choir|percussion)\b/i;
const STRUCTURE = /\b(intro|build|drop|outro|loop|bridge)\b/i;

const TEMPO_BY_MOOD = {
  tense: ["around 120 bpm, driving", "128 bpm with a pushing hi-hat"],
  triumphant: ["around 110 bpm, marching", "104 bpm with big downbeats"],
  calm: ["around 75 bpm, unhurried", "70 bpm, laid back"],
  playful: ["around 105 bpm, bouncing", "112 bpm with a skipping groove"],
  sad: ["around 65 bpm, slow", "60 bpm, rubato"],
} satisfies Record<Mood, readonly string[]>;

const INSTRUMENTS_BY_GENRE = {
  afrobeats: ["talking drum, shekere and a round bassline", "log drum, shakers and plucked guitar"],
  highlife: ["bright palm-wine guitar and soft horns", "interlocking guitars over light congas"],
  orchestral: ["low strings, French horns and timpani", "string ostinato with brass swells"],
  lofi: ["dusty Rhodes, vinyl crackle and soft kick", "muted kora loop over a lazy beat"],
  electronic: [
    "analogue synth bass and gated pads",
    "arpeggiated synths over a four-on-the-floor kick",
  ],
} satisfies Record<Genre, readonly string[]>;

const STRUCTURE_BY_MOOD = {
  tense: "short intro, build to a hit at the midpoint, cut to silence at the end",
  triumphant: "steady build, full arrangement for the last third, ring out",
  calm: "even loopable bed with no sudden changes",
  playful: "call and response between two instruments, light stop at the end",
  sad: "sparse start, one swell in the middle, fade out",
} satisfies Record<Mood, string>;

const pick = (options: readonly string[], attempt: number): string =>
  options[attempt % options.length] ?? "";

export function improveMusicPrompt(input: MusicMagicPromptRequest): MagicPromptResult {
  const prompt = input.prompt.trim();
  if (DISALLOWED.test(prompt)) {
    return MusicMagicPromptResultSchema.parse({
      status: "declined",
      reason:
        "Magic Prompt cannot help with explicit content. Describe the music without it and try again.",
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
    const before = rest.slice(0, best.index);
    if (before) {
      original.push({ text: before, change: null });
      suggestion.push({ text: before, change: null });
    }
    const after = pick(best.rule.options, input.attempt);
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
    assumptions.push(
      "It plays under a scene, so it stays out of the way of dialogue.",
      "The genre and mood you picked set the instruments and tempo.",
    );
  }

  if (!INSTRUMENTS.test(prompt)) {
    append(
      pick(INSTRUMENTS_BY_GENRE[input.genre], input.attempt),
      "Naming instruments gives the genre a sound you can hear, not just a label.",
    );
  }
  if (input.strength !== "light" && !TEMPO.test(prompt)) {
    append(
      pick(TEMPO_BY_MOOD[input.mood], input.attempt),
      "A tempo ties the music to the mood and to the cut of the scene.",
    );
  }
  if (input.strength !== "light" && !STRUCTURE.test(prompt)) {
    append(STRUCTURE_BY_MOOD[input.mood], "A shape over time lets the music land with the action.");
  }
  if (input.strength === "directed") {
    append("no vocals, low end kept dry", "Leaving room means dialogue and effects sit on top.");
  }

  if (IMITATION.test(prompt)) {
    warnings.push(
      "Naming a real artist is not allowed. Describe the sound you like about them instead.",
    );
  }

  const improved = suggestion
    .map((segment) => segment.text)
    .join("")
    .replace(/\s+,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();

  return MusicMagicPromptResultSchema.parse({
    status: "improved",
    improved,
    original,
    suggestion,
    changes,
    assumptions,
    warnings,
    recipes: ["score under scene v1 (sample)", "anti-slop v1 (sample)"],
  });
}
