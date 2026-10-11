"use client";

import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { balanceQuery } from "@/features/credits/queries";
import { openBuyCredits } from "@/features/credits/stores";
import { formatCredits } from "@/lib/format";

/** The live balance with a buy action. Reads, never computes (AGENTS.md §4). */
export function CreditsCard() {
  const { data, isPending, isError } = useQuery(balanceQuery);

  return (
    <div className="flex items-center gap-1 rounded-full bg-background py-1 ps-1 pe-1">
      <Link
        href="/credits"
        className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full ps-2.5 hover:bg-card"
        aria-live="polite"
      >
        <Coins className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        {isPending ? (
          <>
            <Skeleton className="h-4 w-20" />
            <span className="sr-only">Credits</span>
          </>
        ) : isError ? (
          <span className="text-sm text-muted-foreground">Balance unavailable</span>
        ) : (
          <span className="truncate text-sm">
            <span className="tabular font-semibold">{formatCredits(data.balance)}</span>{" "}
            <span className="text-muted-foreground">credits</span>
          </span>
        )}
      </Link>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          openBuyCredits();
        }}
      >
        Buy
      </Button>
    </div>
  );
}

export function CreditsChip() {
  const { data, isPending, isError } = useQuery(balanceQuery);

  return (
    <Link
      href="/credits"
      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-background px-3 text-sm font-medium hover:bg-card"
      aria-live="polite"
    >
      <Coins className="size-3.5 text-muted-foreground" aria-hidden="true" />
      {isPending ? (
        <>
          <Skeleton className="h-3.5 w-10" />
          <span className="sr-only">Credits</span>
        </>
      ) : isError ? (
        <span className="text-muted-foreground">Unavailable</span>
      ) : (
        <span className="tabular">
          {formatCredits(data.balance)}
          <span className="sr-only"> credits</span>
        </span>
      )}
    </Link>
  );
}
