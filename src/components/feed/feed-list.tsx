"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { PostCard } from "@/components/post/post-card";
import { PostSkeleton } from "./post-skeleton";
import { EmptyFeed } from "./empty-state";
import { useFeed, type FeedTab } from "@/hooks/use-feed";
import { useIntersection } from "@/hooks/use-intersection";

export function FeedList({ tab }: { tab: FeedTab }) {
  const query = useFeed(tab);
  const { ref, isIntersecting } = useIntersection<HTMLDivElement>({ rootMargin: "400px" });

  React.useEffect(() => {
    if (isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [isIntersecting, query]);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger/10 p-6 text-center text-sm text-danger">
        Feed broke. Refresh and pretend nothing happened.
      </div>
    );
  }

  const rows = query.data?.pages.flatMap((p) => p.rows) ?? [];

  if (rows.length === 0) return <EmptyFeed />;

  return (
    <div className="space-y-4">
      {rows.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <div ref={ref} className="flex items-center justify-center py-6 text-muted-foreground">
        {query.isFetchingNextPage ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : query.hasNextPage ? (
          <span className="text-xs">Loading more chaos…</span>
        ) : (
          <span className="text-xs">That&apos;s all for now. Touch grass. 🌱</span>
        )}
      </div>
    </div>
  );
}
