import { type Metadata } from "next";
import { Suspense } from "react";

import { ProjectSkeleton, ProjectView } from "@/features/projects/components/project-view";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  return (
    // nuqs reads the search params (`?shot=`), which suspends during prerender.
    <Suspense fallback={<ProjectSkeleton />}>
      <ProjectView projectId={id} />
    </Suspense>
  );
}
