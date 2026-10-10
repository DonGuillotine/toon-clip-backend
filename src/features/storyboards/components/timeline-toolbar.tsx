"use client";

import {
  Download,
  Flag,
  Keyboard,
  LayoutDashboard,
  Lock,
  Merge,
  Pause,
  Play,
  Redo2,
  Scissors,
  Undo2,
} from "lucide-react";
import { type ReactNode } from "react";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { SHORTCUTS } from "../shortcuts";

function Tool({
  label,
  keys,
  disabled,
  onClick,
  children,
}: {
  readonly label: string;
  readonly keys: readonly string[];
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          aria-keyshortcuts={keys.length === 0 ? undefined : keys.join("+")}
          disabled={disabled}
          onClick={onClick}
          className="max-lg:size-11"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

export function ShortcutsHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Keyboard shortcuts"
          className="max-lg:size-11"
        >
          <Keyboard aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <p className="px-3 pt-2 pb-1 text-sm font-medium">Keyboard shortcuts</p>
        <ul className="flex flex-col">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.command}
              className="flex items-center justify-between gap-3 rounded-md px-3 py-1.5 text-sm"
            >
              <span>{shortcut.label}</span>
              <span className="flex shrink-0 gap-1 text-muted-foreground">
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export type ToolbarProps = {
  readonly storyboardId: string;
  readonly playing: boolean;
  readonly can: {
    readonly split: boolean;
    readonly merge: boolean;
    readonly flag: boolean;
    readonly lock: boolean;
    readonly undo: boolean;
    readonly redo: boolean;
  };
  readonly undoLabel: string | null;
  readonly redoLabel: string | null;
  readonly onPlay: () => void;
  readonly onSplit: () => void;
  readonly onMerge: () => void;
  readonly onFlag: () => void;
  readonly onLock: () => void;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
};

/** Play, edit and history controls, then the two ways out: the board and export. */
export function TimelineToolbar(props: ToolbarProps) {
  const { can } = props;
  const base = `/storyboards/${encodeURIComponent(props.storyboardId)}`;
  return (
    <Card
      role="toolbar"
      aria-label="Timeline tools"
      className="flex flex-wrap items-center gap-1 p-1"
    >
      <Tool
        label={props.playing ? "Pause" : "Play"}
        keys={["Space"]}
        disabled={false}
        onClick={props.onPlay}
      >
        {props.playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      </Tool>
      <Tool label="Split at playhead" keys={["S"]} disabled={!can.split} onClick={props.onSplit}>
        <Scissors aria-hidden="true" />
      </Tool>
      <Tool label="Merge with next" keys={[]} disabled={!can.merge} onClick={props.onMerge}>
        <Merge aria-hidden="true" />
      </Tool>
      <Tool label="Flag" keys={["F"]} disabled={!can.flag} onClick={props.onFlag}>
        <Flag aria-hidden="true" />
      </Tool>
      <Tool label="Lock" keys={["Shift", "L"]} disabled={!can.lock} onClick={props.onLock}>
        <Lock aria-hidden="true" />
      </Tool>
      <Tool
        label={props.undoLabel === null ? "Undo" : `Undo ${props.undoLabel.toLowerCase()}`}
        keys={["Cmd/Ctrl", "Z"]}
        disabled={!can.undo}
        onClick={props.onUndo}
      >
        <Undo2 aria-hidden="true" />
      </Tool>
      <Tool
        label={props.redoLabel === null ? "Redo" : `Redo ${props.redoLabel.toLowerCase()}`}
        keys={["Cmd/Ctrl", "Shift", "Z"]}
        disabled={!can.redo}
        onClick={props.onRedo}
      >
        <Redo2 aria-hidden="true" />
      </Tool>
      <ShortcutsHelp />
      <div className="ms-auto flex gap-1">
        {/* Plain anchors: the board and export routes are built in another lane,
            so typed routes cannot see them yet. */}
        <Button asChild variant="secondary" className="max-lg:h-11">
          <a href={`${base}/board`} data-board-link="">
            <LayoutDashboard aria-hidden="true" /> Open in Board
          </a>
        </Button>
        <Button asChild className="max-lg:h-11">
          <a href={`${base}/export`}>
            <Download aria-hidden="true" /> Export
          </a>
        </Button>
      </div>
    </Card>
  );
}
