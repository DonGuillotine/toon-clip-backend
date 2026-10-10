import { GalleryActionResultSchema, GalleryActionSchema } from "@/features/gallery/schema";

import { actOnGallery } from "../_lib/store";

/** Create, rename, share settings, delete, and add or remove work. */
export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = GalleryActionSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "That change is missing something.";
    return Response.json({ error: message }, { status: 400 });
  }
  const outcome = actOnGallery(parsed.data);
  if (!outcome.ok) {
    return Response.json({ error: outcome.message }, { status: outcome.status });
  }
  return Response.json(
    GalleryActionResultSchema.parse({
      collections: outcome.collections,
      collectionId: outcome.collectionId,
    }),
  );
}
