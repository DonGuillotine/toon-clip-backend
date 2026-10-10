import { type Metadata } from "next";

import { NotBuiltYet } from "@/components/manga/not-built-yet";

export const metadata: Metadata = { title: "Watch" };

export default function Page() {
  return <NotBuiltYet title="Watch" purpose="Play back finished work, start to end." />;
}
