import { type Metadata } from "next";

import { CalmNotBuiltYet } from "@/calm/not-built-yet";

export const metadata: Metadata = { title: "Storyboards" };

export default function CalmStoryboardsPage() {
  return (
    <CalmNotBuiltYet title="Storyboards" purpose="Every storyboard you have made, searchable." />
  );
}
