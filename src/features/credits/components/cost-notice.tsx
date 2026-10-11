"use client";

import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCredits } from "@/lib/format";
import { cn } from "@/lib/utils";

import { balanceQuery } from "../queries";
import { openBuyCredits } from "../stores";

/**
 * Whether the balance covers `cost`. `null` while the balance is unknown:
 * an unknown balance neither allows nor blocks, the button waits.
 */
export function useCanAfford(cost: number | null): boolean | null {
  const { data } = useQuery(balanceQuery);
  if (data === undefined || cost === null) return null;
  return data.balance >= cost;
}

/**
 * The cost of an action, shown before it (DESIGN.md §8, "Cost"). Both
 * figures come from the API. When the balance is short it says by how much
 * and offers to buy credits.
 */
export function CostNotice({
  cost,
  className,
}: {
  /** `null` while the price is loading. */
  readonly cost: number | null;
  readonly className?: string;
}) {
  const balance = useQuery(balanceQuery);
  const short =
    balance.data === undefined || cost === null ? null : Math.max(0, cost - balance.data.balance);

  return (
    <div className={cn("flex flex-col gap-2", className)} aria-live="polite">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Coins className="size-4 text-muted-foreground" aria-hidden="true" />
          {cost === null ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <span className="tabular">
              {cost === 0 ? "Free" : `${formatCredits(cost)} credits`}
            </span>
          )}
        </span>
        <span className="text-muted-foreground">
          {balance.isPending ? (
            <Skeleton className="inline-block h-3.5 w-20 align-middle" />
          ) : balance.isError ? (
            "Your balance did not load."
          ) : (
            <>
              You have <span className="tabular">{formatCredits(balance.data.balance)}</span>
            </>
          )}
        </span>
      </p>
      {short !== null && short > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-flag/12 py-2 ps-3 pe-2">
          <p className="text-sm text-flag-foreground">
            You need <span className="tabular font-medium">{formatCredits(short)}</span> more
            credits.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              openBuyCredits(cost ?? undefined);
            }}
          >
            Buy credits
          </Button>
        </div>
      ) : null}
    </div>
  );
}
