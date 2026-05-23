"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-brand to-accent text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.6)] hover:shadow-[0_10px_40px_-8px_rgba(236,72,153,0.55)] hover:brightness-110",
        secondary:
          "bg-white/5 text-foreground border border-white/10 hover:bg-white/10 hover:border-white/20",
        outline:
          "border border-border-strong bg-transparent text-foreground hover:bg-white/5",
        ghost: "text-foreground hover:bg-white/5",
        glass:
          "glass-strong text-foreground hover:bg-white/10",
        danger: "bg-danger/90 text-white hover:bg-danger",
        link: "text-brand-glow underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-5",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
        xs: "h-7 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
