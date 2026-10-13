/**
 * Magic Prompt writes a long clip as timed beats:
 *
 *   BIG CHIEF is @Image 1
 *   0:00–0:03
 *   Visual: On a rocky cliff battlefield...
 *   Camera: Slow push-in on his grin...
 *
 * This reads that layout back into data, so a prompt can be shown beat by
 * beat and a clip can be cut where its beats change. A prompt without
 * timecodes has no beats; that is a normal result, not an error.
 */

export type BeatField = { readonly label: string; readonly text: string };

export type Beat = {
  readonly startSeconds: number;
  readonly endSeconds: number;
  readonly fields: readonly BeatField[];
  /** Lines in the beat that are not "Label: text". */
  readonly notes: readonly string[];
};

export type ParsedPrompt = {
  /** Text before the first timecode, such as "BIG CHIEF is @Image 1". */
  readonly lead: string;
  readonly beats: readonly Beat[];
};

/** "0:03", "1:05" or "0:03.5" as seconds. */
function clockSeconds(minutes: string, seconds: string): number {
  return Number(minutes) * 60 + Number(seconds);
}

// A line that is only a time range, joined by a hyphen, an en dash or an em dash: "0:00 - 0:03".
const RANGE = /^\s*(\d{1,2}):(\d{2}(?:\.\d+)?)\s*[-\u2013\u2014]\s*(\d{1,2}):(\d{2}(?:\.\d+)?)\s*$/;
// "Visual: text". The label is a short phrase that starts with a letter.
const FIELD = /^\s*([A-Za-z][A-Za-z /&]{0,23}):\s+(.+)$/;

type Draft = { startSeconds: number; endSeconds: number; fields: BeatField[]; notes: string[] };

export function parseBeats(prompt: string): ParsedPrompt {
  const lead: string[] = [];
  const beats: Draft[] = [];

  for (const line of prompt.split(/\r?\n/)) {
    const range = RANGE.exec(line);
    if (range !== null) {
      const [, m1 = "0", s1 = "0", m2 = "0", s2 = "0"] = range;
      const startSeconds = clockSeconds(m1, s1);
      const endSeconds = clockSeconds(m2, s2);
      if (endSeconds > startSeconds) {
        beats.push({ startSeconds, endSeconds, fields: [], notes: [] });
        continue;
      }
    }
    const text = line.trim();
    if (text === "") continue;
    const current = beats.at(-1);
    if (current === undefined) {
      lead.push(text);
      continue;
    }
    const field = FIELD.exec(text);
    if (field !== null) {
      const [, label = "", value = ""] = field;
      current.fields.push({ label: label.trim(), text: value.trim() });
    } else {
      current.notes.push(text);
    }
  }

  return { lead: lead.join(" "), beats };
}

/** The first field of a beat as a one-line summary ("Visual" when there is one). */
export function beatSummary(beat: Beat): string {
  const visual = beat.fields.find((field) => field.label.toLowerCase() === "visual");
  return visual?.text ?? beat.fields[0]?.text ?? beat.notes[0] ?? "";
}

/** The beat playing at `seconds`, or `null` when no beat covers it. */
export function beatAt(beats: readonly Beat[], seconds: number): Beat | null {
  return beats.find((beat) => seconds >= beat.startSeconds && seconds < beat.endSeconds) ?? null;
}

/** "0:03" from 3, "0:03.5" from 3.5. */
export function formatClock(seconds: number): string {
  const tenths = Math.round(seconds * 10);
  const minutes = Math.floor(tenths / 600);
  const rest = (tenths % 600) / 10;
  const whole = Math.floor(rest);
  const fraction = Math.round((rest - whole) * 10);
  const clock = `${String(minutes)}:${String(whole).padStart(2, "0")}`;
  return fraction === 0 ? clock : `${clock}.${String(fraction)}`;
}
