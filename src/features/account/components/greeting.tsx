"use client";

import { useQuery } from "@tanstack/react-query";

import { accountQuery } from "../queries";

/** The page heading. Shows the creator's name once the account has loaded. */
export function Greeting() {
  const { data } = useQuery(accountQuery);

  return (
    <h1 className="font-display text-4xl leading-[1.05] text-balance sm:text-5xl">
      What are we making
      {data ? (
        <>
          ,{" "}
          <span className="inline-block -rotate-2 border-3 border-ink bg-spot px-2">
            {data.displayName}
          </span>
        </>
      ) : null}
      ?
    </h1>
  );
}
