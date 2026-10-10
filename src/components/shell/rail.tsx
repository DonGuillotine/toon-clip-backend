import { AttachmentsTray } from "./attachments-tray";
import { CreditsCard } from "./credits";
import { Logo } from "./logo";
import { NavList } from "./nav-list";
import { ProfileMenu } from "./profile-menu";
import { ThemeToggle } from "./theme-toggle";

/**
 * Desktop navigation, on L0. It has no edge of its own: the inset panel
 * beside it is one rung lighter, and that step is the separation.
 */
export function Rail() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-3 bg-canvas p-3 lg:flex">
      <div className="px-3 pt-3 pb-2">
        <Logo />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NavList />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-end gap-1 px-1">
          <AttachmentsTray />
          <ThemeToggle />
        </div>
        <CreditsCard />
        <ProfileMenu />
      </div>
    </aside>
  );
}
