import { LAYOUTS } from "../layouts";
import { type ComicLayout } from "../schema";
import { cn } from "@/lib/utils";

/** A small schematic of a page template: one block per panel slot. */
export function LayoutDiagram({
  layout,
  className,
}: {
  readonly layout: ComicLayout;
  readonly className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("grid aspect-2/3 grid-cols-6 grid-rows-6 gap-0.5 p-0.5", className)}
    >
      {LAYOUTS[layout].slots.map((slot, index) => (
        <span key={index} className={cn("rounded-xs bg-pending", slot)} />
      ))}
    </span>
  );
}
