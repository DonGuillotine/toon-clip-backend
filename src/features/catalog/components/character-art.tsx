import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * A character's image from the API. When an example has no image, the slot
 * is screentone with the character's initial: screentone means stand-in art
 * (DESIGN.md §1), so it never passes for a real drawing.
 */
export function CharacterArt({
  name,
  imageUrl,
  className,
  sizes,
}: {
  readonly name: string;
  readonly imageUrl: string | null;
  readonly className?: string;
  /** Rendered width hint for the image, as in `<Image sizes>`. */
  readonly sizes: string;
}) {
  if (imageUrl !== null) {
    return (
      <span className={cn("relative block overflow-hidden bg-muted", className)}>
        {/* Signed media links carry their own expiry, so they are not re-optimised. */}
        <Image src={imageUrl} alt={name} fill sizes={sizes} unoptimized className="object-cover" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "grid place-items-center bg-pending tone-dots [--tone-ink:var(--muted-foreground)] [--tone-size:3px]",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-card text-lg font-semibold">
        {name.charAt(0).toUpperCase()}
      </span>
      <span className="sr-only">No image for {name}</span>
    </span>
  );
}
