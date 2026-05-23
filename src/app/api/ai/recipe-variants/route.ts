import { NextResponse } from "next/server";
import { MEME_RECIPES, applyRecipe } from "@/lib/meme/recipes";

// Returns 6 Pollinations URLs (one per recipe) so the browser can start
// rendering tiles immediately. NO vision call here — the recipe prompts
// don't have slot placeholders, so the URLs don't depend on slot values.
// Vision-derived caption text comes from /api/ai/recipe-slots in parallel,
// and the client merges it in when ready.
//
// Why split: vision was a ~5s blocking step BEFORE tiles started loading.
// Tiles now start the moment the user uploads.

export const runtime = "edge";

// All 6 tiles render via Pollinations flux with enhance disabled.
//
// Why these knobs:
// - `turbo` is now paywalled (HTTP 402) so we can't use it.
// - `enhance=true` is the real bottleneck: empirically times out at 60s+
//   while `enhance=false` returns in ~2-3s. Our prompts are already
//   well-engineered upstream, so the LLM enhance step adds latency without
//   improving the result much for these recipe scenes.
// - 720x720 matches the canvas display size — no reason to render smaller.
const TILE_MODEL = "flux";
const TILE_WIDTH = 720;
const TILE_HEIGHT = 720;

// POST with no body needed — recipe prompts are fixed, so URLs are
// derivable from MEME_RECIPES alone. The endpoint stays POST for symmetry
// with the prior signature and so future per-call tweaks (e.g. seed pinning)
// can carry a body without breaking the client.
export async function POST() {
  const variants = MEME_RECIPES.map((recipe) => {
    // Apply with empty slots so the prompt uses the recipe's own defaults.
    // The applied.prompt is what Pollinations renders.
    const applied = applyRecipe(recipe, {});
    const seed = Math.floor(Math.random() * 1_000_000);
    const params = new URLSearchParams({
      prompt: applied.prompt,
      seed: String(seed),
      model: TILE_MODEL,
      w: String(TILE_WIDTH),
      h: String(TILE_HEIGHT),
      enhance: "false",
    });
    return {
      recipeId: recipe.id,
      label: recipe.label,
      emoji: recipe.emoji,
      // Slots start empty — the client overlays vision-derived text once
      // /api/ai/recipe-slots returns, falling back to placeholders otherwise.
      slots: {} as Record<string, string>,
      prompt: applied.prompt,
      seed,
      model: TILE_MODEL,
      url: `/api/ai/image-proxy?${params.toString()}`,
    };
  });

  return NextResponse.json({ variants });
}
