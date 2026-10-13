"use client";

import { type RefObject, useEffect, useEffectEvent, useState } from "react";

export type VideoClock = {
  readonly seconds: number;
  readonly playing: boolean;
};

/**
 * The playhead of a `<video>`, read every frame while it plays and on every
 * seek, so a timeline drawn from it moves smoothly. `videoKey` changes when
 * the element is replaced (a new take), so the listeners move with it.
 *
 * With `stopAt` set, playback pauses when it gets there and `onStop` runs:
 * that is how one segment plays on its own.
 */
export function useVideoTime(
  videoRef: RefObject<HTMLVideoElement | null>,
  videoKey: string | null,
  stopAt: number | null,
  onStop: () => void,
): VideoClock {
  const [clock, setClock] = useState<VideoClock>({ seconds: 0, playing: false });

  const read = useEffectEvent((video: HTMLVideoElement) => {
    if (stopAt !== null && !video.paused && video.currentTime >= stopAt) {
      video.pause();
      onStop();
    }
    setClock({ seconds: video.currentTime, playing: !video.paused && !video.ended });
  });

  useEffect(() => {
    const video = videoRef.current;
    if (video === null) return;
    let frame = 0;

    const onEvent = () => {
      read(video);
    };
    const loop = () => {
      read(video);
      if (!video.paused && !video.ended) frame = requestAnimationFrame(loop);
    };
    const onPlay = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(loop);
    };

    const events: readonly (keyof HTMLVideoElementEventMap)[] = [
      "seeked",
      "timeupdate",
      "pause",
      "ended",
      "loadedmetadata",
    ];
    for (const name of events) video.addEventListener(name, onEvent);
    video.addEventListener("play", onPlay);
    frame = requestAnimationFrame(onEvent);
    return () => {
      cancelAnimationFrame(frame);
      for (const name of events) video.removeEventListener(name, onEvent);
      video.removeEventListener("play", onPlay);
    };
  }, [videoRef, videoKey]);

  return clock;
}
