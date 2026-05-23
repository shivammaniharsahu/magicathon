import { VIBE_BY_KEY, type VibeKey } from "@/lib/constants/vibes";
import { cn } from "@/lib/utils/cn";

export function VibePill({ vibe, className }: { vibe: VibeKey | null; className?: string }) {
  if (!vibe) return null;
  const v = VIBE_BY_KEY[vibe];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        v.bg,
        v.color,
        className,
      )}
    >
      <span aria-hidden>{v.emoji}</span>
      {v.label}
    </span>
  );
}
