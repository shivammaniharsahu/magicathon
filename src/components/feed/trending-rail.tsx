"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatNumber, timeAgo } from "@/lib/utils/format";
import { VIBE_BY_KEY } from "@/lib/constants/vibes";
import type { Post } from "@/types/db";

export function TrendingRail() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const query = useQuery({
    queryKey: ["trending-rail"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, content, vibe, laughs_count, created_at, profile:profiles!posts_user_id_fkey(username)")
        .order("laughs_count", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data as unknown as (Pick<Post, "id" | "content" | "vibe" | "laughs_count" | "created_at"> & { profile: { username: string } | null })[]) ?? [];
    },
  });

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-amber">
        <Flame className="h-3.5 w-3.5" /> Trending
      </div>
      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : !query.data || query.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No trending posts yet. Be the trend.</p>
      ) : (
        <ul className="space-y-3">
          {query.data.map((p) => {
            const v = p.vibe ? VIBE_BY_KEY[p.vibe] : null;
            return (
              <li key={p.id}>
                <Link
                  href={`/post/${p.id}`}
                  className="group block rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span className="truncate">
                      {v ? <span className={v.color}>{v.emoji} {v.label}</span> : "✨"}
                      {p.profile ? <> · @{p.profile.username}</> : null}
                    </span>
                    <span>{timeAgo(p.created_at)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-foreground/90 group-hover:text-foreground">
                    {p.content}
                  </p>
                  <p className="mt-0.5 text-[11px] text-rose">
                    😂 {formatNumber(p.laughs_count)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
