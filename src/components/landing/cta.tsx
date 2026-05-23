"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-surface-elevated to-surface p-10 text-center sm:p-14"
      >
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-20 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-brand/25 blur-[100px]" />
          <div className="absolute -bottom-20 right-0 h-[200px] w-[300px] rounded-full bg-accent/20 blur-[80px]" />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Built for laughs.
          <br />
          <span className="gradient-text">Designed for humans.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-balance text-muted-foreground">
          Join the platform where authenticity gets applause and the worst day
          becomes the best post.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/feed">Start posting →</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/trending">See what's trending</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
