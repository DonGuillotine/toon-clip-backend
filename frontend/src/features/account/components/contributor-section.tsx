"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CircleCheck, Clock, type LucideIcon, Plus, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SwitchField } from "@/features/export/components/fields";

import { useSetContributor, useWithdrawRecipe } from "../mutations";
import { recipesQuery } from "../queries";
import { SCOPE_LABELS } from "../recipe-labels";
import { type Recipe, type RecipeStatus } from "../schema";
import { RecipeDialog } from "./recipe-dialog";

const STATUS_META = {
  "in-review": { icon: Clock, label: "In review", variant: "default" },
  live: { icon: CircleCheck, label: "Live", variant: "live" },
  withdrawn: { icon: Undo2, label: "Withdrawn", variant: "default" },
} satisfies Record<RecipeStatus, { icon: LucideIcon; label: string; variant: "default" | "live" }>;

/**
 * Contributor settings (spec 7.4, prompt knowledge base). Opting in lets the
 * creator submit prompts and steps; every recipe is reviewed before Magic
 * Prompt uses it, contributors are credited, and a recipe can be withdrawn.
 */
export function ContributorSection({
  contributor,
  className,
}: {
  readonly contributor: boolean;
  readonly className: string;
}) {
  const setContributor = useSetContributor();
  const recipes = useQuery(recipesQuery);
  const [submitting, setSubmitting] = useState(false);

  return (
    <Section
      title="Contributing to Magic Prompt"
      titleId="profile-contributor"
      count={recipes.data?.length ?? null}
      description="Share the prompting craft behind your best work. You are credited, and you can withdraw a recipe at any time."
      className={className}
      action={
        <Button
          size="sm"
          disabled={!contributor}
          onClick={() => {
            setSubmitting(true);
          }}
        >
          <Plus aria-hidden="true" /> Submit a recipe
        </Button>
      }
      footer="Your raw prompts are never shown to other creators. Magic Prompt uses the rules distilled from them, and each result records which recipe versions it used."
    >
      <div className="flex flex-col gap-1">
        <div className="rounded-sm bg-card">
          <SwitchField
            label="Share my prompting craft"
            hint={
              contributor
                ? "You can submit recipes. Each one is reviewed before it goes live."
                : "Turn this on to submit recipes. Recipes you already shared stay as they are."
            }
            checked={contributor}
            disabled={setContributor.isPending}
            onChange={(next) => {
              setContributor.mutate(
                { contributor: next },
                {
                  onSuccess: () => {
                    toast(next ? "You are a contributor now." : "Contributing is off.");
                  },
                  onError: () => {
                    toast.error("That did not save. The setting is back as it was.");
                  },
                },
              );
            }}
          />
        </div>

        {recipes.isPending ? (
          <div className="flex flex-col gap-1" aria-busy="true">
            <Skeleton className="h-16 rounded-sm" />
            <Skeleton className="h-16 rounded-sm" />
          </div>
        ) : recipes.isError ? (
          <div className="flex items-center justify-between gap-2 p-3">
            <p className="text-sm">Your recipes did not load.</p>
            <Button size="sm" variant="secondary" onClick={() => void recipes.refetch()}>
              Try again
            </Button>
          </div>
        ) : recipes.data.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">
            No recipes yet. Submit the prompt and steps behind a finished piece and it goes to
            review.
          </p>
        ) : (
          <ul aria-label="Your recipes" className="flex flex-col gap-1">
            {recipes.data.map((recipe) => (
              <RecipeRow key={recipe.id} recipe={recipe} />
            ))}
          </ul>
        )}
      </div>
      <RecipeDialog open={submitting} onOpenChange={setSubmitting} />
    </Section>
  );
}

function RecipeRow({ recipe }: { readonly recipe: Recipe }) {
  const withdraw = useWithdrawRecipe();
  const meta = STATUS_META[recipe.status];
  const Icon = meta.icon;

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-sm px-3 py-2 hover:bg-card">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {recipe.title}
          <Badge variant={meta.variant}>
            <Icon aria-hidden="true" /> {meta.label}
          </Badge>
        </span>
        <span className="tabular text-xs text-muted-foreground">
          {SCOPE_LABELS[recipe.scope]}, version {recipe.version}, used {recipe.adoptions}{" "}
          {recipe.adoptions === 1 ? "time" : "times"}, submitted{" "}
          {format(parseISO(recipe.submittedAt), "d MMM yyyy")}
          {recipe.linkedWork === null ? null : (
            <>
              {", from "}
              <Link
                href={`/storyboards/${recipe.linkedWork}`}
                className="underline underline-offset-2 hover:text-foreground"
              >
                linked work
              </Link>
            </>
          )}
        </span>
      </div>
      {recipe.status === "withdrawn" ? null : (
        <Button
          size="sm"
          variant="secondary"
          disabled={withdraw.isPending}
          onClick={() => {
            withdraw.mutate(recipe.id, {
              onSuccess: () => {
                toast(`"${recipe.title}" is withdrawn. Magic Prompt no longer uses it.`);
              },
              onError: () => {
                toast.error("The recipe was not withdrawn. Try again.");
              },
            });
          }}
        >
          Withdraw
        </Button>
      )}
    </li>
  );
}
