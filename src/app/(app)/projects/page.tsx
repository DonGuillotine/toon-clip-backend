import { type Metadata } from "next";

import { ProjectsSection } from "@/features/projects/components/projects-section";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Everything made in this browser session.</p>
      </header>
      <ProjectsSection />
    </>
  );
}
