"use client";

import { useSyncExternalStore } from "react";

import { DEV_MODE_COOKIE, DEV_MODE_ON, isDevModeValue } from "./paths";

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readCookie(): boolean {
  const entry = document.cookie.split("; ").find((part) => part.startsWith(`${DEV_MODE_COOKIE}=`));
  return isDevModeValue(entry?.slice(DEV_MODE_COOKIE.length + 1));
}

/**
 * Whether dev mode is on. The server render and the hydration pass always
 * say off, so a fixture-backed control appears just after hydration and never
 * on a first paint with dev mode off.
 */
export function useDevMode(): boolean {
  return useSyncExternalStore(subscribe, readCookie, () => false);
}

/** Turns dev mode on or off for this browser, for a year. */
export function setDevMode(on: boolean): void {
  const maxAge = on ? 60 * 60 * 24 * 365 : 0;
  document.cookie = `${DEV_MODE_COOKIE}=${on ? DEV_MODE_ON : ""}; path=/; max-age=${String(maxAge)}; samesite=lax`;
  for (const listener of listeners) listener();
}
