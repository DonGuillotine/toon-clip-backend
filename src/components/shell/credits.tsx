"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { balanceQuery, sessionQuery } from "@/features/credits/queries";
import { openBuyCredits, openJoin, useSessionMemory } from "@/features/credits/stores";
import { formatCredits } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";

/** The live balance with a buy action. Reads, never computes (AGENTS.md §4). */
export function CreditsCard() {
  const { data, isPending, isError } = useQuery(balanceQuery);

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/credits"
        className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md border-2 border-primary px-3 font-label text-sm tracking-label text-primary hover:bg-accent"
        aria-live="polite"
      >
        {isPending ? (
          <>
            <Skeleton className="h-4 w-20" />
            <span className="sr-only">Credits</span>
          </>
        ) : isError ? (
          <span className="text-muted-foreground">Balance unavailable</span>
        ) : (
          <span className="tabular truncate">{formatCredits(data.balance)} credits</span>
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

/** The balance as a green outlined tag, as in the top bar. */
export function CreditsChip() {
  const { data, isPending, isError } = useQuery(balanceQuery);

  return (
    <Link
      href="/credits"
      className="inline-flex h-11 items-center rounded-md border-2 border-primary px-3 font-label text-sm tracking-label text-primary hover:bg-accent"
      aria-live="polite"
    >
      {isPending ? (
        <>
          <Skeleton className="h-3.5 w-16" />
          <span className="sr-only">Credits</span>
        </>
      ) : isError ? (
        <span className="text-muted-foreground">Unavailable</span>
      ) : (
        <span className="tabular">{formatCredits(data.balance)} credits</span>
      )}
    </Link>
  );
}

/**
 * Join now for a browser that has not started yet: no wallet linked, no
 * credits, nothing spent. Joining opens the wallet flow, which ends with the
 * first credits. Everyone else sees their balance.
 */
export function JoinOrCredits() {
  const hydrated = useHydrated();
  const session = useQuery(sessionQuery);
  const balance = useQuery(balanceQuery);
  // The linked wallet is remembered in this browser; read it only after hydration.
  const memory = useSessionMemory(session.data?.expiresAt ?? null);
  const started =
    memory.linkedWallet !== null ||
    (balance.data !== undefined &&
      (balance.data.balance > 0 || balance.data.history.items.length > 0));

  if (!hydrated || balance.data === undefined || started) return <CreditsChip />;
  return (
    <Button
      onClick={() => {
        openJoin();
      }}
    >
      Join now
    </Button>
  );
}
