import type { Metadata, Viewport } from "next";
import {
  Alfa_Slab_One,
  Caveat_Brush,
  Dela_Gothic_One,
  Figtree,
  Shantell_Sans,
  Zen_Kaku_Gothic_New,
} from "next/font/google";

import { StyleToolbar } from "@/components/shell/style-toolbar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Providers } from "./providers";

import "./globals.css";

/** Display: heavy gothic, the face of a manga magazine cover. */
const dela = Dela_Gothic_One({
  variable: "--font-dela",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/** Interface: a Japanese gothic with sturdy Latin, for everything you read and click. */
const zen = Zen_Kaku_Gothic_New({
  variable: "--font-zen",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

/** Lettering: the creator's own words, set like a comic's hand lettering. */
const shantell = Shantell_Sans({
  variable: "--font-shantell",
  subsets: ["latin"],
  display: "swap",
});

/* Mafiki faces. Loaded alongside the manga set while both styles are on trial. */

/** Display: slab lettering, after the hand-painted shop signs of Lagos and Accra. */
const alfa = Alfa_Slab_One({
  variable: "--font-alfa",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/** Interface: a warm, open grotesque. */
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

/** Lettering: a dry brush, for the creator's own words. */
const caveatBrush = Caveat_Brush({
  variable: "--font-caveat-brush",
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
  themeColor: "#f8f8f6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dela.variable} ${zen.variable} ${shantell.variable} ${alfa.variable} ${figtree.variable} ${caveatBrush.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
          <StyleToolbar />
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
