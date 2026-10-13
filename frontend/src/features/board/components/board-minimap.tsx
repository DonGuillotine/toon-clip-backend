"use client";

import { type PointerEvent } from "react";

import { union, type PageLayout } from "../layout";
import { centreOn, visibleWorld, type Size, type Viewport } from "../viewport";

const MAP_W = 160;
const MAP_H = 100;

/**
 * A small overview of the page and the part on screen. Pointer only: the
 * keyboard pans with the arrow keys, so this is hidden from assistive tech.
 */
export function BoardMinimap({
  layout,
  selected,
  view,
  size,
  onCentre,
}: {
  readonly layout: PageLayout;
  readonly selected: ReadonlySet<string>;
  readonly view: Viewport;
  readonly size: Size;
  readonly onCentre: (view: Viewport) => void;
}) {
  if (!layout.bounds || size.w === 0) return null;
  const visible = visibleWorld(view, size);
  const world = union(layout.bounds, visible);
  const scale = Math.min(MAP_W / world.w, MAP_H / world.h);
  const toMap = (x: number, y: number) => ({ x: (x - world.x) * scale, y: (y - world.y) * scale });

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const point = {
      x: (event.clientX - box.left) / scale + world.x,
      y: (event.clientY - box.top) / scale + world.y,
    };
    onCentre(centreOn(view, point, size));
  };

  const viewTopLeft = toMap(visible.x, visible.y);

  return (
    <div className="absolute end-2 bottom-2 hidden rounded-md bg-card p-1 md:block">
      <svg
        aria-hidden="true"
        width={MAP_W}
        height={MAP_H}
        className="block cursor-pointer rounded-sm bg-muted"
        onPointerDown={onPointerDown}
      >
        {[...layout.groups.values()].map((rect, index) => {
          const at = toMap(rect.x, rect.y);
          return (
            <rect
              key={`g${String(index)}`}
              x={at.x}
              y={at.y}
              width={rect.w * scale}
              height={rect.h * scale}
              rx={2}
              className="fill-secondary"
            />
          );
        })}
        {[...layout.nodes.entries()].map(([id, rect]) => {
          const at = toMap(rect.x, rect.y);
          return (
            <rect
              key={id}
              x={at.x}
              y={at.y}
              width={rect.w * scale}
              height={rect.h * scale}
              rx={1}
              className={selected.has(id) ? "fill-spot" : "fill-settled"}
            />
          );
        })}
        <rect
          x={viewTopLeft.x}
          y={viewTopLeft.y}
          width={visible.w * scale}
          height={visible.h * scale}
          className="fill-none stroke-ring"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}
