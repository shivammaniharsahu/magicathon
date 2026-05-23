import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "brand" | "outline" | "ghost" | "success";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const styles = {
    default: "bg-white/10 text-foreground",
    brand: "bg-gradient-to-r from-brand/80 to-accent/80 text-white",
    outline: "border border-white/15 text-foreground",
    ghost: "bg-white/5 text-muted-foreground",
    success: "bg-success/15 text-success",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
