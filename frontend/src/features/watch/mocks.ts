import { type CaptionBook } from "./library";

/**
 * Sample dialogue for the captions track, by storyboard and shot position.
 * `null` means the shot has no spoken line. Only route handlers import this.
 */
export const captionsFixture: CaptionBook = {
  sb_courtyard: [
    "Kaito: Open the gate. I will not ask twice.",
    null,
    "Soldier: Hold the line!",
    null,
    "Kaito: Three of you. Is that all Benin could spare?",
    "Kaito: It is done. Let the drums tell it.",
  ],
  sb_rooftop: [null, "Adaeze: Not today, storm. Not today.", null, "Adaeze: Made it. Just about."],
  sb_market: [
    null,
    "Tunde: This adire, the indigo is real?",
    "Trader: For you? Twelve thousand. Final.",
    "Zuri: She said final, Tunde. Pay the woman.",
    "Trader: Scarves up, everybody. Harmattan is here.",
  ],
  sb_nightbus: ["Zuri: Kano by morning, if the rain lets us.", null],
};
