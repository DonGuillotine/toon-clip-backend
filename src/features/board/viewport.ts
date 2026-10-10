import { type Rect } from "./layout";

/** Screen = world * zoom + offset. */
export type Viewport = { readonly x: number; readonly y: number; readonly zoom: number };
export type Size = { readonly w: number; readonly h: number };
export type Point = { readonly x: number; readonly y: number };

export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 1.2;
export const PAN_STEP = 64;

export const INITIAL_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };

export function clampZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

/** Zooms so the world point under `anchor` (screen space) stays put. */
export function zoomAt(view: Viewport, nextZoom: number, anchor: Point): Viewport {
  const zoom = clampZoom(nextZoom);
  const ratio = zoom / view.zoom;
  return {
    zoom,
    x: anchor.x - (anchor.x - view.x) * ratio,
    y: anchor.y - (anchor.y - view.y) * ratio,
  };
}

export function panBy(view: Viewport, dx: number, dy: number): Viewport {
  return { ...view, x: view.x + dx, y: view.y + dy };
}

/** Fits `bounds` inside `size`, never zooming past 1 so tiles stay crisp. */
export function fitTo(bounds: Rect | null, size: Size, padding = 48): Viewport {
  if (!bounds || size.w <= 0 || size.h <= 0) return INITIAL_VIEWPORT;
  const zoom = clampZoom(
    Math.min(
      1,
      (size.w - 2 * padding) / Math.max(bounds.w, 1),
      (size.h - 2 * padding) / Math.max(bounds.h, 1),
    ),
  );
  return {
    zoom,
    x: (size.w - bounds.w * zoom) / 2 - bounds.x * zoom,
    y: (size.h - bounds.h * zoom) / 2 - bounds.y * zoom,
  };
}

/** The part of the world the viewport shows. */
export function visibleWorld(view: Viewport, size: Size): Rect {
  return {
    x: -view.x / view.zoom,
    y: -view.y / view.zoom,
    w: size.w / view.zoom,
    h: size.h / view.zoom,
  };
}

/** Pans the least needed to bring `rect` fully on screen, for keyboard focus. */
export function revealRect(view: Viewport, rect: Rect, size: Size, margin = 24): Viewport {
  const left = rect.x * view.zoom + view.x;
  const top = rect.y * view.zoom + view.y;
  const right = left + rect.w * view.zoom;
  const bottom = top + rect.h * view.zoom;
  let dx = 0;
  let dy = 0;
  if (left < margin) dx = margin - left;
  else if (right > size.w - margin) dx = size.w - margin - right;
  if (top < margin) dy = margin - top;
  else if (bottom > size.h - margin) dy = size.h - margin - bottom;
  return dx === 0 && dy === 0 ? view : panBy(view, dx, dy);
}

/** Centres the viewport on a world point, for clicks on the minimap. */
export function centreOn(view: Viewport, point: Point, size: Size): Viewport {
  return { ...view, x: size.w / 2 - point.x * view.zoom, y: size.h / 2 - point.y * view.zoom };
}
