"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/post/post-card";
import { PostSkeleton } from "@/components/feed/post-skeleton";
import { Card } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Post, Profile } from "@/types/db";
import { randomLine, EMPTY_PROFILE_LINES, EMPTY_ROASTS_LINES, EMPTY_SAVED_LINES } from "@/lib/constants/empty-states";

type Tab = "posts" | "roasts" | "saved";

export function ProfileTabs({ profile, viewer }: { profile: Profile; viewer: Profile | null }) {
  return (
    <Tabs defaultValue="posts" className="mt-8">
      <TabsList>
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="roasts">🔥 Roasts</TabsTrigger>
        {viewer?.id === profile.id ? <TabsTrigger value="saved">Saved</TabsTrigger> : null}
      </TabsList>
      <TabsContent value="posts">
        <PostList userId={profile.id} filter="all" emptyKey="profile" />
      </TabsContent>
      <TabsContent value="roasts">
        <PostList userId={profile.id} filter="roast" emptyKey="roasts" />
      </TabsContent>
      {viewer?.id === profile.id ? (
        <TabsContent value="saved">
          <SavedList userId={profile.id} />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}

function PostList({
  userId,
  filter,
  emptyKey,
}: {
  userId: string;
  filter: "all" | "roast";
  emptyKey: "profile" | "roasts";
}) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const query = useQuery({
    queryKey: ["profile-posts", userId, filter],
    queryFn: async () => {
      let q = supabase
        .from("posts")
        .select("*, profile:profiles!posts_user_id_fkey(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (filter === "roast") q = q.eq("is_roast_me", true);
      const { data, error } = await q;
      if (error) throw error;
      return { rows: (data as Post[]) ?? [] };
    },
  });

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }
  if (!query.data || query.data.rows.length === 0) {
    return <EmptyTab line={randomLine(emptyKey === "profile" ? EMPTY_PROFILE_LINES : EMPTY_ROASTS_LINES)} />;
  }
  return (
    <div className="space-y-4">
      {query.data.rows.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}

function SavedList({ userId }: { userId: string }) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const query = useQuery({
    queryKey: ["profile-saved", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reactions")
        .select("post_id, post:posts(*, profile:profiles!posts_user_id_fkey(*))")
        .eq("user_id", userId)
        .eq("type", "save")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      const rows = (data ?? []).map((r) => r.post).filter(Boolean) as unknown as Post[];
      return { rows };
    },
  });

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
      </div>
    );
  }
  if (!query.data || query.data.rows.length === 0) {
    return <EmptyTab line={randomLine(EMPTY_SAVED_LINES)} />;
  }
  return (
    <div className="space-y-4">
      {query.data.rows.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}

function EmptyTab({ line }: { line: string }) {
  return (
    <Card className="p-10 text-center">
      <div className="text-5xl">🫥</div>
      <p className="mt-2 font-display text-lg font-semibold">{line}</p>
    </Card>
  );
}
