"use client";

import { Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DEFAULT_STYLE,
  isLookId,
  isStyleId,
  LOOK_OPTIONS,
  type LookId,
  type StyleId,
} from "@/lib/styles";
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

/** Each look's own palette, so the chip previews the look it switches to. */
const SWATCHES: Record<LookId, readonly string[]> = {
  manga: ["bg-swatch-manga-1", "bg-swatch-manga-2", "bg-swatch-manga-3"],
  mafiki: ["bg-swatch-mafiki-1", "bg-swatch-mafiki-2", "bg-swatch-mafiki-3"],
  calm: ["bg-swatch-calm-1", "bg-swatch-calm-2", "bg-swatch-calm-3"],
};

/**
 * Floating switcher between the candidate looks. A review tool for choosing
 * the design; it goes away once one look is chosen.
 *
 * Manga and Mafiki are token sets on the same UI and switch in place. Calm is
 * a separate UI at `/calm`, so picking it (or leaving it) navigates. Each
 * layout renders the toolbar and says which side it is on.
 */
export function StyleToolbar({ inCalm }: { readonly inCalm: boolean }) {
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
        <ConnectedLookToggle inCalm={inCalm} />
      </div>
    </div>
  );
}

function ConnectedLookToggle({ inCalm }: { readonly inCalm: boolean }) {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const router = useRouter();

  const saved: StyleId = hydrated && isStyleId(theme) ? theme : DEFAULT_STYLE;
  const current: LookId = inCalm ? "calm" : saved;

  const pick = (look: LookId) => {
    if (look === "calm") {
      if (!inCalm) router.push("/calm");
      return;
    }
    setTheme(look);
    if (inCalm) router.push("/");
  };

  return <LookToggle current={current} onPick={pick} />;
}

function LookToggle({
  current,
  onPick,
}: {
  readonly current: LookId;
  readonly onPick: (look: LookId) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={current}
      onValueChange={(value) => {
        // Radix sends "" when the pressed item is clicked again; keep the choice.
        if (isLookId(value)) onPick(value);
      }}
      aria-label="Choose a visual style"
    >
      {LOOK_OPTIONS.map((option) => (
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
  );
}
