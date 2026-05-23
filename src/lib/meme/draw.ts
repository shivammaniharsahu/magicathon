// Canvas helpers for the meme generator.
// Supports an optional background image + N draggable text blocks.

import type { TextBlock } from "./types";

export const MEME_CANVAS_SIZE = 720;

export interface DrawMemeOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  image: HTMLImageElement | null; // null = gradient background
  blocks: TextBlock[];
  watermark?: boolean;
  selectedId?: string | null;
  darken?: number; // 0..1 — additional black overlay over the background
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for true cross-origin URLs. blob:, data:, and
    // same-origin URLs either don't need CORS or actively fail with it set
    // (the browser rejects the load when no CORS response headers exist).
    const isCrossOrigin =
      /^https?:\/\//.test(src) &&
      typeof window !== "undefined" &&
      !src.startsWith(window.location.origin);
    if (isCrossOrigin) {
      img.crossOrigin = "anonymous";
    }
    img.referrerPolicy = "no-referrer";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = w / h;
  let sx = 0,
    sy = 0,
    sw = img.naturalWidth,
    sh = img.naturalHeight;
  if (imgRatio > canvasRatio) {
    const desiredWidth = img.naturalHeight * canvasRatio;
    sx = (img.naturalWidth - desiredWidth) / 2;
    sw = desiredWidth;
  } else {
    const desiredHeight = img.naturalWidth / canvasRatio;
    sy = (img.naturalHeight - desiredHeight) / 2;
    sh = desiredHeight;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
}

function drawGradientBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#1e1640");
  g.addColorStop(0.5, "#3a1f6b");
  g.addColorStop(1, "#0d0a1f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let y = 16; y < h; y += 24) {
    for (let x = 16; x < w; x += 24) {
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }
}

function memeFont(size: number) {
  return `900 ${size}px Impact, "Anton", "Arial Black", "Helvetica Neue", sans-serif`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0]!;
  for (let i = 1; i < words.length; i++) {
    const tentative = current + " " + words[i];
    if (ctx.measureText(tentative).width <= maxWidth) current = tentative;
    else {
      lines.push(current);
      current = words[i]!;
    }
  }
  lines.push(current);
  return lines;
}

// Measured layout for one block — used by both renderer and drag hit-testing.
export interface BlockLayout {
  blockId: string;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  fontSizePx: number;
  lines: string[];
}

export function layoutBlock(
  ctx: CanvasRenderingContext2D,
  block: TextBlock,
  canvasWidth: number,
  canvasHeight: number,
): BlockLayout {
  const fontSizePx = Math.max(14, Math.round(block.fontSize * canvasWidth));
  const padX = canvasWidth * 0.04;
  const maxTextWidth = canvasWidth - padX * 2;
  ctx.font = memeFont(fontSizePx);
  const display = block.upper ? block.text.toUpperCase() : block.text;
  const lines = wrapLines(ctx, display, maxTextWidth);
  const widest = lines.length
    ? Math.max(...lines.map((l) => ctx.measureText(l).width))
    : 0;
  const lineHeight = fontSizePx * 1.05;
  const totalHeight = Math.max(lineHeight, lines.length * lineHeight);
  return {
    blockId: block.id,
    centerX: block.x * canvasWidth,
    centerY: block.y * canvasHeight,
    width: widest,
    height: totalHeight,
    fontSizePx,
    lines,
  };
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  block: TextBlock,
  layout: BlockLayout,
  highlighted: boolean,
) {
  ctx.font = memeFont(layout.fontSizePx);
  ctx.textAlign = block.align;
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  const stroke = Math.max(3, layout.fontSizePx * 0.12);

  // Block reference X for textAlign rendering
  let anchorX = layout.centerX;
  if (block.align === "left") anchorX = layout.centerX - layout.width / 2;
  if (block.align === "right") anchorX = layout.centerX + layout.width / 2;
  const topY = layout.centerY - layout.height / 2;
  const lineHeight = layout.fontSizePx * 1.05;

  layout.lines.forEach((line, i) => {
    const y = topY + i * lineHeight;
    if (block.stroke) {
      ctx.lineWidth = stroke;
      ctx.strokeStyle = "rgba(0,0,0,0.95)";
      ctx.strokeText(line, anchorX, y);
    }
    ctx.fillStyle = block.color;
    ctx.fillText(line, anchorX, y);
  });

  if (highlighted) {
    const padding = layout.fontSizePx * 0.2;
    ctx.save();
    ctx.strokeStyle = "rgba(167,139,250,0.9)";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.strokeRect(
      layout.centerX - layout.width / 2 - padding,
      layout.centerY - layout.height / 2 - padding,
      layout.width + padding * 2,
      layout.height + padding * 2,
    );
    ctx.restore();
  }
}

export function drawMeme({
  ctx,
  width,
  height,
  image,
  blocks,
  watermark = true,
  selectedId = null,
  darken = 0,
}: DrawMemeOptions) {
  ctx.clearRect(0, 0, width, height);

  if (image) {
    drawCoverImage(ctx, image, width, height);
  } else {
    drawGradientBackground(ctx, width, height);
  }

  if (darken > 0) {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, darken)})`;
    ctx.fillRect(0, 0, width, height);
  }

  // Soft top + bottom gradients so white text always reads.
  const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.4);
  topGrad.addColorStop(0, "rgba(0,0,0,0.45)");
  topGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, height * 0.4);
  const botGrad = ctx.createLinearGradient(0, height * 0.6, 0, height);
  botGrad.addColorStop(0, "rgba(0,0,0,0)");
  botGrad.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, height * 0.6, width, height * 0.4);

  for (const block of blocks) {
    const layout = layoutBlock(ctx, block, width, height);
    drawBlock(ctx, block, layout, block.id === selectedId);
  }

  if (watermark) {
    ctx.font = "500 14px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("✨ MagicAthon", width - 12, height - 8);
  }
}

// Returns the topmost block id (last in array drawn last) whose bbox contains the point.
export function hitTestBlocks(
  ctx: CanvasRenderingContext2D,
  blocks: TextBlock[],
  canvasWidth: number,
  canvasHeight: number,
  pointX: number,
  pointY: number,
): string | null {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const layout = layoutBlock(ctx, blocks[i]!, canvasWidth, canvasHeight);
    const pad = layout.fontSizePx * 0.25;
    const left = layout.centerX - layout.width / 2 - pad;
    const right = layout.centerX + layout.width / 2 + pad;
    const top = layout.centerY - layout.height / 2 - pad;
    const bottom = layout.centerY + layout.height / 2 + pad;
    if (pointX >= left && pointX <= right && pointY >= top && pointY <= bottom) {
      return blocks[i]!.id;
    }
  }
  return null;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas toBlob returned null"));
      },
      "image/png",
      0.92,
    );
  });
}
