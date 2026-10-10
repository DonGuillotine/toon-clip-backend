import {
  RecentStoryboardsSchema,
  StoryboardDetailSchema,
  type CoverArt,
  type ShotSummary,
  type StoryboardDetail,
  type StoryboardSummary,
} from "./schema";

const minutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString();

export const recentStoryboardsFixture: readonly StoryboardSummary[] = RecentStoryboardsSchema.parse(
  [
    {
      id: "sb_courtyard",
      title: "Courtyard fight",
      idea: "Kaito battles through a line of armoured soldiers in a torchlit courtyard.",
      style: "2D anime",
      aspectRatio: "16:9",
      updatedAt: minutesAgo(14),
      characterIds: ["ch_kaito"],
      shots: [
        { id: "s1", state: "locked", durationSec: 6 },
        { id: "s2", state: "ready", durationSec: 8 },
        { id: "s3", state: "generating", durationSec: 5 },
        { id: "s4", state: "flagged", durationSec: 7 },
        { id: "s5", state: "ready", durationSec: 10 },
        { id: "s6", state: "queued", durationSec: 6 },
      ],
      cover: { art: "burst", sfx: "DOOM" },
    },
    {
      id: "sb_rooftop",
      title: "Lagos rooftop chase",
      idea: "Adaeze sprints across Lagos Island rooftops ahead of a storm.",
      style: "Mafiki",
      aspectRatio: "9:16",
      updatedAt: minutesAgo(60 * 5),
      characterIds: ["ch_adaeze"],
      shots: [
        { id: "s1", state: "ready", durationSec: 5 },
        { id: "s2", state: "ready", durationSec: 4 },
        { id: "s3", state: "ready", durationSec: 6 },
        { id: "s4", state: "flagged", durationSec: 5 },
      ],
      cover: { art: "rush", sfx: "WHOOSH" },
    },
    {
      id: "sb_market",
      title: "Harmattan market",
      idea: "Tunde haggles at a dusty market stall as the harmattan rolls in.",
      style: "Manga ink",
      aspectRatio: "16:9",
      updatedAt: minutesAgo(60 * 26),
      characterIds: ["ch_tunde", "ch_zuri"],
      shots: [
        { id: "s1", state: "ready", durationSec: 8 },
        { id: "s2", state: "ready", durationSec: 6 },
        { id: "s3", state: "failed", durationSec: 6 },
        { id: "s4", state: "ready", durationSec: 9 },
        { id: "s5", state: "ready", durationSec: 5 },
      ],
      cover: { art: "dusk", sfx: null },
    },
    {
      id: "sb_nightbus",
      title: "Night bus to Kano",
      idea: "Zuri watches the road through a rain-streaked bus window.",
      style: "2D anime",
      aspectRatio: "16:9",
      updatedAt: minutesAgo(60 * 24 * 4),
      characterIds: ["ch_zuri"],
      shots: [
        { id: "s1", state: "queued", durationSec: 10 },
        { id: "s2", state: "queued", durationSec: 8 },
      ],
      cover: { art: "rain", sfx: null },
    },
  ],
);

/* ------------------------------------------------------------------------ */
/* Storyboard detail fixtures for the timeline. Sample content only.        */
/* ------------------------------------------------------------------------ */

const ART_CYCLE: readonly CoverArt[] = ["burst", "rush", "dusk", "rain"];

const SHOT_PROMPTS: Readonly<Record<string, readonly string[]>> = {
  sb_courtyard: [
    "Wide: torchlit courtyard in old Benin City, a line of armoured soldiers, Kaito at the gate.",
    "Kaito charges, red headband streaming, dust kicking off the laterite.",
    "Close: a spear thrust, Kaito ducks under it, speed lines behind.",
    "Kaito vaults a soldier's shield, camera tracks low.",
    "Medium: three soldiers circle him, torches flare.",
    "Kaito stands alone as the last soldier falls, drums swell.",
  ],
  sb_rooftop: [
    "Aerial: Lagos Island rooftops, storm clouds rolling in off the lagoon.",
    "Adaeze sprints, braids whipping, a danfo horn far below.",
    "She leaps the gap between two zinc roofs.",
    "Close: Adaeze lands, looks back, first raindrops hit.",
  ],
  sb_market: [
    "Wide: a Kano market at noon, harmattan haze turning the sky white.",
    "Tunde inspects a bolt of indigo adire cloth.",
    "The trader names her price, Tunde raises an eyebrow.",
    "Zuri laughs from the next stall over.",
    "The dust rolls in, everyone pulls up their scarves.",
  ],
  sb_nightbus: [
    "Interior: a night bus to Kano, rain on the window, Zuri half asleep.",
    "Through the glass: headlights smear past on the expressway.",
  ],
};

