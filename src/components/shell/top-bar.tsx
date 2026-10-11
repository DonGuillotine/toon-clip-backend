import { DevOnly, DevToggle } from "@/features/dev-mode/components/dev-mode";

import { AttachmentsTray } from "./attachments-tray";
import { CreditsChip } from "./credits";
import { Logo } from "./logo";
import { NavList } from "./nav-list";
import { ProfileMenu } from "./profile-menu";

/**
 * Desktop navigation: a 72px bar on the page, closed by a 2px rule. The
 * wordmark and the text tabs on the left; the dev switch, the balance and
 * the account on the right.
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-40 hidden h-18 shrink-0 items-center justify-between gap-8 border-b-2 border-rule bg-canvas/95 px-12 backdrop-blur-md lg:flex">
      <div className="flex min-w-0 items-center gap-12">
        <Logo />
        <NavList layout="bar" />
      </div>
      <div className="flex shrink-0 items-center gap-3.5">
        <DevToggle />
        <DevOnly>
          <AttachmentsTray />
        </DevOnly>
        <CreditsChip />
        <DevOnly>
          <ProfileMenu layout="avatar" />
        </DevOnly>
      </div>
    </header>
  );
}
