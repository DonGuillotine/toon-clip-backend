import { type Metadata } from "next";

import { TourStart } from "@/features/catalog/components/tour-start";

export const metadata: Metadata = { title: "Tour" };

/** The tour: a published example, walked through in three steps (spec 7.1). */
export default function TourPage() {
  return <TourStart />;
}
