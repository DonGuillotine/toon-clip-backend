import { type Metadata } from "next";

import { ComicsList } from "@/features/comics/components/comics-list";

export const metadata: Metadata = { title: "Comics" };

export default function ComicsPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Comics</h1>
      <ComicsList />
    </>
  );
}
