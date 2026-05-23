"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { AUDIENCES, type Audience } from "@/lib/constants/vibes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

export function AudiencePicker({
  value,
  onChange,
}: {
  value: Audience;
  onChange: (a: Audience) => void;
}) {
  const current = AUDIENCES.find((a) => a.key === value) ?? AUDIENCES[0]!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition hover:bg-white/10"
        >
          <span>{current.emoji}</span>
          {current.label}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {AUDIENCES.map((a) => (
          <DropdownMenuItem
            key={a.key}
            onSelect={() => onChange(a.key)}
            className="flex items-start gap-2"
          >
            <span className="text-base leading-none">{a.emoji}</span>
            <div className="flex-1">
              <div className="text-sm font-medium">{a.label}</div>
              <div className="text-xs text-muted-foreground">{a.description}</div>
            </div>
            <Check
              className={cn(
                "h-4 w-4 text-brand-glow transition-opacity",
                value === a.key ? "opacity-100" : "opacity-0",
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
