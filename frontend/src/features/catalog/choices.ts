import { type Choice, type Scenario, type Selection } from "./schema";

export type ChoiceField = {
  readonly field: string;
  readonly label: string;
  /** Only options that appear in at least one supported selection. */
  readonly options: readonly Choice[];
};

/** "character" becomes "Character", "camera_move" becomes "Camera move". */
export function fieldLabel(field: string): string {
  const words = field.replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The choice fields a creator picks from, in the API's order. */
export function choiceFields(scenario: Scenario): ChoiceField[] {
  return Object.entries(scenario.choices).map(([field, options]) => ({
    field,
    label: fieldLabel(field),
    options: options.filter((option) =>
      scenario.selections.some((selection) => selection.values[field] === option.id),
    ),
  }));
}

/**
 * The selection after picking `optionId` for `field`: the one that keeps
 * every other current value if it exists, else the first that has the option.
 */
export function pickSelection(
  scenario: Scenario,
  current: Selection,
  field: string,
  optionId: string,
): Selection | null {
  const wanted = { ...current.values, [field]: optionId };
  const exact = scenario.selections.find((selection) =>
    Object.entries(wanted).every(([key, value]) => selection.values[key] === value),
  );
  return exact ?? scenario.selections.find((s) => s.values[field] === optionId) ?? null;
}

export type CharacterArt = { readonly name: string; readonly imageUrl: string | null };

/**
 * The character to show for an example: the option chosen for a field named
 * "character" when there is one, else the first option with an image.
 */
export function characterFor(scenario: Scenario, selection: Selection | null): CharacterArt | null {
  const characterOptions = scenario.choices["character"];
  if (characterOptions !== undefined) {
    const chosenId = selection?.values["character"];
    const option = characterOptions.find((item) => item.id === chosenId) ?? characterOptions[0];
    if (option !== undefined) return { name: option.label, imageUrl: option.media?.url ?? null };
  }
  for (const options of Object.values(scenario.choices)) {
    const option = options.find((item) => item.media !== undefined);
    if (option?.media !== undefined) return { name: option.label, imageUrl: option.media.url };
  }
  return null;
}

/**
 * The example the tour walks through: the one the API marks as the tour
 * (free, cannot be exported), else the first published example.
 */
export function tourScenario<T extends Pick<Scenario, "isTour">>(
  scenarios: readonly T[],
): T | null {
  return scenarios.find((scenario) => scenario.isTour) ?? scenarios[0] ?? null;
}
