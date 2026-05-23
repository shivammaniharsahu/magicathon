// Streaming image proxy. The browser hits this same-origin URL, we fetch
// from Pollinations server-side with retries and a model fallback, then
// stream the bytes back.
//
// Accepts:
//   ?prompt=…           the image prompt (required)
//   ?seed=42            random seed
//   ?model=flux|turbo   starting model (turbo is ~3-5x faster; flux is higher quality)
//   ?w=640&h=640        upstream render dimensions (default 720×720). Smaller = faster.
//   ?enhance=false      skip Pollinations' server-side LLM prompt-enhance pass
//                       (enhance adds latency; off when our prompts are already well-formed).
//
// Usage:
//   <img src="/api/ai/image-proxy?prompt=...&seed=42&model=turbo&w=512&h=512&enhance=false" />

export const runtime = "edge";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

type Model = "flux" | "turbo";

interface Attempt {
  model: Model;
  timeoutMs: number;
}

// Multi-attempt plan. Pollinations is flaky — sometimes 502s fast, sometimes
// takes 60+s. The right move is more attempts with a sleep between them so
// we give Pollinations a chance to recover, instead of hammering it.
//
// Note: `turbo` used to be a fast alternative model but is now paywalled
// (HTTP 402). Calls that select turbo will fast-fail; we still try one turbo
// attempt as a sanity probe, but the chain otherwise stays on flux.
function attemptsFor(starting: Model): Attempt[] {
  if (starting === "turbo") {
    return [
      { model: "turbo", timeoutMs: 6_000 },
      { model: "flux", timeoutMs: 25_000 },
      { model: "flux", timeoutMs: 20_000 },
      { model: "flux", timeoutMs: 18_000 },
    ];
  }
  return [
    { model: "flux", timeoutMs: 25_000 },
    { model: "flux", timeoutMs: 20_000 },
    { model: "flux", timeoutMs: 18_000 },
    { model: "flux", timeoutMs: 15_000 },
  ];
}

// Default short backoff between attempts. When Pollinations returns 402
// "queue full" we extend this on-the-fly so the upstream rate-limit window
// has time to clear before we knock again.
const SLEEP_BETWEEN_ATTEMPTS_MS = 1500;
const SLEEP_AFTER_QUEUE_FULL_MS = 4000;

function buildPollinationsUrl(
  prompt: string,
  model: Model,
  seed: number,
  opts: { width: number; height: number; enhance: boolean },
) {
  const params = new URLSearchParams({
    width: String(opts.width),
    height: String(opts.height),
    seed: String(seed),
    model,
    nologo: "true",
    enhance: opts.enhance ? "true" : "false",
    private: "true",
  });
  return `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;
}

function clampDim(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(256, Math.min(1024, n));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get("prompt");
  const seedParam = searchParams.get("seed");
  const modelParam = searchParams.get("model");

  if (!prompt) {
    return new Response("missing prompt", { status: 400 });
  }
  const seed = seedParam ? parseInt(seedParam, 10) : Math.floor(Math.random() * 1_000_000);
  const starting: Model = modelParam === "turbo" ? "turbo" : "flux";
  const width = clampDim(searchParams.get("w"), 720);
  const height = clampDim(searchParams.get("h"), 720);
  const enhance = searchParams.get("enhance") !== "false";

  let lastErr: string | null = null;
  let lastWasQueueFull = false;
  const attempts = attemptsFor(starting);

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i]!;

    // Sleep between attempts (skipping the first) — Pollinations needs a
    // breather, otherwise hammering it just yields repeated 502s. After a
    // 402 "queue full" we wait longer so the upstream limit window clears.
    if (i > 0) {
      const sleep = lastWasQueueFull
        ? SLEEP_AFTER_QUEUE_FULL_MS
        : SLEEP_BETWEEN_ATTEMPTS_MS;
      await new Promise((r) => setTimeout(r, sleep));
    }

    const url = buildPollinationsUrl(prompt, attempt.model, seed, { width, height, enhance });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), attempt.timeoutMs);

    try {
      const upstream = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "MagicAthonProxy/1.0 (+https://magicathon.app)" },
      });
      clearTimeout(timer);

      if (!upstream.ok || !upstream.body) {
        lastErr = `${attempt.model} returned ${upstream.status}`;
        lastWasQueueFull = upstream.status === 402;
        continue;
      }
      lastWasQueueFull = false;

      const contentType = upstream.headers.get("Content-Type") ?? "image/jpeg";
      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          "X-Generated-Model": attempt.model,
          "X-Generated-Seed": String(seed),
          "X-Attempts": String(i + 1),
        },
      });
    } catch (err) {
      clearTimeout(timer);
      lastErr =
        (err as Error).name === "AbortError"
          ? `${attempt.model} timed out after ${attempt.timeoutMs}ms`
          : `${attempt.model} threw: ${(err as Error).message}`;
      continue;
    }
  }

  return new Response(
    JSON.stringify({ error: "all image attempts failed", lastError: lastErr }),
    { status: 502, headers: { "Content-Type": "application/json" } },
  );
}
