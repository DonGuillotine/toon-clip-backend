"use client";

import { Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DEFAULT_STYLE, isStyleId, STYLE_OPTIONS, type StyleId } from "@/lib/styles";
import { cn } from "@/lib/utils";

const noop = () => () => undefined;

/** True only after hydration; the saved style is unknown on the server. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/** Each style's own palette, so the chip previews the style it switches to. */
const SWATCHES: Record<StyleId, readonly string[]> = {
  manga: ["bg-swatch-manga-1", "bg-swatch-manga-2", "bg-swatch-manga-3"],
  mafiki: ["bg-swatch-mafiki-1", "bg-swatch-mafiki-2", "bg-swatch-mafiki-3"],
};

/**
 * Floating switcher between the candidate visual styles. A review tool for
 * choosing the look; it goes away once one style is chosen.
 */
export function StyleToolbar() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const current: StyleId = hydrated && isStyleId(theme) ? theme : DEFAULT_STYLE;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 print:hidden">
      <div
        role="region"
        aria-label="Visual style"
        className="pointer-events-auto flex items-center gap-2 rounded-lg border-2 border-ink bg-sheet p-2 shadow-toolbar"
      >
        <span className="flex items-center gap-1.5 px-1.5 text-xs font-bold tracking-wide text-ink-soft uppercase">
          <Palette aria-hidden="true" className="size-4" />
          <span className="max-sm:sr-only">Style</span>
        </span>
        <ToggleGroup
          type="single"
          value={current}
          onValueChange={(value) => {
            // Radix sends "" when the pressed item is clicked again; keep the choice.
            if (isStyleId(value)) setTheme(value);
          }}
          aria-label="Choose a visual style"
        >
          {STYLE_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.id}
              value={option.id}
              title={option.description}
              aria-label={`${option.label}: ${option.description}`}
            >
              <span aria-hidden="true" className="flex -space-x-1">
                {SWATCHES[option.id].map((swatch) => (
                  <span
                    key={swatch}
                    className={cn("size-3.5 rounded-full border-2 border-ink", swatch)}
                  />
                ))}
              </span>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
