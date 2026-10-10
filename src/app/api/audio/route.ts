import { AudioLibrarySchema } from "@/features/audio/schema";

import { getLibrary } from "./_lib/store";

export function GET(): Response {
  return Response.json(AudioLibrarySchema.parse(getLibrary()));
}
