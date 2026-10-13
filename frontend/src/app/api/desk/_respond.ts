import { type LibraryEdit } from "@/features/desk/library";
import { DeskLibrarySchema } from "@/features/desk/schema";

/** Every desk write answers with the whole library, so the client replaces it. */
export function respond(edit: LibraryEdit): Response {
  if (!edit.ok) return Response.json({ error: edit.message }, { status: 409 });
  return Response.json(DeskLibrarySchema.parse(edit.library));
}

export function invalid(issue: string | undefined): Response {
  return Response.json({ error: issue ?? "That is missing something." }, { status: 400 });
}
