import type { Metadata, Viewport } from "next";
import { Dela_Gothic_One, Geist, Shantell_Sans } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Providers } from "./providers";

import "./globals.css";

/** Interface: a plain, precise grotesque for everything you read and click. */
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

/** Hand lettering: margin notes only. */
const shantell = Shantell_Sans({
  variable: "--font-shantell",
  subsets: ["latin"],
  display: "swap",
});

/** SFX lettering inside comic art. Never interface text. */
const dela = Dela_Gothic_One({
  variable: "--font-dela",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Toon Clip",
    template: "%s · Toon Clip",
  },
  description: "Turn an idea and a character sheet into animation you can fix shot by shot.",
};

export const viewport: Viewport = {
  themeColor: "#f1f1f3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${shantell.variable} ${dela.variable}`}>
      <body className="min-h-dvh">
        <Providers>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
