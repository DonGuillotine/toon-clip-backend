"use client";

import { type CalmHref } from "./nav-items";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, Suspense } from "react";

import { Badge } from "@/components/ui/calm/badge";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/calm") return pathname === "/calm";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type CalmNavLinkProps = {
  readonly href: CalmHref;
  readonly label: string;
  readonly icon: ReactNode;
  readonly soon: boolean;
};

/** Prerenders inactive; the active state streams in once the path is known. */
export function CalmNavLink(props: CalmNavLinkProps) {
  return (
    <Suspense fallback={<CalmNavLinkView {...props} active={false} />}>
      <ActiveCalmNavLink {...props} />
    </Suspense>
  );
}

function ActiveCalmNavLink(props: CalmNavLinkProps) {
  const pathname = usePathname();
  return <CalmNavLinkView {...props} active={isActive(pathname, props.href)} />;
}

function CalmNavLinkView({
  href,
  label,
  icon,
  soon,
  active,
}: CalmNavLinkProps & { readonly active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium",
        "transition-colors duration-(--duration-fast) ease-out",
        active ? "bg-sheet text-ink shadow-card" : "text-ink-soft hover:bg-tone-1 hover:text-ink",
      )}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {soon ? <Badge>Soon</Badge> : null}
    </Link>
  );
}
