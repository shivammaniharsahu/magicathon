"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { laughScoreLabel } from "@/lib/utils/format";
import type { Profile } from "@/types/db";

export function WhoToFollow() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const query = useQuery({
    queryKey: ["who-to-follow"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("laugh_score", { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data as Profile[]) ?? [];
    },
  });

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-cyan">Funny people</span>
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : query.data && query.data.length > 0 ? (
        <ul className="space-y-3">
          {query.data.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <UserAvatar
                src={p.avatar_url}
                name={p.display_name ?? p.username}
                className="h-9 w-9"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${p.username}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  @{p.username}
                </Link>
                <span className="text-[11px] text-muted-foreground">
                  {laughScoreLabel(p.laugh_score)}
                </span>
              </div>
              <Button size="xs" variant="secondary">
                Follow
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No one yet. You could be #1.</p>
      )}
    </Card>
  );
}
