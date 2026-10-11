import { type Metadata } from "next";

import { ComicsList } from "@/features/comics/components/comics-list";

export const metadata: Metadata = { title: "Comics" };

export default function ComicsPage() {
  return (
    <>
      <h1 className="font-display text-4xl md:text-5xl">Comics</h1>
      <ComicsList />
    </>
  );
}
