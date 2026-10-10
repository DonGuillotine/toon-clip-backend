"use client";

import { CoverArt } from "@/components/comic/cover-art";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SHOT_STATE_META } from "@/features/storyboards/shot-state";

import { type MediaNode } from "../schema";

/** Side by side, so two takes can be judged at the same size. */
export function CompareDialog({
  open,
  onOpenChange,
  nodes,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly nodes: readonly MediaNode[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Compare</DialogTitle>
          <DialogDescription>
            {nodes.length} items at the same size. Close to go back to the board.
          </DialogDescription>
        </DialogHeader>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {nodes.map((node) => {
            const meta = SHOT_STATE_META[node.state];
            const Icon = meta.icon;
            return (
              <li key={node.id} className="flex flex-col gap-1 rounded-md bg-muted p-1">
                <div className="aspect-8/5 overflow-hidden rounded-sm">
                  <CoverArt art={node.art} sfx={null} className="size-full" />
                </div>
                <div className="flex items-center justify-between gap-2 px-2 pb-1 text-xs">
                  <span className="truncate font-medium">{node.label}</span>
                  <span className={`inline-flex items-center gap-1 ${meta.tone}`}>
                    <Icon aria-hidden="true" className="size-3" /> {meta.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
