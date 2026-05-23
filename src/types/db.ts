import type { VibeKey } from "@/lib/constants/vibes";

export type PostType = "text" | "image" | "poll" | "video";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  laugh_score: number;
  followers_count: number;
  following_count: number;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[] | null;
  type: PostType;
  vibe: VibeKey | null;
  audience: "everyone" | "followers" | "vibe-match";
  is_roast_me: boolean;
  magic_boost: boolean;
  poll_options: { id: string; text: string; votes: number }[] | null;
  laughs_count: number;
  comments_count: number;
  shares_count: number;
  meh_count: number;
  ai_score: number | null;
  created_at: string;
  // populated joins
  profile?: Profile;
  has_laughed?: boolean;
  has_saved?: boolean;
  has_mehd?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_roast: boolean;
  laughs_count: number;
  created_at: string;
  profile?: Profile;
}

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  type: "laugh" | "save" | "meh";
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: "laugh" | "comment" | "follow" | "roast" | "challenge";
  post_id: string | null;
  comment_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile;
}
