import { type ComicPage, ComicPageSchema } from "./schema";

/**
 * Sample comic pages. Only the fixture store in `src/app/api/comics` reads
 * these. Art is placeholder and is labelled as sample art in the UI.
 */

const now = Date.now();
const hoursAgo = (hours: number): string => new Date(now - hours * 60 * 60 * 1000).toISOString();

const take = (
  id: string,
  number: number,
  prompt: string,
  art: "burst" | "rush" | "dusk" | "rain",
  hours: number,
) => ({ id, number, prompt, credits: 40, createdAt: hoursAgo(hours), art });

const marketChase: ComicPage = {
  id: "cp_market_chase",
  title: "Market chase, page 1",
  layout: "feature-three",
  updatedAt: hoursAgo(2),
  panels: [
    {
      id: "cp_market_chase_p1",
      prompt:
        "Wide establishing shot of Balogun market at noon, Kaito vaulting a fruit stall, crowd scattering, high angle, hard sun.",
      takes: [
        take("cp_market_chase_p1_t1", 1, "Wide shot of a busy market, Kaito running.", "rush", 30),
        take(
          "cp_market_chase_p1_t2",
          2,
          "Wide establishing shot of Balogun market at noon, Kaito vaulting a fruit stall, crowd scattering, high angle, hard sun.",
          "burst",
          26,
        ),
      ],
      selectedTakeId: "cp_market_chase_p1_t2",
      bubbles: [
        { id: "b_mc_1", kind: "caption", text: "Lagos. Noon. Nobody saw it coming.", x: 3, y: 4 },
        { id: "b_mc_2", kind: "speech", text: "Out of the way!", x: 58, y: 18 },
      ],
      state: "ready",
    },
    {
      id: "cp_market_chase_p2",
      prompt: "Close on the soldier's boots skidding in spilled palm oil, low angle, motion blur.",
      takes: [
        take(
          "cp_market_chase_p2_t1",
          1,
          "Close on the soldier's boots skidding in spilled palm oil, low angle, motion blur.",
          "rush",
          25,
        ),
      ],
      selectedTakeId: "cp_market_chase_p2_t1",
      bubbles: [{ id: "b_mc_3", kind: "thought", text: "Not again.", x: 40, y: 10 }],
      state: "ready",
    },
    {
      id: "cp_market_chase_p3",
      prompt: "Kaito looks back over his shoulder, half smile, sun flare behind him.",
      takes: [],
      selectedTakeId: null,
      bubbles: [],
      state: "failed",
      reason: "The model timed out on this panel. Your 40 credits were refunded. Try again.",
    },
  ],
  exports: [],
};

const rooftop: ComicPage = {
  id: "cp_rooftop_rain",
  title: "Rooftop in the rain",
  layout: "grid-four",
  updatedAt: hoursAgo(50),
  panels: [
    {
      id: "cp_rooftop_rain_p1",
      prompt: "Night rooftop, heavy rain, Amara alone under a water tank, neon below.",
      takes: [
        take(
          "cp_rooftop_rain_p1_t1",
          1,
          "Night rooftop, heavy rain, Amara alone under a water tank, neon below.",
          "rain",
          52,
        ),
      ],
      selectedTakeId: "cp_rooftop_rain_p1_t1",
      bubbles: [{ id: "b_rr_1", kind: "caption", text: "Three days since the raid.", x: 4, y: 4 }],
      state: "ready",
    },
    {
      id: "cp_rooftop_rain_p2",
      prompt: "Her hand tightens on the railing, rain beading on her knuckles, extreme close up.",
      takes: [
        take(
          "cp_rooftop_rain_p2_t1",
          1,
          "Her hand tightens on the railing, rain beading on her knuckles, extreme close up.",
          "dusk",
          51,
        ),
      ],
      selectedTakeId: "cp_rooftop_rain_p2_t1",
      bubbles: [],
      state: "ready",
    },
    {
      id: "cp_rooftop_rain_p3",
      prompt: "A figure steps out of the stairwell door behind her, backlit, face hidden.",
      takes: [],
      selectedTakeId: null,
      bubbles: [{ id: "b_rr_2", kind: "speech", text: "You came back.", x: 50, y: 12 }],
      state: "empty",
    },
    {
      id: "cp_rooftop_rain_p4",
      prompt: "",
      takes: [],
      selectedTakeId: null,
      bubbles: [],
      state: "empty",
    },
  ],
  exports: [],
};

export const comicPagesFixture: readonly ComicPage[] = [marketChase, rooftop].map((page) =>
  ComicPageSchema.parse(page),
);
