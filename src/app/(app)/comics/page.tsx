import { type Metadata } from "next";

import { NotBuiltYet } from "@/components/manga/not-built-yet";

export const metadata: Metadata = { title: "Comics" };

export default function Page() {
  return (
    <NotBuiltYet
      title="Comics"
      purpose="Panel layouts, speech bubbles and page export. Coming after the animation tools."
    />
  );
}
