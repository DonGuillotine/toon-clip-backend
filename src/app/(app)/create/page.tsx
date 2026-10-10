import { type Metadata } from "next";

import { NotBuiltYet } from "@/components/manga/not-built-yet";

export const metadata: Metadata = { title: "Quick create" };

export default function Page() {
  return (
    <NotBuiltYet
      title="Quick create"
      purpose="One-off images, video, audio, compositions and stitches, with reference and frame modes."
    />
  );
}
