import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { GallerySchema } from "./schema";

export const galleryQuery = queryOptions({
  queryKey: keys.gallery.state(),
  queryFn: ({ signal }) => request("/api/gallery", GallerySchema, { signal }),
});
