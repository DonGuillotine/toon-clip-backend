import { mutationOptions, type QueryClient } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { applyBoardAction } from "./actions";
import { boardQuery } from "./queries";
import {
  BoardActionResultSchema,
  type Board,
  type BoardActionRequest,
  type SendShotRequest,
} from "./schema";

type Context = { readonly previous: Board | undefined };

/**
 * Runs a board action. The board updates optimistically with the same pure
 * function the fixture API uses, rolls back on error, and re-reads the board
 * and the job queue once the API answers.
 */
export const boardActionMutation = (queryClient: QueryClient, storyboardId: string) =>
  mutationOptions({
    mutationFn: (input: BoardActionRequest) =>
      request(`/api/boards/${encodeURIComponent(storyboardId)}/actions`, BoardActionResultSchema, {
        method: "POST",
        body: input,
      }),
    onMutate: async (input): Promise<Context> => {
      const key = boardQuery(storyboardId).queryKey;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      if (previous) {
        const { board } = applyBoardAction(
          previous,
          input.action,
          input.nodeIds,
          (index) => `optimistic_${String(index)}`,
        );
        queryClient.setQueryData(key, board);
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardQuery(storyboardId).queryKey, context.previous);
      }
    },
    onSettled: async () => {
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: keys.board.detail(storyboardId) }),
        queryClient.invalidateQueries({ queryKey: keys.jobs.active() }),
        queryClient.invalidateQueries({ queryKey: keys.account.all() }),
      ]);
    },
  });

/** Send a timeline shot to the board. The board re-reads once the API answers. */
export const sendShotMutation = (queryClient: QueryClient, storyboardId: string) =>
  mutationOptions({
    mutationFn: (input: SendShotRequest) =>
      request(`/api/boards/${encodeURIComponent(storyboardId)}/timeline`, BoardActionResultSchema, {
        method: "POST",
        body: input,
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.board.detail(storyboardId) }),
  });
