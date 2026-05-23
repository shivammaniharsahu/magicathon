import { NextResponse } from "next/server";
import { z } from "zod";
import { chat } from "@/lib/openrouter/client";
import { RECIPE_SLOTS_FROM_IMAGE_SYSTEM } from "@/lib/openrouter/prompts";
import { MEME_RECIPES } from "@/lib/meme/recipes";

// Vision-derived slot values for the 6 recipe templates. Runs the OpenRouter
// vision call ONCE against an uploaded photo and returns slot values keyed
// by recipeId. Decoupled from /api/ai/recipe-variants so tile rendering
// doesn't wait on this — the client merges the result in when it arrives.
//
// If the vision call fails (bad API key, OpenRouter down, parse error), we
// return 200 with an empty `slotsByRecipe` and a `visionError` for the UI
// to surface. The feature still works on placeholder text.

export const runtime = "edge";

const schema = z.object({
  image: z
    .string()
    .min(10)
    .refine(
      (v) => v.startsWith("data:image/") || v.startsWith("http://") || v.startsWith("https://"),
      "image must be a data URL or http(s) URL",
    ),
});

const RECIPE_BRIEF = MEME_RECIPES.map((r) => ({
  id: r.id,
  format: r.format,
  description: r.description,
  slots: r.slots.map((s) => ({ key: s.key, label: s.label, hint: s.placeholder })),
}));

function parseSlotsJson(raw: string): Record<string, Record<string, string>> {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed: unknown = JSON.parse(cleaned);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("vision did not return an object");
  }
  const out: Record<string, Record<string, string>> = {};
  for (const [recipeId, slotMap] of Object.entries(parsed as Record<string, unknown>)) {
    if (!slotMap || typeof slotMap !== "object") continue;
    const inner: Record<string, string> = {};
    for (const [k, v] of Object.entries(slotMap as Record<string, unknown>)) {
      if (typeof v === "string") inner[k] = v.slice(0, 120);
    }
    out[recipeId] = inner;
  }
  return out;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let slotsByRecipe: Record<string, Record<string, string>> = {};
  let visionError: string | null = null;

  try {
    const text = await chat({
      messages: [
        { role: "system", content: RECIPE_SLOTS_FROM_IMAGE_SYSTEM },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Recipes:\n${JSON.stringify(RECIPE_BRIEF)}\n\nLook at the image and return the slot-values JSON now.`,
            },
            {
              type: "image_url",
              image_url: { url: parsed.data.image, detail: "low" },
            },
          ],
        },
      ],
      temperature: 0.85,
      max_tokens: 700,
    });
    try {
      slotsByRecipe = parseSlotsJson(text);
    } catch {
      visionError = "vision returned unparseable JSON";
      // eslint-disable-next-line no-console
      console.warn("[recipe-slots] vision JSON parse failed; returning empty slots");
    }
  } catch (err) {
    visionError = (err as Error).message || "vision call failed";
    // eslint-disable-next-line no-console
    console.warn(`[recipe-slots] vision call failed: ${visionError}`);
  }

  return NextResponse.json({ slotsByRecipe, visionError });
}
