"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Coins, type LucideIcon, RotateCcw } from "lucide-react";

import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCredits } from "@/lib/format";
import { cn } from "@/lib/utils";

import { totalOf } from "../ledger";
import { ledgerQuery } from "../queries";
import { type LedgerKind } from "../schema";
import { openTopUp } from "../top-up-store";

/** Each movement says which way it went in an icon, a word and a sign, never colour alone. */
const KIND_META = {
  spend: { icon: ArrowUpRight, label: "Spent", sign: "-", tone: "text-foreground" },
  refund: { icon: RotateCcw, label: "Refund", sign: "+", tone: "text-live-foreground" },
  "top-up": { icon: ArrowDownLeft, label: "Top up", sign: "+", tone: "text-live-foreground" },
} satisfies Record<LedgerKind, { icon: LucideIcon; label: string; sign: string; tone: string }>;

/** Balance, a top-up action, and every spend, refund and top-up (spec 7.8). */
export function CreditsSection({
  balance,
  className,
}: {
  readonly balance: number;
  readonly className: string;
}) {
  const ledger = useQuery(ledgerQuery);
  const refunded = ledger.data ? totalOf(ledger.data, "refund") : null;

  return (
    <Section
      title="Credits"
      titleId="profile-credits"
      count={ledger.data?.length ?? null}
      className={className}
      action={
        <Button
          size="sm"
          onClick={() => {
            openTopUp();
          }}
        >
          Top up
        </Button>
      }
      footer="Failed generations are refunded automatically, and the refund shows here."
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-end justify-between gap-2 rounded-sm bg-card p-3">
          <div className="flex flex-col gap-0.5" aria-live="polite">
            <span className="text-xs text-muted-foreground">Balance</span>
            <span className="tabular flex items-center gap-2 text-2xl font-semibold">
              <Coins aria-hidden="true" className="size-5 text-muted-foreground" />
              {formatCredits(balance)}
              <span className="text-sm font-normal text-muted-foreground">credits</span>
            </span>
          </div>
          {refunded === null || refunded === 0 ? null : (
            <span className="tabular text-xs text-muted-foreground">
              {formatCredits(refunded)} credits refunded so far
            </span>
          )}
        </div>

        {ledger.isPending ? (
          <div className="flex flex-col gap-1" aria-busy="true">
            <Skeleton className="h-14 rounded-sm" />
            <Skeleton className="h-14 rounded-sm" />
            <Skeleton className="h-14 rounded-sm" />
          </div>
        ) : ledger.isError ? (
          <div className="flex items-center justify-between gap-2 p-3">
            <p className="text-sm">Your credit history did not load.</p>
            <Button size="sm" variant="secondary" onClick={() => void ledger.refetch()}>
              Try again
            </Button>
          </div>
        ) : ledger.data.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">
            No credit movements yet. Spends, refunds and top-ups show here.
          </p>
        ) : (
          <ul aria-label="Credit history" className="flex max-h-96 flex-col gap-1 overflow-y-auto">
            {ledger.data.map((entry) => {
              const meta = KIND_META[entry.kind];
              const Icon = meta.icon;
              return (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 rounded-sm px-3 py-2 hover:bg-card"
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="truncate">{entry.reason}</span>
                      {entry.kind === "refund" ? <Badge variant="live">Refund</Badge> : null}
                    </span>
                    <time dateTime={entry.at} className="text-xs text-muted-foreground">
                      {format(parseISO(entry.at), "d MMM yyyy, HH:mm")}
                    </time>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className={cn("tabular text-sm font-medium", meta.tone)}>
                      <span className="sr-only">{meta.label}: </span>
                      {meta.sign}
                      {formatCredits(entry.amount)}
                    </span>
                    <span className="tabular text-xs text-muted-foreground">
                      {formatCredits(entry.balance)} after
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Section>
  );
}
