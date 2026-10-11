import { Dock } from "@/components/dock/dock";
import { MobileBar } from "@/components/shell/mobile-bar";
import { TopBar } from "@/components/shell/top-bar";
import { TopUpDialog } from "@/features/account/components/top-up-dialog";
import { BuyCreditsDialog } from "@/features/credits/components/buy-credits-dialog";
import { DevOnly } from "@/features/dev-mode/components/dev-mode";
import { CastDockItem } from "@/features/characters/components/cast-dock-item";
import { QueueDockItem } from "@/features/jobs/components/queue-dock-item";
import { RecentDockItem } from "@/features/storyboards/components/recent-dock-item";

/**
 * The shell: a top bar over the page, both straight on the dotted navy
 * canvas (DESIGN.md §2). The document scrolls; the bar is sticky.
 *
 * Page padding is a property of the shell, not of each page: the frame
 * around the sections is at least the gap between them.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <MobileBar />
      <main id="main" className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 md:gap-10 md:p-12">
          {children}
        </div>
      </main>
      {/* Every "Buy credits" button and short-balance notice opens this one dialog. */}
      <BuyCreditsDialog />
      <DevOnly>
        {/* Fixture-backed: the sample top-up, and the dock of recent work,
            cast and queue. Shown only in dev mode. */}
        <TopUpDialog />
        <Dock>
          <QueueDockItem />
          <RecentDockItem />
          <CastDockItem />
        </Dock>
      </DevOnly>
    </div>
  );
}
