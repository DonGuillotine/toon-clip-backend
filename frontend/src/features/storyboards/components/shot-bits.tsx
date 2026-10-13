import { CoverArt } from "@/components/comic/cover-art";
import { cn } from "@/lib/utils";

import { type CoverArt as CoverArtKind, type ShotState } from "../schema";
import { SHOT_STATE_META } from "../shot-state";

/** A shot state as an icon and a word, never colour alone. */
export function ShotStateLabel({
  state,
  className,
}: {
  readonly state: ShotState;
  readonly className?: string;
}) {
  const meta = SHOT_STATE_META[state];
  const Icon = meta.icon;
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs font-medium", meta.tone, className)}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {meta.label}
    </span>
  );
}

/**
 * Placeholder art for a take or frame. Cover art is composed for 320 x 200,
 * so it is drawn at that size and scaled down to a thumbnail.
 */
export function ArtThumb({
  art,
  className,
}: {
  readonly art: CoverArtKind;
  readonly className?: string;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none relative block h-12.5 w-20 shrink-0 overflow-hidden rounded-xs",
        className,
      )}
    >
      <CoverArt
        art={art}
        sfx={null}
        className="absolute start-0 top-0 h-50 w-80 origin-top-left scale-25"
      />
    </span>
  );
}
