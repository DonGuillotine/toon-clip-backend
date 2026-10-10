import { getAccount } from "@/features/account/server";

export function GET(): Response {
  return Response.json(getAccount());
}
