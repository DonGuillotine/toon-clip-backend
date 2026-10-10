import { type Metadata } from "next";

import { NotBuiltYet } from "@/components/manga/not-built-yet";

export const metadata: Metadata = { title: "Storyboards" };

export default function Page() {
  return <NotBuiltYet title="Storyboards" purpose="Every storyboard you have made, searchable, with its shots and takes." />;
}
