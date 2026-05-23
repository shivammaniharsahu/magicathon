<h1 align="center">MagicAthon ✨</h1>

<p align="center">
  <strong>Post anything. Make everyone laugh. 😂</strong><br>
  An AI-native social platform built for memes, laughter, and zero corporate energy.
</p>

<p align="center">
  <a href="https://magicathon-silk.vercel.app/"><img alt="Live demo" src="https://img.shields.io/badge/▲%20Live%20demo-magicathon--silk.vercel.app-fbbf24?style=for-the-badge&labelColor=0d0a1f"></a>
  <a href="https://github.com/shivammaniharsahu/magicathon"><img alt="GitHub" src="https://img.shields.io/badge/source-shivammaniharsahu%2Fmagicathon-8b5cf6?style=for-the-badge&labelColor=0d0a1f&logo=github"></a>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=for-the-badge&logo=typescript&logoColor=white">
</p>

<p align="center">
  <em>Built solo, in a hackathon — every interactive surface is helped by AI.</em>
</p>

<!-- =================  HERO  ================= -->
<p align="center">
  <a href="https://magicathon-silk.vercel.app/">
    <img src="docs/screenshots/01-hero.png" alt="MagicAthon landing page" width="900" />
  </a>
</p>

<p align="center">
  👉 <strong><a href="https://magicathon-silk.vercel.app/">magicathon-silk.vercel.app</a></strong>
</p>

---

## 🎬 60-second walkthrough

<!-- Drop your demo video file into this README on GitHub (drag-and-drop) and
     replace the src below with the user-images.githubusercontent.com URL it gives you.
     If using a local file, commit to docs/videos/demo.mp4 first. -->

https://github.com/shivammaniharsahu/magicathon/assets/REPLACE_WITH_VIDEO_URL_AFTER_DRAG_DROP/demo.mp4

> **No video yet?** Replace the line above with a GIF or use the live link.
> The fastest way: edit this README on github.com → drag your `.mp4` into the editor → GitHub generates a URL → paste it in place of the line above.

---

## What is this?

MagicAthon is an **AI-native social platform built for memes and laughter**. Think Instagram + Reddit + a comedy coach — except every part of the app is helped by AI:

- 🎨 **AI Meme Studio** — describe a scene → AI generates the image. Upload a photo or take a selfie → AI captions what it sees.
- 🎭 **Cartoonify** — turn any photo into a Pixar / Anime / Caricature version with one click.
- 🤖 **Funny Coach** — live 0-100 score and one specific tip while you type your draft.
- 🔥 **Daily Trending Meme** — AI reads what's landing in the feed, cooks today's joke, pins it.
- 🥊 **Meme Battle** — two random memes face off; you vote, and the AI weighs in too.
- ✨ **AI score on every post** — `gpt-4o-mini` rates funniness 0-100. The feed learns what lands.
- 🔪 **AI Roast suggestions** — one click pulls three witty roasts on any "Roast Me" post.

> Built in **demo mode** (no signup — everyone posts as the shared **Magic Guest** profile). That keeps the focus on the AI features, which are the actual point.

---

## ✨ Feature gallery

### 🎨 AI Meme Studio

> Describe a scene in plain English → AI renders two variants you can pick from. Drag text anywhere on the canvas, pick a color, add an animation. Or hit **Cook me a trending meme** and let AI do the whole thing.

<p align="center">
  <img src="docs/screenshots/03-meme-studio.png" alt="AI Meme Studio with text editing" width="850" />
</p>

---

### 🎭 Cartoonify — turn any photo into a cartoon

> AI vision describes your photo, then Pollinations repaints it in your chosen style. Pick from **Pixar**, **Cartoon**, **Anime**, **Caricature**, **Vector**, or **Claymation**. Same scene, same vibe — way funnier.

<table align="center">
  <tr>
    <td align="center"><img src="docs/screenshots/04-cartoonify-before.png" alt="Original photo" width="380" /></td>
    <td align="center"><img src="docs/screenshots/04-cartoonify-after.png" alt="Pixar-style cartoon version" width="380" /></td>
  </tr>
  <tr>
    <td align="center"><em>Original selfie</em></td>
    <td align="center"><em>One-click Pixar version</em></td>
  </tr>
</table>

---

### 🤖 Live Funny Coach

> As you type a draft, AI scores it 0–100 in real time and tells you exactly what to change. *"Add a punchline about your landlord's reaction"* — not generic "be funnier" advice.

<p align="center">
  <img src="docs/screenshots/05-coach.png" alt="Funny Coach reading a draft and offering a specific tip" width="650" />
