"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { type NavHref } from "./nav-items";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavLinkProps = {
  readonly href: NavHref;
  readonly label: string;
  readonly icon: ReactNode;
  readonly soon: boolean;
};

/**
 * The pathname is request data: on a dynamic route with Cache Components it
 * suspends during prerender, so the link prerenders inactive and the active
 * state streams in.
 */
export function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<NavLinkView {...props} active={false} />}>
      <ActiveNavLink {...props} />
    </Suspense>
  );
}

function ActiveNavLink(props: NavLinkProps) {
  const pathname = usePathname();
  return <NavLinkView {...props} active={isActive(pathname, props.href)} />;
}

/**
 * A nav row on the L0 rail. Hover lifts it one rung (L1); the active row
 * lifts two (L2). Never animated: it is clicked a hundred times a day.
 */
function NavLinkView({
  href,
  label,
  icon,
  soon,
  active,
}: NavLinkProps & { readonly active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-full px-3 text-sm font-medium",
        active
          ? "bg-card text-foreground"
          : "text-muted-foreground hover:bg-background hover:text-foreground",
      )}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {soon ? <Badge>Soon</Badge> : null}
    </Link>
  );
}
