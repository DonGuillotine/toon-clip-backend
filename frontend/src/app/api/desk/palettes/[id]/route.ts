import { type NextRequest } from "next/server";

import { PaletteDraftSchema } from "@/features/desk/schema";
import { deletePalette, editPalette } from "@/features/desk/server";

import { invalid, respond } from "../../_respond";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/desk/palettes/[id]">) {
  const { id } = await ctx.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = PaletteDraftSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  return respond(editPalette(id, parsed.data));
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/desk/palettes/[id]">) {
  const { id } = await ctx.params;
  return respond(deletePalette(id));
}
