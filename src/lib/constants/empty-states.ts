export const EMPTY_FEED_LINES = [
  "No chaos yet. Be the first gremlin.",
  "Crickets. The funny kind.",
  "Quiet on set. Drop a take.",
  "Nothing here. The void wants jokes.",
  "Empty feed. Imagine the possibilities.",
];

export const EMPTY_PROFILE_LINES = [
  "No posts. Just vibes.",
  "Lurker mode: enabled.",
  "Mystery person. Famously offline.",
];

export const EMPTY_ROASTS_LINES = [
  "No roasts yet. Coward energy.",
  "Roast crickets. We can fix that.",
  "Suspiciously unroasted.",
];

export const EMPTY_SAVED_LINES = [
  "Nothing saved. Live in the moment, queen.",
  "No bookmarks. The void thanks you.",
];

export function randomLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)] ?? lines[0];
}
