import { connection } from "next/server";

import { getGallery } from "./_lib/store";

export async function GET(): Promise<Response> {
  await connection();
  return Response.json(getGallery());
}
