import { type Metadata } from "next";

import { NotBuiltYet } from "@/components/manga/not-built-yet";

export const metadata: Metadata = { title: "Timeline" };

export default function Page() {
  return (
    <NotBuiltYet
      title="Timeline"
      purpose="Flag a shot, regenerate just that shot, compare takes and lock the ones you like."
    />
  );
}
