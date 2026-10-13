"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, Suspense } from "react";

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
  /** A marker after the label, such as the dev-mode badge. */
  readonly badge: ReactNode;
  /** `bar`: a text tab in the desktop top bar. `drawer`: a row in the mobile sheet. */
  readonly layout: "bar" | "drawer";
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
 * In the top bar, a text tab: the active one is paper white over a green
 * rule. In the drawer, a row. Never animated: it is clicked a hundred times
 * a day.
 */
function NavLinkView({
  href,
  label,
  icon,
  badge,
  layout,
  active,
}: NavLinkProps & { readonly active: boolean }) {
  if (layout === "bar") {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-11 items-center gap-1.5 border-b-3 pt-1 text-base font-semibold whitespace-nowrap",
          active
            ? "border-primary font-bold text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground",
        )}
      >
        {label}
        {badge}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-2.5 rounded-md border-2 px-3 text-base font-semibold",
        active
          ? "border-primary bg-card text-foreground"
          : "border-transparent text-muted-foreground hover:bg-card hover:text-foreground",
      )}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {badge}
    </Link>
  );
}
