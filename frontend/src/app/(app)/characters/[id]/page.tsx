import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { CharacterEditor } from "@/features/characters/components/character-editor";
import { characterQuery } from "@/features/characters/queries";
import { getCharacter } from "@/features/characters/server";
import { deskLibraryQuery } from "@/features/desk/queries";
import { getDeskLibrary } from "@/features/desk/server";
import { getQueryClient } from "@/lib/query/client";

export async function generateMetadata({
  params,
}: PageProps<"/characters/[id]">): Promise<Metadata> {
  const { id } = await params;
  await connection();
  return { title: getCharacter(id)?.name ?? "Character" };
}

export default async function CharacterPage({ params }: PageProps<"/characters/[id]">) {
  const { id } = await params;
  // The sheet can change between requests, so it is read at request time.
  await connection();
  const sheet = getCharacter(id);
  if (sheet === null) notFound();

  // Prefetch on the server from the same source the route handlers read.
  const queryClient = getQueryClient();
  queryClient.setQueryData(characterQuery(id).queryKey, sheet);
  queryClient.setQueryData(deskLibraryQuery.queryKey, getDeskLibrary());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CharacterEditor id={id} />
    </HydrationBoundary>
  );
}
