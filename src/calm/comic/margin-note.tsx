import { cn } from "@/lib/utils";

/**
 * A hand-written note with a drawn arrow, like a comment pencilled into a
 * script's margin. For gentle guidance, never for anything the user must read.
 */
export function MarginNote({
  children,
  className,
}: {
  readonly children: string;
  readonly className?: string;
}) {
  return (
    <p className={cn("flex items-end gap-1 font-letter text-base text-ink-soft", className)}>
      <span>{children}</span>
      <svg
        viewBox="0 0 40 28"
        aria-hidden="true"
        className="mb-1 h-5 w-7 shrink-0 fill-none stroke-ink-mute"
      >
        <path
          d="M2 4 C 14 2, 30 6, 33 22"
          strokeWidth="1.75"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M27 18 L 33 23 L 37 16"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </p>
  );
}
