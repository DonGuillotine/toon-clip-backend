"use client";

import { WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * The one control that earns a comic flourish: on hover, a small burst of
 * focus lines flares behind the wand, the way a manga panel marks a reveal.
 */
export function MagicPromptButton({
  disabled,
  pressed,
  onClick,
}: {
  readonly disabled: boolean;
  readonly pressed: boolean;
  readonly onClick: () => void;
}) {
  return (
    <Button
      variant="secondary"
      disabled={disabled}
      aria-pressed={pressed}
      onClick={onClick}
      className="group/magic overflow-hidden bg-card hover:bg-card"
    >
      <span aria-hidden="true" className="relative grid size-4 place-items-center">
        <span className="pointer-events-none absolute size-12 scale-90 focus-lines opacity-0 transition-[opacity,transform] duration-(--duration-menu) ease-out-strong [--focus-ink:var(--spot-hover)] group-hover/magic:scale-100 group-hover/magic:opacity-100" />
        <WandSparkles className="relative transition-transform duration-(--duration-menu) ease-out-strong group-hover/magic:-rotate-12" />
      </span>
      Magic Prompt
    </Button>
  );
}
