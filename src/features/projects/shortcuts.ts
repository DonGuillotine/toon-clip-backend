/**
 * Project keyboard shortcuts (PRODUCT.md, "Timeline shortcuts"), for the
 * actions the live API supports. One table, read by the key handler and by
 * the help list, so they cannot disagree.
 */

export type ProjectCommand = "play" | "previous" | "next" | "flag" | "lock" | "revise";

export type ProjectShortcut = {
  readonly command: ProjectCommand;
  readonly keys: readonly string[];
  readonly label: string;
};

export const PROJECT_SHORTCUTS: readonly ProjectShortcut[] = [
  { command: "play", keys: ["Space"], label: "Play or pause" },
  { command: "previous", keys: ["["], label: "Previous shot" },
  { command: "next", keys: ["]"], label: "Next shot" },
  { command: "flag", keys: ["F"], label: "Flag or clear the flag" },
  { command: "lock", keys: ["Shift", "L"], label: "Lock or unlock" },
  { command: "revise", keys: ["R"], label: "Go to revisions" },
];

export type KeyInput = {
  readonly key: string;
  readonly shiftKey: boolean;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
};

/** Which command a key press means, or `null` when it is not a shortcut. */
export function projectCommandFor(input: KeyInput): ProjectCommand | null {
  if (input.altKey || input.metaKey || input.ctrlKey) return null;
  if (input.key === " ") return input.shiftKey ? null : "play";
  const key = input.key.toLowerCase();
  if (input.shiftKey) return key === "l" ? "lock" : null;
  switch (key) {
    case "[":
      return "previous";
    case "]":
      return "next";
    case "f":
      return "flag";
    case "r":
      return "revise";
    default:
      return null;
  }
}

/**
 * True when a key press belongs to whatever has focus: typing in a field,
 * or operating a control that uses the same keys (Space on a button).
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
