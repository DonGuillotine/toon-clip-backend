import { type Metadata } from "next";

import { NotBuiltYet } from "@/components/manga/not-built-yet";

export const metadata: Metadata = { title: "Music and voices" };

export default function Page() {
  return <NotBuiltYet title="Music and voices" purpose="Generate music cues and voice lines, and keep a library of both." />;
}
