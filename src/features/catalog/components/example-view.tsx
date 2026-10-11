"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useId, useState } from "react";

import { LoadError } from "@/components/load-state";
import { Card, Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { CostNotice, useCanAfford } from "@/features/credits/components/cost-notice";
import { useCreateProject } from "@/features/projects/mutations";
import { apiErrorDetail, newIdempotencyKey } from "@/lib/api/client";
import { cn } from "@/lib/utils";

import { catalogQuery, promptPreviewQuery } from "../queries";
import { characterFor, choiceFields, pickSelection } from "../choices";
import { type Scenario, type Selection } from "../schema";
import { CharacterArt } from "./character-art";

/**
 * One example: pick a choice, read what Magic Prompt does with it, and
 * create the project. The choice lives in the URL (`?choice=`), so a shared
 * link opens the same preview.
 */
export function ExampleView({ scenarioId }: { readonly scenarioId: string }) {
  const catalog = useQuery(catalogQuery);

  if (catalog.isPending) return <ExampleSkeleton />;
  if (catalog.isError) {
    return (
      <Card>
        <LoadError onRetry={() => void catalog.refetch()}>This example did not load.</LoadError>
      </Card>
    );
  }
  const scenario = catalog.data.scenarios.items.find((item) => item.id === scenarioId);
  if (scenario === undefined) notFound();

  return <Example scenario={scenario} createCost={catalog.data.prices.createCredits} />;
}

function ExampleSkeleton() {
  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-12" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-96 rounded-xl lg:col-span-5" />
      <Skeleton className="h-96 rounded-xl lg:col-span-7" />
    </div>
  );
}

