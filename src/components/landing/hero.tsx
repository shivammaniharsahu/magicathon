"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const FLOATING_EMOJIS = ["😂", "🔥", "🥲", "🫠", "👽", "🥰", "🤡", "✨", "💀"];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand/25 blur-[120px]" />
        <div className="absolute -top-10 right-0 h-[300px] w-[400px] rounded-full bg-accent/20 blur-[100px]" />
        <div className="absolute top-40 left-0 h-[300px] w-[400px] rounded-full bg-cyan/10 blur-[100px]" />
      </div>

      <FloatingEmojis />

      <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-glow" />
            <span>The internet&apos;s happiest place</span>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] text-success">
              Live
            </span>
          </motion.div>

          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Post anything.
            <br />
            Make everyone{" "}
            <span className="gradient-text">laugh.</span>
            <motion.span
              animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
              className="inline-block"
            >
              😂
            </motion.span>
          </h1>

          <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground sm:text-xl">
            The social playground where authenticity gets applause. Roast,
            react, vibe match. Real people. No corporate energy.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="text-base">
              <Link href="/feed">
                Enter the chaos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="lg" className="text-base">
              <Link href="/trending">See trending</Link>
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 flex items-center gap-3 text-xs text-muted-foreground"
          >
            <div className="flex -space-x-2">
              {["from-amber to-rose", "from-cyan to-brand", "from-accent to-rose", "from-lime to-cyan"].map(
                (g, i) => (
                  <span
                    key={i}
                    className={`h-7 w-7 rounded-full bg-gradient-to-br ${g} ring-2 ring-background`}
                  />
                ),
              )}
            </div>
            <span>
              <span className="font-semibold text-foreground">12,438</span> humans laughing right now
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function FloatingEmojis() {
  // Stable positions so SSR/CSR match. Uses a tiny PRNG seeded by index.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
      {FLOATING_EMOJIS.map((emoji, i) => {
        const left = ((i * 89) % 100);
        const top = ((i * 53) % 70) + 10;
        const delay = (i % 5) * 0.4;
        const size = 22 + ((i * 7) % 14);
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: [-10, 10, -10], opacity: 0.6 }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: `${top}%`,
              fontSize: `${size}px`,
              filter: "drop-shadow(0 4px 12px rgba(139, 92, 246, 0.4))",
            }}
          >
            {emoji}
          </motion.span>
        );
      })}
    </div>
  );
}
