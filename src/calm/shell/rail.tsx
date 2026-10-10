import { CalmCreditsCard } from "./credits";
import { CalmLogo } from "./logo";
import { CalmNavList } from "./nav-list";
import { CalmProfileMenu } from "./profile-menu";

/** Desktop navigation: a quiet sidebar, separated by a hairline. */
export function CalmRail() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-4 border-e border-line bg-paper p-4 lg:flex">
      <div className="px-2 pt-1.5 pb-1">
        <CalmLogo />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <CalmNavList />
      </div>
      <div className="flex flex-col gap-2">
        <CalmCreditsCard />
        <CalmProfileMenu />
      </div>
    </aside>
  );
}
