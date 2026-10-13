"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DevBadge } from "@/features/dev-mode/components/dev-mode";

import { type NavHref } from "./nav-items";

/**
 * The fixture-backed destinations, folded into one menu so the top bar stays
 * one line. Shown only in dev mode, each still marked "Dev".
 */
export function NavMore({
  items,
}: {
  readonly items: readonly { readonly href: NavHref; readonly label: string }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-11 items-center gap-1 border-b-3 border-transparent pt-1 text-base font-semibold whitespace-nowrap text-muted-foreground hover:text-foreground aria-expanded:text-foreground">
        More
        <ChevronDown className="size-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {items.map(({ href, label }) => (
          <DropdownMenuItem key={href} asChild>
            <Link href={href}>
              <span className="flex-1">{label}</span>
              <DevBadge />
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