const MODEL_SETTINGS = { model: "Seedance 1.0 Pro", resolution: "1080p" };

function buildShot(
  storyboardId: string,
  summary: ShotSummary,
  index: number,
  prompt: string,
  characterIds: readonly string[],
): unknown {
  const art = ART_CYCLE[index % ART_CYCLE.length] ?? "burst";
  const takeCount =
    summary.state === "queued" || summary.state === "generating" ? 0 : (index % 3) + 1;
  const takes = Array.from({ length: takeCount }, (_, takeIndex) => ({
    id: `${summary.id}_t${String(takeIndex + 1)}`,
    number: takeIndex + 1,
    prompt,
    notes: takeIndex === 0 ? null : "Keep the headband red, tighten the framing.",
    settings: {
      ...MODEL_SETTINGS,
      durationSec: summary.durationSec,
      seed: 1000 + index * 17 + takeIndex,
    },
    credits: summary.durationSec * 30,
    createdAt: minutesAgo(60 - takeIndex * 10 - index),
    art: ART_CYCLE[(index + takeIndex) % ART_CYCLE.length] ?? art,
  }));
  const last = takes.at(-1);
  const base = {
    id: summary.id,
    durationSec: summary.durationSec,
    prompt,
    characterIds,
    firstFrame: index === 0 ? { id: `${summary.id}_first`, label: "Opening frame", art } : null,
    lastFrame: { id: `${summary.id}_last`, label: `Shot ${String(index + 1)} end`, art },
    takes,
    selectedTakeId: last?.id ?? null,
  };
  switch (summary.state) {
    case "queued":
    case "generating":
      return { ...base, state: summary.state, jobId: `job_${storyboardId}_${summary.id}` };
    case "failed":
      return {
        ...base,
        state: "failed",
        reason: "The model timed out before the shot finished.",
        creditsRefunded: summary.durationSec * 30,
      };
    case "ready":
    case "flagged":
    case "locked":
      return { ...base, state: summary.state };
  }
}

/** Groups shots into sheets of at most 15 seconds, in order. */
function buildSheets(summary: StoryboardSummary): unknown[] {
  const prompts = SHOT_PROMPTS[summary.id] ?? [];
  const sheets: { id: string; title: string; shots: unknown[] }[] = [];
  let current: { id: string; title: string; shots: unknown[] } | null = null;
  let length = 0;
  summary.shots.forEach((shot, index) => {
    if (current === null || length + shot.durationSec > 15) {
      const number = sheets.length + 1;
      current = { id: `sheet_${String(number)}`, title: `Sheet ${String(number)}`, shots: [] };
      sheets.push(current);
      length = 0;
    }
    length += shot.durationSec;
    current.shots.push(
      buildShot(summary.id, shot, index, prompts[index] ?? summary.idea, summary.characterIds),
    );
  });
  return sheets;
}

export const storyboardDetailsFixture: readonly StoryboardDetail[] = recentStoryboardsFixture.map(
  (summary) => {
    const total = summary.shots.reduce((sum, shot) => sum + shot.durationSec, 0);
    return StoryboardDetailSchema.parse({
      id: summary.id,
      title: summary.title,
      idea: summary.idea,
      style: summary.style,
      aspectRatio: summary.aspectRatio,
      updatedAt: summary.updatedAt,
      cover: summary.cover,
      revision: 0,
      sheets: buildSheets(summary),
      audio: [
        { id: "a_score", label: "Talking drum score (sample)", startSec: 0, durationSec: total },
      ],
    });
  },
);
