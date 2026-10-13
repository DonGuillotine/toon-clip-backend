"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import Link from "next/link";

import { EmptyState, LoadError, UnreadableNote } from "@/components/load-state";
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { projectsQuery } from "../queries";
import { type ProjectSummary } from "../schema";
import { PosterArt } from "./project-art";

function ProjectTile({ project }: { readonly project: ProjectSummary }) {
  return (
    <li>
      <Link
        href={`/projects/${encodeURIComponent(project.id)}`}
        className="flex h-full flex-col gap-1 rounded-sm p-1 transition-colors duration-(--duration-press) ease-out-strong hover:bg-card"
      >
        <PosterArt posterUrl={null} label="" sizes="25vw" className="aspect-16/9 rounded-xs" />
        <span className="flex flex-col gap-0.5 px-2 pt-1 pb-2">
          <span className="truncate text-sm font-medium">{project.title}</span>
          <span className="tabular text-xs text-muted-foreground">
            Made{" "}
            {formatDistanceToNowStrict(new Date(project.createdAt * 1000), { addSuffix: true })}
          </span>
        </span>
      </Link>
    </li>
  );
}

/**
 * Projects made on this browser's session, newest first. `limit` shows the
 * latest few with a link to the rest.
 */
export function ProjectsSection({ limit }: { readonly limit?: number }) {
  const projects = useQuery(projectsQuery);
  const all = [...(projects.data?.items ?? [])].sort((a, b) => b.createdAt - a.createdAt);
  const shown = limit === undefined ? all : all.slice(0, limit);
  const more = limit !== undefined && all.length > limit;

  return (
    <Section
      title="Your projects"
      titleId="projects-heading"
      count={projects.data === undefined ? null : projects.data.items.length}
      action={
        more ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/projects">All projects</Link>
          </Button>
        ) : undefined
      }
    >
      {projects.isPending ? (
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((index) => (
            <li key={index}>
              <Skeleton className="aspect-4/3 rounded-sm" />
            </li>
          ))}
        </ul>
      ) : projects.isError ? (
        <LoadError onRetry={() => void projects.refetch()}>Your projects did not load.</LoadError>
      ) : (
        <>
          {shown.length === 0 ? (
            <EmptyState>No projects yet. Pick an example to make your first one.</EmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
              {shown.map((project) => (
                <ProjectTile key={project.id} project={project} />
              ))}
            </ul>
          )}
          <UnreadableNote count={projects.data.unreadable} singular="project" plural="projects" />
        </>
      )}
    </Section>
  );
}
