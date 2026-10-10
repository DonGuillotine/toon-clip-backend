import { deskLibraryFixture } from "@/features/desk/mocks";
import { DeskLibrarySchema } from "@/features/desk/schema";

export function GET(): Response {
  return Response.json(DeskLibrarySchema.parse(deskLibraryFixture));
}
