"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

/**
 * Puts `data-style="calm"` on <html> while the Calm UI is mounted, so portals
 * (menus, sheets, toasts) that render outside the Calm wrapper pick up its
 * tokens too. On the way out it hands <html> back to the saved token style.
 */
export function CalmStyle() {
  const { theme } = useTheme();
  const saved = useRef(theme);

  useEffect(() => {
    saved.current = theme;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset["style"] = "calm";
    return () => {
      root.dataset["style"] = saved.current ?? "manga";
    };
  }, []);

  return null;
}
