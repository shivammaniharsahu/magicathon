"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Flame, Heart, Sparkles, Trophy, Users, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

const FEATURES = [
  {
    icon: Heart,
    title: "Laugh First",
    description: "Upvote what actually makes you laugh out loud — no vanity metrics.",
    color: "from-rose to-accent",
    bg: "bg-rose/10",
  },
  {
    icon: Users,
    title: "Real People",
    description: "No filters, no fakes. Just real stories and chaotic energy.",
    color: "from-cyan to-brand",
    bg: "bg-cyan/10",
  },
  {
    icon: Flame,
    title: "Roast Me",
    description: "Invite playful roasts. Get destroyed lovingly. It's healing.",
    color: "from-amber to-accent",
    bg: "bg-amber/10",
  },
  {
    icon: Wand2,
    title: "Magic Boost",
    description: "AI surfaces your funniest content to the people who'll get it.",
    color: "from-brand to-accent",
    bg: "bg-brand/10",
  },
  {
    icon: Trophy,
    title: "Play & Win",
    description: "Daily challenges, badges, streaks. Earn your way to legend status.",
    color: "from-lime to-cyan",
    bg: "bg-lime/10",
  },
  {
    icon: Sparkles,
    title: "Vibe Match",
    description: "Find your people by humor — not looks or follower counts.",
    color: "from-accent to-brand",
    bg: "bg-accent/10",
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, delay: i * 0.06 }}
          >
            <Card className="group relative h-full overflow-hidden p-6 transition-all hover:border-white/15 hover:shadow-glow">
              <div
                className={cn(
                  "mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl",
                  f.bg,
                )}
              >
                <f.icon className={cn("h-5 w-5 bg-gradient-to-br bg-clip-text", f.color)} />
                <span
                  className={cn(
                    "absolute h-11 w-11 rounded-2xl bg-gradient-to-br opacity-30 blur-md transition-opacity group-hover:opacity-60",
                    f.color,
                  )}
                />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
