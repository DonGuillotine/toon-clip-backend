import { type Collection, CollectionSchema } from "./schema";

const daysAgo = (days: number): string => new Date(Date.now() - days * 86_400_000).toISOString();

/**
 * Sample collections. Item ids point at the watch library fixtures
 * (storyboards and quick create results). Only route handlers import this.
 */
export const collectionsFixture: readonly Collection[] = CollectionSchema.array().parse([
  {
    id: "col_showreel",
    name: "Showreel",
    description: "The cuts we send to people.",
    visibility: "public",
    itemIds: ["sb_courtyard", "sb_rooftop"],
    createdAt: daysAgo(12),
    updatedAt: daysAgo(1),
  },
  {
    id: "col_lagos",
    name: "Lagos and Kano",
    description: "City pieces for the Series pitch.",
    visibility: "private",
    itemIds: ["sb_market"],
    createdAt: daysAgo(6),
    updatedAt: daysAgo(3),
  },
  {
    id: "col_drafts",
    name: "Drafts to revisit",
    description: "",
    visibility: "private",
    itemIds: [],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
]);
