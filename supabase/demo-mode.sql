-- ============================================================
-- MagicAthon demo mode (v2 — adds images, AI score, meh vote)
-- Run this AFTER schema.sql in the Supabase SQL editor.
-- Idempotent — safe to re-run.
--
-- What this does:
--   1. Drops auth FK so profiles can exist without auth.users rows
--   2. Adds ai_score + meh_count columns and a meh-count trigger
--   3. Inserts the shared "Magic Guest" profile + 8 fake users
--   4. Relaxes RLS so anyone can post/react without being signed in
--   5. Seeds ~12 demo posts (with images, AI scores, varied vibes)
--   6. Sprinkles laughs / saves / mehs / comments
--   7. Adds permissive storage policies if the bucket exists
-- ============================================================

-- ============================================================
-- 1. Drop FK from profiles → auth.users
-- ============================================================
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- ============================================================
-- 2. New columns + meh trigger
-- ============================================================
alter table public.posts add column if not exists ai_score integer;
alter table public.posts add column if not exists meh_count integer not null default 0;

-- Convert reactions.type from enum to text + check so we can add 'meh'
-- without enum-add-value transaction headaches.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reactions'
      and column_name = 'type'
      and udt_name = 'reaction_type'
  ) then
    alter table public.reactions alter column type type text using type::text;
  end if;
end$$;

-- Add a CHECK so we don't accept anything random.
alter table public.reactions drop constraint if exists reactions_type_check;
alter table public.reactions add constraint reactions_type_check
  check (type in ('laugh', 'save', 'meh'));

