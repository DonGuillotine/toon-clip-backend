"use client";

import { toast } from "sonner";

import { Section } from "@/components/section";
import { ChoiceField } from "@/features/export/components/fields";
import { STRENGTHS, type Strength } from "@/features/magic-prompt/schema";
import { ASPECT_RATIOS, type AspectRatio } from "@/features/storyboards/schema";

import { useUpdatePreferences } from "../mutations";
import { type Preferences, type Theme, THEMES } from "../schema";
import { applyTheme } from "../theme";

const THEME_LABELS = { light: "Light", dark: "Dark" } satisfies Record<Theme, string>;

const STRENGTH_LABELS = {
  light: "Light",
  standard: "Standard",
  directed: "Directed",
} satisfies Record<Strength, string>;

const ASPECT_LABELS = {
  "16:9": "16:9 landscape",
  "9:16": "9:16 vertical",
  "1:1": "1:1 square",
} satisfies Record<AspectRatio, string>;

/**
 * Defaults saved to the account, so they follow the creator across devices.
 * Each change saves at once; there is nothing to submit.
 */
export function PreferencesSection({
  preferences,
  className,
}: {
  readonly preferences: Preferences;
  readonly className: string;
}) {
  const update = useUpdatePreferences();

  const save = (next: Preferences, what: string) => {
    if (next.theme !== preferences.theme) applyTheme(next.theme);
    update.mutate(next, {
      onSuccess: () => {
        toast(`${what} saved.`);
      },
      onError: () => {
        if (next.theme !== preferences.theme) applyTheme(preferences.theme);
        toast.error(`${what} did not save. It is back as it was.`);
      },
    });
  };

  return (
    <Section
      title="Preferences"
      titleId="profile-preferences"
      description="Saved to your account."
      className={className}
    >
      <div className="flex flex-col">
        <ChoiceField
          label="Theme"
          value={preferences.theme}
          choices={THEMES.map((value) => ({ value, label: THEME_LABELS[value] }))}
          onChange={(theme) => {
            save({ ...preferences, theme }, "Theme");
          }}
        />
        <ChoiceField
          label="Default aspect ratio"
          hint="New quick creates and storyboards start with this shape."
          value={preferences.defaultAspectRatio}
          choices={ASPECT_RATIOS.map((value) => ({ value, label: ASPECT_LABELS[value] }))}
          onChange={(defaultAspectRatio) => {
            save({ ...preferences, defaultAspectRatio }, "Default aspect ratio");
          }}
        />
        <ChoiceField
          label="Default Magic Prompt strength"
          hint="Light keeps your words; Directed adds the most camera, light and motion detail."
          value={preferences.defaultStrength}
          choices={STRENGTHS.map((value) => ({ value, label: STRENGTH_LABELS[value] }))}
          onChange={(defaultStrength) => {
            save({ ...preferences, defaultStrength }, "Default strength");
          }}
        />
      </div>
    </Section>
  );
}
