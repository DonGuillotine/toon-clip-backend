import type { Metadata, Viewport } from "next";
import { Anton, Dela_Gothic_One, Public_Sans, Shantell_Sans } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Providers } from "./providers";

import "./globals.css";

/** Interface: a plain, sturdy grotesque for everything you read. */
const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

/** Display and labels: condensed, uppercase. Titles, buttons, tags. */
const anton = Anton({
  variable: "--font-anton",
  weight: "400",
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
  themeColor: "#0a0f1f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${anton.variable} ${shantell.variable} ${dela.variable}`}
    >
      <body className="min-h-dvh">
        <Providers>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
