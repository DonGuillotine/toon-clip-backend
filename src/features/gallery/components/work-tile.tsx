"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { Play } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

import { CoverArt } from "@/components/comic/cover-art";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/format";

import { type GalleryWork } from "../schema";

/**
 * One piece of finished work. The cover opens it in the player; `action`
 * sits beside the title for curation (add to a collection, remove).
 */
export function WorkTile({
  work,
  action,
}: {
  readonly work: GalleryWork;
  readonly action: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-1 rounded-sm p-1 transition-colors duration-(--duration-press) ease-out-strong hover:bg-card">
      <Link
        href={`/watch?item=${encodeURIComponent(work.id)}`}
        className="relative block aspect-8/5 overflow-hidden rounded-xs"
      >
        <CoverArt art={work.cover.art} sfx={work.cover.sfx} className="absolute inset-0" />
        <Badge variant="overlay" className="absolute start-2 top-2">
          {work.kind === "storyboard" ? "Storyboard" : "Quick create"}
        </Badge>
        <Badge variant="overlay" className="tabular absolute end-2 bottom-2">
          <Play aria-hidden="true" /> {formatDuration(work.durationSec)}
        </Badge>
        <span className="sr-only">Watch {work.title}</span>
      </Link>
      <div className="flex items-start gap-1 ps-2 pt-1 pb-1">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
          <span className="truncate text-sm font-medium">{work.title}</span>
          <span className="truncate text-xs text-muted-foreground">
            {work.subtitle} ·{" "}
            {formatDistanceToNowStrict(new Date(work.updatedAt), { addSuffix: true })}
          </span>
        </div>
        {action}
      </div>
    </li>
  );
}
