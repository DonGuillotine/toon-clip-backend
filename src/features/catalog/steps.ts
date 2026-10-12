/**
 * An example is walked through in three steps, the same three the tour
 * shows (spec 7.1): the character and the idea, what Magic Prompt does with
 * it, and the result. The step is in the URL (`?step=`).
 */

export const STEPS: readonly ["1", "2", "3"] = ["1", "2", "3"];
export type Step = (typeof STEPS)[number];

export const STEP_TITLES = {
  "1": "Character and idea",
  "2": "Magic Prompt",
  "3": "Result",
} satisfies Record<Step, string>;

export const STEP_HEADINGS = {
  "1": "Step 1: a character and an idea",
  "2": "Step 2: Magic Prompt",
  "3": "Step 3: the result",
} satisfies Record<Step, string>;

/** The step after this one, or `null` on the last. */
export function nextStep(step: Step): Step | null {
  return STEPS[STEPS.indexOf(step) + 1] ?? null;
}

/** The step before this one, or `null` on the first. */
export function previousStep(step: Step): Step | null {
  const index = STEPS.indexOf(step);
  return index <= 0 ? null : (STEPS[index - 1] ?? null);
}
