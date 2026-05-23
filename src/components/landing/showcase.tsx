"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Repeat2, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";

const SAMPLE_POSTS = [
  {
    handle: "@sarcastic_soul",
    avatarFrom: "from-amber",
    avatarTo: "to-rose",
    time: "2h",
    vibe: "Relatable",
    vibeEmoji: "🫠",
    text: "tried to adult today… it didn't go well.",
    laughs: 1280,
    comments: 186,
    shares: 93,
    accent: "from-brand/20 to-accent/10",
  },
  {
    handle: "@not_a_morning_person",
    avatarFrom: "from-cyan",
    avatarTo: "to-brand",
    time: "5h",
    vibe: "Weird",
    vibeEmoji: "👽",
    text: "morning people are robots sent by the government. i'm not convinced otherwise.",
    laughs: 2614,
    comments: 312,
    shares: 121,
    accent: "from-cyan/20 to-brand/10",
  },
  {
    handle: "@laughing_panda",
    avatarFrom: "from-accent",
    avatarTo: "to-brand",
    time: "1d",
    vibe: "Wholesome",
    vibeEmoji: "🥰",
    text: "some call it overthinking. i call it advanced planning.",
    laughs: 4090,
    comments: 220,
    shares: 88,
    accent: "from-accent/20 to-rose/10",
  },
];

export function Showcase() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-24">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {SAMPLE_POSTS.map((p, i) => (
          <motion.div
            key={p.handle}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Card className={`relative overflow-hidden bg-gradient-to-br ${p.accent} p-5`}>
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 shrink-0 rounded-full bg-gradient-to-br ${p.avatarFrom} ${p.avatarTo}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.handle}</div>
                  <div className="text-xs text-muted-foreground">{p.time} · {p.vibeEmoji} {p.vibe}</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-medium text-amber">
                  <Flame className="h-3 w-3" /> Roast me
                </span>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed">{p.text}</p>
              <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-rose" /> {p.laughs.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4" /> {p.comments}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Repeat2 className="h-4 w-4" /> {p.shares}
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