</p>

---

### 🥊 Meme Battle

> Two random recent memes face off in the feed. Tap the funnier one — the winner gets a real +1 laugh in the DB, and AI tells you whether it agrees with your pick. Repeat until you've battled them all.

<p align="center">
  <img src="docs/screenshots/06-meme-battle.png" alt="Meme Battle widget mid-vote" width="850" />
</p>

---

### 🔥 Daily Trending Meme

> Every UTC midnight, AI reads the top posts of the last 7 days, comes up with a brand-new joke that rides the wave, generates the image, writes the top + bottom text, and pins the whole thing to the top of `/feed`. Updates once a day; cached server-side so every visitor sees the same one.

<p align="center">
  <img src="docs/screenshots/02-feed.png" alt="Feed with the Daily Trending card pinned at the top" width="850" />
</p>

---

### ✏️ Inline text editing on the meme

> Click any text directly on the canvas → cursor lands on it → type to replace. Drag the same block anywhere to reposition. Edit color, font size, alignment, CAPS, stroke — or ask AI to rewrite that specific line for you.

<p align="center">
  <img src="docs/screenshots/08-text-edit.png" alt="Inline text editor over a meme block on the canvas" width="650" />
</p>

---

### 🎬 Animated memes

> Pick one of 5 animation styles (**Shake / Bounce / Pulse / Rainbow / Glitch**) right in the studio. The animation plays live on the preview and again when the meme appears in the feed. Encoded in a URL fragment so the static image still caches normally.

---

## 🛠 Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + custom dark/purple-neon theme |
| Animations | Framer Motion + CSS keyframes |
| UI primitives | shadcn-style components on Radix UI |
| State | Zustand (UI) + React Query (server cache) |
| Validation | Zod |
| DB / Auth / Storage | Supabase (Postgres + RLS + Storage) |
| AI text | OpenRouter → `openai/gpt-4o-mini` (chat + vision) |
| AI image | Pollinations.ai (Flux + Turbo, server-proxied with retry) |
| Deploy | Vercel (edge runtime for AI routes) |

## 🧠 What's AI-powered (and where)

| Endpoint | Purpose |
|---|---|
| `/api/ai/coach` | Live 0-100 funniness score + 1-line tip on every keystroke (debounced) |
| `/api/ai/score` | Background scoring for every post, gpt-4o-mini |
| `/api/ai/caption` | Polish a text draft for maximum land |
| `/api/ai/meme-caption` | Generate top + bottom meme text from a prompt |
| `/api/ai/caption-from-image` | **Vision** — caption a meme from what's actually in the image |
| `/api/ai/rewrite-block` | Context-aware single-block rewrite (knows about the image + other lines) |
| `/api/ai/image` | Returns 2 variant proxy URLs (flux + turbo) for parallel generation |
| `/api/ai/image-proxy` | Streaming Pollinations proxy w/ 4 retries + model fallback + cache |
| `/api/ai/image-prompt` | Rewrite a rough idea into a vivid image prompt |
| `/api/ai/cartoonify` | **Vision describe → stylized repaint** in 6 cartoon styles |
| `/api/ai/trending-meme` | Reads top posts → chain-of-thought → designs today's meme |
| `/api/ai/reply` | 3 funny reply suggestions for any post |
| `/api/ai/roast` | Single-shot roast on a target post |
| `/api/battles/pair` | Picks 2 random recent posts for a battle |
| `/api/battles/vote` | Bumps the winner's `laughs_count` directly |

---

## 📂 Project structure

```
src/
  app/
    (auth)/                  # Login + signup (redirect to /feed in demo mode)
    (main)/                  # Authed shell — feed, trending, profile
    api/
      ai/                    # All AI endpoints (10 of them)
      battles/               # Meme Battle pair + vote
      auth/callback/         # Supabase OAuth callback (when re-enabled)
    page.tsx                 # Landing page (hero + features + showcase)
    globals.css              # Tailwind v4 theme + meme animation keyframes
  components/
    ui/                      # Button, Card, Dialog, Tabs, Switch, Avatar
    layout/                  # Navbar, SiteShell, Logo, DemoBanner
    landing/                 # Hero, FeatureGrid, Showcase, CTA
    feed/                    # FeedTabs, DailyTrendingCard, MemeBattle, ...
    post/                    # CreatePostDialog, MemeBuilderDialog, CoachCard,
                             # PostCard, WebcamCaptureDialog, ...
    profile/                 # ProfileHeader, ProfileTabs
  hooks/                     # use-feed, use-reaction, use-create-post, ...
  lib/
    supabase/                # client, server, middleware
    openrouter/              # chat client + system prompts
    meme/                    # canvas draw + text-block types
    trending/                # daily-meme generator with date-keyed cache
    utils/                   # cn, format, confetti
    constants/               # vibes, empty-states, challenges
    validators/              # Zod schemas
  stores/                    # Zustand UI store
  types/                     # DB type definitions
  middleware.ts              # Supabase session refresh per request
supabase/
  schema.sql                 # Postgres schema + RLS + counter triggers
  demo-mode.sql              # Demo mode setup + permissive RLS + seed data
docs/
  screenshots/               # README images
  videos/                    # Demo videos
  SHOT_LIST.md               # What to capture and how
```

