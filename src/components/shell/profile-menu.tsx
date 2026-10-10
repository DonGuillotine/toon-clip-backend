"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, LogOut, MessageCircle, MessageSquareText, Play, User } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { accountQuery } from "@/features/account/queries";

const notYet = (what: string) => () => {
  toast(`${what} is not built yet.`);
};

export function ProfileMenu() {
  const { data } = useQuery(accountQuery);
  const initial = data?.displayName.charAt(0).toUpperCase() ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-12 w-full items-center gap-2.5 rounded-md border-2 border-transparent px-2.5 text-start hover:border-ink hover:bg-sheet aria-expanded:border-ink aria-expanded:bg-sheet">
        <Avatar>
          <AvatarFallback className="bg-spot font-display text-ink">{initial}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col">
          {data ? (
            <>
              <span className="truncate text-sm font-bold">{data.displayName}</span>
              <span className="truncate text-xs text-ink-soft">@{data.handle}</span>
            </>
          ) : (
            <Skeleton className="h-4 w-20" />
          )}
        </span>
        <ChevronsUpDown className="size-4 text-ink-soft" aria-hidden="true" />
        <span className="sr-only">Open account menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width)">
        <DropdownMenuItem onSelect={notYet("Profile")}>
          <User aria-hidden="true" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={notYet("The tour")}>
          <Play aria-hidden="true" /> Replay the tour
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={notYet("Feedback")}>
          <MessageSquareText aria-hidden="true" /> Send feedback
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={notYet("Telegram chat")}>
          <MessageCircle aria-hidden="true" /> Chat on Telegram
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={notYet("Sign out")}>
          <LogOut aria-hidden="true" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
