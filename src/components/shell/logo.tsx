import Link from "next/link";

import { cn } from "@/lib/utils";

/** Wordmark: "Toon" in ink, "Clip" on a spot-yellow slab, like a cover logo. */
export function Logo({ className }: { readonly className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Toon Clip home"
      className={cn("inline-flex items-center gap-1 font-display text-2xl leading-none", className)}
    >
      <span>Toon</span>
      <span className="-rotate-3 border-2 border-ink bg-spot px-1.5 py-0.5">Clip</span>
    </Link>
  );
}
