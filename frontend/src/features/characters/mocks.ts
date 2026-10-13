import { z } from "zod";

import { CharacterSheetSchema, type CharacterSheet, type CharacterSummary } from "./schema";
import { toSummary } from "./sheet";

/** The fixture sheets. Kaito is the sample character from the tour. */
export const characterSheetsFixture: readonly CharacterSheet[] = z
  .array(CharacterSheetSchema)
  .parse([
    {
      id: "ch_kaito",
      name: "Kaito",
      look: "Red headband, yellow vest, cobalt shadows",
      notes:
        "Sample character. Fights with a wooden staff, never a blade. Headband knot always on the left.",
      voice: "Low, calm, clipped sentences",
      paletteId: "pl_torch",
      palette: ["#d83a2e", "#f4c430", "#1f3a8a", "#1b1b1f"],
      turnarounds: [
        { id: "img_kaito_front", label: "Front", source: { kind: "placeholder", art: "burst" } },
        { id: "img_kaito_side", label: "Side", source: { kind: "placeholder", art: "rush" } },
        { id: "img_kaito_back", label: "Back", source: { kind: "placeholder", art: "rain" } },
      ],
      expressions: [
        { id: "img_kaito_calm", label: "Calm", source: { kind: "placeholder", art: "dusk" } },
        {
          id: "img_kaito_shout",
          label: "Battle cry",
          source: { kind: "placeholder", art: "burst" },
        },
        { id: "img_kaito_tired", label: "Tired", source: { kind: "placeholder", art: "rain" } },
        { id: "img_kaito_smirk", label: "Smirk", source: { kind: "placeholder", art: "dusk" } },
        { id: "img_kaito_focus", label: "Focused", source: { kind: "placeholder", art: "rush" } },
        { id: "img_kaito_hurt", label: "Hurt", source: { kind: "placeholder", art: "rain" } },
      ],
      outfits: [
        {
          id: "img_kaito_vest",
          label: "Yellow vest",
          source: { kind: "placeholder", art: "burst" },
        },
        {
          id: "img_kaito_cloak",
          label: "Travel cloak",
          source: { kind: "placeholder", art: "dusk" },
        },
      ],
      rightsConfirmed: false,
      isSample: true,
      updatedAt: "2026-09-01T09:00:00.000Z",
    },
    {
      id: "ch_adaeze",
      name: "Adaeze",
      look: "Braided crown, green bomber, gold hoops",
      notes: "Quick with words, slow to trust. Hoops catch the light in every close-up.",
      voice: "",
      paletteId: null,
      palette: ["#1f7a4d", "#e0a526", "#3b2418", "#f2ebe0"],
      turnarounds: [
        { id: "img_ada_front", label: "Front", source: { kind: "placeholder", art: "dusk" } },
        { id: "img_ada_side", label: "Side", source: { kind: "placeholder", art: "rush" } },
      ],
      expressions: [
        { id: "img_ada_laugh", label: "Laugh", source: { kind: "placeholder", art: "burst" } },
        { id: "img_ada_side_eye", label: "Side eye", source: { kind: "placeholder", art: "dusk" } },
        { id: "img_ada_angry", label: "Angry", source: { kind: "placeholder", art: "burst" } },
        { id: "img_ada_sad", label: "Sad", source: { kind: "placeholder", art: "rain" } },
        { id: "img_ada_shock", label: "Shock", source: { kind: "placeholder", art: "rush" } },
        { id: "img_ada_proud", label: "Proud", source: { kind: "placeholder", art: "dusk" } },
        { id: "img_ada_sly", label: "Sly", source: { kind: "placeholder", art: "rain" } },
        { id: "img_ada_scared", label: "Scared", source: { kind: "placeholder", art: "rush" } },
      ],
      outfits: [
        {
          id: "img_ada_bomber",
          label: "Green bomber",
          source: { kind: "placeholder", art: "dusk" },
        },
        {
          id: "img_ada_gele",
          label: "Wedding gele",
          source: { kind: "placeholder", art: "burst" },
        },
        {
          id: "img_ada_school",
          label: "School uniform",
          source: { kind: "placeholder", art: "rain" },
        },
      ],
      rightsConfirmed: true,
      isSample: false,
      updatedAt: "2026-09-20T15:30:00.000Z",
    },
    {
      id: "ch_tunde",
      name: "Tunde",
      look: "Agbada in indigo adire, round glasses",
      notes: "The elder. Moves slowly, speaks in proverbs.",
      voice: "",
      paletteId: null,
      palette: ["#27408b", "#c9d4f0", "#5a3a22", "#111111"],
      turnarounds: [
        { id: "img_tunde_front", label: "Front", source: { kind: "placeholder", art: "rain" } },
      ],
      expressions: [
        { id: "img_tunde_wise", label: "Knowing", source: { kind: "placeholder", art: "dusk" } },
        { id: "img_tunde_stern", label: "Stern", source: { kind: "placeholder", art: "rain" } },
        {
          id: "img_tunde_laugh",
          label: "Belly laugh",
          source: { kind: "placeholder", art: "burst" },
        },
        { id: "img_tunde_sleep", label: "Dozing", source: { kind: "placeholder", art: "dusk" } },
      ],
      outfits: [
        {
          id: "img_tunde_agbada",
          label: "Indigo agbada",
          source: { kind: "placeholder", art: "rain" },
        },
      ],
      rightsConfirmed: true,
      isSample: false,
      updatedAt: "2026-09-12T11:00:00.000Z",
    },
    {
      id: "ch_zuri",
      name: "Zuri",
      look: "Short locs, oversized orange hoodie",
      notes: "Skates everywhere. Hoodie strings always untied.",
      voice: "",
      paletteId: "pl_lagos",
      palette: ["#ef7d22", "#1f7a4d", "#2b2b2b", "#e9e4da"],
      turnarounds: [
        { id: "img_zuri_front", label: "Front", source: { kind: "placeholder", art: "rush" } },
        { id: "img_zuri_back", label: "Back", source: { kind: "placeholder", art: "burst" } },
      ],
      expressions: [
        { id: "img_zuri_grin", label: "Grin", source: { kind: "placeholder", art: "burst" } },
        { id: "img_zuri_bored", label: "Bored", source: { kind: "placeholder", art: "rain" } },
        { id: "img_zuri_dare", label: "Dare", source: { kind: "placeholder", art: "rush" } },
        { id: "img_zuri_worry", label: "Worried", source: { kind: "placeholder", art: "dusk" } },
        { id: "img_zuri_cheer", label: "Cheer", source: { kind: "placeholder", art: "burst" } },
      ],
      outfits: [
        {
          id: "img_zuri_hoodie",
          label: "Orange hoodie",
          source: { kind: "placeholder", art: "rush" },
        },
        { id: "img_zuri_rain", label: "Rain jacket", source: { kind: "placeholder", art: "rain" } },
      ],
      rightsConfirmed: true,
      isSample: false,
      updatedAt: "2026-09-25T18:45:00.000Z",
    },
  ]);

/** The cast rows, derived from the sheets so the two can never disagree. */
export const charactersFixture: readonly CharacterSummary[] = characterSheetsFixture.map(toSummary);