function Example({
  scenario,
  createCost,
}: {
  readonly scenario: Scenario;
  readonly createCost: number;
}) {
  const [choice, setChoice] = useQueryState("choice", parseAsString);
  const selection =
    scenario.selections.find((item) => item.id === choice) ?? scenario.selections[0] ?? null;
  const character = characterFor(scenario, selection);

  return (
    <>
      <header className="flex flex-col items-start gap-3">
        <Button asChild variant="ghost" size="sm" className="-ms-3">
          <Link href="/">
            <ArrowLeft aria-hidden="true" /> Examples
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{scenario.title}</h1>
          {scenario.isTour ? <Badge variant="spot">Free tour</Badge> : null}
        </div>
        <p className="max-w-2xl text-muted-foreground">{scenario.description}</p>
      </header>

      <div className="grid items-start gap-4 md:gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-4 md:gap-8 lg:col-span-5">
          {character === null ? null : (
            <Card className="flex flex-col gap-2">
              <CharacterArt
                name={character.name}
                imageUrl={character.imageUrl}
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="aspect-4/3 rounded-md"
              />
              <p className="px-2 pb-1 text-sm font-medium">{character.name}</p>
            </Card>
          )}
          {selection === null ? null : (
            <ChoicePicker
              scenario={scenario}
              selection={selection}
              onChange={(next) => void setChoice(next.id)}
            />
          )}
        </div>

        <div className="flex flex-col gap-4 md:gap-8 lg:col-span-7">
          {selection === null ? null : (
            <>
              <MagicPromptPreview scenarioId={scenario.id} selection={selection} />
              {/* Remounted per selection: one idempotency key per thing being bought. */}
              <CreatePanel
                key={selection.id}
                scenarioId={scenario.id}
                selectionId={selection.id}
                cost={scenario.isTour ? 0 : createCost}
                isTour={scenario.isTour}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * One group per choice field (character, idea, settings...). Picking an
 * option moves to the supported selection that keeps the other picks when it
 * can; only supported combinations exist, so the others follow along.
 */
function ChoicePicker({
  scenario,
  selection,
  onChange,
}: {
  readonly scenario: Scenario;
  readonly selection: Selection;
  readonly onChange: (next: Selection) => void;
}) {
  const baseId = useId();
  const fields = choiceFields(scenario);

  return (
    <Section title="Choose" titleId={`${baseId}-heading`} well={false}>
      <div className="flex flex-col gap-2">
        {fields.map(({ field, label, options }) => {
          const groupId = `${baseId}-${field}`;
          return (
            <div key={field} className="flex flex-col gap-1 rounded-md bg-muted p-1">
              <h3 id={groupId} className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                {label}
              </h3>
              <RadioGroup
                aria-labelledby={groupId}
                value={selection.values[field] ?? ""}
                onValueChange={(optionId) => {
                  const next = pickSelection(scenario, selection, field, optionId);
                  if (next !== null) onChange(next);
                }}
                className="flex flex-col gap-1"
              >
                {options.map((option) => {
                  const id = `${groupId}-${option.id}`;
                  const active = selection.values[field] === option.id;
                  return (
                    <Label
                      key={option.id}
                      htmlFor={id}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 leading-normal font-normal hover:bg-card",
                        active && "bg-card",
                      )}
                    >
                      <RadioGroupItem id={id} value={option.id} />
                      {option.media === undefined ? null : (
                        <CharacterArt
                          name={option.label}
                          imageUrl={option.media.url}
                          sizes="32px"
                          className="size-8 shrink-0 rounded-xs"
                        />
                      )}
                      <span className="text-sm font-medium">{option.label}</span>
                    </Label>
                  );
                })}
              </RadioGroup>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function MagicPromptPreview({
  scenarioId,
  selection,
}: {
  readonly scenarioId: string;
  readonly selection: Selection;
}) {
  const titleId = useId();
  const preview = useQuery(promptPreviewQuery(scenarioId, selection.id));

  return (
    <Section
      title="Magic Prompt"
      titleId={titleId}
      description="The idea as written, and as Magic Prompt directs it. Free to read."
      well={false}
    >
      {preview.isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-20 rounded-md" />
          <Skeleton className="h-32 rounded-md" />
          <Skeleton className="h-24 rounded-md" />
        </div>
      ) : preview.isError ? (
        <div className="rounded-md bg-muted p-1">
          <LoadError onRetry={() => void preview.refetch()}>Magic Prompt did not load.</LoadError>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1 rounded-md bg-muted px-4 py-3">
            <h3 className="text-xs font-medium text-muted-foreground">Original prompt</h3>
            <p className="text-sm">{preview.data.original}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-md bg-muted px-4 py-3">
            <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5" aria-hidden="true" /> Directed by Magic Prompt
            </h3>
            <p className="text-base leading-relaxed">{preview.data.improved}</p>
          </div>
          {preview.data.changes.length === 0 ? null : (
            <div className="flex flex-col gap-1 rounded-md bg-muted p-1">
              <h3 className="px-3 pt-2 text-xs font-medium text-muted-foreground">
                Why each change
              </h3>
              <ol className="flex flex-col gap-1">
                {preview.data.changes.map((change, index) => (
                  <li
                    // Reasons are positional: the preview is saved and never reordered.
                    key={index}
                    className="flex gap-3 rounded-sm bg-card px-3 py-2.5"
                  >
                    <span
                      aria-hidden="true"
                      className="tabular grid size-5 shrink-0 place-items-center rounded-full bg-spot text-xs font-semibold text-spot-foreground"
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 text-sm">{change}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

function CreatePanel({
  scenarioId,
  selectionId,
  cost,
  isTour,
}: {
  readonly scenarioId: string;
  readonly selectionId: string;
  readonly cost: number;
  readonly isTour: boolean;
}) {
  const titleId = useId();
  const router = useRouter();
  const create = useCreateProject();
  const canAfford = useCanAfford(cost);
  // Kept across retries of this one purchase, so a retry is never a second charge.
  const [idempotencyKey] = useState(newIdempotencyKey);

  return (
    <Card aria-labelledby={titleId} className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <h2 id={titleId} className="text-sm font-medium">
          Create the project
        </h2>
        <p className="text-sm text-muted-foreground">
          {isTour
            ? "A free tour project: change takes and revise shots at no cost. Tour projects cannot be exported."
            : "You get every shot with its takes. Revise any shot later without starting over."}
        </p>
      </div>
      <CostNotice cost={cost} />
      {create.isError ? (
        <p role="alert" className="text-sm text-destructive-foreground">
          {apiErrorDetail(create.error) ?? "The project was not created."} Try again: you are only
          charged once.
        </p>
      ) : null}
      <Button
        variant="spot"
        size="lg"
        className="self-start"
        disabled={canAfford !== true || create.isPending || create.isSuccess}
        onClick={() => {
          create.mutate(
            { scenarioId, selectionId, idempotencyKey },
            {
              onSuccess: ({ id }) => {
                router.push(`/projects/${encodeURIComponent(id)}`);
              },
            },
          );
        }}
      >
        {create.isPending || create.isSuccess ? "Creating…" : "Create project"}
      </Button>
    </Card>
  );
}
