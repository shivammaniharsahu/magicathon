"use client";

import * as React from "react";
import Image from "next/image";
import {
  Image as ImageIcon,
  ListTree,
  Loader2,
  Send,
  Sparkles,
  Sticker,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { UserAvatar } from "@/components/ui/avatar";
import { VibePicker } from "./vibe-picker";
import { AudiencePicker } from "./audience-picker";
import { MemeBuilderDialog } from "./meme-builder-dialog";
import { CoachCard } from "./coach-card";
import { createPostSchema } from "@/lib/validators/post";
import { useCreatePost } from "@/hooks/use-create-post";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { VibeKey } from "@/lib/constants/vibes";
import type { Audience } from "@/lib/constants/vibes";
import type { Profile } from "@/types/db";

const MAX_LEN = 2000;
const BUCKET = "post-media";

interface PollOpt {
  id: string;
  text: string;
  votes: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
}

export function CreatePostDialog({ open, onOpenChange, profile }: Props) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const create = useCreatePost();
  const [content, setContent] = React.useState("");
  const [vibe, setVibe] = React.useState<VibeKey | null>("funny");
  const [audience, setAudience] = React.useState<Audience>("everyone");
  const [roastMe, setRoastMe] = React.useState(false);
  const [boost, setBoost] = React.useState(true);
  const [mediaUrls, setMediaUrls] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [pollOpen, setPollOpen] = React.useState(false);
  const [poll, setPoll] = React.useState<PollOpt[]>([
    { id: "a", text: "", votes: 0 },
    { id: "b", text: "", votes: 0 },
  ]);
  const [improving, setImproving] = React.useState(false);
  const [memeOpen, setMemeOpen] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const reset = React.useCallback(() => {
    setContent("");
    setVibe("funny");
    setAudience("everyone");
    setRoastMe(false);
    setBoost(true);
    setMediaUrls([]);
    setPollOpen(false);
    setPoll([
      { id: "a", text: "", votes: 0 },
      { id: "b", text: "", votes: 0 },
    ]);
  }, []);

  React.useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Max 8MB. Compress the chaos.");
      return;
    }
    setUploading(true);
    try {
      const filename = `${profile.id}/${Date.now()}-${file.name.replace(/[^a-z0-9_.-]/gi, "_")}`;
      const { error } = await supabase.storage.from(BUCKET).upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      setMediaUrls((prev) => [...prev, data.publicUrl]);
    } catch (err) {
      const msg = (err as Error).message || "";
      if (msg.toLowerCase().includes("bucket")) {
        toast.error("Storage bucket 'post-media' not found. See README.");
      } else {
        toast.error("Upload failed. Try a smaller image.");
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onImproveCaption = async () => {
    if (!content.trim()) {
      toast.message("Write something first, then I'll polish it.");
      return;
    }
    setImproving(true);
    try {
      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: content, vibe }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { caption: string };
      if (data.caption) {
        setContent(data.caption);
        toast.success("Polished. You're welcome.");
      }
    } catch {
      toast.error("AI ghosted. Try again.");
    } finally {
      setImproving(false);
    }
  };

  const onSubmit = async () => {
    const pollOptions = pollOpen
      ? poll.filter((o) => o.text.trim().length > 0).map((o) => ({ ...o, text: o.text.trim() }))
      : null;
    if (pollOpen && (!pollOptions || pollOptions.length < 2)) {
      toast.error("A poll needs at least 2 options.");
      return;
    }
    const parsed = createPostSchema.safeParse({
      content,
      vibe,
      audience,
      is_roast_me: roastMe,
      magic_boost: boost,
      media_urls: mediaUrls,
      poll_options: pollOptions,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Check your post.";
      toast.error(first);
      return;
    }
    try {
      await create.mutateAsync(parsed.data);
      toast.success("Posted. The world is laughing.");
      onOpenChange(false);
    } catch (err) {
      const msg = (err as Error).message || "";
      // FK violation when demo profile hasn't been seeded yet
      if (msg.includes("posts_user_id_fkey") || msg.includes("violates foreign key")) {
        toast.error("Demo mode isn't initialized. Run supabase/demo-mode.sql in Supabase first.");
      } else {
        toast.error("Couldn't post. Try again.");
      }
    }
  };

  const remaining = MAX_LEN - content.length;
  const canPost = content.trim().length > 0 && !create.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-glow" /> Create a post
          </DialogTitle>
          <DialogDescription>Spill the chaos. We&apos;ll handle the laughs.</DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3">
          <UserAvatar
            src={profile.avatar_url}
            name={profile.display_name ?? profile.username}
            className="h-10 w-10"
          />
          <div className="flex-1">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
              placeholder="What's on your mind today? 🫠"
              className="min-h-[120px] border-0 bg-transparent text-base focus:bg-transparent focus:ring-0"
              autoFocus
            />
            {mediaUrls.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {mediaUrls.map((url) => (
                  <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-white/10">
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => setMediaUrls((prev) => prev.filter((u) => u !== url))}
                      className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white backdrop-blur-sm hover:bg-black/80"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pollOpen && (
              <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Poll
                  </span>
                  <button
                    type="button"
                    onClick={() => setPollOpen(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
                {poll.map((o, i) => (
                  <input
                    key={o.id}
                    value={o.text}
                    onChange={(e) =>
                      setPoll((prev) =>
                        prev.map((p) => (p.id === o.id ? { ...p, text: e.target.value } : p)),
                      )
                    }
                    placeholder={`Option ${i + 1}`}
                    maxLength={80}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-brand/50"
                  />
                ))}
                {poll.length < 4 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPoll((prev) => [
                        ...prev,
                        { id: String(prev.length + 1), text: "", votes: 0 },
                      ])
                    }
                    className="w-full rounded-xl border border-dashed border-white/15 px-3 py-2 text-xs text-muted-foreground hover:border-white/30 hover:text-foreground"
                  >
                    + Add option
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <CoachCard content={content} vibe={vibe} />

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Pick a vibe</p>
          <div className="mt-2">
            <VibePicker value={vibe} onChange={setVibe} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Magic Boost <span className="ml-1">✨</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Let AI show your post to the right people.
              </p>
            </div>
            <Switch checked={boost} onCheckedChange={setBoost} />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <div>
              <p className="text-sm font-medium">
                Roast Me <span className="ml-1">🔥</span>
              </p>
              <p className="text-xs text-muted-foreground">Invite the funniest replies.</p>
            </div>
            <Switch checked={roastMe} onCheckedChange={setRoastMe} />
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onUpload}
        />

        <div className="flex items-center gap-1 border-t border-white/5 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || mediaUrls.length >= 4}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            Photo
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPollOpen((s) => !s)}
            className={cn(pollOpen && "text-brand-glow")}
          >
            <ListTree className="h-4 w-4" />
            Poll
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMemeOpen(true)}
            disabled={mediaUrls.length >= 4}
          >
            <Sticker className="h-4 w-4" />
            Meme it
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onImproveCaption}
            disabled={improving}
          >
            {improving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            AI polish
          </Button>

          <div className="ml-auto flex items-center gap-3">
            <span
              className={cn(
                "text-xs tabular-nums",
                remaining < 0 ? "text-danger" : remaining < 100 ? "text-amber" : "text-muted-foreground",
              )}
            >
              {remaining}
            </span>
            <AudiencePicker value={audience} onChange={setAudience} />
            <Button onClick={onSubmit} disabled={!canPost}>
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post it!
            </Button>
          </div>
        </div>
      </DialogContent>

      <MemeBuilderDialog
        open={memeOpen}
        onOpenChange={setMemeOpen}
        onCreated={(url) => setMediaUrls((prev) => [...prev, url])}
      />
    </Dialog>
  );
}
