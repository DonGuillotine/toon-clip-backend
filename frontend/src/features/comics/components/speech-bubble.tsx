"use client";

import { type KeyboardEvent, type PointerEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { clampPercent, nudge, type Point } from "../page";
import { BUBBLE_KIND_META } from "../panel-state";
import { type Bubble } from "../schema";

/** A press that travels less than this, in pixels, is a click, not a drag. */
const DRAG_SLOP = 4;

type Drag = {
  readonly pointer: Point;
  readonly origin: Point;
  readonly width: number;
  readonly height: number;
  readonly direction: 1 | -1;
  moved: boolean;
};

/** The look of each bubble kind. Lettering is comic art, so it draws with comic tokens. */
const KIND_CLASS = {
  speech: "rounded-lg border-2 border-comic-ink bg-comic-paper px-3 py-1.5 text-sm",
  thought:
    "rounded-3xl border-2 border-dashed border-comic-ink bg-comic-paper px-3.5 py-2 text-sm italic",
  caption:
    "rounded-xs border-2 border-comic-ink bg-comic-spot/90 px-2 py-1 text-xs font-semibold tracking-wide uppercase",
} satisfies Record<Bubble["kind"], string>;

/**
 * One bubble on a panel. Click selects it, drag moves it, arrow keys nudge
 * it and Delete removes it. The drag position is local until the pointer is
 * released, then it is sent as one edit.
 */
export function SpeechBubble({
  bubble,
  panelNumber,
  selected,
  onSelect,
  onMove,
  onDelete,
}: {
  readonly bubble: Bubble;
  readonly panelNumber: number;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly onMove: (point: Point) => void;
  readonly onDelete: () => void;
}) {
  const drag = useRef<Drag | null>(null);
  const [live, setLive] = useState<Point | null>(null);
  const position = live ?? { x: bubble.x, y: bubble.y };
  const label = BUBBLE_KIND_META[bubble.kind].label;
  const text = bubble.text.trim() === "" ? "Empty bubble" : bubble.text;

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const surface = event.currentTarget.closest("[data-panel-surface]");
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const rtl = getComputedStyle(surface).direction === "rtl";
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointer: { x: event.clientX, y: event.clientY },
      origin: { x: bubble.x, y: bubble.y },
      width: rect.width,
      height: rect.height,
      direction: rtl ? -1 : 1,
      moved: false,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.width === 0 || current.height === 0) return;
    const dx = event.clientX - current.pointer.x;
    const dy = event.clientY - current.pointer.y;
    if (!current.moved && Math.hypot(dx, dy) < DRAG_SLOP) return;
    current.moved = true;
    setLive({
      x: clampPercent(current.origin.x + ((dx * current.direction) / current.width) * 100),
      y: clampPercent(current.origin.y + (dy / current.height) * 100),
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (current?.moved && live) onMove(live);
    setLive(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onDelete();
      return;
    }
    const next = nudge({ x: bubble.x, y: bubble.y }, event.key, event.shiftKey);
    if (next === null) return;
    event.preventDefault();
    onSelect();
    onMove(next);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={selected}
      aria-label={`${label} bubble on panel ${String(panelNumber)}: ${text}. Drag or use arrow keys to move, Delete to remove.`}
      className={cn(
        "absolute z-10 h-auto max-w-1/2 cursor-grab touch-none justify-start text-start whitespace-normal text-comic-ink select-none hover:bg-comic-paper hover:text-comic-ink active:cursor-grabbing",
        KIND_CLASS[bubble.kind],
        bubble.kind === "caption" && "hover:bg-comic-spot/90",
        selected && "outline-2 outline-offset-2 outline-ring",
        live !== null && "opacity-90",
      )}
      style={{
        insetInlineStart: `${String(position.x)}%`,
        insetBlockStart: `${String(position.y)}%`,
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current = null;
        setLive(null);
      }}
      onKeyDown={onKeyDown}
    >
      <span className="line-clamp-4">{text}</span>
    </Button>
  );
}
