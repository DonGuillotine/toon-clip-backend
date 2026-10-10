"use client";

import { useQuery } from "@tanstack/react-query";

import { Highlight } from "@/components/comic/highlight";

import { accountQuery } from "../queries";

/** The page title. The creator's name gets the page's one highlighter swipe. */
export function Greeting() {
  const { data } = useQuery(accountQuery);

  return (
    <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
      What are we making
      {data ? (
        <>
          , <Highlight>{data.displayName}</Highlight>
        </>
      ) : null}
      ?
    </h1>
  );
}
