import { MobileBar } from "@/components/shell/mobile-bar";
import { Rail } from "@/components/shell/rail";

/**
 * The shell. The rail sits on L0 (the canvas). On desktop the page lives in
 * an inset panel one rung lighter (L1, r32), which is the panel's only edge.
 * The panel is the scroll container, so the rail never moves.
 *
 * Page padding is a property of the shell, not of each page: the frame
 * around the sections is the same width as the gap between them.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <Rail />
      <div className="flex min-w-0 flex-1 flex-col lg:h-dvh lg:py-2 lg:pe-2">
        <MobileBar />
        <main id="main" className="flex-1 bg-background lg:overflow-y-auto lg:rounded-3xl">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:gap-8 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
