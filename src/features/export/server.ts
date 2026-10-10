import "server-only";

import { exportsFixture } from "./mocks";
import { type ExportsResponse } from "./schema";

/**
 * The export panel's data, read on the server. The route handler and the
 * page prefetch both call this, so they can never disagree. When the backend
 * lands, this is the one function that changes. `null` is an unknown storyboard.
 */
export function getExports(storyboardId: string): ExportsResponse | null {
  return exportsFixture(storyboardId);
}
