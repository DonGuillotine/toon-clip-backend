import { Film } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * A still for a project or a take: its poster from the API when there is
 * one, otherwise screentone with a film mark, which reads as "stand-in"
 * (DESIGN.md §1) and never as real art.
 */
export function PosterArt({
  posterUrl,
  label,
  sizes,
  className,
}: {
  readonly posterUrl: string | null;
  /** What the still shows, for screen readers. Empty when a caption beside it says so. */
  readonly label: string;
  readonly sizes: string;
  readonly className?: string;
}) {
  if (posterUrl !== null) {
    return (
      <span className={cn("relative block overflow-hidden bg-muted", className)}>
        <Image
          src={posterUrl}
          alt={label}
          fill
          sizes={sizes}
          unoptimized
          className="object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "grid place-items-center bg-pending tone-dots text-muted-foreground [--tone-ink:var(--muted-foreground)] [--tone-size:3px]",
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-full bg-card">
        <Film className="size-4" aria-hidden="true" />
      </span>
      {label === "" ? null : <span className="sr-only">{label}, no still yet</span>}
    </span>
  );
}

/**
 * A take's first frame, from its own video. The API sends no stills, so the
 * browser loads just enough of the file to paint one frame.
 */
export function TakeFrame({
  videoUrl,
  className,
}: {
  readonly videoUrl: string;
  readonly className?: string;
}) {
  return (
    <span className={cn("relative block overflow-hidden bg-foreground", className)}>
      <video
        src={`${videoUrl}#t=0.1`}
        preload="metadata"
        muted
        playsInline
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />
    </span>
  );
}
