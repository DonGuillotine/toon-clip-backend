"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Coins,
  MessageCircle,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import { useId, useState } from "react";

import { CoverArt } from "@/components/comic/cover-art";
import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { accountQuery } from "@/features/account/queries";
import { formatCredits } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

import { useComicAction, useGeneratePanel } from "../mutations";
import { BUBBLE_DEFAULTS, isBusy } from "../page";
import { BUBBLE_KIND_META, PANEL_STATE_META } from "../panel-state";
import { panelQuoteQuery } from "../queries";
import {
  BUBBLE_KINDS,
  BUBBLE_TEXT_MAX,
  type Bubble,
  type BubbleKind,
  type ComicPage,
  type Panel,
  PROMPT_MAX,
} from "../schema";

const KIND_ICON = {
  speech: MessageSquare,
  thought: MessageCircle,
  caption: Type,
} satisfies Record<BubbleKind, typeof MessageSquare>;

function isBubbleKind(value: string): value is BubbleKind {
  return BUBBLE_KINDS.some((kind) => kind === value);
}

let bubbleCounter = 0;
/** A client-made id, so the optimistic bubble and the saved one are the same bubble. */
function newBubbleId(): string {
  bubbleCounter += 1;
  return `b_${Date.now().toString(36)}_${String(bubbleCounter)}`;
}

/* ------------------------------------------------------------------------ */
/* Prompt, cost and generation.                                              */
/* ------------------------------------------------------------------------ */

