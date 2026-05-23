"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Bot, Flame, Meh, MessageCircle, Repeat2, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { VibePill } from "./vibe-pill";
import { RoastSuggestor } from "./roast-suggestor";
import { readAnimationFromUrl } from "./meme-builder-dialog";
import { useReaction } from "@/hooks/use-reaction";
import { fireLaughConfetti } from "@/lib/utils/confetti";
import { formatNumber, timeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Post } from "@/types/db";

export function PostCard({ post }: { post: Post }) {
  const reaction = useReaction();
  const [showRoastBox, setShowRoastBox] = React.useState(false);
  const profile = post.profile;
  const displayName = profile?.display_name ?? profile?.username ?? "human";

  const reactionPayload = {
    id: post.id,
    has_laughed: post.has_laughed,
    has_saved: post.has_saved,
    has_mehd: post.has_mehd,
  };

  const onLaugh = () => {
    if (!post.has_laughed) fireLaughConfetti();
    reaction.mutate({ post: reactionPayload, type: "laugh" });
  };

  const onMeh = () => {
    reaction.mutate({ post: reactionPayload, type: "meh" });
  };

  const onSave = () => {
    reaction.mutate({ post: reactionPayload, type: "save" });
  };

  const onShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "MagicAthon", text: post.content.slice(0, 80), url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // user cancelled or clipboard blocked
    }
  };

  const firstImage = post.media_urls?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden p-0 transition-colors hover:border-white/10">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <Link href={profile ? `/profile/${profile.username}` : "#"}>
              <UserAvatar
                src={profile?.avatar_url}
                name={displayName}
                className="h-10 w-10"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={profile ? `/profile/${profile.username}` : "#"}
                  className="truncate text-sm font-semibold hover:underline"
                >
                  {displayName}
                </Link>
                {profile ? (
                  <span className="truncate text-xs text-muted-foreground">
                    @{profile.username}
                  </span>
                ) : null}
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <VibePill vibe={post.vibe} />
                {post.is_roast_me && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2 py-0.5 text-[11px] font-medium text-amber">
                    <Flame className="h-3 w-3" />
                    Roast me
                  </span>
                )}
                {post.magic_boost && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand/20 to-accent/20 px-2 py-0.5 text-[11px] font-medium text-brand-glow">
                    ✨ Boosted
                  </span>
                )}
                <AiScoreBadge score={post.ai_score} />
              </div>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>

          {firstImage ? (
            (() => {
              const animClass = readAnimationFromUrl(firstImage);
              return (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/5">
                  <Image
                    src={firstImage}
                    alt=""
                    width={1200}
                    height={800}
                    className={cn("h-auto w-full object-cover", animClass)}
                    unoptimized
                  />
                </div>
              );
            })()
          ) : null}

          {post.poll_options && post.poll_options.length > 0 ? (
            <PollOptions postId={post.id} options={post.poll_options} />
          ) : null}
        </div>

        <div className="flex items-center gap-1 border-t border-white/5 px-3 py-2 text-sm text-muted-foreground">
          <ActionButton
            active={post.has_laughed}
            onClick={onLaugh}
            count={post.laughs_count}
            label="Laugh"
            activeClass="text-rose"
          >
            <span className={cn("inline-block", post.has_laughed && "animate-bounce-slow")}>😂</span>
          </ActionButton>

          <ActionButton
            active={post.has_mehd}
            onClick={onMeh}
            count={post.meh_count}
            label="Not funny"
            activeClass="text-muted-foreground"
          >
            <Meh className="h-4 w-4" />
          </ActionButton>

          <ActionButton onClick={() => setShowRoastBox((s) => !s)} count={post.comments_count} label="Comments">
            <MessageCircle className="h-4 w-4" />
          </ActionButton>

          <ActionButton onClick={onShare} count={post.shares_count} label="Share">
            <Repeat2 className="h-4 w-4" />
          </ActionButton>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={onSave}
              className={cn(
                "rounded-full p-2 transition-colors hover:bg-white/5",
                post.has_saved && "text-brand-glow",
              )}
              aria-label="Save"
            >
              {post.has_saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
            <button
              onClick={onShare}
              className="rounded-full p-2 transition-colors hover:bg-white/5"
              aria-label="External share"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showRoastBox && (
          <div className="border-t border-white/5 p-4">
            <RoastSuggestor postContent={post.content} />
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function ActionButton({
  children,
  count,
  label,
  onClick,
  active,
  activeClass,
}: {
  children: React.ReactNode;
  count?: number;
  label: string;
  onClick?: () => void;
  active?: boolean;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors hover:bg-white/5 hover:text-foreground",
        active && activeClass,
      )}
      aria-label={label}
    >
      {children}
      {typeof count === "number" ? <span>{formatNumber(count)}</span> : null}
    </button>
  );
}

function AiScoreBadge({ score }: { score: number | null }) {
  if (score == null) return null;
  // Gradient bins for visual variety
  const tier =
    score >= 90 ? "from-amber to-rose text-amber"
    : score >= 75 ? "from-brand to-accent text-brand-glow"
    : score >= 50 ? "from-cyan to-brand text-cyan"
    : "from-white/20 to-white/10 text-muted-foreground";
  return (
    <span
      title={`AI funniness score: ${score}/100`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2 py-0.5 text-[11px] font-semibold ring-1 ring-white/10",
        tier,
      )}
    >
      <Bot className="h-3 w-3" />
      {score}
    </span>
  );
}

function PollOptions({ postId, options }: { postId: string; options: { id: string; text: string; votes: number }[] }) {
  const total = options.reduce((s, o) => s + (o.votes ?? 0), 0);
  return (
    <div className="mt-4 space-y-2">
      {options.map((o) => {
        const pct = total ? Math.round((o.votes / total) * 100) : 0;
        return (
          <div key={`${postId}-${o.id}`} className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand/40 to-accent/30"
              style={{ width: `${pct}%` }}
              aria-hidden
            />
            <div className="relative flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="truncate">{o.text}</span>
              <span className="ml-3 text-xs text-muted-foreground">{pct}%</span>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">{formatNumber(total)} votes</p>
    </div>
  );
}
