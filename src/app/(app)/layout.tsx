import { AppRail } from "@/components/shell/app-rail";
import { MobileBar } from "@/components/shell/mobile-bar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <AppRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar />
        <main id="main" className="flex-1 pb-24">
          {children}
        </main>
      </div>
    </div>
  );
}
