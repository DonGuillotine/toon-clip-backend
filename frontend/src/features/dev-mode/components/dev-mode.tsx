"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useId } from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { isDevOnlyPath } from "../paths";
import { setDevMode, useDevMode } from "../use-dev-mode";

/** Renders its children only while dev mode is on. */
export function DevOnly({ children }: { readonly children: ReactNode }) {
  return useDevMode() ? children : null;
}

/** Renders its children only while dev mode is off. */
export function LiveOnly({ children }: { readonly children: ReactNode }) {
  return useDevMode() ? null : children;
}

/** Marks a control that runs on fixtures, so nobody mistakes it for live. */
export function DevBadge({ className }: { readonly className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-xs border-2 border-flag px-1 font-label text-2xs tracking-label text-flag",
        className,
      )}
    >
      Dev
    </span>
  );
}

/**
 * The dev mode switch. Off, the app shows only what the API backs. On, the
 * fixture-backed screens and controls come back, each marked "Dev".
 */
export function DevToggle() {
  const on = useDevMode();
  const router = useRouter();
  const id = useId();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex h-9 items-center gap-2 px-3">
          <Switch
            id={id}
            size="sm"
            checked={on}
            onCheckedChange={(next) => {
              setDevMode(next);
              // Read at the click, not during render: the pathname is request
              // data and would keep the shell from prerendering.
              if (!next && isDevOnlyPath(window.location.pathname)) {
                // A full load on purpose: the client router cache still holds
                // home as rendered in dev mode, so a soft push would show the
                // fixture-backed composer again.
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                window.location.assign("/");
              } else {
                router.refresh();
              }
            }}
          />
          <Label htmlFor={id} className="text-sm font-medium text-muted-foreground">
            Dev
          </Label>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        {on ? "Showing screens that run on sample data" : "Show screens that run on sample data"}
      </TooltipContent>
    </Tooltip>
  );
}
