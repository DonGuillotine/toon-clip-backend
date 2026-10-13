import "server-only";

import { cookies } from "next/headers";

import { DEV_MODE_COOKIE, isDevModeValue } from "./paths";

/** Whether this request has dev mode on. Request data: call it inside `<Suspense>`. */
export async function isDevMode(): Promise<boolean> {
  const store = await cookies();
  return isDevModeValue(store.get(DEV_MODE_COOKIE)?.value);
}
