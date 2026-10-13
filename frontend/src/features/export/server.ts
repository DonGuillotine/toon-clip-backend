import "server-only";

import { getAccount } from "@/features/account/server";

import { exportsFixture } from "./mocks";
import { type ExportsResponse } from "./schema";

/**
 * The export panel's data, read on the server. The route handler and the
 * page prefetch both call this, so they can never disagree. When the backend
 * lands, this is the one function that changes. `null` is an unknown storyboard.
 * The watermark follows the account's plan (spec 7.7).
 */
export function getExports(storyboardId: string): ExportsResponse | null {
  const data = exportsFixture(storyboardId);
  if (data === null) return null;
  return getAccount().plan.watermark ? data : { ...data, watermark: null };
}
