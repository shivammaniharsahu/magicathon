import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shimmer rounded-xl bg-white/[0.03]",
        className,
      )}
      {...props}
    />
  );
}
