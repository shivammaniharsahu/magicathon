"use client";

import * as React from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Camera,
  CheckCircle2,
  Eraser,
  Eye,
  Flame,
  ImagePlus,
  Loader2,
  PenLine,
  Plus,
  RefreshCcw,
  Smile,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  Type as TypeIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  canvasToBlob,
  drawMeme,
  hitTestBlocks,
  loadImage,
  MEME_CANVAS_SIZE,
} from "@/lib/meme/draw";
import {
  DEFAULT_BOTTOM_BLOCK,
  DEFAULT_TOP_BLOCK,
  newTextBlock,
  type TextBlock,
} from "@/lib/meme/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEMO_PROFILE_ID } from "@/lib/demo";
import { cn } from "@/lib/utils/cn";
import { WebcamCaptureDialog } from "./webcam-capture-dialog";
import { RecipePicker } from "./recipe-picker";

const BUCKET = "post-media";

type CartoonStyle = "pixar" | "cartoon" | "anime" | "caricature" | "vector" | "claymation";

const CARTOON_STYLES: { key: CartoonStyle; label: string; emoji: string }[] = [
  { key: "pixar", label: "Pixar", emoji: "🤩" },
  { key: "cartoon", label: "Cartoon", emoji: "🦊" },
  { key: "anime", label: "Anime", emoji: "🌸" },
  { key: "caricature", label: "Caricature", emoji: "🤪" },
  { key: "vector", label: "Vector", emoji: "🎨" },
  { key: "claymation", label: "Claymation", emoji: "🧱" },
];

type AnimationKey = "none" | "shake" | "bounce" | "pulse" | "rainbow" | "glitch";

const ANIMATIONS: { key: AnimationKey; label: string; emoji: string; className: string }[] = [
  { key: "none", label: "Still", emoji: "▫️", className: "" },
  { key: "shake", label: "Shake", emoji: "🤣", className: "anim-shake" },
  { key: "bounce", label: "Bounce", emoji: "🏀", className: "anim-bounce" },
  { key: "pulse", label: "Pulse", emoji: "💥", className: "anim-pulse" },
  { key: "rainbow", label: "Rainbow", emoji: "🌈", className: "anim-rainbow" },
  { key: "glitch", label: "Glitch", emoji: "👾", className: "anim-glitch" },
];

// Helper: read the #anim=… fragment off a media URL.
export function readAnimationFromUrl(url: string): string | null {
  try {
    const hashIdx = url.indexOf("#");
    if (hashIdx < 0) return null;
    const fragment = url.slice(hashIdx + 1);
    const params = new URLSearchParams(fragment);
    const anim = params.get("anim");
    if (!anim) return null;
    // Whitelist so we only ever render classes we control.
    const valid = ANIMATIONS.find((a) => a.key === anim);
    return valid ? valid.className : null;
  } catch {
    return null;
  }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (url: string) => void;
}

