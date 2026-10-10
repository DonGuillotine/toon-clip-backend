import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Wordmark. Plain type, with one comic mark: "Clip" sits on a tilted
 * highlighter swipe.
 */
export function CalmLogo({ className }: { readonly className?: string }) {
  return (
    <Link
      href="/calm"
      aria-label="Toon Clip home"
      className={cn(
        "inline-flex items-center gap-1 text-lg font-semibold tracking-tight",
        className,
      )}
    >
      <span>Toon</span>
      <span className="relative px-1">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 inset-y-0.5 -rotate-2 rounded-sm bg-spot"
        />
        <span className="relative">Clip</span>
      </span>
    </Link>
  );
}
