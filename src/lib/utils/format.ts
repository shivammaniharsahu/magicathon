import { formatDistanceToNowStrict } from "date-fns";

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "just now";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNowStrict(d, { addSuffix: false })
    .replace("seconds", "s")
    .replace("second", "s")
    .replace("minutes", "m")
    .replace("minute", "m")
    .replace("hours", "h")
    .replace("hour", "h")
    .replace("days", "d")
    .replace("day", "d")
    .replace("months", "mo")
    .replace("month", "mo")
    .replace("years", "y")
    .replace("year", "y")
    .replace(/\s/g, "");
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "0";
  if (n < 1000) return String(n);
  if (n < 1_000_000) return (n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "") + "K";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}

export function laughScoreLabel(score: number): string {
  if (score >= 10_000) return "Legend";
  if (score >= 5_000) return "Comedy King";
  if (score >= 2_000) return "Riot";
  if (score >= 1_000) return "Funny One";
  if (score >= 500) return "Class Clown";
  if (score >= 100) return "Chuckler";
  return "Fresh Face";
}
