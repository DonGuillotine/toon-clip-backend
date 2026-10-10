/**
 * The visual styles the app can wear. Each one is a token set in
 * `globals.css` scoped to `html[data-style="<id>"]`; components never branch
 * on the style, they read tokens.
 *
 * This is a design-review tool while the look is being chosen. When one
 * style wins, the other is deleted (AGENTS.md §9, removing a feature).
 */

export type StyleId = "manga" | "mafiki";

export type StyleOption = {
  readonly id: StyleId;
  readonly label: string;
  readonly description: string;
};

export const STYLE_OPTIONS: readonly StyleOption[] = [
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
];

export const STYLE_IDS: readonly StyleId[] = STYLE_OPTIONS.map((option) => option.id);

export const DEFAULT_STYLE: StyleId = "manga";

export function isStyleId(value: unknown): value is StyleId {
  return STYLE_IDS.some((id) => id === value);
}
