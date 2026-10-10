import { CharactersSchema, type CharacterSummary } from "./schema";

export const charactersFixture: readonly CharacterSummary[] = CharactersSchema.parse([
  {
    id: "ch_kaito",
    name: "Kaito",
    look: "Red headband, yellow vest, cobalt shadows",
    palette: ["#d83a2e", "#f4c430", "#1f3a8a", "#1b1b1f"],
    outfitCount: 2,
    expressionCount: 6,
    isSample: true,
  },
  {
    id: "ch_adaeze",
    name: "Adaeze",
    look: "Braided crown, green bomber, gold hoops",
    palette: ["#1f7a4d", "#e0a526", "#3b2418", "#f2ebe0"],
    outfitCount: 3,
    expressionCount: 8,
    isSample: false,
  },
  {
    id: "ch_tunde",
    name: "Tunde",
    look: "Agbada in indigo adire, round glasses",
    palette: ["#27408b", "#c9d4f0", "#5a3a22", "#111111"],
    outfitCount: 1,
    expressionCount: 4,
    isSample: false,
  },
  {
    id: "ch_zuri",
    name: "Zuri",
    look: "Short locs, oversized orange hoodie",
    palette: ["#ef7d22", "#2b2b2b", "#7a4b2a", "#e9e4da"],
    outfitCount: 2,
    expressionCount: 5,
    isSample: false,
  },
]);