---

## 🚀 Run it locally

### 1. Install

```bash
npm install
```

> The repo ships with `.npmrc` setting `strict-ssl=false` for corporate proxies. Delete it if you don't need it.

### 2. Set up Supabase (one-time, ~5 min)

1. Create a free project at [supabase.com](https://supabase.com).
2. SQL editor → paste [`supabase/schema.sql`](./supabase/schema.sql) → Run.
3. SQL editor → paste [`supabase/demo-mode.sql`](./supabase/demo-mode.sql) → Run. *(Seeds 12 demo posts + 8 fake profiles + permissive RLS for no-auth demo mode.)*
4. Storage → New bucket → name `post-media`, **toggle Public ON**.

### 3. Get an OpenRouter key

Grab one from [openrouter.ai/keys](https://openrouter.ai/keys). `openai/gpt-4o-mini` is cheap (~$0.0001 per chat call).

### 4. Environment variables

```bash
cp env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## 📜 Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

---

## 🏛 Architecture highlights

- **AI image proxy** — Browser `<img>` hits same-origin `/api/ai/image-proxy?prompt=…&seed=…&model=…`. The edge function then fetches from Pollinations with **4 retry attempts** (Flux → Turbo → Flux → Turbo) + 1.5s sleep between, and streams the bytes back. Cached at the browser for 24h. Same-origin URL = no CORS issues for canvas pixel access.
- **2 variants split across models** — variant 1 uses Flux (high quality, slower), variant 2 uses Turbo (fast). Different upstream queues, so they don't compete on the same prompt.
- **Trending-meme chain-of-thought** — the system prompt forces the model to (1) decide the punchline (2) describe the literal still-frame that *shows* the joke (3) write top + bottom (4) self-check coherence. Sanitizer strips any caption-leakage out of the image prompt.
- **Vision pipeline** — Cartoonify and "caption from image" use `gpt-4o-mini` vision with `detail: low`. Local blob URLs (uploads / selfies) get converted to base64 client-side so the API can fetch them.
- **Demo mode** — `supabase/demo-mode.sql` drops the auth FK and relaxes RLS so anyone can post/react without signing in. Every action is attributed to the shared `Magic Guest` profile. Battles use a direct `laughs_count` increment so the same post can rise repeatedly.
- **Meme animations** — 5 keyframes shipped in `globals.css`. Encoded as a URL fragment (`#anim=shake`) when the meme uploads to storage. PostCard parses the fragment client-side and applies a whitelisted CSS class. Zero schema changes needed.
- **Optimistic reactions** — `use-reaction.ts` flips the React Query cache instantly. DB triggers update `laughs_count` on the post and `laugh_score` on the author asynchronously.
- **Inline canvas text editing** — Click-vs-drag detected with a 5-pixel threshold. Click = select + open a floating textarea over the block. Drag = reposition. The textarea is positioned via percentages so it survives canvas resize.

---

## 🚢 Deploying to Vercel

1. Push to GitHub.
2. [vercel.com/new](https://vercel.com/new) → Import the repo.
3. Add the env vars from `env.example`.
4. Deploy. First build ~90s.
5. Update `NEXT_PUBLIC_APP_URL` to the deployed URL and redeploy.

A `vercel.json` is included.

---

## 🗺 Roadmap (post-MVP)

- [ ] Realtime feed updates via Supabase Realtime
- [ ] Single-post page with full comment thread
- [ ] Notifications inbox
- [ ] Vibe-match search ("show me people who post like @x")
- [ ] Badges and streaks
- [ ] Multi-image collage memes (Drake / Distracted Boyfriend layouts)
- [ ] Voice-to-meme (Web Speech API → image gen)
- [ ] Real auth flow back on (login + signup work, just bypassed in demo mode)

---

<p align="center">
  Built with chaos and caffeine. 🍵<br>
  <sub>If MagicAthon made you smile, that was the entire point.</sub>
</p>
