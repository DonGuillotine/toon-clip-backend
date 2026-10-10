import { RecentStoryboardsSchema, type StoryboardSummary } from "./schema";

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
