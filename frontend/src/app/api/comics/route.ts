import {
  ComicListSchema,
  ComicPageSchema,
  CreateComicRequestSchema,
} from "@/features/comics/schema";

import { createPage, listPages } from "./_lib/store";

export function GET(): Response {
  return Response.json(ComicListSchema.parse(listPages()));
}

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = CreateComicRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Give the page a title and pick a template." }, { status: 400 });
  }
  return Response.json(ComicPageSchema.parse(createPage(parsed.data)), { status: 201 });
}
