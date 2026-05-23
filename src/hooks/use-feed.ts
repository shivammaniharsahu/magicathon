"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEMO_PROFILE_ID } from "@/lib/demo";
import type { Post } from "@/types/db";

export type FeedTab = "for-you" | "roast-me" | "following" | "new";

const PAGE_SIZE = 12;

export function useFeed(tab: FeedTab) {
  const supabase = createSupabaseBrowserClient();

  return useInfiniteQuery({
    queryKey: ["feed", tab],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("posts")
        .select(`
          *,
          profile:profiles!posts_user_id_fkey(*)
        `)
        .range(from, to);

      if (tab === "roast-me") {
        query = query.eq("is_roast_me", true).order("created_at", { ascending: false });
      } else if (tab === "new") {
        query = query.order("created_at", { ascending: false });
      } else {
        // for-you = trending-ish: rank by laughs then recency
        query = query
          .order("laughs_count", { ascending: false })
          .order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      // Annotate has_laughed / has_saved for the demo user
      let annotated = (data as Post[]) ?? [];
      if (annotated.length > 0) {
        const ids = annotated.map((p) => p.id);
        const { data: reactions } = await supabase
          .from("reactions")
          .select("post_id, type")
          .in("post_id", ids)
          .eq("user_id", DEMO_PROFILE_ID);
        const laughed = new Set((reactions ?? []).filter((r) => r.type === "laugh").map((r) => r.post_id));
        const saved = new Set((reactions ?? []).filter((r) => r.type === "save").map((r) => r.post_id));
        const mehd = new Set((reactions ?? []).filter((r) => r.type === "meh").map((r) => r.post_id));
        annotated = annotated.map((p) => ({
          ...p,
          has_laughed: laughed.has(p.id),
          has_saved: saved.has(p.id),
          has_mehd: mehd.has(p.id),
        }));
      }

      return {
        rows: annotated,
        nextPage: annotated.length === PAGE_SIZE ? (pageParam as number) + 1 : undefined,
      };
    },
    getNextPageParam: (last) => last.nextPage,
  });
}
