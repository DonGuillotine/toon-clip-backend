import { recentStoryboardsFixture } from "@/features/storyboards/mocks";
import { RecentStoryboardsSchema } from "@/features/storyboards/schema";

export function GET(): Response {
  return Response.json(RecentStoryboardsSchema.parse(recentStoryboardsFixture));
}
