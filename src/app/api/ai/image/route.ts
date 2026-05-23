import { NextResponse } from "next/server";
import { z } from "zod";

// Returns N variant image URLs. Each URL is same-origin and points to
// /api/ai/image-proxy which streams the bytes from Pollinations server-side
// with retry + model fallback. We don't fetch anything here — just hand back
// stable URLs so the browser can load all variants in parallel.

export const runtime = "edge";

const schema = z.object({
  prompt: z.string().trim().min(1).max(500),
  count: z.number().int().min(1).max(8).default(2),
  // Optional fixed seed — if provided, all variants get THIS seed and only differ by model.
  // For "regenerate" we omit it and roll N random seeds.
  seed: z.number().int().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { prompt, count } = parsed.data;

  // Alternate models across variants so parallel requests hit different
  // upstream queues. Flux = higher quality, Turbo = faster.
  const MODELS = ["flux", "turbo"] as const;

  const variants = Array.from({ length: count }, (_, i) => {
    const seed = parsed.data.seed ?? Math.floor(Math.random() * 1_000_000);
    const model = MODELS[i % MODELS.length]!;
    const params = new URLSearchParams({
      prompt,
      seed: String(seed + i),
      model,
    });
    return {
      seed: seed + i,
      model,
      url: `/api/ai/image-proxy?${params.toString()}`,
    };
  });

  return NextResponse.json({ variants, prompt });
}
