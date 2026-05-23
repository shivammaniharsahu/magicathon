"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { VIBES, type VibeKey } from "@/lib/constants/vibes";
import { cn } from "@/lib/utils/cn";

export function VibePicker({
  value,
  onChange,
}: {
  value: VibeKey | null;
  onChange: (v: VibeKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {VIBES.map((v) => {
        const active = value === v.key;
        return (
          <button
            key={v.key}
            type="button"
            onClick={() => onChange(v.key)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? `${v.bg} ${v.color} border-transparent ring-2 ${v.ring}`
                : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
            )}
          >
            <motion.span
              animate={active ? { rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.5 }}
              className="text-sm"
            >
              {v.emoji}
            </motion.span>
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
