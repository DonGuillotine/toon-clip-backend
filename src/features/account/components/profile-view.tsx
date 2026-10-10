"use client";

import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/lib/use-hydrated";

import { accountQuery } from "../queries";
import { AccountDetailsForm } from "./account-details-form";
import { ContributorSection } from "./contributor-section";
import { CreditsSection } from "./credits-section";
import { PlanSection } from "./plan-section";
import { PreferencesSection } from "./preferences-section";

/**
 * The profile (spec 5): account, credits and their history, plan,
 * preferences and contributor settings. The shell reads the account too, so
 * the body waits for hydration before it renders cached data (AGENTS.md §3).
 */
export function ProfileView() {
  const hydrated = useHydrated();
  const account = useQuery(accountQuery);

  if (!hydrated || account.isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-12" aria-busy="true">
        <Skeleton className="h-72 rounded-xl lg:col-span-7" />
        <Skeleton className="h-72 rounded-xl lg:col-span-5" />
        <Skeleton className="h-96 rounded-xl lg:col-span-7" />
        <Skeleton className="h-96 rounded-xl lg:col-span-5" />
      </div>
    );
  }

  if (account.isError) {
    return (
      <Card className="flex flex-col items-start gap-4 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Your profile did not load.</h2>
          <p className="text-sm text-muted-foreground">
            Nothing changed on your account. Check your connection and load it again.
          </p>
        </div>
        <Button onClick={() => void account.refetch()}>Try again</Button>
      </Card>
    );
  }

  const data = account.data;
  return (
    <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-12">
      <AccountDetailsForm account={data} className="lg:col-span-7" />
      <PlanSection account={data} className="lg:col-span-5" />
      <CreditsSection balance={data.credits} className="lg:col-span-7" />
      <PreferencesSection preferences={data.preferences} className="lg:col-span-5" />
      <ContributorSection contributor={data.contributor} className="lg:col-span-12" />
    </div>
  );
}
