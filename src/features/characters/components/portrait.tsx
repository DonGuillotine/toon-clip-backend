import { cn } from "@/lib/utils";

import { type CharacterSummary } from "../schema";

/**
 * Until sheets have turnaround art, a character is their palette in a
 * screentoned roundel: comic art standing in for the character's real face.
 */
export function Portrait({
  character,
  size = "md",
  className,
}: {
  readonly character: CharacterSummary;
  readonly size?: "sm" | "md";
  readonly className?: string;
}) {
  const stops = character.palette
    .map((colour, index, all) => {
      const from = (index / all.length) * 360;
      const to = ((index + 1) / all.length) * 360;
      return `${colour} ${String(from)}deg ${String(to)}deg`;
    })
    .join(", ");

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full",
        size === "md" ? "size-11" : "size-9",
        className,
      )}
      style={{ backgroundImage: `conic-gradient(from 200deg, ${stops})` }}
    >
      <div className="absolute inset-0 tone-dots [--tone-ink:var(--comic-faint)] [--tone-size:4px]" />
      <span
        className={cn(
          "relative grid place-items-center rounded-full bg-card font-semibold",
          size === "md" ? "size-6.5 text-xs" : "size-5 text-[0.625rem]",
        )}
      >
        {character.name.charAt(0)}
      </span>
    </div>
  );
}
