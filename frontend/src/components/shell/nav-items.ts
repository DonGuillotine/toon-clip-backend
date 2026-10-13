import {
  BookOpen,
  Clapperboard,
  Coins,
  Film,
  House,
  Images,
  type LucideIcon,
  Music,
  Sparkles,
  SquareKanban,
  Tv,
} from "lucide-react";

/**
 * Every drawer destination as a literal. Typed routes only validate a dynamic
 * segment (`/[section]`) for a literal href, so `<Link>` checks each of these.
 */
export type NavHref =
  | "/"
  | "/projects"
  | "/credits"
  | "/create"
  | "/storyboards"
  | "/desk"
  | "/watch"
  | "/gallery"
  | "/audio"
  | "/comics";

export type NavItem = {
  readonly href: NavHref;
  readonly label: string;
  readonly icon: LucideIcon;
  /** Runs on fixtures: shown only in dev mode (`src/features/dev-mode`). */
  readonly dev: boolean;
};

/**
 * The left drawer. The live destinations come first; the fixture-backed ones
 * follow in the order the spec lists them (PRODUCT.md, IA).
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Home", icon: House, dev: false },
  { href: "/projects", label: "Projects", icon: Film, dev: false },
  { href: "/credits", label: "Credits", icon: Coins, dev: false },
  { href: "/create", label: "Quick create", icon: Sparkles, dev: true },
  { href: "/storyboards", label: "Storyboards", icon: Clapperboard, dev: true },
  { href: "/desk", label: "Director's desk", icon: SquareKanban, dev: true },
  { href: "/watch", label: "Watch", icon: Tv, dev: true },
  { href: "/gallery", label: "Gallery", icon: Images, dev: true },
  { href: "/audio", label: "Music and voices", icon: Music, dev: true },
  { href: "/comics", label: "Comics", icon: BookOpen, dev: true },
];
