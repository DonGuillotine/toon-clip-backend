"use client";

import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { accountQuery } from "@/features/account/queries";
import { openTopUp } from "@/features/account/top-up-store";
import { formatCredits } from "@/lib/format";

/** Balance with a top-up action. Reads, never computes (AGENTS.md §4). */
export function CreditsCard() {
  const { data, isPending, isError } = useQuery(accountQuery);

  return (
    <div className="flex items-center gap-1 rounded-full bg-background py-1 ps-3.5 pe-1">
      <div className="flex min-w-0 flex-1 items-center gap-2" aria-live="polite">
        <Coins className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        {isPending ? (
          <Skeleton className="h-4 w-20" />
        ) : isError ? (
          <span className="text-sm text-muted-foreground">Unavailable</span>
        ) : (
          <span className="truncate text-sm">
            <span className="tabular font-semibold">{formatCredits(data.credits)}</span>{" "}
            <span className="text-muted-foreground">credits</span>
          </span>
        )}
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          openTopUp();
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
      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-background px-3 text-sm font-medium"
      aria-live="polite"
    >
      <Coins className="size-3.5 text-muted-foreground" aria-hidden="true" />
      {isPending ? (
        <Skeleton className="h-3.5 w-10" />
      ) : isError ? (
        <span className="text-muted-foreground">Unavailable</span>
      ) : (
        <span className="tabular">
          {formatCredits(data.credits)}
          <span className="sr-only"> credits</span>
        </span>
      )}
    </span>
  );
}
