import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { NotBuiltYet } from "@/components/not-built-yet";
import { NAV_ITEMS } from "@/components/shell/nav-items";

/** What each roadmap screen will do, from PRODUCT.md. */
const PURPOSE: Record<string, { readonly title: string; readonly purpose: string }> = {
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

/**
 * Every drawer destination served here. Home, Quick create and Storyboards
 * have their own folders, so they are not sections.
 */
const OWN_ROUTES: ReadonlySet<string> = new Set(["/", "/create", "/storyboards"]);

export function generateStaticParams() {
  return NAV_ITEMS.filter((item) => !OWN_ROUTES.has(item.href)).map((item) => ({
    section: item.href.slice(1),
  }));
}

export async function generateMetadata({ params }: PageProps<"/[section]">): Promise<Metadata> {
  const { section } = await params;
  return { title: PURPOSE[section]?.title ?? "Not found" };
}

export default async function SectionPage({ params }: PageProps<"/[section]">) {
  const { section } = await params;
  const page = PURPOSE[section];
  if (!page) notFound();
  return <NotBuiltYet title={page.title} purpose={page.purpose} />;
}
