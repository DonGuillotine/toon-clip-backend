"use client";

import { useState } from "react";

import { describeProgress } from "../announce";
import { type AudioClip } from "../schema";

/**
 * A polite live region for generation progress. It compares each poll with
 * the last one it saw (stored during render, the React way to track a
 * previous value) and speaks only the meaningful steps.
 */
export function ProgressAnnouncer({ clips }: { readonly clips: readonly AudioClip[] }) {
  const [seen, setSeen] = useState(clips);
  const [message, setMessage] = useState("");

  if (seen !== clips) {
    const messages = describeProgress(seen, clips);
    setSeen(clips);
    if (messages.length > 0) setMessage(messages.join(" "));
  }

  return (
    <p aria-live="polite" role="status" className="sr-only">
      {message}
    </p>
  );
}
