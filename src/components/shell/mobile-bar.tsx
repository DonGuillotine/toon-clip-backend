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
import { CreditsCard, JoinOrCredits } from "./credits";
import { Logo } from "./logo";
import { NavList } from "./nav-list";
import { ProfileMenu } from "./profile-menu";

/** Below `lg`: an L0 top bar with the drawer behind a menu button. */
export function MobileBar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b-2 border-rule bg-canvas/95 px-3 backdrop-blur-md lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 gap-3 border-e-2 border-rule bg-canvas p-3">
          <SheetHeader className="px-3 pt-3 pb-2">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Logo />
            <SheetDescription className="sr-only">Main navigation</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <NavList layout="drawer" />
          </div>
          <div className="flex flex-col gap-2">
            <DevToggle />
            <CreditsCard />
            <DevOnly>
              <ProfileMenu layout="row" />
            </DevOnly>
          </div>
        </SheetContent>
      </Sheet>
      <Logo />
      <div className="ms-auto flex items-center gap-1">
        <DevOnly>
          <AttachmentsTray />
        </DevOnly>
        <JoinOrCredits />
      </div>
    </header>
  );
}
