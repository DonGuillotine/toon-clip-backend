import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { CALM_SECTIONS } from "@/calm/shell/nav-items";
import { CalmNotBuiltYet } from "@/calm/not-built-yet";

/** What each roadmap screen will do, from PRODUCT.md. */
const PURPOSE: Record<string, { readonly title: string; readonly purpose: string }> = {
  create: {
    title: "Quick create",
    purpose: "One-off images, video, audio, compositions and stitches, with first and last frames.",
  },
  desk: {
    title: "Director's desk",
    purpose: "Your characters, palettes, styles and pending tasks in one place.",
  },
  watch: { title: "Watch", purpose: "Play back finished work." },
  gallery: { title: "Gallery", purpose: "Show and curate your best work in collections." },
  audio: {
    title: "Music and voices",
    purpose: "Generate music and voices, and keep a library of both.",
  },
  comics: { title: "Comics", purpose: "Panel layouts, speech bubbles and page export." },
};

export function generateStaticParams() {
  return CALM_SECTIONS.map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: PageProps<"/calm/[section]">): Promise<Metadata> {
  const { section } = await params;
  return { title: PURPOSE[section]?.title ?? "Not found" };
}

export default async function CalmSectionPage({ params }: PageProps<"/calm/[section]">) {
  const { section } = await params;
  const page = PURPOSE[section];
  if (!page) notFound();
  return <CalmNotBuiltYet title={page.title} purpose={page.purpose} />;
}
