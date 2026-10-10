"use client";

import { type RefObject, useCallback, useEffect, useState } from "react";

import { useHydrated } from "@/lib/use-hydrated";

/**
 * Full screen for one element, with the state kept in step with the browser
 * (Escape leaves full screen without going through us).
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>): {
  readonly active: boolean;
  readonly supported: boolean;
  readonly toggle: () => void;
} {
  const [active, setActive] = useState(false);
  // Read after hydration so the server render and the first client render agree.
  const supported = useHydrated() && document.fullscreenEnabled;

  useEffect(() => {
    const onChange = () => {
      setActive(document.fullscreenElement !== null && document.fullscreenElement === ref.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
    };
  }, [ref]);

  const toggle = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      element.requestFullscreen().catch(() => {
        // Some browsers refuse without a fresh gesture; the button stays usable.
        setActive(false);
      });
    }
  }, [ref]);

  return { active, supported, toggle };
}
