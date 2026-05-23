# MagicAthon ✨

> Post anything. Make everyone laugh. 😂
>
> The social playground where authenticity gets applause. Built for humans, designed for laughs.

MagicAthon is a Next.js 15 / App Router social platform with humor as the core metric. Real people, real stories, AI-assisted roasts, vibe matching, and zero corporate energy.

---

## Tech stack

| Layer            | Choice |
|------------------|--------|
| Framework        | Next.js 16 (App Router, React 19) |
| Language         | TypeScript (strict) |
| Styling          | Tailwind CSS v4 + custom dark/purple neon theme |
| Animations       | Framer Motion |
| UI primitives    | shadcn-style components built on Radix UI |
| State            | Zustand (client UI), React Query (server cache) |
| Validation       | Zod |
| Auth + DB        | Supabase (Auth, Postgres, Storage, Realtime) |
| AI               | OpenRouter (`openai/gpt-4o-mini`) |
| Deploy           | Vercel |

---

## Features

- **Auth** — Email/password + Google OAuth via Supabase
- **Home feed** — For You / Roast Me / Following / New tabs, infinite scroll, ranked by laughs
- **Create post** — Text + image (Supabase Storage), polls, vibe tags, audience selector, **Magic Boost** flag
- **Roast Me** — A toggle on every post that invites funny replies
- **Reactions** — 😂 laughs (with confetti), bookmark, share
- **Profiles** — Bio, laugh score, posts / roasts / saved tabs, follow
- **AI features (OpenRouter)**
  - **AI polish** — Rewrite your draft for maximum land
  - **AI roast suggestions** — 3 funny replies on demand for any post
  - **AI roast generator** — Single-shot roast for a given post
- **Daily Challenge widget** — A new prompt every day, seeded from UTC date
- **Trending rail** — Top 5 most-laughed posts
- **Vibe system** — Funny / Weird / Relatable / Rant / Wholesome
- **Laugh Score** — A per-user count that updates via DB triggers when posts get laughs
- **Funny empty states** — Because crickets deserve jokes too

---

## Folder structure

```
src/
  app/
    (auth)/           # Login + signup — minimal layout
    (main)/           # Authed shell — feed, trending, profile
    api/
      ai/             # AI route handlers (roast, caption, reply)
      auth/callback   # Supabase OAuth callback
    layout.tsx
    page.tsx          # Landing page
    globals.css       # Tailwind v4 theme + utilities
  components/
    ui/               # Button, Card, Dialog, Tabs, Switch, Avatar, ...
    layout/           # Navbar, SiteShell, Logo
    landing/          # Hero, FeatureGrid, Showcase, CTA
    feed/             # FeedTabs, FeedList, DailyChallenge, TrendingRail
    post/             # PostCard, CreatePostDialog, VibePicker, ...
    profile/          # ProfileHeader, ProfileTabs
  hooks/              # use-feed, use-reaction, use-create-post, ...
  lib/
    supabase/         # client, server, middleware
    openrouter/       # client + prompts
    utils/            # cn, format, confetti
    constants/        # vibes, empty-states, challenges
    validators/       # Zod schemas
  stores/             # Zustand UI store
  types/              # DB type definitions
supabase/
  schema.sql          # Postgres schema + RLS + triggers
```

---

## Getting started

### 1. Install

```bash
npm install
```

> The repo ships with `.npmrc` setting `strict-ssl=false` to work behind corporate proxies. If you don't need it, delete the file.

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run [`supabase/schema.sql`](./supabase/schema.sql). This creates the tables, RLS policies, and triggers.
3. (Optional but recommended) Enable Google as an auth provider: **Authentication → Providers → Google**. Add `http://localhost:3000/api/auth/callback` and your production URL to the redirect allow list.
4. Create a public Storage bucket named **`post-media`** (for image uploads). Bucket settings:
   - Public: ON
   - File size limit: 8 MB (or whatever fits your plan)

   Then add storage policies (Settings → Storage → Policies):

   ```sql
   create policy "post-media authenticated insert"
     on storage.objects for insert
     with check (bucket_id = 'post-media' and auth.role() = 'authenticated');

   create policy "post-media public read"
     on storage.objects for select
     using (bucket_id = 'post-media');
   ```

### 3. Configure OpenRouter

1. Grab a key from [openrouter.ai/keys](https://openrouter.ai/keys).
2. (Optional) Add credit. `openai/gpt-4o-mini` is cheap.

### 4. Environment variables

Copy `env.example` to `.env.local`:

```bash
cp env.example .env.local
```

> The example file is named `env.example` (no leading dot) so it doesn't collide with environments that block `.env*` edits. Rename freely.

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # not used at runtime today; included for future tooling
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run it

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Scripts

| Command            | Purpose |
|--------------------|---------|
| `npm run dev`      | Start dev server |
| `npm run build`    | Production build |
| `npm run start`    | Run the built app |
| `npm run lint`     | ESLint |
| `npm run typecheck`| `tsc --noEmit` |

---

## Architecture notes

- **Auth**: `@supabase/ssr` provides cookie-based sessions. `src/middleware.ts` refreshes the session on every request via `src/lib/supabase/middleware.ts`. Server components fetch the current profile via `getServerProfile()`; client components use `useCurrentUser()`.
- **Data**: All reads come through Supabase REST under RLS. Counters (laughs, comments, followers) live on row columns and are kept fresh by DB triggers — feeds stay cheap.
- **AI routes**: Three edge-runtime route handlers under `/api/ai/*`. They require an authenticated user and call OpenRouter directly with `openai/gpt-4o-mini`. The roast/reply route asks for a JSON array and falls back to line-splitting if the model freestyles.
- **Creating a post**: `CreatePostDialog` validates with Zod, optionally polishes with `/api/ai/caption`, uploads to the `post-media` bucket, then inserts via Supabase. React Query invalidates the feed on success.
- **Reactions**: Optimistic — `use-reaction.ts` flips the cache instantly, then reverts on error. DB triggers update `laughs_count` on the post and `laugh_score` on the author.
- **Theme**: Tailwind v4 `@theme` block in `globals.css`. Custom utilities (`glass`, `gradient-text`, `glow-purple`, `dot-pattern`, `shimmer`) live alongside.

---

## Deploying to Vercel

1. Push to GitHub.
2. Import the repo on Vercel.
3. Add the environment variables from `env.example`.
4. Update `NEXT_PUBLIC_APP_URL` to the deployed URL.
5. Add `<deployed-url>/api/auth/callback` to Supabase's redirect allow list (if using OAuth).
6. Deploy.

A `vercel.json` is included with sane defaults.

---

## Roadmap (post-MVP)

- [ ] Realtime feed updates via Supabase Realtime
- [ ] Single-post page with full comment thread
- [ ] Notifications inbox
- [ ] Vibe match search ("show me people who post like @x")
- [ ] Badges and streaks
- [ ] Video posts
- [ ] Discover page

---

Built with chaos and caffeine. 🍵
