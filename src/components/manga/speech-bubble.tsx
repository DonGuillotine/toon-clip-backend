import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

type SpeechBubbleProps = ComponentProps<"div"> & {
  /** Where the tail leaves the bubble. */
  readonly tail?: "bottom-start" | "bottom-end" | "none";
  readonly size?: "default" | "sm";
};

/**
 * A speech bubble. The tail is drawn in SVG and laid over the bubble's own
 * border so the outline reads as one continuous ink line.
 */
export function SpeechBubble({
  className,
  tail = "bottom-start",
  size = "default",
  children,
  ...props
}: SpeechBubbleProps) {
  return (
    <div
      data-slot="speech-bubble"
      className={cn(
        "relative border-ink bg-sheet",
        size === "default" ? "rounded-bubble border-3" : "rounded-3xl border-2",
        className,
      )}
      {...props}
    >
      {children}
      {tail === "none" ? null : (
        <BubbleTail
          weight={size === "default" ? 3 : 2}
          className={cn(
            "pointer-events-none absolute top-full",
            size === "default" ? "-mt-(--stroke-panel) h-9 w-12" : "-mt-(--stroke) h-6 w-8",
            tail === "bottom-start"
              ? size === "default"
                ? "start-14"
                : "start-7"
              : size === "default"
                ? "end-14 -scale-x-100"
                : "end-7 -scale-x-100",
          )}
        />
      )}
    </div>
  );
}

function BubbleTail({ className, weight }: { readonly className: string; readonly weight: 2 | 3 }) {
  return (
    <svg viewBox="0 -4 48 40" aria-hidden="true" className={className} overflow="visible">
      <polygon points="1,-4 1,0 16,33 47,0 47,-4" className="fill-sheet" />
      <polyline
        points="1,0 16,33 47,0"
        className="fill-none stroke-ink"
        strokeWidth={weight}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
