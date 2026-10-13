"use client";

import { CoverArt } from "@/components/comic/cover-art";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SHOT_STATE_META } from "@/features/storyboards/shot-state";
import { cn } from "@/lib/utils";

import { slotClass } from "../layouts";
import { type Point, selectedTake } from "../page";
import { PANEL_STATE_META } from "../panel-state";
import { type ComicPage, type Panel } from "../schema";
import { SpeechBubble } from "./speech-bubble";

type CanvasHandlers = {
  readonly onSelectPanel: (panelId: string) => void;
  readonly onSelectBubble: (panelId: string, bubbleId: string) => void;
  readonly onMoveBubble: (panelId: string, bubbleId: string, point: Point) => void;
  readonly onDeleteBubble: (panelId: string, bubbleId: string) => void;
};

/** What a panel shows when it has no selected take to draw. */
function PanelPlaceholder({ panel }: { readonly panel: Panel }) {
  const meta = PANEL_STATE_META[panel.state];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center",
        panel.state === "generating"
          ? SHOT_STATE_META.generating.fill
          : "bg-comic-faint tone-dots [--tone-ink:var(--comic-tone)] [--tone-size:6px]",
      )}
    >
      <span className="flex items-center gap-1 rounded-xs bg-comic-paper px-2 py-0.5 text-xs font-medium text-comic-ink">
        <Icon aria-hidden="true" className="size-3.5" />
        {meta.label}
        {panel.state === "generating" ? ` ${String(panel.progress)}%` : null}
      </span>
    </div>
  );
}

function PanelFrame({
  panel,
  index,
  layoutSlot,
  selected,
  selectedBubbleId,
  handlers,
}: {
  readonly panel: Panel;
  readonly index: number;
  readonly layoutSlot: string;
  readonly selected: boolean;
  readonly selectedBubbleId: string | null;
  readonly handlers: CanvasHandlers;
}) {
  const take = selectedTake(panel);
  const meta = PANEL_STATE_META[panel.state];
  const number = index + 1;
  // A panel with a take keeps showing it while a new take generates, with the state on top.
  const showState = panel.state !== "ready";

  return (
    <li
      data-panel-surface=""
      className={cn(
        "relative min-h-0 overflow-hidden rounded-xs bg-comic-paper",
        layoutSlot,
        selected && "outline-3 outline-offset-2 outline-ring",
      )}
    >
      {take ? (
        <CoverArt art={take.art} sfx={null} className="absolute inset-0" />
      ) : (
        <PanelPlaceholder panel={panel} />
      )}

      {/* Selecting a panel sits under the bubbles, so a bubble press never selects the panel. */}
      <Button
        type="button"
        variant="ghost"
        aria-pressed={selected}
        className="absolute inset-0 h-auto rounded-none p-0 hover:bg-comic-ink/5"
        onClick={() => {
          handlers.onSelectPanel(panel.id);
        }}
      >
        <span className="sr-only">
          Panel {number}, {meta.label.toLowerCase()}
          {take ? `, take ${String(take.number)}` : null}
        </span>
      </Button>

      <span className="pointer-events-none absolute end-1.5 bottom-1.5 z-10 flex items-center gap-1">
        {take && showState ? (
          <Badge variant={meta.badge === "live" ? "live" : "overlay"}>
            <meta.icon aria-hidden="true" />
            {meta.label}
            {panel.state === "generating" ? ` ${String(panel.progress)}%` : null}
          </Badge>
        ) : null}
        <Badge variant="overlay" className="tabular">
          {number}
        </Badge>
      </span>

      {panel.bubbles.map((bubble) => (
        <SpeechBubble
          key={bubble.id}
          bubble={bubble}
          panelNumber={number}
          selected={bubble.id === selectedBubbleId}
          onSelect={() => {
            handlers.onSelectBubble(panel.id, bubble.id);
          }}
          onMove={(point) => {
            handlers.onMoveBubble(panel.id, bubble.id, point);
          }}
          onDelete={() => {
            handlers.onDeleteBubble(panel.id, bubble.id);
          }}
        />
      ))}
    </li>
  );
}

/**
 * The page as drawn: the template grid on paper, a panel per slot, bubbles
 * on top. Selection lives in the URL; the handlers write it.
 */
export function PageCanvas({
  page,
  selectedPanelId,
  selectedBubbleId,
  handlers,
}: {
  readonly page: ComicPage;
  readonly selectedPanelId: string | null;
  readonly selectedBubbleId: string | null;
  readonly handlers: CanvasHandlers;
}) {
  const hasArt = page.panels.some((panel) => selectedTake(panel) !== null);
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <ol
        aria-label={`${page.title}, ${String(page.panels.length)} panels`}
        className="grid aspect-2/3 w-full grid-cols-6 grid-rows-6 gap-2 rounded-md bg-comic-paper p-2"
      >
        {page.panels.map((panel, index) => (
          <PanelFrame
            key={panel.id}
            panel={panel}
            index={index}
            layoutSlot={slotClass(page.layout, index)}
            selected={panel.id === selectedPanelId}
            selectedBubbleId={panel.id === selectedPanelId ? selectedBubbleId : null}
            handlers={handlers}
          />
        ))}
      </ol>
      {hasArt ? (
        <p className="pt-2 text-center text-xs text-muted-foreground">
          Sample art: panels draw in screentone until takes carry real images.
        </p>
      ) : null}
    </div>
  );
}
