"use client";

import { type Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavLinkProps = {
  readonly href: Route;
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
        "flex h-11 items-center gap-3 rounded-md border-2 px-3 text-sm font-bold",
        "transition-colors duration-(--duration-fast) ease-out",
        active
          ? "border-ink bg-spot text-ink"
          : "border-transparent text-ink-soft hover:border-ink hover:bg-sheet hover:text-ink",
      )}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {soon ? <Badge variant="quiet">Soon</Badge> : null}
    </Link>
  );
}
