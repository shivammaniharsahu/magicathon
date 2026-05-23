"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Flame, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUIStore } from "@/stores/ui-store";
import type { DailyMeme } from "@/lib/trending/daily-meme";

const IMPACT_STYLE: React.CSSProperties = {
  fontFamily: 'Impact, "Anton", "Arial Black", "Helvetica Neue", sans-serif',
  letterSpacing: "-0.01em",
  WebkitTextStroke: "1.8px black",
  paintOrder: "stroke fill",
  lineHeight: 1.05,
};

export function DailyTrendingCard({ meme }: { meme: DailyMeme }) {
  const open = useUIStore((s) => s.openCreate);
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const dateLabel = new Date(meme.date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="relative mb-6 overflow-hidden border-amber/30 bg-gradient-to-br from-amber/8 via-rose/5 to-brand/10 p-0">
        <div className="absolute inset-0 -z-10 dot-pattern opacity-20" />
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
          {/* Meme image with classic text overlay */}
          <div className="relative aspect-square w-full overflow-hidden bg-black/50 md:aspect-auto">
            {!imgLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/10 to-white/[0.02]" />
            )}
            <Image
              src={meme.image_url}
              alt={meme.idea}
              fill
              sizes="(max-width: 768px) 100vw, 280px"
              className="object-cover transition-opacity duration-500"
              style={{ opacity: imgLoaded ? 1 : 0 }}
              onLoad={() => setImgLoaded(true)}
              unoptimized
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45" />
            {meme.top && (
              <div
                className="absolute left-2 right-2 top-2.5 text-center text-[22px] font-black uppercase text-white md:text-2xl"
                style={IMPACT_STYLE}
              >
                {meme.top}
              </div>
            )}
            {meme.bottom && (
              <div
                className="absolute bottom-2.5 left-2 right-2 text-center text-[22px] font-black uppercase text-white md:text-2xl"
                style={IMPACT_STYLE}
              >
                {meme.bottom}
              </div>
            )}
            <motion.span
              animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black shadow-lg shadow-amber/30"
            >
              <Flame className="h-3 w-3" /> Daily
            </motion.span>
          </div>

          {/* Description + CTA */}
          <div className="flex flex-col justify-center p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber">
              <Sparkles className="h-3.5 w-3.5" />
              <span>MagicAthon trend · {dateLabel}</span>
            </div>
            <h2 className="mt-1.5 font-display text-xl font-bold leading-tight sm:text-2xl">
              {meme.idea}
            </h2>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              AI cooked today&apos;s joke by reading what&apos;s landing in the feed. Vibe:{" "}
              <span className="text-foreground">{meme.vibe}</span>.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={open}>
                <Wand2 className="h-4 w-4" /> Make your own
              </Button>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-muted-foreground">
                🤖 Refreshes every 24h
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