-- Trigger to maintain meh_count
create or replace function public.bump_post_mehs()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT' and new.type = 'meh') then
    update public.posts set meh_count = meh_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE' and old.type = 'meh') then
    update public.posts set meh_count = greatest(meh_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;
drop trigger if exists reactions_meh_count on public.reactions;
create trigger reactions_meh_count
  after insert or delete on public.reactions
  for each row execute procedure public.bump_post_mehs();

-- ============================================================
-- 3. Insert demo profiles
-- ============================================================
insert into public.profiles (id, username, display_name, bio, laugh_score, followers_count, following_count)
values
  ('00000000-0000-0000-0000-000000000001', 'guest',                'Magic Guest',         'demo mode is on. we all laugh as one. ✨', 0, 0, 0),
  ('00000000-0000-0000-0000-000000000010', 'sarcastic_soul',       'Sarcastic Soul',      'professionally tired since birth.',                            612, 240, 110),
  ('00000000-0000-0000-0000-000000000011', 'not_a_morning_person', 'Not A Morning Person','7am is a hate crime.',                                         480, 199, 65),
  ('00000000-0000-0000-0000-000000000012', 'laughing_panda',       'Laughing Panda',      'i post. i roast. i sleep. repeat mode: ON 🐼',                 1043, 3200, 180),
  ('00000000-0000-0000-0000-000000000013', 'chillguy',             'Chill Guy',           'vibes only.',                                                   355, 88, 412),
  ('00000000-0000-0000-0000-000000000014', 'dreamer',              'Dreamer',             'i have a fridge that gives me life advice.',                   220, 65, 130),
  ('00000000-0000-0000-0000-000000000015', 'roaster_xd',           'Roaster XD',          'i was the friend group roast master since 2014.',              980, 1500, 60),
  ('00000000-0000-0000-0000-000000000016', 'cosmic_tofu',          'Cosmic Tofu',         'tofu by day, chaos by night.',                                 412, 410, 230),
  ('00000000-0000-0000-0000-000000000017', 'existential_milk',     'Existential Milk',    'mostly fine. occasionally curdled.',                           295, 150, 90)
on conflict (id) do update
  set display_name = excluded.display_name,
      bio = excluded.bio;

-- ============================================================
-- 4. Permissive RLS policies (demo only — not for production)
-- ============================================================
drop policy if exists "posts_insert_own" on public.posts;
drop policy if exists "posts_update_own" on public.posts;
drop policy if exists "posts_delete_own" on public.posts;
drop policy if exists "posts_insert_demo" on public.posts;
drop policy if exists "posts_update_demo" on public.posts;
drop policy if exists "posts_delete_demo" on public.posts;
create policy "posts_insert_demo" on public.posts for insert with check (true);
create policy "posts_update_demo" on public.posts for update using (true);
create policy "posts_delete_demo" on public.posts for delete using (true);

drop policy if exists "comments_insert_own" on public.comments;
drop policy if exists "comments_delete_own" on public.comments;
drop policy if exists "comments_insert_demo" on public.comments;
drop policy if exists "comments_delete_demo" on public.comments;
create policy "comments_insert_demo" on public.comments for insert with check (true);
create policy "comments_delete_demo" on public.comments for delete using (true);

drop policy if exists "reactions_write_own" on public.reactions;
drop policy if exists "reactions_delete_own" on public.reactions;
drop policy if exists "reactions_insert_demo" on public.reactions;
drop policy if exists "reactions_delete_demo" on public.reactions;
create policy "reactions_insert_demo" on public.reactions for insert with check (true);
create policy "reactions_delete_demo" on public.reactions for delete using (true);

drop policy if exists "follows_insert_own" on public.follows;
drop policy if exists "follows_delete_own" on public.follows;
drop policy if exists "follows_insert_demo" on public.follows;
drop policy if exists "follows_delete_demo" on public.follows;
create policy "follows_insert_demo" on public.follows for insert with check (true);
create policy "follows_delete_demo" on public.follows for delete using (true);

drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_demo" on public.profiles;
create policy "profiles_update_demo" on public.profiles for update using (true);

-- ============================================================
-- 5. Seed posts (images via picsum.photos, AI scores baked in)
--    Uses deterministic UUIDs so re-running is a no-op.
-- ============================================================
insert into public.posts
  (id, user_id, content, type, vibe, audience, is_roast_me, magic_boost, media_urls, ai_score, created_at)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010',
   'tried to adult today… it didn''t go well. i microwaved my coffee three times and never drank it. someone please come get me.',
   'image', 'relatable', 'everyone', true, true,
   array['https://picsum.photos/seed/magicathon-coffee/900/600'], 87,
   now() - interval '2 hours'),

  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000011',
   'morning people are robots sent by the government. i''m not convinced otherwise.',
   'image', 'weird', 'everyone', true, true,
   array['https://picsum.photos/seed/magicathon-morning/900/600'], 81,
   now() - interval '5 hours'),

  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000012',
   'some call it overthinking. i call it advanced planning. for things that will never happen. ever.',
   'text', 'wholesome', 'everyone', false, true,
   null, 74,
   now() - interval '1 day'),

  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000013',
   'monday be like 🥲',
   'image', 'funny', 'everyone', false, false,
   array['https://picsum.photos/seed/magicathon-monday/900/700'], 69,
   now() - interval '3 hours'),

  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000014',
   'just had a dream where my fridge gave me life advice. honestly? solid take. it told me to drink water and ghost my ex.',
   'image', 'wholesome', 'everyone', false, true,
   array['https://picsum.photos/seed/magicathon-fridge/900/600'], 92,
   now() - interval '7 hours'),

  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000015',
   'the only thing awake at 3am is you and your wifi. roast me, i dare you.',
   'image', 'funny', 'everyone', true, false,
   array['https://picsum.photos/seed/magicathon-wifi/900/600'], 78,
   now() - interval '10 hours'),

  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000016',
   'if aliens are watching, please skip ahead 5 minutes i''m about to be cringe.',
   'image', 'weird', 'everyone', false, false,
   array['https://picsum.photos/seed/magicathon-aliens/900/600'], 84,
   now() - interval '14 hours'),

  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000017',
   'wifi router is the real influencer in this house. nobody listens to me, but the wifi? gospel.',
   'image', 'rant', 'everyone', false, true,
   array['https://picsum.photos/seed/magicathon-router/900/600'], 71,
   now() - interval '18 hours'),

  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000010',
   'my therapist said to set boundaries so i blocked my landlord.',
   'text', 'funny', 'everyone', false, true,
   null, 95,
   now() - interval '22 hours'),

  ('00000000-0000-0000-0000-00000000010a', '00000000-0000-0000-0000-000000000012',
   'i don''t go to gym. i just sigh dramatically and call it cardio.',
   'image', 'relatable', 'everyone', false, false,
   array['https://picsum.photos/seed/magicathon-gym/900/600'], 76,
   now() - interval '1 day 4 hours'),

  ('00000000-0000-0000-0000-00000000010b', '00000000-0000-0000-0000-000000000011',
   'i ordered a salad and the salad ordered therapy. neither of us is okay.',
   'image', 'rant', 'everyone', true, false,
   array['https://picsum.photos/seed/magicathon-salad/900/600'], 88,
   now() - interval '1 day 9 hours'),

  ('00000000-0000-0000-0000-00000000010c', '00000000-0000-0000-0000-000000000015',
   'me at 11pm: i should fix my sleep schedule. me at 2am: what if the moon is just a spotlight.',
   'image', 'weird', 'everyone', false, false,
   array['https://picsum.photos/seed/magicathon-moon/900/600'], 82,
   now() - interval '2 days')
on conflict (id) do update
  set media_urls = excluded.media_urls,
      ai_score = excluded.ai_score,
      type = excluded.type;

-- ============================================================
-- 6. Seed reactions (laughs, saves, mehs)
--    Triggers from schema.sql + the new meh trigger keep counts in sync.
-- ============================================================

