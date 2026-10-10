import { type LucideIcon } from "lucide-react";
import { type Route } from "next";

import { NAV_ITEMS } from "@/components/shell/nav-items";

/**
 * Calm routes as literals: typed routes validate a dynamic segment only for
 * a literal href, so `<Link>` checks each of these at the call site.
 */
export type CalmHref =
  | "/calm"
  | "/calm/create"
  | "/calm/storyboards"
  | "/calm/desk"
  | "/calm/watch"
  | "/calm/gallery"
  | "/calm/audio"
  | "/calm/comics";

const CALM_HREF = new Map<Route, CalmHref>([
  ["/", "/calm"],
  ["/create", "/calm/create"],
  ["/storyboards", "/calm/storyboards"],
  ["/desk", "/calm/desk"],
  ["/watch", "/calm/watch"],
  ["/gallery", "/calm/gallery"],
  ["/audio", "/calm/audio"],
  ["/comics", "/calm/comics"],
]);

export type CalmNavItem = {
  readonly href: CalmHref;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly soon?: true;
};

/** The same drawer as the manga shell, pointed at the Calm routes. */
export const CALM_NAV_ITEMS: readonly CalmNavItem[] = NAV_ITEMS.flatMap((item) => {
  const href = CALM_HREF.get(item.href);
  if (href === undefined) return [];
  const calm: CalmNavItem = { href, label: item.label, icon: item.icon };
  return item.soon ? [{ ...calm, soon: item.soon }] : [calm];
});

/**
 * Section slugs served by `/calm/[section]`. Storyboards has its own folder
 * (it nests the timeline), so it is not one of them.
 */
export const CALM_SECTIONS: readonly string[] = NAV_ITEMS.filter(
  (item) => item.href !== "/" && item.href !== "/storyboards",
).map((item) => item.href.slice(1));