export function MemeBuilderDialog({ open, onOpenChange, onCreated }: Props) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageElRef = React.useRef<HTMLImageElement | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const [prompt, setPrompt] = React.useState(
    "an exhausted office goblin clutching a flat coffee, fluorescent monday light, photo-real",
  );
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [imageLoading, setImageLoading] = React.useState(false);
  const [imageVersion, setImageVersion] = React.useState(0);
  const [darken, setDarken] = React.useState(0);
  const [generating, setGenerating] = React.useState(false);
  const [enhancing, setEnhancing] = React.useState(false);
  const [trendingLoading, setTrendingLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Multi-variant grid state
  const [variants, setVariants] = React.useState<
    { url: string; seed: number; model?: string }[]
  >([]);
  const [selectedVariantSeed, setSelectedVariantSeed] = React.useState<number | null>(null);
  const [captionLoading, setCaptionLoading] = React.useState(false);
  const [cameraOpen, setCameraOpen] = React.useState(false);
  const [animation, setAnimation] = React.useState<AnimationKey>("none");
  const [cartoonifying, setCartoonifying] = React.useState(false);
  const [cartoonStyle, setCartoonStyle] = React.useState<CartoonStyle>("pixar");

  // Builds a fresh image-proxy URL for the current prompt + a given seed.
  // The `model` query tells the proxy which Pollinations model to try first.
  const buildVariantUrl = React.useCallback(
    (seed: number, model: string = "flux") =>
      `/api/ai/image-proxy?${new URLSearchParams({
        prompt,
        seed: String(seed),
        model,
      }).toString()}`,
    [prompt],
  );

  // Replace a single variant with a fresh seed. URL changes → tile reloads.
  // Keeps the same model so the alternation is preserved.
  const onRetryVariant = React.useCallback(
    (oldSeed: number) => {
      const newSeed = Math.floor(Math.random() * 1_000_000);
      setVariants((prev) =>
        prev.map((v) =>
          v.seed === oldSeed
            ? { seed: newSeed, model: v.model, url: buildVariantUrl(newSeed, v.model) }
            : v,
        ),
      );
      if (selectedVariantSeed === oldSeed) setSelectedVariantSeed(null);
    },
    [buildVariantUrl, selectedVariantSeed],
  );

  const [blocks, setBlocks] = React.useState<TextBlock[]>(() => [
    DEFAULT_TOP_BLOCK(),
    DEFAULT_BOTTOM_BLOCK(),
  ]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  // When non-null, the block with this id is being inline-edited via the
  // floating textarea over the canvas.
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setImageUrl(null);
      imageElRef.current = null;
      setBlocks([DEFAULT_TOP_BLOCK(), DEFAULT_BOTTOM_BLOCK()]);
      setSelectedId(null);
      setEditingId(null);
      setDarken(0);
      setImageVersion(0);
      setVariants([]);
      setSelectedVariantSeed(null);
      setAnimation("none");
      setCartoonStyle("pixar");
      setCartoonifying(false);
    }
  }, [open]);

  // ============== Load image when imageUrl changes ==============
  // Decoupled from canvas render so dragging text doesn't re-fetch the image.
  React.useEffect(() => {
    if (!imageUrl) {
      imageElRef.current = null;
      setImageVersion((v) => v + 1);
      return;
    }
    let cancelled = false;
    setImageLoading(true);
    const attempt = (retries: number): Promise<void> =>
      loadImage(imageUrl)
        .then((img) => {
          if (cancelled) return;
          imageElRef.current = img;
          setImageVersion((v) => v + 1);
        })
        .catch(async (err) => {
          if (cancelled) return;
          if (retries > 0) {
            // Transient Pollinations errors are common; wait and retry once.
            await new Promise((r) => setTimeout(r, 2000));
            if (cancelled) return;
            return attempt(retries - 1);
          }
          imageElRef.current = null;
          setImageVersion((v) => v + 1);
          toast.error("Couldn't load that image. Try regenerating or a different prompt.");
          // eslint-disable-next-line no-console
          console.error("[meme] image load failed:", err);
        });
    attempt(1).finally(() => {
      if (!cancelled) setImageLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  // ============== Render canvas on every visible state change ==============
  // No image fetching here. Just paints what's already loaded.
  React.useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawMeme({
      ctx,
      width: canvas.width,
      height: canvas.height,
      image: imageElRef.current,
      blocks,
      selectedId,
      darken,
    });
  }, [open, blocks, selectedId, imageVersion, darken]);

  // ============== AI image generation (multi-variant) ==============

  // explicitPrompt lets callers (e.g. the recipe picker) trigger generation
  // before React has flushed setPrompt() — they pass the prompt directly.
  const fetchVariants = async (explicitPrompt: string, count = 2) => {
    const res = await fetch("/api/ai/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: explicitPrompt, count }),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as {
      variants: { url: string; seed: number; model?: string }[];
    };
  };

  const onGenerateVariants = async (overridePrompt?: string) => {
    const effectivePrompt = (overridePrompt ?? prompt).trim();
    if (!effectivePrompt) {
      toast.message("Describe the meme image first.");
      return;
    }
    setGenerating(true);
    setSelectedVariantSeed(null);
    setImageUrl(null);
    imageElRef.current = null;
    try {
      const data = await fetchVariants(effectivePrompt, 2);
      setVariants(data.variants);
    } catch {
      toast.error("Couldn't generate. Try a shorter prompt or hit again.");
    } finally {
      setGenerating(false);
    }
  };

  // Apply { top, bottom } to the first two text blocks (creating if missing).
  const applyCaption = React.useCallback((top?: string, bottom?: string) => {
    setBlocks((prev) => {
      const next = [...prev];
      if (top) {
        if (next[0]) next[0] = { ...next[0], text: top };
        else next.unshift(newTextBlock({ y: 0.1, text: top }));
      }
      if (bottom) {
        if (next[1]) next[1] = { ...next[1], text: bottom };
        else next.push(newTextBlock({ y: 0.9, text: bottom }));
      }
      return next;
    });
  }, []);

  // Vision caption: look at the actual image, write a caption. Used for
  // uploads, selfies, and AI-generated images. Works with blob: URLs (we
  // convert to base64) and http(s) URLs (passed straight to the vision model).
  const captionFromImage = React.useCallback(
    async (url: string, opts: { silent?: boolean } = {}) => {
      setCaptionLoading(true);
      try {
        // For local blob URLs, convert to a base64 data URL so the vision API
        // can actually fetch the bytes. For absolute http(s) URLs, pass through.
        let imagePayload = url;
        if (url.startsWith("blob:") || url.startsWith("/")) {
          const res = await fetch(url);
          const blob = await res.blob();
          imagePayload = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
        const res = await fetch("/api/ai/caption-from-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imagePayload }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { top?: string; bottom?: string };
        applyCaption(data.top, data.bottom);
        if (!opts.silent) toast.success("Caption from image ✍️");
      } catch {
        if (!opts.silent) toast.error("Vision caption flopped. Try again.");
      } finally {
        setCaptionLoading(false);
      }
    },
    [applyCaption],
  );

  // Prompt-based caption (text only). Used when there's no image yet.
  const captionFromPrompt = React.useCallback(async () => {
    setCaptionLoading(true);
    try {
      const res = await fetch("/api/ai/meme-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: prompt }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { top?: string; bottom?: string };
      applyCaption(data.top, data.bottom);
      toast.success("Caption written ✍️");
    } catch {
      toast.error("AI couldn't cook a caption. Try again.");
    } finally {
      setCaptionLoading(false);
    }
  }, [prompt, applyCaption]);

  // The Caption button picks the right tool based on context.
  const onWriteCaption = async () => {
    if (imageUrl) {
      await captionFromImage(imageUrl);
      return;
    }
    if (!prompt.trim()) {
      toast.message("Drop a prompt or an image first, then I'll write a caption.");
      return;
    }
    await captionFromPrompt();
  };

  // Per-block AI rewrite: generates ONE line for the given block, using the
  // other blocks + the current image (vision) as context.
  const rewriteBlock = React.useCallback(
    async (blockId: string) => {
      const targetIndex = blocks.findIndex((b) => b.id === blockId);
      if (targetIndex < 0) return;
      const existing_lines = blocks.map((b) => b.text);
      try {
        let imagePayload: string | undefined = undefined;
        if (imageUrl) {
          if (imageUrl.startsWith("blob:") || imageUrl.startsWith("/")) {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            imagePayload = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } else {
            imagePayload = imageUrl;
          }
        }
        const res = await fetch("/api/ai/rewrite-block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            existing_lines,
            target_index: targetIndex,
            image: imagePayload,
            prompt: prompt || undefined,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { text?: string };
        if (data.text) {
          setBlocks((prev) =>
            prev.map((b) => (b.id === blockId ? { ...b, text: data.text! } : b)),
          );
          toast.success("Block rewritten ✨");
        }
      } catch {
        toast.error("AI couldn't rewrite this block.");
      }
    },
    [blocks, imageUrl, prompt],
  );

  const onPickVariant = (variant: { url: string; seed: number }) => {
    setSelectedVariantSeed(variant.seed);
    setImageUrl(variant.url);
  };

  const onClearImage = () => {
    setImageUrl(null);
    imageElRef.current = null;
    setImageVersion((v) => v + 1);
    setSelectedVariantSeed(null);
  };

  // Cartoonify: take the current image, repaint it in a chosen cartoon style.
  // Two-step pipeline server-side: vision describes the photo → builds a
  // stylized prompt → returns a proxy URL that streams the rendered cartoon.
  const onCartoonify = async () => {
    if (!imageUrl) {
      toast.message("Upload a photo or take a selfie first.");
      return;
    }
    setCartoonifying(true);
    try {
      // Convert blob: URLs to base64 so the vision API can fetch the bytes.
      let imagePayload = imageUrl;
      if (imageUrl.startsWith("blob:") || imageUrl.startsWith("/")) {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        imagePayload = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      const res = await fetch("/api/ai/cartoonify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imagePayload, style: cartoonStyle }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { url: string; description?: string };
      // The proxy URL will start loading via the canvas useEffect.
      setImageUrl(data.url);
      setSelectedVariantSeed(null);
      setVariants([]);
      toast.success(
        `Cartoonifying as ${CARTOON_STYLES.find((s) => s.key === cartoonStyle)?.label ?? cartoonStyle} ✨`,
      );
    } catch {
      toast.error("AI cartoonifier flopped. Try again.");
    } finally {
      setCartoonifying(false);
    }
  };

  const onEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast.message("Give me a rough idea first.");
      return;
    }
    setEnhancing(true);
    try {
      const res = await fetch("/api/ai/image-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: prompt }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { prompt: string };
      if (data.prompt) {
        setPrompt(data.prompt);
        toast.success("Prompt sharpened.");
      }
    } catch {
      toast.error("AI prompt rewrite flopped.");
    } finally {
      setEnhancing(false);
    }
  };

  const onTrending = async () => {
    setTrendingLoading(true);
    try {
      const res = await fetch("/api/ai/trending-meme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        idea: string;
        image_prompt: string;
        top: string;
        bottom: string;
      };
      if (data.image_prompt) setPrompt(data.image_prompt);
      setBlocks([
        newTextBlock({ y: 0.1, text: data.top || "top text" }),
        newTextBlock({ y: 0.9, text: data.bottom || "bottom text" }),
      ]);
      setSelectedId(null);
      setSelectedVariantSeed(null);
      setImageUrl(null);
      imageElRef.current = null;
      const imgRes = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: data.image_prompt, count: 2 }),
      });
      const imgData = (await imgRes.json()) as { variants?: { url: string; seed: number }[] };
      if (imgData.variants) setVariants(imgData.variants);
      toast.success(`Trending: ${data.idea.slice(0, 60)}`);
    } catch {
      toast.error("Trending fetch flopped.");
    } finally {
      setTrendingLoading(false);
    }
  };

  // ============== Upload mode ==============

  const onUploadTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Max 8MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    // reset file input so picking the same file twice still fires onChange
    if (fileRef.current) fileRef.current.value = "";
    // Auto-caption from what's in the photo
    void captionFromImage(url, { silent: true });
  };

  // ============== Text blocks ==============

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  const updateBlock = (id: string, patch: Partial<TextBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const addBlock = () => {
    const fresh = newTextBlock({ x: 0.5, y: 0.5, text: "new text" });
    setBlocks((prev) => [...prev, fresh]);
    setSelectedId(fresh.id);
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // ============== Drag on canvas ==============

  const dragRef = React.useRef<{
    blockId: string;
    pointerId: number;
    startBlockX: number;
    startBlockY: number;
    startClientX: number;
    startClientY: number;
    rect: DOMRect;
    moved: boolean;
  } | null>(null);

  const DRAG_THRESHOLD_PX = 5;

  const onCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const hit = hitTestBlocks(ctx, blocks, canvas.width, canvas.height, px, py);
    if (!hit) {
      // Empty canvas tap: deselect + close any open inline editor
      setSelectedId(null);
      setEditingId(null);
      return;
    }
    const block = blocks.find((b) => b.id === hit);
    if (!block) return;
    setSelectedId(hit);
    // Don't enter edit mode yet — we wait to see if the user drags.
    dragRef.current = {
      blockId: hit,
      pointerId: e.pointerId,
      startBlockX: block.x,
      startBlockY: block.y,
      startClientX: e.clientX,
      startClientY: e.clientY,
      rect,
      moved: false,
    };
    canvas.setPointerCapture(e.pointerId);
  };

  const onCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dxCss = e.clientX - drag.startClientX;
    const dyCss = e.clientY - drag.startClientY;
    // Only treat as a drag if the user moved more than the threshold.
    if (!drag.moved && Math.hypot(dxCss, dyCss) < DRAG_THRESHOLD_PX) {
      return;
    }
    drag.moved = true;
    const dxNorm = dxCss / drag.rect.width;
    const dyNorm = dyCss / drag.rect.height;
    const nextX = Math.max(0.05, Math.min(0.95, drag.startBlockX + dxNorm));
    const nextY = Math.max(0.05, Math.min(0.95, drag.startBlockY + dyNorm));
    updateBlock(drag.blockId, { x: nextX, y: nextY });
  };

  const onCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const drag = dragRef.current;
    if (canvas && drag?.pointerId === e.pointerId) {
      canvas.releasePointerCapture(e.pointerId);
    }
    if (drag && !drag.moved) {
      // Click (no drag) — enter inline edit mode on the block.
      setEditingId(drag.blockId);
    }
    dragRef.current = null;
  };

  // ============== Submit ==============

  const onGenerate = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Render once more without selection chrome
    const ctx = canvas.getContext("2d");
    if (ctx) {
      drawMeme({
        ctx,
        width: canvas.width,
        height: canvas.height,
        image: imageElRef.current,
        blocks,
        selectedId: null,
        darken,
      });
    }
    setSubmitting(true);
    try {
      const blob = await canvasToBlob(canvas);
      const filename = `${DEMO_PROFILE_ID}/memes/${Date.now()}.png`;
      const { error } = await supabase.storage.from(BUCKET).upload(filename, blob, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/png",
      });
      if (error) {
        const msg = error.message || "";
        if (msg.toLowerCase().includes("bucket") || msg.toLowerCase().includes("not found")) {
          toast.error("Create the 'post-media' storage bucket in Supabase first.");
        } else {
          toast.error("Upload failed. Try again.");
        }
        return;
      }
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      // Encode the chosen animation in the URL fragment so the PostCard can
      // replay it without needing a schema change. Browsers strip fragments
      // when fetching, so it doesn't affect image loading.
      const finalUrl =
        animation === "none" ? pub.publicUrl : `${pub.publicUrl}#anim=${animation}`;
      onCreated(finalUrl);
      toast.success("Meme attached. Post it!");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't render the meme.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-glow" /> AI Meme Studio
          </DialogTitle>
          <DialogDescription>
            Describe a scene → AI generates the image → drag text anywhere. Or hit{" "}
            <span className="text-amber">Trending</span> and let AI cook the whole thing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_300px]">
          {/* Left column: canvas + trending CTA */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <canvas
              ref={canvasRef}
              width={MEME_CANVAS_SIZE}
              height={MEME_CANVAS_SIZE}
              className={cn(
                "block aspect-square w-full touch-none select-none cursor-text",
                ANIMATIONS.find((a) => a.key === animation)?.className,
              )}
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onCanvasPointerMove}
              onPointerUp={onCanvasPointerUp}
              onPointerCancel={onCanvasPointerUp}
            />
            <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white/85 backdrop-blur-sm">
              <PenLine className="h-2.5 w-2.5" /> Click any text to edit · drag to move
            </div>

            {/* Inline editor — appears right over the selected block */}
            {editingId &&
              (() => {
                const block = blocks.find((b) => b.id === editingId);
                if (!block) return null;
                return (
                  <InlineTextEditor
                    block={block}
                    onChange={(v) => updateBlock(block.id, { text: v })}
                    onCommit={() => setEditingId(null)}
                  />
                );
              })()}

            {imageLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <Skeleton className="h-12 w-12 rounded-full" />
                <p className="mt-3 text-xs text-muted-foreground">AI is painting…</p>
              </div>
            )}
            {!imageUrl && !imageLoading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
                {generating ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-glow" />
                    <p className="text-xs text-muted-foreground">
                      Cooking 2 variants — tap one on the right when they appear →
                    </p>
                  </div>
                ) : variants.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    👉 Pick one of the variants on the right to use it here.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No image yet. Pick a template, describe a scene, or upload a photo.
                  </p>
                )}
              </div>
            )}
            </div>

            {/* Trending CTA — generates the whole meme (image + caption) from AI's read of recent posts */}
            <div className="rounded-2xl border border-amber/30 bg-gradient-to-r from-amber/10 via-rose/10 to-accent/10 p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber">
                  🔥 Hot right now
                </span>
                <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-semibold text-amber">
                  ZERO EFFORT
                </span>
              </div>
              <Button
                type="button"
                onClick={onTrending}
                disabled={trendingLoading || generating}
                className="w-full bg-gradient-to-r from-amber via-rose to-accent text-black shadow-[0_10px_40px_-8px_rgba(251,113,133,0.5)] hover:shadow-[0_14px_50px_-8px_rgba(251,191,36,0.6)] hover:brightness-110"
              >
                {trendingLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Flame className="h-4 w-4" />
                )}
                {trendingLoading ? "Reading the room…" : "Cook me a trending meme"}
              </Button>
              <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                AI reads what&apos;s landing in the feed → writes the joke → paints
                the image → fills the text. One click.
              </p>
            </div>
          </div>

          {/* Right column: controls */}
          <div className="space-y-4">
            {/* Background — primary way to bring your OWN image: upload or selfie */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-wider text-cyan">
                🖼️ Background
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Upload a photo or take a selfie — AI will caption what it sees.
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  className="px-2"
                >
                  <ImagePlus className="h-3 w-3" />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => setCameraOpen(true)}
                  className="px-2"
                >
                  <Camera className="h-3 w-3" />
                  Selfie
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearImage}
                  disabled={!imageUrl}
                  className="px-2"
                >
                  <Eraser className="h-3 w-3" />
                  Clear
                </Button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onUploadTemplate}
              />

              {/* Cartoonify — one-click stylized repaint of the current image */}
              <div className="mt-3 rounded-xl border border-accent/30 bg-accent/[0.06] p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-accent">
                    🎭 Cartoonify
                  </span>
                  <select
                    value={cartoonStyle}
                    onChange={(e) => setCartoonStyle(e.target.value as CartoonStyle)}
                    className="h-6 rounded-md border border-white/10 bg-black/40 px-1.5 text-[11px] outline-none focus:border-accent/50"
                  >
                    {CARTOON_STYLES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.emoji} {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onCartoonify}
                  disabled={!imageUrl || cartoonifying}
                  className="mt-2 w-full"
                >
                  {cartoonifying ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Smile className="h-3 w-3" />
                  )}
                  {cartoonifying ? "AI is sketching…" : "Cartoonify this image"}
                </Button>
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  AI describes your photo, then repaints it in the chosen style — funnier and more meme-able.
                </p>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Darken</span>
                  <span>{Math.round(darken * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={70}
                  step={1}
                  value={darken * 100}
                  onChange={(e) => setDarken(Number(e.target.value) / 100)}
                  className="mt-1 w-full accent-[#a78bfa]"
                />
              </div>
            </div>

            {/* Reusable meme recipes — 6 classic formats. Each one fills the prompt
                + text-block layout, then triggers normal generation. */}
            <RecipePicker
              onApply={({ prompt: tplPrompt, blocks: tplBlocks, recipe }) => {
                setPrompt(tplPrompt);
                setBlocks(tplBlocks);
                setSelectedId(null);
                setEditingId(null);
                setSelectedVariantSeed(null);
                setImageUrl(null);
                imageElRef.current = null;
                toast.success(`${recipe.label} → generating image…`);
                // Auto-fire generation so the user sees the meme materialize
                // immediately. They can still hit Regenerate for a fresh take.
                void onGenerateVariants(tplPrompt);
              }}
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-wider text-brand-glow">
                ✨ Describe the meme image
              </p>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A capybara in a CEO suit on a yacht, photoreal, golden hour…"
                rows={3}
                maxLength={500}
                className="mt-2 min-h-[80px] text-sm"
              />
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={onEnhancePrompt}
                  disabled={enhancing}
                  className="flex-1"
                >
                  {enhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                  Sharpen
                </Button>
                <Button
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={onWriteCaption}
                  disabled={captionLoading}
                  className="flex-1"
                >
                  {captionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PenLine className="h-3 w-3" />}
                  Caption
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onGenerateVariants()}
                  disabled={generating}
                  className="flex-1"
                >
                  {generating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : variants.length > 0 ? (
                    <RefreshCcw className="h-3 w-3" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {variants.length > 0 ? "Regenerate" : "Generate"}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                💡 <span className="font-medium">Caption</span> writes top + bottom text from your prompt. Both text blocks stay fully editable.
              </p>
            </div>

            {variants.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-wider text-brand-glow">
                  ✨ Pick the funniest
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Two variants render in parallel. Tap one to use as background.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {variants.map((v, i) => (
                    <VariantTile
                      key={v.seed}
                      url={v.url}
                      // Generous stagger — Pollinations queues same-prompt requests
                      delayMs={i * 1500}
                      selected={selectedVariantSeed === v.seed}
                      onClick={() => onPickVariant(v)}
                      onRetry={() => onRetryVariant(v.seed)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-wider text-accent">
                🎬 Animation
              </p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {ANIMATIONS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setAnimation(a.key)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-[11px] font-medium transition",
                      animation === a.key
                        ? "border-accent/60 bg-accent/15 text-foreground ring-2 ring-accent/30"
                        : "border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/10 hover:text-foreground",
                    )}
                  >
                    <span className="text-base leading-none">{a.emoji}</span>
                    {a.label}
                  </button>
                ))}
              </div>
              {animation !== "none" && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Plays in the feed when posted. Preview live above 👆
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-cyan">
                  ✏️ Text blocks · {blocks.length}
                </p>
                <div className="flex items-center gap-1">
                  {imageUrl && (
                    <Button
                      type="button"
                      size="xs"
                      variant="glass"
                      onClick={() => void captionFromImage(imageUrl)}
                      disabled={captionLoading}
                      className="h-7"
                      title="Re-caption from the image"
                    >
                      {captionLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                      Vision
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="xs"
                    variant="glass"
                    onClick={addBlock}
                    className="h-7"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>
              </div>
              {captionLoading ? (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-brand-glow">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  AI is reading the image…
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Click any text on the canvas → edit it here. Drag to reposition.
                </p>
              )}
            </div>

            {selectedBlock ? (
              <BlockInspector
                key={selectedBlock.id}
                block={selectedBlock}
                onChange={(patch) => updateBlock(selectedBlock.id, patch)}
                onDelete={() => deleteBlock(selectedBlock.id)}
                onAiRewrite={() => rewriteBlock(selectedBlock.id)}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-3 text-center">
                <p className="text-[11px] text-muted-foreground">
                  No block selected.
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Click any text on the canvas to edit it inline.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-4">
          <p className="text-[11px] text-muted-foreground">
            <TypeIcon className="mr-1 inline h-3 w-3" />
            Pro tip: click empty canvas to deselect.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={onGenerate} disabled={submitting || !imageUrl}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Attach to post
            </Button>
          </div>
        </div>
      </DialogContent>

      <WebcamCaptureDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={(url) => {
          setImageUrl(url);
          setSelectedVariantSeed(null);
          // Auto-caption from the selfie / camera frame
          void captionFromImage(url, { silent: true });
        }}
      />
    </Dialog>
  );
}

// ----------------- Block inspector -----------------

function BlockInspector({
  block,
  onChange,
  onDelete,
  onAiRewrite,
}: {
  block: TextBlock;
  onChange: (patch: Partial<TextBlock>) => void;
  onDelete: () => void;
  onAiRewrite: () => Promise<void> | void;
}) {
  const [rewriting, setRewriting] = React.useState(false);
  const handleAi = async () => {
    setRewriting(true);
    try {
      await onAiRewrite();
    } finally {
      setRewriting(false);
    }
  };
  return (
    <div className="space-y-3 rounded-2xl border border-brand/40 bg-brand/5 p-3 ring-1 ring-brand/30">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-brand-glow">Editing block</p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="xs"
            variant="glass"
            onClick={handleAi}
            disabled={rewriting}
            title="Ask AI to rewrite this block"
          >
            {rewriting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            AI
          </Button>
          <Button type="button" size="xs" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-3 w-3" /> Delete
          </Button>
        </div>
      </div>

      <Input
        autoFocus
        value={block.text}
        onChange={(e) => onChange({ text: e.target.value })}
        onFocus={(e) => e.target.select()}
        placeholder="Type here…"
        maxLength={200}
        className="h-10"
      />

      <div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Size</span>
          <span>{Math.round(block.fontSize * 100)}</span>
        </div>
        <input
          type="range"
          min={3}
          max={18}
          step={0.5}
          value={block.fontSize * 100}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) / 100 })}
          className="mt-1 w-full accent-[#a78bfa]"
        />
      </div>

      <div className="flex items-center gap-2">
        <AlignButton
          active={block.align === "left"}
          onClick={() => onChange({ align: "left" })}
          icon={<AlignLeft className="h-3 w-3" />}
        />
        <AlignButton
          active={block.align === "center"}
          onClick={() => onChange({ align: "center" })}
          icon={<AlignCenter className="h-3 w-3" />}
        />
        <AlignButton
          active={block.align === "right"}
          onClick={() => onChange({ align: "right" })}
          icon={<AlignRight className="h-3 w-3" />}
        />
        <label className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            className="accent-[#a78bfa]"
            checked={block.upper}
            onChange={(e) => onChange({ upper: e.target.checked })}
          />
          CAPS
        </label>
        <label className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            className="accent-[#a78bfa]"
            checked={block.stroke}
            onChange={(e) => onChange({ stroke: e.target.checked })}
          />
          Stroke
        </label>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-muted-foreground">Color</label>
          <input
            type="color"
            value={block.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-7 w-10 cursor-pointer rounded border border-white/10 bg-transparent p-0"
          />
          <div className="ml-1 flex gap-1">
            {["#ffffff", "#000000", "#fbbf24", "#22d3ee", "#fb7185", "#a78bfa"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ color: c })}
                className={cn(
                  "h-6 w-6 rounded-full border transition-transform",
                  block.color.toLowerCase() === c
                    ? "border-brand ring-2 ring-brand/40 scale-110"
                    : "border-white/15",
                )}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating textarea that overlays the canvas at the block's position.
// Lets users edit text *directly on the meme* instead of via the side panel.
function InlineTextEditor({
  block,
  onChange,
  onCommit,
}: {
  block: TextBlock;
  onChange: (v: string) => void;
  onCommit: () => void;
}) {
  const ref = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Focus + place caret at the end so the user can immediately type to extend
    // OR select-all and replace.
    el.focus();
    el.select();
  }, []);

  // Approximate the on-canvas font size in CSS px relative to the displayed
  // canvas width. The displayed canvas always matches its container so its
  // CSS width = the wrapper width. We position via percentages and size via cqw
  // (container query width) so the editor scales with the canvas.
  const widthPct = 88; // leaves ~6% padding on each side, same as canvas wrap

  const stop = (e: React.PointerEvent | React.MouseEvent) => {
    // Don't let pointer events on the editor bubble to the canvas
    // (which would deselect / move the block).
    e.stopPropagation();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey)) {
      e.preventDefault();
      onCommit();
    }
  };

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 5 }}
    >
      <div
        className="absolute pointer-events-auto"
        style={{
          left: "50%",
          top: `${block.y * 100}%`,
          transform: "translate(-50%, -50%)",
          width: `${widthPct}%`,
        }}
        onPointerDown={stop}
        onMouseDown={stop}
      >
        <textarea
          ref={ref}
          value={block.text}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={onKeyDown}
          rows={2}
          className="w-full resize-none rounded-lg border-2 border-brand/70 bg-black/60 px-2 py-1 text-center text-white outline-none ring-2 ring-brand/30 backdrop-blur-sm placeholder:text-white/40"
          style={{
            fontFamily: 'Impact, "Anton", "Arial Black", "Helvetica Neue", sans-serif',
            fontWeight: 900,
            letterSpacing: "-0.01em",
            // Match the on-canvas font size as closely as we can: block.fontSize is
            // a fraction of canvas width, the canvas is 100% wide in CSS, so
            // fontSize in cqw is roughly equivalent.
            fontSize: `${block.fontSize * 100}cqw`,
            lineHeight: 1.05,
            color: block.color,
            WebkitTextStroke: block.stroke ? "1px black" : undefined,
            paintOrder: "stroke fill",
            textTransform: block.upper ? "uppercase" : undefined,
          }}
          placeholder="type your text…"
        />
        <p className="mt-1 text-center text-[10px] text-white/70" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
          enter to save · esc to cancel · click outside to commit
        </p>
      </div>
    </div>
  );
}

function VariantTile({
  url,
  selected,
  onClick,
  onRetry,
  delayMs = 0,
}: {
  url: string;
  selected: boolean;
  onClick: () => void;
  onRetry: () => void;
  delayMs?: number;
}) {
  // Stagger only on the FIRST load. After that (including retries) load instantly.
  const firstLoadRef = React.useRef(true);
  const [state, setState] = React.useState<"queued" | "loading" | "ready" | "error">(
    delayMs > 0 ? "queued" : "loading",
  );
  const [src, setSrc] = React.useState<string | null>(
    delayMs > 0 && firstLoadRef.current ? null : url,
  );
  // Auto-retry counter: we silently retry once when Pollinations 502s,
  // before surfacing the manual retry button.
  const autoRetriesRef = React.useRef(0);
  const [busterNonce, setBusterNonce] = React.useState(0);

  React.useEffect(() => {
    const isFirst = firstLoadRef.current;
    const effectiveDelay = isFirst ? delayMs : 0;
    autoRetriesRef.current = 0;
    setBusterNonce(0);
    setState(effectiveDelay > 0 ? "queued" : "loading");
    setSrc(effectiveDelay > 0 ? null : url);
    if (effectiveDelay > 0) {
      const t = setTimeout(() => {
        setSrc(url);
        setState("loading");
        firstLoadRef.current = false;
      }, effectiveDelay);
      return () => clearTimeout(t);
    }
    firstLoadRef.current = false;
  }, [url, delayMs]);

  // Hard client-side timeout: if a tile is still in "loading" after 60s
  // (the proxy's max attempt cycle is ~75s but most fail much faster), flip
  // to error so the user can manually retry.
  React.useEffect(() => {
    if (state !== "loading") return;
    const t = setTimeout(() => {
      setState((prev) => (prev === "loading" ? "error" : prev));
    }, 60_000);
    return () => clearTimeout(t);
  }, [state, src, busterNonce]);

  const onImgError = () => {
    if (autoRetriesRef.current < 1) {
      autoRetriesRef.current += 1;
      // Retry once after a short delay with a cache-buster nonce so the browser
      // doesn't reuse the cached error response. Same seed, same upstream URL.
      setTimeout(() => {
        setBusterNonce((n) => n + 1);
        setState("loading");
      }, 1500);
      return;
    }
    setState("error");
  };

  const finalSrc = src ? `${src}${src.includes("?") ? "&" : "?"}n=${busterNonce}` : "";

  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRetry();
  };

  const idle = state === "queued" || state === "loading";
  const interactive = state === "ready";

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={interactive ? 0 : -1}
      aria-disabled={!interactive}
      aria-pressed={selected}
      onClick={interactive ? onClick : undefined}
      onKeyDown={onKeyDown}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl border transition-all outline-none",
        selected
          ? "border-brand ring-2 ring-brand/50 scale-[0.98]"
          : "border-white/10 hover:border-white/30",
        interactive
          ? "cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/40"
          : "cursor-default",
      )}
    >
      {idle && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/[0.03]">
          <Loader2 className="h-5 w-5 animate-spin text-brand-glow" />
          {state === "queued" && (
            <span className="text-[10px] text-muted-foreground">queued…</span>
          )}
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-danger/10 px-2 text-center">
          <span className="text-[10px] text-danger">image was slow</span>
          <button
            type="button"
            onClick={handleRetryClick}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-foreground hover:bg-white/20"
          >
            <RefreshCcw className="h-2.5 w-2.5" /> retry with new seed
          </button>
        </div>
      )}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${src}-${busterNonce}`}
          src={finalSrc}
          alt="meme variant"
          loading="eager"
          onLoad={() => setState("ready")}
          onError={onImgError}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            state === "ready" ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {selected && (
        <div className="absolute right-1.5 top-1.5 rounded-full bg-brand p-1 text-white shadow-lg">
          <CheckCircle2 className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}

function AlignButton({
  active,
  icon,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
        active
          ? "border-brand/60 bg-brand/15 text-foreground"
          : "border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/10",
      )}
    >
      {icon}
    </button>
  );
}
