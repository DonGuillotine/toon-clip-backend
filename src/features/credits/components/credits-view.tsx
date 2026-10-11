"use client";

import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Coins, Info, Wallet } from "lucide-react";
import { useId } from "react";

import { EmptyState, LoadError, UnreadableNote } from "@/components/load-state";
import { Card, Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type Prices } from "@/features/catalog/schema";
import { formatCredits } from "@/lib/format";
import { shortAddress } from "@/lib/solana/payment";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

import { balanceQuery, sessionQuery } from "../queries";
import { type HistoryEntry } from "../schema";
import { openBuyCredits, useSessionMemory } from "../stores";

/** The balance, what things cost, the payment wallet, and every change. */
export function CreditsView() {
  const balance = useQuery(balanceQuery);

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Credits</h1>
        <p className="text-muted-foreground">
          Credits pay for projects, revisions and exports. Buy them with test USDC on Solana Devnet.
        </p>
      </header>

      <div className="grid items-start gap-4 md:gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-4 md:gap-8 lg:col-span-5">
          <BalanceCard />
          <SessionCard />
        </div>
        <div className="flex flex-col gap-4 md:gap-8 lg:col-span-7">
          {balance.data === undefined ? (
            balance.isError ? null : (
              <Skeleton className="h-40 rounded-xl" />
            )
          ) : (
            <PriceList prices={balance.data.prices} />
          )}
          <History />
        </div>
      </div>
    </>
  );
}

function BalanceCard() {
  const balance = useQuery(balanceQuery);
  const titleId = useId();

  return (
    <Card aria-labelledby={titleId} className="flex flex-col gap-4 p-4">
      <h2 id={titleId} className="text-sm font-medium">
        Balance
      </h2>
      {balance.isPending ? (
        <Skeleton className="h-10 w-32 rounded-md" />
      ) : balance.isError ? (
        <LoadError onRetry={() => void balance.refetch()}>Your balance did not load.</LoadError>
      ) : (
        <>
          <p className="flex items-baseline gap-2" aria-live="polite">
            <span className="tabular text-4xl font-semibold tracking-tight">
              {formatCredits(balance.data.balance)}
            </span>
            <span className="text-muted-foreground">credits</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="spot"
              onClick={() => {
                openBuyCredits();
              }}
            >
              <Coins aria-hidden="true" /> Buy credits
            </Button>
            <span className="tabular text-sm text-muted-foreground">
              {formatCredits(balance.data.prices.creditPack.credits)} for{" "}
              {balance.data.prices.creditPack.amount} {balance.data.prices.creditPack.token}
            </span>
          </div>
        </>
      )}
    </Card>
  );
}

/**
 * What the session means for the person paying: credits and projects live
 * with this browser's session, and there is no account recovery yet.
 */
function SessionCard() {
  const session = useQuery(sessionQuery);
  const hydrated = useHydrated();
  const expiresAt = session.data?.expiresAt ?? null;
  const memory = useSessionMemory(expiresAt);
  const titleId = useId();

  return (
    <Card aria-labelledby={titleId} className="flex flex-col gap-3 p-4">
      <h2 id={titleId} className="text-sm font-medium">
        This browser
      </h2>
      {!hydrated || session.isPending ? (
        <Skeleton className="h-16 rounded-md" />
      ) : (
        <>
          {memory.pending === null ? null : (
            <div className="flex flex-col items-start gap-2 rounded-md bg-flag/12 p-3 text-sm text-flag-foreground">
              <p>
                A payment of {memory.pending.amount} {memory.pending.token} is waiting to be
                credited.
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  openBuyCredits();
                }}
              >
                Finish payment
              </Button>
            </div>
          )}
          <p className="flex items-center gap-2 text-sm">
            <Wallet className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            {memory.linkedWallet === null ? (
              <span className="text-muted-foreground">
                No wallet verified yet. You verify one when you first buy credits.
              </span>
            ) : (
              <span>
                Paying with{" "}
                <span className="tabular font-medium" title={memory.linkedWallet}>
                  {shortAddress(memory.linkedWallet)}
                </span>
              </span>
            )}
          </p>
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Your credits and projects belong to this browser&apos;s session
              {expiresAt === null
                ? "."
                : `, which ends ${format(new Date(expiresAt * 1000), "d MMM yyyy")} (${formatDistanceToNowStrict(new Date(expiresAt * 1000), { addSuffix: true })}).`}{" "}
              There is no account recovery yet: clearing this browser&apos;s cookies or the session
              ending loses them, so spend credits before then.
            </span>
          </p>
        </>
      )}
    </Card>
  );
}

function PriceList({ prices }: { readonly prices: Prices }) {
  const titleId = useId();
  const rows = [
    { label: "Create a project from an example", credits: prices.createCredits },
    { label: "Revise a shot", credits: prices.revisionCredits },
    { label: "Unlock the MP4 export", credits: prices.exportCredits },
  ];
  return (
    <Section title="What things cost" titleId={titleId}>
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex h-11 items-center justify-between gap-3 rounded-sm bg-card px-3 text-sm"
          >
            <span>{row.label}</span>
            <span className="tabular flex items-center gap-1.5 font-medium">
              <Coins className="size-3.5 text-muted-foreground" aria-hidden="true" />
              {formatCredits(row.credits)}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const REASON_COPY: Readonly<Record<string, string>> = {
  purchase: "Bought credits",
  create: "Created a project",
  revision: "Revised a shot",
  export: "Unlocked an MP4 export",
};

function HistoryRow({ entry }: { readonly entry: HistoryEntry }) {
  const date = new Date(entry.created * 1000);
  return (
    <li className="flex min-h-11 items-center justify-between gap-3 rounded-sm bg-card px-3 py-2 text-sm">
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{REASON_COPY[entry.reason] ?? entry.reason}</span>
        <time dateTime={date.toISOString()} className="text-xs text-muted-foreground">
          {format(date, "d MMM yyyy, HH:mm")}
        </time>
      </span>
      <span
        className={cn(
          "tabular shrink-0 font-medium",
          entry.delta > 0 ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {entry.delta > 0 ? "+" : ""}
        {formatCredits(entry.delta)}
      </span>
    </li>
  );
}

function History() {
  const balance = useQuery(balanceQuery);
  const titleId = useId();
  // Already newest first from the API.
  const items = balance.data?.history.items ?? [];

  return (
    <Section
      title="History"
      titleId={titleId}
      count={balance.data === undefined ? null : balance.data.history.items.length}
    >
      {balance.isPending ? (
        <div className="flex flex-col gap-1" aria-busy="true">
          <Skeleton className="h-11 rounded-sm" />
          <Skeleton className="h-11 rounded-sm" />
        </div>
      ) : balance.isError ? (
        <LoadError onRetry={() => void balance.refetch()}>Your history did not load.</LoadError>
      ) : (
        <>
          {items.length === 0 ? (
            <EmptyState>Every purchase and spend shows up here, newest first.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-1">
              {items.map((entry, index) => (
                // Entries have no id; the list is append-only and newest first.
                <HistoryRow key={`${String(entry.created)}-${String(index)}`} entry={entry} />
              ))}
            </ul>
          )}
          <UnreadableNote
            count={balance.data.history.unreadable}
            singular="entry"
            plural="entries"
          />
        </>
      )}
    </Section>
  );
}
