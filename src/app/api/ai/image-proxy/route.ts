// Streaming image proxy. The browser hits this same-origin URL, we fetch
// from Pollinations server-side with retries and a model fallback, then
// stream the bytes back.
//
// Now accepts ?model=flux|turbo to choose the *starting* model. Splitting
// variants across models lets two parallel calls hit different upstream queues.
//
// Usage:
//   <img src="/api/ai/image-proxy?prompt=...&seed=42&model=flux" />

export const runtime = "edge";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

type Model = "flux" | "turbo";

interface Attempt {
  model: Model;
  timeoutMs: number;
}

// Multi-attempt plan. Pollinations is flaky — sometimes 502s fast, sometimes
// takes 60+s. The right move is more attempts with a short sleep between them
// so we give Pollinations a chance to recover, instead of hammering it.
function attemptsFor(starting: Model): Attempt[] {
  if (starting === "turbo") {
    return [
      { model: "turbo", timeoutMs: 18_000 },
      { model: "flux", timeoutMs: 22_000 },
      { model: "turbo", timeoutMs: 18_000 },
      { model: "flux", timeoutMs: 18_000 },
    ];
  }
  return [
    { model: "flux", timeoutMs: 22_000 },
    { model: "turbo", timeoutMs: 18_000 },
    { model: "flux", timeoutMs: 18_000 },
    { model: "turbo", timeoutMs: 15_000 },
  ];
}

const SLEEP_BETWEEN_ATTEMPTS_MS = 1500;

function buildPollinationsUrl(prompt: string, model: Model, seed: number) {
  const params = new URLSearchParams({
    width: "720",
    height: "720",
    seed: String(seed),
    model,
    nologo: "true",
    enhance: "true",
    private: "true",
  });
  return `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;
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

  let lastErr: string | null = null;
  const attempts = attemptsFor(starting);

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i]!;

    // Sleep between attempts (skipping the first) — Pollinations needs a
    // breather, otherwise hammering it just yields repeated 502s.
    if (i > 0) {
      await new Promise((r) => setTimeout(r, SLEEP_BETWEEN_ATTEMPTS_MS));
    }

    const url = buildPollinationsUrl(prompt, attempt.model, seed);
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
        continue;
      }

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
