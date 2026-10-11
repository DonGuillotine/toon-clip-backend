"use client";

import { Maximize, Minus, Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import { Button } from "@/components/ui/button";

import { groupDepth, layoutPage, type Rect } from "../layout";
import { type Board } from "../schema";
import {
  INITIAL_VIEWPORT,
  PAN_STEP,
  ZOOM_STEP,
  fitTo,
  panBy,
  revealRect,
  zoomAt,
  type Size,
  type Viewport,
} from "../viewport";
import { BoardMinimap } from "./board-minimap";
import { NodeTile } from "./node-tile";

const GRID = 24;

/**
 * The board canvas. Pan and zoom are one CSS transform on the world layer,
 * so nothing reflows while the creator moves around. Drag or arrow keys
 * pan; Ctrl or Cmd with the wheel, the buttons, or + and - zoom; 0 fits.
 */
export function BoardCanvas({
  board,
  pageId,
  selected,
  onSelect,
  onClear,
}: {
  readonly board: Board;
  readonly pageId: string;
  readonly selected: readonly string[];
  readonly onSelect: (id: string, additive: boolean) => void;
  readonly onClear: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  const [view, setView] = useState<Viewport>(INITIAL_VIEWPORT);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const layout = useMemo(() => layoutPage(board, pageId), [board, pageId]);
  const groups = useMemo(
    () =>
      board.groups
        .filter((group) => group.pageId === pageId)
        .map((group) => ({ group, depth: groupDepth(board.groups, group) }))
        .sort((a, b) => a.depth - b.depth),
    [board.groups, pageId],
  );
  const nodes = board.nodes.filter((node) => node.pageId === pageId);
  const edges = board.edges.filter((edge) => edge.pageId === pageId);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  const fit = useCallback(() => {
    setView(fitTo(layout.bounds, size));
  }, [layout.bounds, size]);

  // Fit once the canvas has a size, and again on every page change.
  const fittedFor = useRef<string | null>(null);
  useEffect(() => {
    if (size.w === 0 || fittedFor.current === pageId) return;
    fittedFor.current = pageId;
    fit();
  }, [fit, pageId, size.w]);

  // Wheel needs a non-passive listener so Ctrl-wheel can stop the browser zoom.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) {
        const box = element.getBoundingClientRect();
        const anchor = { x: event.clientX - box.left, y: event.clientY - box.top };
        setView((current) =>
          zoomAt(current, current.zoom * Math.exp(-event.deltaY * 0.01), anchor),
        );
      } else {
        setView((current) => panBy(current, -event.deltaX, -event.deltaY));
      }
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", onWheel);
    };
  }, []);

  const centre = { x: size.w / 2, y: size.h / 2 };
  const zoomBy = (factor: number) => {
    setView((current) => zoomAt(current, current.zoom * factor, centre));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const pan: Record<string, readonly [number, number]> = {
      ArrowLeft: [PAN_STEP, 0],
      ArrowRight: [-PAN_STEP, 0],
      ArrowUp: [0, PAN_STEP],
      ArrowDown: [0, -PAN_STEP],
    };
    const step = pan[event.key];
    if (step) {
      event.preventDefault();
      setView((current) => panBy(current, step[0], step[1]));
    } else if (event.key === "+" || event.key === "=") {
      zoomBy(ZOOM_STEP);
    } else if (event.key === "-") {
      zoomBy(1 / ZOOM_STEP);
    } else if (event.key === "0") {
      fit();
    } else if (event.key === "Escape") {
      onClear();
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, moved: false };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < 3) return;
    drag.current = { x: event.clientX, y: event.clientY, moved: true };
    setView((current) => panBy(current, dx, dy));
  };
  const onPointerUp = () => {
    // A click on empty canvas, not a drag, clears the selection.
    if (drag.current && !drag.current.moved) onClear();
    drag.current = null;
  };

  const reveal = (rect: Rect | undefined) => (event: FocusEvent<HTMLButtonElement>) => {
    if (!rect || !event.currentTarget.matches(":focus-visible")) return;
    setView((current) => revealRect(current, rect, size));
  };

  const selectedSet = new Set(selected);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-md bg-muted">
      {/* role="application": the canvas owns arrow keys, +, - and 0 while focused. */}
      <div
        ref={containerRef}
        role="application"
        aria-roledescription="board canvas"
        aria-label="Board. Arrow keys pan, plus and minus zoom, 0 fits, Escape clears the selection."
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null;
        }}
        className="absolute inset-0 cursor-grab touch-none board-grid select-none active:cursor-grabbing"
        style={{
          backgroundSize: `${String(GRID * view.zoom)}px ${String(GRID * view.zoom)}px`,
          backgroundPosition: `${String(view.x)}px ${String(view.y)}px`,
        }}
      >
        <div
          className="absolute start-0 top-0 origin-top-left"
          style={{
            transform: `translate(${String(view.x)}px, ${String(view.y)}px) scale(${String(view.zoom)})`,
          }}
        >
          {groups.map(({ group }) => {
            const rect = layout.groups.get(group.id);
            if (!rect) return null;
            return (
              // Board drawing, not chrome: a group is a dashed outline the
              // creator draws around tiles, so the no-border rule does not apply.
              <div
                key={group.id}
                role="group"
                aria-label={`Group: ${group.title}`}
                className="absolute start-0 top-0 rounded-2xl outline-2 -outline-offset-2 outline-settled outline-dashed"
                style={{
                  transform: `translate(${String(rect.x)}px, ${String(rect.y)}px)`,
                  width: rect.w,
                  height: rect.h,
                }}
              >
                <span className="block truncate px-4 pt-2 text-xs font-medium text-muted-foreground">
                  {group.title}
                </span>
              </div>
            );
          })}

          <svg
            aria-hidden="true"
            className="absolute start-0 top-0 overflow-visible"
            width="1"
            height="1"
          >
            <defs>
              <marker
                id="board-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L10 5 L0 10 z" className="fill-settled" />
              </marker>
            </defs>
            {edges.map((edge) => {
              const from = layout.groups.get(edge.from);
              const to = layout.groups.get(edge.to);
              if (!from || !to) return null;
              const x1 = from.x + from.w;
              const y1 = from.y + from.h / 2;
              const x2 = to.x;
              const y2 = to.y + to.h / 2;
              const bend = Math.max(40, Math.abs(x2 - x1) / 2);
              return (
                <g key={edge.id}>
                  <path
                    d={`M${String(x1)} ${String(y1)} C${String(x1 + bend)} ${String(y1)}, ${String(x2 - bend)} ${String(y2)}, ${String(x2)} ${String(y2)}`}
                    className="fill-none stroke-settled"
                    strokeWidth={2}
                    markerEnd="url(#board-arrow)"
                  />
                  {edge.label === null ? null : (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 8}
                      textAnchor="middle"
                      className="fill-muted-foreground text-xs"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {nodes.map((node) => {
            const rect = layout.nodes.get(node.id);
            if (!rect) return null;
            return (
              <div
                key={node.id}
                className="absolute start-0 top-0 h-35 w-42"
                style={{ transform: `translate(${String(rect.x)}px, ${String(rect.y)}px)` }}
              >
                <NodeTile
                  node={node}
                  selected={selectedSet.has(node.id)}
                  interactive
                  onSelect={onSelect}
                  onFocus={reveal(rect)}
                />
              </div>
            );
          })}
        </div>

        {nodes.length === 0 ? (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <p className="max-w-xs text-sm text-muted-foreground">
              Nothing on this page yet. Open a generation in the board to start laying out frames.
            </p>
          </div>
        ) : null}
      </div>

      <div className="absolute start-2 bottom-2 flex items-center gap-0.5 rounded-md border-2 border-border bg-card p-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom out"
          onClick={() => {
            zoomBy(1 / ZOOM_STEP);
          }}
        >
          <Minus aria-hidden="true" />
        </Button>
        <span className="tabular w-10 text-center text-xs text-muted-foreground" aria-live="polite">
          {Math.round(view.zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom in"
          onClick={() => {
            zoomBy(ZOOM_STEP);
          }}
        >
          <Plus aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Fit to screen" onClick={fit}>
          <Maximize aria-hidden="true" />
        </Button>
      </div>

      <BoardMinimap
        layout={layout}
        selected={selectedSet}
        view={view}
        size={size}
        onCentre={setView}
      />
    </div>
  );
}
