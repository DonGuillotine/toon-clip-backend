import { Highlight } from "@/components/comic/highlight";

/**
 * The page title. A server component: the name comes from the server reader,
 * so the heading is in the first HTML and never changes during hydration.
 * The creator's name gets the page's one highlighter swipe.
 */
export function Greeting({ displayName }: { readonly displayName: string }) {
  return (
    <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
      What are we making, <Highlight>{displayName}</Highlight>?
    </h1>
  );
}
