"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/calm/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/calm/sheet";

import { CalmCreditsCard, CalmCreditsChip } from "./credits";
import { CalmLogo } from "./logo";
import { CalmNavList } from "./nav-list";
import { CalmProfileMenu } from "./profile-menu";

/** Below `lg`: a top bar with the drawer behind a menu button. */
export function CalmMobileBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur-md lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 gap-4 bg-paper p-4">
          <SheetHeader className="p-0 pt-1.5">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <CalmLogo />
            <SheetDescription className="sr-only">Main navigation</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <CalmNavList />
          </div>
          <div className="flex flex-col gap-2">
            <CalmCreditsCard />
            <CalmProfileMenu />
          </div>
        </SheetContent>
      </Sheet>
      <CalmLogo />
      <div className="ms-auto">
        <CalmCreditsChip />
      </div>
    </header>
  );
}
