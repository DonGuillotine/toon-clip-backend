import { z } from "zod";

import { API_ORIGIN } from "@/lib/env";

/**
 * A list where each entry is parsed on its own. One entry the app cannot
 * read costs that entry, not the whole list, and the count of unreadable
 * entries is kept so the UI can say so instead of silently dropping them.
 */
export function readableList<Item extends z.ZodType>(item: Item) {
  return z.array(z.unknown()).transform((entries) => {
    const items: z.infer<Item>[] = [];
    let unreadable = 0;
    for (const entry of entries) {
      const parsed = item.safeParse(entry);
      if (parsed.success) items.push(parsed.data);
      else unreadable += 1;
    }
    return { items, unreadable };
  });
}

export type ReadableList<Item> = { readonly items: Item[]; readonly unreadable: number };

/**
 * A media link from the API. The API signs media links and may send them
 * relative to itself (`/v1/media/...`), so they are resolved against the API
 * origin. Anything that is not http(s) is refused.
 */
export const MediaUrlSchema = z
  .string()
  .min(1)
  .transform((value, ctx) => {
    try {
      const url = new URL(value, `${API_ORIGIN}/`);
      if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    } catch {
      // Falls through to the issue below.
    }
    ctx.addIssue({ code: "custom", message: "Not a media link" });
    return z.NEVER;
  });

/** Unix seconds, as the API sends every time. */
export const UnixSecondsSchema = z.number().int().nonnegative();
