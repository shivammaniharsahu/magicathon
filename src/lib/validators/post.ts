import { z } from "zod";

export const VIBE_VALUES = ["funny", "weird", "relatable", "rant", "wholesome"] as const;
export const AUDIENCE_VALUES = ["everyone", "followers", "vibe-match"] as const;

export const createPostSchema = z.object({
  content: z.string().trim().min(1, "Say something funny.").max(2000, "Easy there, novelist."),
  vibe: z.enum(VIBE_VALUES).nullable().default("funny"),
  audience: z.enum(AUDIENCE_VALUES).default("everyone"),
  is_roast_me: z.boolean().default(false),
  magic_boost: z.boolean().default(false),
  media_urls: z.array(z.string().url()).max(4).default([]),
  poll_options: z
    .array(z.object({ id: z.string(), text: z.string().min(1).max(80), votes: z.number().default(0) }))
    .max(4)
    .nullable()
    .default(null),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createCommentSchema = z.object({
  post_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable().default(null),
  content: z.string().trim().min(1, "Type something").max(500, "Roast too long"),
  is_roast: z.boolean().default(false),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
