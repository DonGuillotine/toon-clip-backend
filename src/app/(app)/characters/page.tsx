import { redirect } from "next/navigation";

/** The cast lives on the Director's desk; this address goes there. */
export default function CharactersPage() {
  redirect("/desk");
}