function GenerationBlock({ pageId, panel }: { readonly pageId: string; readonly panel: Panel }) {
  const promptId = useId();
  const action = useComicAction(pageId);
  const generate = useGeneratePanel(pageId);
  const quote = useQuery(panelQuoteQuery(pageId, panel.id));
  const account = useQuery(accountQuery);
  // A draft prompt is local until saved; the panel id keys this block, so it resets per panel.
  const [draft, setDraft] = useState(panel.prompt);

  const busy = isBusy(panel);
  const dirty = draft !== panel.prompt;
  const cost = quote.data?.credits ?? null;
  const balance = account.data?.credits ?? null;
  const short = cost !== null && balance !== null && cost > balance;
  const empty = draft.trim() === "";
  const canGenerate = !busy && !empty && !short && cost !== null && !generate.isPending;
  const hasTake = panel.takes.length > 0;

  const save = () => {
    if (!dirty || busy) return;
    action.mutate({ type: "setPrompt", panelId: panel.id, prompt: draft });
  };

  const run = async () => {
    if (!canGenerate) return;
    if (dirty) {
      const saved = await action
        .mutateAsync({ type: "setPrompt", panelId: panel.id, prompt: draft })
        .then(() => true)
        .catch(() => false);
      if (!saved) return;
    }
    generate.mutate(panel.id);
  };

  const verb =
    panel.state === "failed" ? "Try again" : hasTake ? "Generate another take" : "Generate panel";

  return (
    <div className="flex flex-col gap-3 rounded-sm bg-card p-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor={promptId}>Prompt</Label>
        <Textarea
          id={promptId}
          value={draft}
          maxLength={PROMPT_MAX}
          disabled={busy}
          placeholder="Who is in the panel, what they do, the framing and the light."
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onBlur={save}
        />
        {dirty && !busy ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={save}>
              Save prompt
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(panel.prompt);
              }}
            >
              Revert
            </Button>
          </div>
        ) : null}
      </div>

      <div aria-live="polite" className="flex flex-col gap-2">
        {panel.state === "queued" ? (
          <p className="text-sm text-muted-foreground">Queued. It starts in a moment.</p>
        ) : null}
        {panel.state === "generating" ? (
          <div className="flex items-center gap-3">
            <Progress value={panel.progress} aria-label={`Generating ${String(panel.progress)}%`} />
            <span className="tabular text-xs text-muted-foreground">{panel.progress}%</span>
          </div>
        ) : null}
        {panel.state === "failed" ? (
          <p className="text-sm text-destructive-foreground">{panel.reason}</p>
        ) : null}

        {quote.isPending ? (
          <Skeleton className="h-5 w-40" />
        ) : quote.isError ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm">The cost did not load.</p>
            <Button size="sm" variant="secondary" onClick={() => void quote.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <p className="tabular flex items-center gap-1.5 text-sm">
            <Coins aria-hidden="true" className="size-4 text-muted-foreground" />
            {hasTake ? "A new take" : "This panel"} costs {formatCredits(quote.data.credits)}{" "}
            credits.
            {balance === null ? null : ` You have ${formatCredits(balance)}.`}
          </p>
        )}
        {short ? (
          <p className="text-sm text-destructive-foreground">
            Insufficient credits. Top up to generate this panel.
          </p>
        ) : null}
        {empty && !busy ? (
          <p className="text-xs text-muted-foreground">Describe the panel to generate it.</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={panel.state === "failed" ? "default" : "spot"}
          disabled={!canGenerate}
          onClick={() => void run()}
        >
          {panel.state === "failed" ? (
            <RotateCcw aria-hidden="true" />
          ) : (
            <Sparkles aria-hidden="true" />
          )}
          {verb}
        </Button>
        {hasTake ? (
          <span className="text-xs text-muted-foreground">Older takes are kept.</span>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Take history.                                                             */
/* ------------------------------------------------------------------------ */

function TakeHistory({ pageId, panel }: { readonly pageId: string; readonly panel: Panel }) {
  const action = useComicAction(pageId);
  const hydrated = useHydrated();
  const takes = [...panel.takes].reverse();

  if (takes.length === 0) {
    return (
      <p className="p-3 text-sm text-muted-foreground">
        No takes yet. Every generation for this panel is kept here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {takes.map((take) => {
        const selected = take.id === panel.selectedTakeId;
        return (
          <li
            key={take.id}
            className={cn("flex items-center gap-3 rounded-sm p-3", selected && "bg-card")}
          >
            <span className="relative block aspect-8/5 w-20 shrink-0 overflow-hidden rounded-xs">
              <CoverArt art={take.art} sfx={null} className="absolute inset-0" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-medium">
                Take {take.number}
                {selected ? (
                  <Badge>
                    <Check aria-hidden="true" /> Selected
                  </Badge>
                ) : null}
              </span>
              <span className="truncate text-xs text-muted-foreground" title={take.prompt}>
                {take.prompt === "" ? "No prompt recorded" : take.prompt}
              </span>
              <span className="tabular text-xs text-muted-foreground">
                {formatCredits(take.credits)} credits
                {hydrated
                  ? ` · ${formatDistanceToNowStrict(new Date(take.createdAt), { addSuffix: true })}`
                  : null}
              </span>
            </span>
            {selected ? null : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  action.mutate({ type: "selectTake", panelId: panel.id, takeId: take.id });
                }}
              >
                Use this take
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------------ */
/* Bubbles.                                                                  */
/* ------------------------------------------------------------------------ */

function BubbleEditor({
  pageId,
  panelId,
  bubble,
  number,
  selected,
  onSelect,
  onDeleted,
}: {
  readonly pageId: string;
  readonly panelId: string;
  readonly bubble: Bubble;
  readonly number: number;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly onDeleted: () => void;
}) {
  const textId = useId();
  const kindId = useId();
  const action = useComicAction(pageId);
  // Typing is local until the field loses focus, so each keystroke is not a request.
  const [draft, setDraft] = useState(bubble.text);

  const commit = (kind: BubbleKind, text: string) => {
    if (kind === bubble.kind && text === bubble.text) return;
    action.mutate({ type: "editBubble", panelId, bubbleId: bubble.id, kind, text });
  };

  return (
    <li
      className={cn("flex flex-col gap-2 rounded-sm p-3", selected ? "bg-card" : "bg-transparent")}
      onFocusCapture={onSelect}
    >
      <div className="flex items-center justify-between gap-2">
        <span id={kindId} className="text-sm font-medium">
          Bubble {number}
        </span>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Delete bubble ${String(number)}`}
          onClick={() => {
            action.mutate({ type: "deleteBubble", panelId, bubbleId: bubble.id });
            onDeleted();
          }}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      <ToggleGroup
        type="single"
        size="sm"
        spacing={1}
        aria-labelledby={kindId}
        value={bubble.kind}
        onValueChange={(next) => {
          if (isBubbleKind(next)) commit(next, draft);
        }}
        className="flex-wrap"
      >
        {BUBBLE_KINDS.map((kind) => {
          const Icon = KIND_ICON[kind];
          return (
            <ToggleGroupItem
              key={kind}
              value={kind}
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Icon aria-hidden="true" /> {BUBBLE_KIND_META[kind].label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      <Label htmlFor={textId} className="sr-only">
        Bubble {number} text
      </Label>
      <Textarea
        id={textId}
        value={draft}
        maxLength={BUBBLE_TEXT_MAX}
        placeholder={BUBBLE_KIND_META[bubble.kind].placeholder}
        className="min-h-14"
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onBlur={() => {
          commit(bubble.kind, draft);
        }}
      />
      <p className="tabular text-xs text-muted-foreground">
        At {Math.round(bubble.x)}% across, {Math.round(bubble.y)}% down. Drag it on the page, or
        focus it and use the arrow keys.
      </p>
    </li>
  );
}

function BubbleList({
  pageId,
  panel,
  selectedBubbleId,
  onSelectBubble,
}: {
  readonly pageId: string;
  readonly panel: Panel;
  readonly selectedBubbleId: string | null;
  readonly onSelectBubble: (bubbleId: string | null) => void;
}) {
  const action = useComicAction(pageId);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2 p-2">
        {BUBBLE_KINDS.map((kind) => {
          const Icon = KIND_ICON[kind];
          return (
            <Button
              key={kind}
              size="sm"
              variant="secondary"
              onClick={() => {
                const bubbleId = newBubbleId();
                action.mutate({
                  type: "addBubble",
                  panelId: panel.id,
                  bubbleId,
                  kind,
                  text: BUBBLE_DEFAULTS[kind].text,
                });
                onSelectBubble(bubbleId);
              }}
            >
              <Icon aria-hidden="true" /> Add {BUBBLE_KIND_META[kind].label.toLowerCase()}
            </Button>
          );
        })}
      </div>
      {panel.bubbles.length === 0 ? (
        <p className="px-3 pb-3 text-sm text-muted-foreground">
          No bubbles on this panel. Bubbles stay editable text, in the editor and in the PSD.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {panel.bubbles.map((bubble, index) => (
            <BubbleEditor
              key={bubble.id}
              pageId={pageId}
              panelId={panel.id}
              bubble={bubble}
              number={index + 1}
              selected={bubble.id === selectedBubbleId}
              onSelect={() => {
                if (bubble.id !== selectedBubbleId) onSelectBubble(bubble.id);
              }}
              onDeleted={() => {
                if (bubble.id === selectedBubbleId) onSelectBubble(null);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* The inspector.                                                            */
/* ------------------------------------------------------------------------ */

/** Everything about the selected panel: order, prompt, cost, takes and bubbles. */
export function PanelInspector({
  page,
  panel,
  selectedBubbleId,
  onSelectBubble,
}: {
  readonly page: ComicPage;
  readonly panel: Panel;
  readonly selectedBubbleId: string | null;
  readonly onSelectBubble: (bubbleId: string | null) => void;
}) {
  const action = useComicAction(page.id);
  const index = page.panels.findIndex((item) => item.id === panel.id);
  const number = index + 1;
  const meta = PANEL_STATE_META[panel.state];
  const last = page.panels.length - 1;

  const move = (toIndex: number) => {
    action.mutate({ type: "movePanel", panelId: panel.id, toIndex });
  };

  return (
    <div className="flex flex-col gap-4">
      <Section
        title={`Panel ${String(number)} of ${String(page.panels.length)}`}
        titleId="panel-inspector-heading"
        action={
          <Badge variant={meta.badge}>
            <meta.icon aria-hidden="true" />
            {meta.label}
          </Badge>
        }
        footer="Reordering moves the panel and everything on it to another slot of the template."
      >
        <div className="flex flex-col gap-1">
          <GenerationBlock key={panel.id} pageId={page.id} panel={panel} />
          <div className="flex flex-wrap gap-2 p-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={index <= 0}
              onClick={() => {
                move(index - 1);
              }}
            >
              <ArrowUp aria-hidden="true" /> Move earlier
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={index >= last}
              onClick={() => {
                move(index + 1);
              }}
            >
              <ArrowDown aria-hidden="true" /> Move later
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Takes" titleId="panel-takes-heading" count={panel.takes.length}>
        <TakeHistory pageId={page.id} panel={panel} />
      </Section>

      <Section title="Bubbles" titleId="panel-bubbles-heading" count={panel.bubbles.length}>
        <BubbleList
          key={panel.id}
          pageId={page.id}
          panel={panel}
          selectedBubbleId={selectedBubbleId}
          onSelectBubble={onSelectBubble}
        />
      </Section>
    </div>
  );
}
