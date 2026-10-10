"use client";

import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { accountQuery } from "@/features/account/queries";
import { formatCredits } from "@/lib/format";

/** Credit balance with a top-up action. Reads, never computes (AGENTS.md §4). */
export function CreditsCard() {
  const { data, isPending, isError } = useQuery(accountQuery);

  return (
    <div className="flex flex-col gap-3 rounded-md border-2 border-ink bg-sheet p-3">
      <div className="flex items-center gap-2" aria-live="polite">
        <Coins className="size-5 shrink-0" aria-hidden="true" />
        {isPending ? (
          <Skeleton className="h-5 w-24" />
        ) : isError ? (
          <span className="text-sm text-ink-soft">Balance unavailable</span>
        ) : (
          <span className="text-sm">
            <span className="tabular font-display text-lg">{formatCredits(data.credits)}</span>{" "}
            <span className="text-ink-soft">credits</span>
          </span>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          toast("Top up is not connected yet.");
        }}
      >
        Top up
      </Button>
    </div>
  );
}

export function CreditsChip() {
  const { data, isPending, isError } = useQuery(accountQuery);

  return (
    <span
      className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-ink bg-sheet px-3 text-sm font-bold"
      aria-live="polite"
    >
      <Coins className="size-4" aria-hidden="true" />
      {isPending ? (
        <Skeleton className="h-4 w-12" />
      ) : isError ? (
        <span className="text-ink-soft">Unavailable</span>
      ) : (
        <span className="tabular">
          {formatCredits(data.credits)}
          <span className="sr-only"> credits</span>
        </span>
      )}
    </span>
  );
}
