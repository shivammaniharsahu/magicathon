"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEMO_PROFILE_ID } from "@/lib/demo";
import type { CreatePostInput } from "@/lib/validators/post";
import type { Post, PostType } from "@/types/db";

export function useCreatePost() {
  const supabase = createSupabaseBrowserClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      const type: PostType =
        input.poll_options && input.poll_options.length > 0
          ? "poll"
          : input.media_urls && input.media_urls.length > 0
          ? "image"
          : "text";

      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: DEMO_PROFILE_ID,
          content: input.content,
          vibe: input.vibe,
          audience: input.audience,
          is_roast_me: input.is_roast_me,
          magic_boost: input.magic_boost,
          media_urls: input.media_urls,
          poll_options: input.poll_options,
          type,
        })
        .select("*, profile:profiles!posts_user_id_fkey(*)")
        .single();

      if (error) throw error;
      return data as Post;
    },
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["profile-posts"] });
      qc.invalidateQueries({ queryKey: ["trending-rail"] });

      // Fire-and-forget: ask the AI to score this post. Updates the row.
      // If it fails, the post still shows — the badge just stays hidden.
      void fetch("/api/ai/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, content: post.content }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then(() => qc.invalidateQueries({ queryKey: ["feed"] }))
        .catch(() => undefined);
    },
  });
}
