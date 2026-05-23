"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatNumber, laughScoreLabel } from "@/lib/utils/format";
import type { Profile } from "@/types/db";

export function ProfileHeader({
  profile,
  viewer,
}: {
  profile: Profile;
  viewer: Profile | null;
}) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const qc = useQueryClient();
  const isSelf = viewer?.id === profile.id;

  const followingQuery = useQuery({
    enabled: !!viewer && !isSelf,
    queryKey: ["follow-status", profile.id, viewer?.id],
    queryFn: async () => {
      if (!viewer) return false;
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", viewer.id)
        .eq("following_id", profile.id)
        .maybeSingle();
      return !!data;
    },
  });

  const follow = useMutation({
    mutationFn: async () => {
      if (!viewer) throw new Error("auth-required");
      if (followingQuery.data) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", viewer.id)
          .eq("following_id", profile.id);
        if (error) throw error;
        return { followed: false };
      }
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: viewer.id, following_id: profile.id });
      if (error) throw error;
      return { followed: true };
    },
    onSuccess: ({ followed }) => {
      qc.invalidateQueries({ queryKey: ["follow-status", profile.id, viewer?.id] });
      toast.success(followed ? "Followed. Welcome to the chaos." : "Unfollowed. Cold.");
    },
    onError: (err) => {
      if ((err as Error).message === "auth-required") toast.error("Log in to follow.");
      else toast.error("That didn't take.");
    },
  });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-surface-elevated to-surface p-6 sm:p-8">
      <div className="absolute -top-20 right-0 h-48 w-48 rounded-full bg-brand/30 blur-[80px]" />
      <div className="absolute -bottom-20 left-0 h-48 w-48 rounded-full bg-accent/25 blur-[80px]" />

      <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <UserAvatar
            src={profile.avatar_url}
            name={profile.display_name ?? profile.username}
            className="h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-brand/20"
          />
        </motion.div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {profile.display_name || profile.username}
            </h1>
            <span className="rounded-full bg-gradient-to-r from-brand/30 to-accent/30 px-3 py-0.5 text-[11px] font-medium text-brand-glow">
              ✨ {laughScoreLabel(profile.laugh_score)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio ? (
            <p className="mt-3 max-w-prose text-sm">{profile.bio}</p>
          ) : isSelf ? (
            <p className="mt-3 text-sm italic text-muted-foreground">
              No bio yet. Drop one — it&apos;s free.
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
            <Stat label="Posts" value={undefined} hint="" />
            <Stat label="Followers" value={profile.followers_count} />
            <Stat label="Following" value={profile.following_count} />
            <Stat label="Laugh score" value={profile.laugh_score} accent />
          </div>
        </div>

        {!isSelf && viewer ? (
          <Button
            onClick={() => follow.mutate()}
            variant={followingQuery.data ? "secondary" : "primary"}
            disabled={follow.isPending}
          >
            {follow.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : followingQuery.data ? (
              <>
                <UserCheck className="h-4 w-4" /> Following
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" /> Follow
              </>
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value?: number;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <div className={accent ? "gradient-text-static font-display text-lg font-bold" : "font-display text-lg font-bold"}>
        {typeof value === "number" ? formatNumber(value) : hint ?? "—"}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
