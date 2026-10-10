/**
 * The visual styles the app can wear. Each one is a token set in
 * `globals.css` scoped to `html[data-style="<id>"]`; components never branch
 * on the style, they read tokens.
 *
 * This is a design-review tool while the look is being chosen. When one
 * style wins, the other is deleted (AGENTS.md §9, removing a feature).
 */

/** Token styles: same components, different tokens, switched in place. */
export type StyleId = "manga" | "mafiki";

/**
 * Every option in the switcher. "calm" is not a token set over the same
 * components: it is a separate UI at `/calm`, so choosing it navigates.
 */
export type LookId = StyleId | "calm";

export type StyleOption = {
  readonly id: LookId;
  readonly label: string;
  readonly description: string;
};

export const LOOK_OPTIONS: readonly StyleOption[] = [
  {
    id: "manga",
    label: "Manga",
    description: "Ink on white paper, screentone, one spot colour",
  },
  {
    id: "mafiki",
    label: "Mafiki",
    description: "Warm cut paper, Adire and Kente pattern, sign-painter lettering",
  },
  {
    id: "calm",
    label: "Calm",
    description: "A quiet everyday app, with comic touches only where they mean something",
  },
];

export const STYLE_IDS: readonly StyleId[] = ["manga", "mafiki"];

export const DEFAULT_STYLE: StyleId = "manga";

export function isLookId(value: unknown): value is LookId {
  return value === "calm" || isStyleId(value);
}

export function isStyleId(value: unknown): value is StyleId {
  return STYLE_IDS.some((id) => id === value);
}
