import { getModels } from "@/features/create/server";

export function GET(): Response {
  return Response.json(getModels());
}
