"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { DevOnly, DevToggle } from "@/features/dev-mode/components/dev-mode";

import { AttachmentsTray } from "./attachments-tray";
import { CreditsCard, CreditsChip } from "./credits";
import { Logo } from "./logo";
import { NavList } from "./nav-list";
import { ProfileMenu } from "./profile-menu";
import { ThemeToggle } from "./theme-toggle";

/** Below `lg`: an L0 top bar with the drawer behind a menu button. */
export function MobileBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 bg-canvas/90 px-3 backdrop-blur-md lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 gap-3 bg-canvas p-3">
          <SheetHeader className="px-3 pt-3 pb-2">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Logo />
            <SheetDescription className="sr-only">Main navigation</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <NavList />
          </div>
          <div className="flex flex-col gap-2">
            <DevToggle />
            <CreditsCard />
            <DevOnly>
              <ProfileMenu />
            </DevOnly>
          </div>
        </SheetContent>
      </Sheet>
      <Logo />
      <div className="ms-auto flex items-center gap-1">
        <DevOnly>
          <AttachmentsTray />
          <ThemeToggle />
        </DevOnly>
        <CreditsChip />
      </div>
    </header>
  );
}
