import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** A pill at control height. Status badges pair the tint with a word, never colour alone. */
const badgeVariants = cva(
  "inline-flex h-5.5 w-fit shrink-0 items-center justify-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-secondary text-muted-foreground",
        /** Sits on cover art, where no surface step exists: a frosted chip. */
        overlay: "bg-card/90 text-foreground backdrop-blur-sm",
        spot: "bg-spot text-spot-foreground",
        live: "bg-live/15 text-live-foreground",
        flag: "bg-flag/12 text-flag-foreground",
        destructive: "bg-destructive/10 text-destructive-foreground",
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
