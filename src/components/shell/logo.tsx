import Link from "next/link";

import { cn } from "@/lib/utils";

/** Wordmark. Plain type, with one comic mark: "Clip" on a tilted highlighter swipe. */
export function Logo({ className }: { readonly className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Toon Clip home"
      className={cn(
        "inline-flex items-center gap-1 rounded-xs text-lg font-semibold tracking-tight",
        className,
      )}
    >
      <span>Toon</span>
      <span className="relative px-1">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 inset-y-0.5 -rotate-2 rounded-xs bg-spot"
        />
        <span className="relative">Clip</span>
      </span>
    </Link>
  );
}
