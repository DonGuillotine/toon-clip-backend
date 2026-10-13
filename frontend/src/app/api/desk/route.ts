import { connection } from "next/server";

import { DeskLibrarySchema } from "@/features/desk/schema";
import { getDeskLibrary } from "@/features/desk/server";

export async function GET(): Promise<Response> {
  await connection();
  return Response.json(DeskLibrarySchema.parse(getDeskLibrary()));
}
