const creditFormatter = new Intl.NumberFormat("en");

/** 1240 becomes "1,240". */
export function formatCredits(credits: number): string {
  return creditFormatter.format(credits);
}

/** 42 becomes "0:42", 75 becomes "1:15". */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
