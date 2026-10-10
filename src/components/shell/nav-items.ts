import {
  BookOpen,
  Clapperboard,
  House,
  Images,
  type LucideIcon,
  Music,
  Sparkles,
  SquareKanban,
  Tv,
} from "lucide-react";
import { type Route } from "next";

export type NavItem = {
  readonly href: Route;
  readonly label: string;
  readonly icon: LucideIcon;
  /** Shown but not built yet, per the roadmap in PRODUCT.md. */
  readonly soon?: true;
};

/** The left drawer, in the order the spec lists it (PRODUCT.md, IA). */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/create", label: "Quick create", icon: Sparkles },
  { href: "/storyboards", label: "Storyboards", icon: Clapperboard },
  { href: "/desk", label: "Director's desk", icon: SquareKanban },
  { href: "/watch", label: "Watch", icon: Tv },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/audio", label: "Music and voices", icon: Music },
  { href: "/comics", label: "Comics", icon: BookOpen, soon: true },
];
