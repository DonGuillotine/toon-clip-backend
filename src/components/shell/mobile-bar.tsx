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

import { CreditsCard, CreditsChip } from "./credits-chip";
import { Logo } from "./logo";
import { NavList } from "./nav-list";
import { ProfileMenu } from "./profile-menu";

/** Below `lg`: a top bar with the drawer behind a menu button. */
export function MobileBar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b-3 border-ink bg-paper px-4 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Open menu">
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 gap-5 bg-paper p-5">
          <SheetHeader className="p-0 pt-2">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Logo />
            <SheetDescription className="sr-only">Main navigation</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <NavList />
          </div>
          <div className="flex flex-col gap-3">
            <CreditsCard />
            <ProfileMenu />
          </div>
        </SheetContent>
      </Sheet>
      <Logo className="text-xl" />
      <div className="ms-auto">
        <CreditsChip />
      </div>
    </header>
  );
}
