/**
 * Dev mode shows the parts of Toon Clip that are not backed by the API yet.
 * They run on fixtures, so with dev mode off they are hidden and their routes
 * answer 404. The toggle lives in the shell; the choice is one cookie, read by
 * the proxy (routes), server components (`server.ts`) and client components
 * (`use-dev-mode.ts`).
 */

export const DEV_MODE_COOKIE = "toonclip-dev";
export const DEV_MODE_ON = "1";

/** Every route that still runs on fixtures. Matched by prefix. */
export const DEV_ONLY_PATHS: readonly string[] = [
  "/create",
  "/storyboards",
  "/desk",
  "/watch",
  "/gallery",
  "/audio",
  "/comics",
  "/characters",
  "/profile",
  "/signed-out",
];

/** True when `pathname` is a fixture-backed route. */
export function isDevOnlyPath(pathname: string): boolean {
  return DEV_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** True when the cookie value turns dev mode on. */
export function isDevModeValue(value: string | undefined): boolean {
  return value === DEV_MODE_ON;
}
