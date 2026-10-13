import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** A printed tag: Anton caps in a 2px outline. Status badges pair the colour with a word. */
const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-xs border-2 px-2 font-label text-xs tracking-label whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-edge-control text-muted-foreground",
        /** Sits on cover art: a solid ink plate so it reads on any picture. */
        overlay: "border-canvas bg-canvas/90 text-foreground backdrop-blur-sm",
        spot: "border-spot bg-spot text-spot-foreground",
        live: "border-live text-live-foreground",
        flag: "border-flag text-flag",
        destructive: "border-destructive text-destructive-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
