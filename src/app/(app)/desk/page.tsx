import { type Metadata } from "next";

import { NotBuiltYet } from "@/components/manga/not-built-yet";

export const metadata: Metadata = { title: "Director's desk" };

export default function Page() {
  return (
    <NotBuiltYet
      title="Director's desk"
      purpose="Your project at a glance: characters, palettes, styles and what still needs doing."
    />
  );
}
