import { connection } from "next/server";

import { getWatchLibrary } from "@/features/watch/server";

import { getBoard } from "../storyboards/_lib/store";

/** Finished work that can be played back, newest first. */
export async function GET(): Promise<Response> {
  await connection();
  return Response.json(getWatchLibrary((id) => getBoard(id)));
}
