"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { applyComicAction, queuePanel } from "./page";
import { comicPageQuery } from "./queries";
import {
  type ComicAction,
  type ComicExport,
  type ComicExportRequest,
  ComicExportSchema,
  type ComicPage,
  ComicPageSchema,
  type CreateComicRequest,
  DeletedComicSchema,
} from "./schema";

type Snapshot = { readonly previous: ComicPage | undefined };

const pagePath = (pageId: string): string => `/api/comics/${encodeURIComponent(pageId)}`;

/** What failed, in words, for the toast. The page is already rolled back. */
function actionNoun(action: ComicAction): string {
  switch (action.type) {
    case "rename":
      return "The new title";
    case "setPrompt":
      return "The prompt";
    case "selectTake":
      return "Choosing that take";
    case "movePanel":
      return "Moving the panel";
    case "addBubble":
      return "The new bubble";
    case "editBubble":
      return "The bubble edit";
    case "moveBubble":
      return "Moving the bubble";
    case "deleteBubble":
      return "Deleting the bubble";
  }
}

function useInvalidateComic(pageId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: keys.comics.detail(pageId) }),
      queryClient.invalidateQueries({ queryKey: keys.comics.list() }),
    ]);
}

/** Start a page from a template. */
export function useCreateComic() {
  const queryClient = useQueryClient();
  return useMutation<ComicPage, Error, CreateComicRequest>({
    mutationFn: (body) => request("/api/comics", ComicPageSchema, { method: "POST", body }),
    onSuccess: (page) => {
      queryClient.setQueryData(comicPageQuery(page.id).queryKey, page);
    },
    onError: () => {
      toast.error("The page was not created. Check your connection and try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.comics.list() }),
  });
}

/** Remove a page and its exports. */
export function useDeleteComic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pageId: string) =>
      request(pagePath(pageId), DeletedComicSchema, { method: "DELETE" }),
    onSuccess: ({ deleted }) => {
      queryClient.removeQueries({ queryKey: keys.comics.detail(deleted) });
      toast("Page deleted.");
    },
    onError: () => {
      toast.error("The page was not deleted. Try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.comics.list() }),
  });
}

/** A free edit (title, prompt, take, panel order, bubbles). Optimistic, rolls back on error. */
export function useComicAction(pageId: string) {
  const queryClient = useQueryClient();
  const { queryKey } = comicPageQuery(pageId);
  const invalidate = useInvalidateComic(pageId);

  return useMutation<ComicPage, Error, ComicAction, Snapshot>({
    mutationFn: (body) =>
      request(`${pagePath(pageId)}/actions`, ComicPageSchema, { method: "POST", body }),
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      if (previous) {
        const result = applyComicAction(previous, action);
        if (result.ok) queryClient.setQueryData(queryKey, result.page);
      }
      return { previous };
    },
    onSuccess: (page) => {
      queryClient.setQueryData(queryKey, page);
    },
    onError: (_error, action, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(`${actionNoun(action)} did not save. The page is back as it was; try again.`);
    },
    onSettled: invalidate,
  });
}

/** Generate a panel: first take, another take, or a retry. Older takes are kept. */
export function useGeneratePanel(pageId: string) {
  const queryClient = useQueryClient();
  const { queryKey } = comicPageQuery(pageId);
  const invalidate = useInvalidateComic(pageId);

  return useMutation<ComicPage, Error, string, Snapshot>({
    mutationFn: (panelId) =>
      request(
        `${pagePath(pageId)}/panels/${encodeURIComponent(panelId)}/generate`,
        ComicPageSchema,
        { method: "POST" },
      ),
    onMutate: async (panelId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      if (previous) {
        const result = queuePanel(previous, panelId, `pending_${panelId}`);
        if (result.ok) queryClient.setQueryData(queryKey, result.page);
      }
      return { previous };
    },
    onSuccess: (page) => {
      queryClient.setQueryData(queryKey, page);
      toast("Panel queued. Older takes are kept.");
    },
    onError: (_error, _panelId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error("The panel did not start generating. No credits were spent; try again.");
    },
    onSettled: invalidate,
  });
}

/** Export the page. The new job shows as preparing at once and rolls back on error. */
export function useStartComicExport(pageId: string) {
  const queryClient = useQueryClient();
  const { queryKey } = comicPageQuery(pageId);
  const invalidate = useInvalidateComic(pageId);

  return useMutation<ComicExport, Error, ComicExportRequest, Snapshot>({
    mutationFn: (body) =>
      request(`${pagePath(pageId)}/exports`, ComicExportSchema, { method: "POST", body }),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      if (previous) {
        const optimistic: ComicExport = {
          id: `pending_${String(Date.now())}`,
          format: body.format,
          summary: body.format === "psd" ? "Layered PSD" : "Flat PNG",
          createdAt: new Date().toISOString(),
          status: "preparing",
        };
        queryClient.setQueryData(queryKey, {
          ...previous,
          exports: [optimistic, ...previous.exports],
        });
      }
      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error("The export did not start. Check your connection and try again.");
    },
    onSettled: invalidate,
  });
}

/** Retry a failed export. It flips to preparing at once and rolls back on error. */
export function useRetryComicExport(pageId: string) {
  const queryClient = useQueryClient();
  const { queryKey } = comicPageQuery(pageId);
  const invalidate = useInvalidateComic(pageId);

  return useMutation<ComicExport, Error, string, Snapshot>({
    mutationFn: (exportId) =>
      request(
        `${pagePath(pageId)}/exports/${encodeURIComponent(exportId)}/retry`,
        ComicExportSchema,
        { method: "POST" },
      ),
    onMutate: async (exportId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      if (previous) {
        queryClient.setQueryData(queryKey, {
          ...previous,
          exports: previous.exports.map((job): ComicExport =>
            job.id === exportId
              ? {
                  id: job.id,
                  format: job.format,
                  summary: job.summary,
                  createdAt: new Date().toISOString(),
                  status: "preparing",
                }
              : job,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _exportId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error("The retry did not start. Check your connection and try again.");
    },
    onSettled: invalidate,
  });
}
