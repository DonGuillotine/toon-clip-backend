import { DeskLibrarySchema, PaletteDraftSchema } from "@/features/desk/schema";
import { createPalette } from "@/features/desk/server";

import { invalid } from "../_respond";

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = PaletteDraftSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  return Response.json(DeskLibrarySchema.parse(createPalette(parsed.data)), { status: 201 });
}
