import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/**
 * False during the server render and the hydration pass, true after.
 *
 * A query's cache is shared: if a component that hydrates earlier (the
 * shell, the dock) has already fetched a query, a later component hydrates
 * with that data even though the server rendered it without. Anything whose
 * first render depends on such shared data waits for this flag.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
