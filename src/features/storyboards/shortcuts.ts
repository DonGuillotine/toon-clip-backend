/**
 * Timeline keyboard shortcuts (PRODUCT.md, "Timeline shortcuts"). One table,
 * read by the key handler and by the help popover, so they cannot disagree.
 *
 * L is both "shuttle forward" and "lock" in the spec. Shuttle keeps the bare
 * key (the J K L convention); lock moves to Shift+L.
 */

export type TimelineCommand =
  | "play"
  | "back"
  | "pause"
  | "forward"
  | "split"
  | "flag"
  | "lock"
  | "regenerate"
  | "undo"
  | "redo"
  | "board";

export type Shortcut = {
  readonly command: TimelineCommand;
  readonly keys: readonly string[];
  readonly label: string;
};

export const SHORTCUTS: readonly Shortcut[] = [
  { command: "play", keys: ["Space"], label: "Play or pause" },
  { command: "back", keys: ["J"], label: "Shuttle back, press again to go faster" },
  { command: "pause", keys: ["K"], label: "Stop" },
  { command: "forward", keys: ["L"], label: "Shuttle forward, press again to go faster" },
  { command: "split", keys: ["S"], label: "Split the shot at the playhead" },
  { command: "flag", keys: ["F"], label: "Flag or clear the flag" },
  { command: "lock", keys: ["Shift", "L"], label: "Lock or unlock" },
  { command: "regenerate", keys: ["R"], label: "Regenerate, cost shown first" },
  { command: "undo", keys: ["Cmd/Ctrl", "Z"], label: "Undo" },
  { command: "redo", keys: ["Cmd/Ctrl", "Shift", "Z"], label: "Redo" },
  { command: "board", keys: ["B"], label: "Open in Board" },
];

export type KeyInput = {
  readonly key: string;
  readonly shiftKey: boolean;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
};

/** Which command a key press means, or `null` when it is not a shortcut. */
export function commandFor(input: KeyInput): TimelineCommand | null {
  if (input.altKey) return null;
  const key = input.key.toLowerCase();
  if (input.metaKey || input.ctrlKey) {
    if (key === "z") return input.shiftKey ? "redo" : "undo";
    return null;
  }
  if (input.key === " ") return input.shiftKey ? null : "play";
  if (input.shiftKey) return key === "l" ? "lock" : null;
  switch (key) {
    case "j":
      return "back";
    case "k":
      return "pause";
    case "l":
      return "forward";
    case "s":
      return "split";
    case "f":
      return "flag";
    case "r":
      return "regenerate";
    case "b":
      return "board";
    default:
      return null;
  }
}
