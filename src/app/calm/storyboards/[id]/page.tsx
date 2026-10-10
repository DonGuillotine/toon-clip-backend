import { type Metadata } from "next";

import { CalmNotBuiltYet } from "@/calm/not-built-yet";

export const metadata: Metadata = { title: "Timeline" };

export default function CalmTimelinePage() {
  return (
    <CalmNotBuiltYet
      title="Timeline"
      purpose="Flag a shot, regenerate just that shot, compare takes and lock the ones you like."
    />
  );
}
