import { type Metadata } from "next";

import { TimelineEditor } from "@/features/storyboards/components/timeline-editor";

export const metadata: Metadata = { title: "Timeline" };

export default async function TimelinePage({ params }: PageProps<"/storyboards/[id]">) {
  const { id } = await params;
  return <TimelineEditor id={id} />;
}
