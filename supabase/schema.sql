-- MagicAthon schema
-- Run this in the Supabase SQL editor (or via the CLI).
-- Idempotent where reasonable.

create extension if not exists "pgcrypto";

-- =========================================================
-- profiles (1:1 with auth.users)
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  laugh_score integer not null default 0,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (lower(username));

-- =========================================================
-- posts
-- =========================================================
create type post_type as enum ('text', 'image', 'poll', 'video');
create type vibe_key as enum ('funny', 'weird', 'relatable', 'rant', 'wholesome');
create type audience_key as enum ('everyone', 'followers', 'vibe-match');

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  media_urls text[] default '{}'::text[],
  type post_type not null default 'text',
  vibe vibe_key,
  audience audience_key not null default 'everyone',
  is_roast_me boolean not null default false,
  magic_boost boolean not null default false,
  poll_options jsonb,
  laughs_count integer not null default 0,
  comments_count integer not null default 0,
  shares_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx on public.posts (user_id, created_at desc);
create index if not exists posts_laughs_idx on public.posts (laughs_count desc, created_at desc);

-- =========================================================
-- comments (incl. roast comments)
-- =========================================================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  is_roast boolean not null default false,
  laughs_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on public.comments (post_id, created_at desc);

-- =========================================================
-- reactions (laugh, save) -- one row per (user, post, type)
-- =========================================================
create type reaction_type as enum ('laugh', 'save');

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type reaction_type not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id, type)
);

create index if not exists reactions_post_id_idx on public.reactions (post_id, type);
create index if not exists reactions_user_id_idx on public.reactions (user_id, type, created_at desc);

-- =========================================================
-- follows
-- =========================================================
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows (following_id);
create index if not exists follows_follower_idx on public.follows (follower_id);

-- =========================================================
-- notifications
-- =========================================================
create type notification_type as enum ('laugh', 'comment', 'follow', 'roast', 'challenge');

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type notification_type not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- =========================================================
-- New-user trigger: auto-create a profile when an auth user is inserted.
-- Uses raw_user_meta_data.username if present; otherwise a slug from email.
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  i integer := 0;
begin
  base_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '_', 'g')
  );
  base_username := lower(left(base_username, 20));
  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    i := i + 1;
    candidate := base_username || i::text;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data->>'display_name', candidate),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- Counter triggers
-- =========================================================
create or replace function public.bump_post_laughs()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT' and new.type = 'laugh') then
    update public.posts set laughs_count = laughs_count + 1 where id = new.post_id;
    update public.profiles p set laugh_score = laugh_score + 1
      from public.posts po where po.id = new.post_id and p.id = po.user_id;
  elsif (tg_op = 'DELETE' and old.type = 'laugh') then
    update public.posts set laughs_count = greatest(laughs_count - 1, 0) where id = old.post_id;
    update public.profiles p set laugh_score = greatest(laugh_score - 1, 0)
      from public.posts po where po.id = old.post_id and p.id = po.user_id;
  end if;
  return null;
end;
$$;

drop trigger if exists reactions_laugh_count on public.reactions;
create trigger reactions_laugh_count
  after insert or delete on public.reactions
  for each row execute procedure public.bump_post_laughs();

create or replace function public.bump_post_comments()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_count_trigger on public.comments;
create trigger comments_count_trigger
  after insert or delete on public.comments
  for each row execute procedure public.bump_post_comments();

create or replace function public.bump_follow_counts()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set followers_count = followers_count + 1 where id = new.following_id;
  elsif (tg_op = 'DELETE') then
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update public.profiles set followers_count = greatest(followers_count - 1, 0) where id = old.following_id;
  end if;
  return null;
end;
$$;

drop trigger if exists follows_count_trigger on public.follows;
create trigger follows_count_trigger
  after insert or delete on public.follows
  for each row execute procedure public.bump_follow_counts();

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;

-- Profiles: anyone can read, only owner can update
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Posts: anyone can read public posts; owner can insert/update/delete
drop policy if exists "posts_read_all" on public.posts;
create policy "posts_read_all" on public.posts for select using (true);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert with check (auth.uid() = user_id);

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts for update using (auth.uid() = user_id);

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts for delete using (auth.uid() = user_id);

-- Comments
drop policy if exists "comments_read_all" on public.comments;
create policy "comments_read_all" on public.comments for select using (true);

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = user_id);

-- Reactions
drop policy if exists "reactions_read_all" on public.reactions;
create policy "reactions_read_all" on public.reactions for select using (true);

drop policy if exists "reactions_write_own" on public.reactions;
create policy "reactions_write_own" on public.reactions for insert with check (auth.uid() = user_id);

drop policy if exists "reactions_delete_own" on public.reactions;
create policy "reactions_delete_own" on public.reactions for delete using (auth.uid() = user_id);

-- Follows
drop policy if exists "follows_read_all" on public.follows;
create policy "follows_read_all" on public.follows for select using (true);

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own" on public.follows for insert with check (auth.uid() = follower_id);

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own" on public.follows for delete using (auth.uid() = follower_id);

-- Notifications: read only your own
drop policy if exists "notifications_read_own" on public.notifications;
create policy "notifications_read_own" on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);

-- =========================================================
-- Storage bucket for post media (run separately in Supabase UI or via CLI)
-- =========================================================
-- insert into storage.buckets (id, name, public) values ('post-media', 'post-media', true)
--   on conflict (id) do nothing;
-- create policy "post-media authenticated insert" on storage.objects for insert
--   with check (bucket_id = 'post-media' and auth.role() = 'authenticated');
-- create policy "post-media public read" on storage.objects for select
--   using (bucket_id = 'post-media');