-- Wipe demo reactions we may have inserted previously
delete from public.reactions where user_id in (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-000000000015',
  '00000000-0000-0000-0000-000000000016',
  '00000000-0000-0000-0000-000000000017'
);

-- Reset counters in case the seed re-ran
update public.posts set laughs_count = 0, comments_count = 0, shares_count = 0, meh_count = 0
  where id::text like '00000000-0000-0000-0000-0000000001%';
update public.profiles set laugh_score = 0
  where id::text like '00000000-0000-0000-0000-00000000001%';

-- Laughs (avoid self-laughs)
insert into public.reactions (post_id, user_id, type) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000011', 'laugh'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000012', 'laugh'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000013', 'laugh'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000014', 'laugh'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000015', 'laugh'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000016', 'laugh'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000017', 'laugh'),

  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000010', 'laugh'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000012', 'laugh'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000013', 'laugh'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000015', 'laugh'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000016', 'laugh'),

  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000010', 'laugh'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000011', 'laugh'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000013', 'laugh'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000014', 'laugh'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000016', 'laugh'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000017', 'laugh'),

  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000010', 'laugh'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000011', 'laugh'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000015', 'laugh'),

  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000010', 'laugh'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000012', 'laugh'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000016', 'laugh'),

  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000010', 'laugh'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000011', 'laugh'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000012', 'laugh'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000013', 'laugh'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000014', 'laugh'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000016', 'laugh'),

  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000012', 'laugh'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000015', 'laugh'),

  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000010', 'laugh'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000011', 'laugh'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000012', 'laugh'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000015', 'laugh'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000016', 'laugh'),

  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000011', 'laugh'),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000012', 'laugh'),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000013', 'laugh'),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000017', 'laugh'),

  ('00000000-0000-0000-0000-00000000010a', '00000000-0000-0000-0000-000000000010', 'laugh'),
  ('00000000-0000-0000-0000-00000000010a', '00000000-0000-0000-0000-000000000011', 'laugh'),
  ('00000000-0000-0000-0000-00000000010a', '00000000-0000-0000-0000-000000000013', 'laugh'),
  ('00000000-0000-0000-0000-00000000010a', '00000000-0000-0000-0000-000000000017', 'laugh'),

  ('00000000-0000-0000-0000-00000000010b', '00000000-0000-0000-0000-000000000010', 'laugh'),
  ('00000000-0000-0000-0000-00000000010b', '00000000-0000-0000-0000-000000000015', 'laugh'),

  ('00000000-0000-0000-0000-00000000010c', '00000000-0000-0000-0000-000000000010', 'laugh'),
  ('00000000-0000-0000-0000-00000000010c', '00000000-0000-0000-0000-000000000011', 'laugh'),
  ('00000000-0000-0000-0000-00000000010c', '00000000-0000-0000-0000-000000000014', 'laugh')
on conflict (post_id, user_id, type) do nothing;

-- A few saves
insert into public.reactions (post_id, user_id, type) values
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000010', 'save'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000011', 'save'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000012', 'save'),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000016', 'save')
on conflict (post_id, user_id, type) do nothing;

-- A few "meh" votes so the metric isn't always blank
insert into public.reactions (post_id, user_id, type) values
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000012', 'meh'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000010', 'meh'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000011', 'meh'),
  ('00000000-0000-0000-0000-00000000010c', '00000000-0000-0000-0000-000000000013', 'meh')
on conflict (post_id, user_id, type) do nothing;

-- Roast comments
insert into public.comments (post_id, user_id, content, is_roast) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000015',
   'three microwaved coffees is just a tier list of disappointment. solid.', true),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000012',
   'this is the most ''raised by playlists'' energy i''ve seen all week.', true),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000015',
   'they''re not robots, they''re just better than us. accept it.', true),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000010',
   'your dare is weaker than your wifi at 3am.', true),
  ('00000000-0000-0000-0000-00000000010b', '00000000-0000-0000-0000-000000000015',
   'the salad isn''t the problem. the dressing of your life is.', true)
on conflict do nothing;

-- ============================================================
-- 7. Storage policies (only if the bucket exists)
-- ============================================================
do $$
begin
  if exists (select 1 from storage.buckets where id = 'post-media') then
    drop policy if exists "post-media authenticated insert" on storage.objects;
    drop policy if exists "post-media demo insert" on storage.objects;
    create policy "post-media demo insert" on storage.objects for insert
      with check (bucket_id = 'post-media');
    drop policy if exists "post-media public read" on storage.objects;
    create policy "post-media public read" on storage.objects for select
      using (bucket_id = 'post-media');
  end if;
end$$;

-- Done. Visit /feed and refresh.
