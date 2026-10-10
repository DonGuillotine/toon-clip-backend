"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAttachmentsStore } from "@/features/create/attachments-store";

/** Forget everything this browser cached for the signed-in account. */
export function ClearSession() {
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.clear();
    useAttachmentsStore.getState().clear();
  }, [queryClient]);
  return null;
}
