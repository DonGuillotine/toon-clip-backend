import { type StoryboardSummary } from "./schema";

/** Case-insensitive match on title, idea and style. Every word must match. */
export function filterStoryboards(
  storyboards: readonly StoryboardSummary[],
  query: string,
): StoryboardSummary[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...storyboards];
  return storyboards.filter((storyboard) => {
    const haystack = `${storyboard.title} ${storyboard.idea} ${storyboard.style}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
