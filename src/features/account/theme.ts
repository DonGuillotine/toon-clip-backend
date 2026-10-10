import { type Theme } from "./schema";

/** The device copy of the theme, read by `public/theme-init.js` before paint. */
export const THEME_STORAGE_KEY = "toonclip-theme";

/** Which theme the document is showing right now. */
export function appliedTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Show a theme and remember it on this device. The account preference is the
 * owner; this mirrors it so the next first paint is already right.
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked. The theme still applies for this visit.
  }
}
