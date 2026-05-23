"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEMO_PROFILE_ID } from "@/lib/demo";
import type { Post } from "@/types/db";

type ReactionType = "laugh" | "save" | "meh";

interface PageShape {
  rows: Post[];
  nextPage?: number;
}

function flipPostInCache(
  qc: ReturnType<typeof useQueryClient>,
  postId: string,
  type: ReactionType,
) {
  const applyFlip = (p: Post): Post => {
    if (p.id !== postId) return p;
    if (type === "laugh") {
      const nowLaughed = !p.has_laughed;
      return {
        ...p,
        has_laughed: nowLaughed,
        laughs_count: Math.max(0, p.laughs_count + (nowLaughed ? 1 : -1)),
      };
    }
    if (type === "meh") {
      const nowMehd = !p.has_mehd;
      return {
        ...p,
        has_mehd: nowMehd,
        meh_count: Math.max(0, p.meh_count + (nowMehd ? 1 : -1)),
      };
    }
    return { ...p, has_saved: !p.has_saved };
  };

  qc.setQueriesData<{ pages: PageShape[]; pageParams: unknown[] }>(
    { queryKey: ["feed"] },
    (data) => {
      if (!data) return data;
      return {
        ...data,
        pages: data.pages.map((page) => ({ ...page, rows: page.rows.map(applyFlip) })),
      };
    },
  );

  qc.setQueriesData<{ rows: Post[] }>(
    { queryKey: ["profile-posts"] },
    (data) => {
      if (!data) return data;
      return { ...data, rows: data.rows.map(applyFlip) };
    },
  );
}

export function useReaction() {
  const supabase = createSupabaseBrowserClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      post,
      type,
    }: {
      post: Pick<Post, "id" | "has_laughed" | "has_saved" | "has_mehd">;
      type: ReactionType;
    }) => {
      const already =
        type === "laugh" ? post.has_laughed : type === "meh" ? post.has_mehd : post.has_saved;
      if (already) {
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", DEMO_PROFILE_ID)
          .eq("type", type);
        if (error) throw error;
        return { removed: true };
      }
      const { error } = await supabase
        .from("reactions")
        .insert({ post_id: post.id, user_id: DEMO_PROFILE_ID, type });
      if (error) throw error;
      return { removed: false };
    },
    onMutate: ({ post, type }) => {
      flipPostInCache(qc, post.id, type);
    },
    onError: (_err, { post, type }) => {
      // revert
      flipPostInCache(qc, post.id, type);
      toast.error("Reaction didn't save. Try again.");
    },
  });
}
