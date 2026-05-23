"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDailyChallenge } from "@/lib/constants/challenges";
import { useUIStore } from "@/stores/ui-store";

export function DailyChallenge() {
  const challenge = React.useMemo(() => getDailyChallenge(), []);
  const open = useUIStore((s) => s.openCreate);

  return (
    <Card className="relative overflow-hidden p-5">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand/20 via-transparent to-accent/15" />
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-brand/40 blur-3xl" />
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-brand-glow">
        <Sparkles className="h-3.5 w-3.5" /> Daily challenge
      </div>
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="mt-2 text-4xl"
      >
        {challenge.emoji}
      </motion.div>
      <h3 className="mt-1 font-display text-lg font-semibold">{challenge.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{challenge.prompt}</p>
      <Button className="mt-4 w-full" size="sm" onClick={open}>
        Take the challenge
      </Button>
    </Card>
  );
}
