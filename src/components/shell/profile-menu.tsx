"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, LogOut, MessageCircle, MessageSquareText, Play, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedbackDialog } from "@/features/account/components/feedback-dialog";
import { accountQuery } from "@/features/account/queries";

/** The community chat, opened in a new tab. */
const TELEGRAM_URL = "https://t.me/tooncentral";

export function ProfileMenu() {
  const { data } = useQuery(accountQuery);
  const initial = data?.displayName.charAt(0).toUpperCase() ?? "";
  // The dialog lives outside the menu so closing the menu does not unmount it.
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-12 w-full items-center gap-2 rounded-lg ps-2 pe-3 text-start hover:bg-background aria-expanded:bg-background">
          <Avatar>
            <AvatarFallback className="bg-spot text-sm font-semibold text-spot-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-1 flex-col">
            {data ? (
              <>
                <span className="truncate text-sm font-medium">{data.displayName}</span>
                <span className="truncate text-xs text-muted-foreground">@{data.handle}</span>
              </>
            ) : (
              <Skeleton className="h-4 w-20" />
            )}
          </span>
          <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Open account menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          className="w-(--radix-dropdown-menu-trigger-width)"
        >
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User aria-hidden="true" /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/tour">
              <Play aria-hidden="true" /> Replay tour
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setFeedbackOpen(true);
            }}
          >
            <MessageSquareText aria-hidden="true" /> Send feedback
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden="true" /> Chat on Telegram
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/signed-out">
              <LogOut aria-hidden="true" /> Sign out
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
