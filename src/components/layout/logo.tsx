import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Logo({ className, asLink = true }: { className?: string; asLink?: boolean }) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight",
        className,
      )}
    >
      <span className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent shadow-[0_0_24px_-4px_rgba(139,92,246,0.7)]">
        <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
      </span>
      <span className="gradient-text">MagicAthon</span>
    </span>
  );
  if (!asLink) return content;
  return <Link href="/">{content}</Link>;
}
