import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, OpenRouterError } from "@/lib/openrouter/client";
import { CARTOONIFY_DESCRIBE_SYSTEM } from "@/lib/openrouter/prompts";

// Cartoonify pipeline:
//   1. Vision call: gpt-4o-mini describes the image (subject + pose + setting).
//   2. Build a Pollinations prompt: <description>, <style modifiers> intended
//      to produce a funny, exaggerated cartoon version of the subject.
//   3. Return the proxy URL — the browser loads that URL and the proxy
//      streams the rendered image from Pollinations.
//
// The endpoint itself does NOT render the image (no waiting on Pollinations),
// just hands back a stable URL. The canvas + image-proxy flow handles the
// heavy lift, identical to the trending/generate flows.

export const runtime = "edge";

type Style =
  | "cartoon"
  | "anime"
  | "pixar"
  | "caricature"
  | "vector"
  | "claymation";

const STYLE_MODIFIERS: Record<Style, string> = {
  cartoon:
    "vibrant cartoon illustration, bold outlines, comically exaggerated facial features, expressive wide eyes, animated tv show style, saturated colors, hyperdetailed, clean rendered",
  anime:
    "anime style illustration, ghibli inspired, soft expressive features, cel-shaded, vibrant colors, dynamic pose, comedic energy",
  pixar:
    "pixar style 3d cartoon, exaggerated comically expressive features, vibrant saturated colors, cinematic studio lighting, polished render, animated movie still",
  caricature:
    "comic caricature drawing, hilariously exaggerated features, ink and watercolor, bold strokes, playful, funny, cartoonish proportions",
  vector:
    "flat vector illustration, minimalist geometric shapes, bright cheerful palette, simple lines, modern animation style, funny",
  claymation:
    "claymation stop-motion style, plasticine textures, slightly lopsided features, cozy quirky vibes, warm lighting, exaggerated comedic expression",
};

const schema = z.object({
  image: z
    .string()
    .min(10)
    .refine(
      (v) => v.startsWith("data:image/") || v.startsWith("http://") || v.startsWith("https://"),
      "image must be a data URL or http(s) URL",
    ),
  style: z
    .enum(["cartoon", "anime", "pixar", "caricature", "vector", "claymation"])
    .default("pixar"),
});

function buildProxyUrl(prompt: string) {
  const seed = Math.floor(Math.random() * 1_000_000);
  const params = new URLSearchParams({
    prompt,
    seed: String(seed),
    model: "flux",
  });
  return {
    seed,
    url: `/api/ai/image-proxy?${params.toString()}`,
  };
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    // Step 1: describe the image plainly
    const description = await chat({
      messages: [
        { role: "system", content: CARTOONIFY_DESCRIBE_SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this photo for repainting as a cartoon. One sentence." },
            { type: "image_url", image_url: { url: parsed.data.image, detail: "low" } },
          ],
        },
      ],
      temperature: 0.4,
      max_tokens: 120,
    });

    const cleanedDesc = description
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 260);

    // Step 2: build the stylized prompt
    const style = parsed.data.style;
    const fullPrompt = `${cleanedDesc}, ${STYLE_MODIFIERS[style as Style]}, no text, no captions, no writing`.slice(
      0,
      500,
    );

    // Step 3: return the proxy URL (client will <img src> it)
    const { url, seed } = buildProxyUrl(fullPrompt);
    return NextResponse.json({
      url,
      seed,
      style,
      description: cleanedDesc,
      prompt: fullPrompt,
    });
  } catch (err) {
    const status = err instanceof OpenRouterError ? err.status : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
