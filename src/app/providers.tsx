"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type ReactNode } from "react";

import { getQueryClient } from "@/lib/query/client";
import { DEFAULT_STYLE, STYLE_IDS } from "@/lib/styles";

export function Providers({ children }: { readonly children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {/* next-themes writes `data-style` on <html> before paint, so a saved
          style never flashes the default first. */}
      <ThemeProvider
        attribute="data-style"
        themes={[...STYLE_IDS]}
        defaultTheme={DEFAULT_STYLE}
        enableSystem={false}
        disableTransitionOnChange
        storageKey="toonclip-style"
      >
        <NuqsAdapter>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </NuqsAdapter>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
