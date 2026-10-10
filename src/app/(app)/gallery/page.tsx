import { type Metadata } from "next";

import { NotBuiltYet } from "@/components/manga/not-built-yet";

export const metadata: Metadata = { title: "Gallery" };

export default function Page() {
  return <NotBuiltYet title="Gallery" purpose="Show and curate the work you are proud of." />;
}
