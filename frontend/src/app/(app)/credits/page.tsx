import { type Metadata } from "next";

import { CreditsView } from "@/features/credits/components/credits-view";

export const metadata: Metadata = { title: "Credits" };

export default function CreditsPage() {
  return <CreditsView />;
}
