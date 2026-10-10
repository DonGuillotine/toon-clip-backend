import { CreditsCard } from "./credits-chip";
import { Logo } from "./logo";
import { NavList } from "./nav-list";
import { ProfileMenu } from "./profile-menu";

/** Desktop navigation: a full-height rail on the left edge of the page. */
export function AppRail() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-5 border-e-3 border-ink bg-paper p-5 lg:flex">
      <div className="px-2 pt-2">
        <Logo />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NavList />
      </div>
      <div className="flex flex-col gap-3">
        <CreditsCard />
        <ProfileMenu />
      </div>
    </aside>
  );
}
