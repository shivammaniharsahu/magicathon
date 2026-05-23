"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MEME_RECIPES, applyRecipe, type MemeRecipe } from "@/lib/meme/recipes";
import { cn } from "@/lib/utils/cn";
import type { TextBlock } from "@/lib/meme/types";

interface Props {
  onApply: (result: { prompt: string; blocks: TextBlock[]; recipe: MemeRecipe }) => void;
}

export function RecipePicker({ onApply }: Props) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const selected = MEME_RECIPES.find((r) => r.id === selectedId);

  const pick = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
      setValues({});
      return;
    }
    setSelectedId(id);
    setValues({});
  };

  const apply = () => {
    if (!selected) return;
    const result = applyRecipe(selected, values);
    onApply({ ...result, recipe: selected });
    // Keep the form filled in case the user wants to tweak + apply again,
    // but collapse the tile selection so the rest of the panels feel clear.
    setSelectedId(null);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-1.5">
        <span className="text-xs uppercase tracking-wider text-lime">
          📋 Templates
        </span>
        <span className="text-[10px] text-muted-foreground">
          · {MEME_RECIPES.length} reusable recipes
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Pick a classic format → fill the slots → AI cooks a fresh take every time.
      </p>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {MEME_RECIPES.map((r) => {
          const isActive = selectedId === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => pick(r.id)}
              title={r.description}
              className={cn(
                "group relative flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-[11px] font-medium transition",
                isActive
                  ? "border-lime/60 bg-lime/15 text-foreground ring-2 ring-lime/30"
                  : "border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              <span className="text-base leading-none">{r.emoji}</span>
              <span className="line-clamp-1">{r.label}</span>
              {isActive && (
                <ChevronDown className="absolute right-1 top-1 h-3 w-3 text-lime" />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl border border-lime/30 bg-lime/[0.04] p-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{selected.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{selected.label}</p>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground">
                    {selected.description}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 space-y-1.5">
                {selected.slots.map((slot) => (
                  <div key={slot.key}>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {slot.label}
                    </label>
                    <Input
                      value={values[slot.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [slot.key]: e.target.value }))}
                      placeholder={slot.placeholder}
                      maxLength={120}
                      className="h-8 text-[12px]"
                    />
                  </div>
                ))}
              </div>

              <Button
                type="button"
                size="sm"
                onClick={apply}
                className="mt-2 w-full bg-gradient-to-r from-lime to-cyan text-black hover:brightness-110"
              >
                <Sparkles className="h-3 w-3" />
                Use this template
              </Button>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Applies the prompt + text-block layout. You can still drag, edit, and regenerate after.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
