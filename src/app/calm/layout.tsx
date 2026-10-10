import { CalmStyle } from "@/calm/calm-style";
import { CalmMobileBar } from "@/calm/shell/mobile-bar";
import { CalmRail } from "@/calm/shell/rail";
import { StyleToolbar } from "@/components/shell/style-toolbar";

/**
 * The Calm UI: a quiet product shell with comic touches only where they mean
 * something. `data-style="calm"` on the wrapper scopes its tokens from the
 * first server render; `CalmStyle` extends them to portals once mounted.
 */
export default function CalmLayout({ children }: LayoutProps<"/calm">) {
  return (
    <div data-style="calm" className="flex min-h-dvh bg-paper font-sans text-ink">
      <CalmStyle />
      <CalmRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <CalmMobileBar />
        <main id="main" className="flex-1 pb-24">
          {children}
        </main>
      </div>
      <StyleToolbar inCalm />
    </div>
  );
}
