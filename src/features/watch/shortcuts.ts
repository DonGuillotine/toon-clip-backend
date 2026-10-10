/**
 * Player keyboard shortcuts. One table, read by the key handler and the
 * shortcut list under the player, so the two cannot disagree. Space and
 * J K L match the timeline (PRODUCT.md, "Timeline shortcuts").
 */

export type PlayerCommand =
  | "play"
  | "back"
  | "pause"
  | "forward"
  | "stepBack"
  | "stepForward"
  | "start"
  | "end"
  | "captions"
  | "fullscreen";

export type PlayerShortcut = {
  readonly command: PlayerCommand;
  readonly keys: readonly string[];
  readonly label: string;
};

export const PLAYER_SHORTCUTS: readonly PlayerShortcut[] = [
  { command: "play", keys: ["Space"], label: "Play or pause" },
  { command: "back", keys: ["J"], label: "Rewind, press again to go faster" },
  { command: "pause", keys: ["K"], label: "Stop" },
  { command: "forward", keys: ["L"], label: "Fast forward, press again to go faster" },
  { command: "stepBack", keys: ["Left"], label: "Back 5 seconds" },
  { command: "stepForward", keys: ["Right"], label: "Forward 5 seconds" },
  { command: "start", keys: ["Home"], label: "Go to the start" },
  { command: "end", keys: ["End"], label: "Go to the end" },
  { command: "captions", keys: ["C"], label: "Captions on or off" },
  { command: "fullscreen", keys: ["F"], label: "Full screen" },
];

export type PlayerKeyInput = {
  readonly key: string;
  readonly shiftKey: boolean;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
};

/** Which command a key press means, or `null` when it is not a shortcut. */
export function playerCommandFor(input: PlayerKeyInput): PlayerCommand | null {
  if (input.altKey || input.metaKey || input.ctrlKey || input.shiftKey) return null;
  switch (input.key) {
    case " ":
      return "play";
    case "ArrowLeft":
      return "stepBack";
    case "ArrowRight":
      return "stepForward";
    case "Home":
      return "start";
    case "End":
      return "end";
    default:
      break;
  }
  switch (input.key.toLowerCase()) {
    case "j":
      return "back";
    case "k":
      return "pause";
    case "l":
      return "forward";
    case "c":
      return "captions";
    case "f":
      return "fullscreen";
    default:
      return null;
  }
}

/**
 * Whether a key press belongs to the focused control instead of the player:
 * typing in a field, or arrows on a slider or menu that handle them itself.
 */
export function keyBelongsToTarget(target: EventTarget | null, key: string): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  const role = target.getAttribute("role");
  const arrows = key.startsWith("Arrow") || key === "Home" || key === "End";
  if (arrows && (role === "slider" || role === "menuitem" || role === "tab")) return true;
  // Space activates a focused button; let it, rather than toggling playback twice.
  if (key === " " && (tag === "BUTTON" || tag === "A" || role === "button")) return true;
  return false;
}
