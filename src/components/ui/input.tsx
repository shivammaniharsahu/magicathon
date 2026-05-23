"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:outline-none focus:border-brand/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/70 transition-colors focus:outline-none focus:border-brand/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
