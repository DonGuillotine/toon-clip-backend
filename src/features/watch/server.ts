import "server-only";

import { listGenerations } from "@/features/create/mocks";
import { type StoryboardDetail } from "@/features/storyboards/schema";
import { recentStoryboardsFixture } from "@/features/storyboards/mocks";

import { buildWatchLibrary } from "./library";
import { captionsFixture } from "./mocks";
import { type WatchLibrary, WatchLibrarySchema } from "./schema";

/**
 * The watch library, read on the server. The route handler and server
 * prefetches both call this, so they never disagree. `readBoard` is the
 * storyboard store's reader, passed in so takes made in the timeline show
 * up here without this file importing the route-handler store.
 */
export function getWatchLibrary(
  readBoard: (id: string) => StoryboardDetail | undefined,
): WatchLibrary {
  const storyboards: StoryboardDetail[] = [];
  for (const summary of recentStoryboardsFixture) {
    const detail = readBoard(summary.id);
    if (detail) storyboards.push(detail);
  }
  return WatchLibrarySchema.parse(
    buildWatchLibrary(storyboards, listGenerations(), captionsFixture),
  );
}
