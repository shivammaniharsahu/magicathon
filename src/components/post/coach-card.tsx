"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Loader2, Sparkles, ThumbsUp, Zap } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils/cn";

interface Props {
  content: string;
  vibe?: string | null;
}

interface CoachState {
  score: number;
  tip: string;
  label: string;
}

const MIN_CHARS = 15;

export function CoachCard({ content, vibe }: Props) {
  const debouncedContent = useDebouncedValue(content, 800);
  const [state, setState] = React.useState<CoachState | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [stale, setStale] = React.useState(false);
  const lastQueried = React.useRef<string>("");

  // Mark stale whenever content drifts from what we last scored.
  React.useEffect(() => {
    if (state && content.trim() !== lastQueried.current) {
      setStale(true);
    } else {
      setStale(false);
    }
  }, [content, state]);

  React.useEffect(() => {
    const trimmed = debouncedContent.trim();
    if (trimmed.length < MIN_CHARS) {
      setState(null);
      setLoading(false);
      return;
    }
    if (trimmed === lastQueried.current) {
      // Already scored this exact text — skip the network round-trip.
      return;
    }
    const controller = new AbortController();
    lastQueried.current = trimmed;
    setLoading(true);
    fetch("/api/ai/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed, vibe }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: CoachState | null) => {
        if (!data) return;
        setState(data);
        setStale(false);
      })
      .catch(() => {
        // Swallow — coach is non-critical. Don't toast.
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [debouncedContent, vibe]);

  if (content.trim().length === 0) return null;

  const score = state?.score ?? 0;
  const tier =
    score >= 86 ? "gold"
    : score >= 66 ? "fire"
    : score >= 41 ? "warm"
    : score > 0 ? "cool"
    : "idle";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-brand-glow">
          <Bot className="h-3.5 w-3.5" />
          Funny coach
          {loading && <Loader2 className="h-3 w-3 animate-spin opacity-70" />}
          {!loading && stale && state && <span className="text-[10px] opacity-60">· typing…</span>}
        </div>
        {state && <ScoreNumber value={score} tier={tier} />}
      </div>

      <Meter score={state ? score : 0} tier={tier} />

      <AnimatePresence mode="wait">
        {state ? (
          <motion.div
            key={state.tip}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mt-2 flex items-start gap-2"
          >
            <TierIcon tier={tier} />
            <p className="flex-1 text-xs leading-relaxed text-foreground/90">
              <span className="font-medium uppercase tracking-wider text-muted-foreground">
                {state.label} ·{" "}
              </span>
              {state.tip}
            </p>
          </motion.div>
        ) : content.trim().length < MIN_CHARS ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-[11px] text-muted-foreground"
          >
            Keep typing… coach kicks in around {MIN_CHARS} chars.
          </motion.p>
        ) : (
          <motion.p
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-[11px] text-muted-foreground"
          >
            Coach is reading…
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreNumber({ value, tier }: { value: number; tier: string }) {
  // Animate the displayed number toward `value`.
  const [shown, setShown] = React.useState(value);
  React.useEffect(() => {
    let raf = 0;
    const start = shown;
    const startTime = performance.now();
    const duration = 350;
    const step = (t: number) => {
      const p = Math.min(1, (t - startTime) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(start + (value - start) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <span
      className={cn(
        "font-display text-lg font-bold tabular-nums",
        tier === "gold" && "text-amber",
        tier === "fire" && "text-brand-glow",
        tier === "warm" && "text-cyan",
        tier === "cool" && "text-muted-foreground",
      )}
    >
      {shown}
      <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">/100</span>
    </span>
  );
}

function Meter({ score, tier }: { score: number; tier: string }) {
  const grad =
    tier === "gold" ? "from-amber via-rose to-accent"
    : tier === "fire" ? "from-brand via-accent to-amber"
    : tier === "warm" ? "from-cyan to-brand"
    : tier === "cool" ? "from-white/30 to-white/20"
    : "from-white/20 to-white/10";
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
      <motion.div
        className={cn("h-full rounded-full bg-gradient-to-r", grad)}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      />
    </div>
  );
}

function TierIcon({ tier }: { tier: string }) {
  if (tier === "gold") return <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" />;
  if (tier === "fire") return <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-glow" />;
  if (tier === "warm") return <ThumbsUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" />;
  return <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}
