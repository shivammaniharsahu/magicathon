"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Crown, Loader2, Skull, Swords, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VibePill } from "@/components/post/vibe-pill";
import { fireLaughConfetti } from "@/lib/utils/confetti";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Post } from "@/types/db";

type Side = "a" | "b";

export function MemeBattle() {
  const qc = useQueryClient();
  const [pair, setPair] = React.useState<[Post, Post] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [winner, setWinner] = React.useState<Side | null>(null);
  const [castCount, setCastCount] = React.useState(0);
  const [hidden, setHidden] = React.useState(false);
  const seenRef = React.useRef<Set<string>>(new Set());

  const fetchPair = React.useCallback(async () => {
    setLoading(true);
    setWinner(null);
    try {
      const exclude = Array.from(seenRef.current).join(",");
      const res = await fetch(`/api/battles/pair?exclude=${encodeURIComponent(exclude)}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { pair: Post[] | null };
      if (!data.pair || data.pair.length < 2) {
        setPair(null);
      } else {
        const [a, b] = data.pair;
        seenRef.current.add(a!.id);
        seenRef.current.add(b!.id);
        // Cap the seen set so users eventually loop back to pairs
        if (seenRef.current.size > 30) {
          const arr = Array.from(seenRef.current).slice(-30);
          seenRef.current = new Set(arr);
        }
        setPair([a as Post, b as Post]);
      }
    } catch {
      setPair(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPair();
  }, [fetchPair]);

  const onVote = async (side: Side) => {
    if (!pair || winner) return;
    const winnerPost = side === "a" ? pair[0] : pair[1];
    const loserPost = side === "a" ? pair[1] : pair[0];
    setWinner(side);
    fireLaughConfetti();

    try {
      await fetch("/api/battles/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner_id: winnerPost.id, loser_id: loserPost.id }),
      });
      setCastCount((c) => c + 1);
      // Keep the feed in sync so users see the bumped count there too.
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["trending-rail"] });
    } catch {
      toast.error("Vote didn't save.");
    }

    // Show the reveal for ~1.6s, then load the next pair
    setTimeout(() => fetchPair(), 1600);
  };

  if (hidden) return null;

  return (
    <Card className="relative mb-6 overflow-hidden border-rose/25 bg-gradient-to-br from-rose/[0.08] via-brand/[0.06] to-cyan/[0.05] p-5">
      <button
        type="button"
        onClick={() => setHidden(true)}
        className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        aria-label="Hide battle widget"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2">
        <motion.div
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.8 }}
        >
          <Swords className="h-5 w-5 text-rose" />
        </motion.div>
        <h3 className="font-display text-xl font-bold tracking-tight">
          Meme Battle <span className="gradient-text">🥊</span>
        </h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {castCount > 0 ? (
            <>
              <span className="text-foreground font-medium">{castCount}</span> battle
              {castCount === 1 ? "" : "s"} cast
            </>
          ) : (
            "Tap the funnier one"
          )}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Two memes enter. One leaves with your laugh. Winners get a {`+1`} laugh score.
      </p>

      <div className="mt-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr]"
            >
              <ContenderSkeleton />
              <VS />
              <ContenderSkeleton />
            </motion.div>
          ) : !pair ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-muted-foreground"
            >
              You&apos;ve battled them all. Touch grass, then refresh.
            </motion.div>
          ) : (
            <motion.div
              key={`${pair[0].id}-${pair[1].id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr]"
            >
              <Contender
                post={pair[0]}
                side="a"
                winner={winner}
                onVote={onVote}
              />
              <VS />
              <Contender
                post={pair[1]}
                side="b"
                winner={winner}
                onVote={onVote}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {winner && pair && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center justify-center gap-2 text-xs"
        >
          <AiVerdict
            humanWinner={winner === "a" ? pair[0] : pair[1]}
            humanLoser={winner === "a" ? pair[1] : pair[0]}
          />
        </motion.div>
      )}
    </Card>
  );
}

// ---------- contender card ----------

function Contender({
  post,
  side,
  winner,
  onVote,
}: {
  post: Post;
  side: Side;
  winner: Side | null;
  onVote: (s: Side) => void;
}) {
  const isWinner = winner === side;
  const isLoser = winner != null && winner !== side;
  const image = post.media_urls?.[0];
  const profile = post.profile;
  const displayName = profile?.display_name ?? profile?.username ?? "human";

  return (
    <motion.div
      animate={
        isWinner
          ? { scale: [1, 1.04, 1.02], filter: "brightness(1.1)" }
          : isLoser
            ? { scale: 0.97, filter: "brightness(0.5) saturate(0.6)", opacity: 0.6 }
            : { scale: 1, filter: "brightness(1)", opacity: 1 }
      }
      transition={{ duration: 0.5 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-black/30",
        isWinner ? "border-amber/60 shadow-[0_0_40px_-8px_rgba(251,191,36,0.55)]" : "border-white/10",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 420px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/30 via-surface to-accent/30 p-6 text-center text-base text-white/90">
            “{post.content.slice(0, 140)}”
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          <VibePill vibe={post.vibe} />
        </div>
        {typeof post.ai_score === "number" && (
          <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-foreground backdrop-blur-sm">
            <Bot className="h-3 w-3 text-brand-glow" /> {post.ai_score}
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 text-xs text-white/95">
          {image && (
            <p className="line-clamp-2 leading-snug" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>
              {post.content}
            </p>
          )}
          <p className="mt-1 text-[11px] text-white/70">
            {profile ? (
              <Link href={`/profile/${profile.username}`} className="hover:underline">
                @{profile.username}
              </Link>
            ) : (
              displayName
            )}
            <span className="mx-1.5">·</span>
            😂 {formatNumber(post.laughs_count)}
          </p>
        </div>
        {isWinner && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 14 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="rounded-full bg-amber/95 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-black shadow-2xl shadow-amber/40">
              <Crown className="mr-1.5 inline h-4 w-4" />
              winner
            </div>
          </motion.div>
        )}
        {isLoser && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <Skull className="h-8 w-8 text-white/80" />
          </motion.div>
        )}
      </div>
      <Button
        onClick={() => onVote(side)}
        variant={isWinner ? "primary" : "glass"}
        className="m-2 w-[calc(100%-1rem)]"
        size="sm"
        disabled={winner !== null}
      >
        {isWinner ? "🏆 You picked this" : isLoser ? "Better luck next time" : "This one 😂"}
      </Button>
    </motion.div>
  );
}

function VS() {
  return (
    <div className="flex items-center justify-center self-stretch">
      <div className="font-display text-3xl font-bold text-muted-foreground sm:rotate-0">
        vs
      </div>
    </div>
  );
}

function ContenderSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      <div className="aspect-[4/3] animate-pulse bg-white/[0.04]" />
      <div className="m-2 h-9 animate-pulse rounded-full bg-white/[0.04]" />
    </div>
  );
}

// ---------- AI verdict ----------

function AiVerdict({
  humanWinner,
  humanLoser,
}: {
  humanWinner: Post;
  humanLoser: Post;
}) {
  const wScore = humanWinner.ai_score;
  const lScore = humanLoser.ai_score;
  if (wScore == null || lScore == null) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Vote registered. Loading next…
      </div>
    );
  }
  const agreed = wScore >= lScore;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
        agreed ? "bg-success/15 text-success" : "bg-amber/15 text-amber",
      )}
    >
      <Bot className="h-3 w-3" />
      {agreed
        ? `AI agrees. (${wScore} vs ${lScore})`
        : `AI disagrees. AI scored the other one ${lScore} vs ${wScore}.`}
    </div>
  );
}
