import Link from "next/link";

import { cn } from "@/lib/utils";

/** Wordmark: "TOON" in green display caps over a green "CLIP" plate. */
export function Logo({ className }: { readonly className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Toon Clip home"
      className={cn("inline-flex w-fit flex-col self-start font-display text-3xl", className)}
    >
      <span aria-hidden="true" className="text-primary">
        Toon
      </span>
      <span
        aria-hidden="true"
        className="block bg-primary ps-1.5 pe-1 py-0.5 text-2xs leading-none tracking-plate text-primary-foreground"
      >
        Clip
      </span>
    </Link>
  );
}
