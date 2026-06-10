-- supabase/migrations/001_initial_schema.sql
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- USERS (extends Supabase auth.users)
-- ─────────────────────────────────────────
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  name          text not null,
  gender        text check (gender in ('masculine', 'feminine')) not null,
  avatar_url    text,
  couple_id     uuid,
  invite_code   text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_at    timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can read partner profile"
  on public.profiles for select
  using (
    couple_id in (
      select id from public.couples
      where user1_id = auth.uid() or user2_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- COUPLES
-- ─────────────────────────────────────────
create table public.couples (
  id            uuid default uuid_generate_v4() primary key,
  user1_id      uuid references public.profiles(id) not null,
  user2_id      uuid references public.profiles(id) not null,
  streak        int default 0,
  last_active   date default current_date,
  anniversary   date,
  created_at    timestamptz default now(),
  unique(user1_id, user2_id)
);

alter table public.couples enable row level security;

create policy "Couple members can read their couple"
  on public.couples for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Couple members can update their couple"
  on public.couples for update
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- ─────────────────────────────────────────
-- DAILY PROMPTS
-- ─────────────────────────────────────────
create table public.daily_prompts (
  id            uuid default uuid_generate_v4() primary key,
  couple_id     uuid references public.couples(id) on delete cascade not null,
  prompt_text   text not null,
  prompt_mode   text check (prompt_mode in ('reflective', 'playful')) not null,
  date          date not null default current_date,
  created_at    timestamptz default now(),
  unique(couple_id, date)
);

alter table public.daily_prompts enable row level security;

create policy "Couple members can access prompts"
  on public.daily_prompts for all
  using (
    couple_id in (
      select id from public.couples
      where user1_id = auth.uid() or user2_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- PROMPT ANSWERS
-- ─────────────────────────────────────────
create table public.prompt_answers (
  id            uuid default uuid_generate_v4() primary key,
  prompt_id     uuid references public.daily_prompts(id) on delete cascade not null,
  user_id       uuid references public.profiles(id) not null,
  answer_text   text not null,
  created_at    timestamptz default now(),
  unique(prompt_id, user_id)
);

alter table public.prompt_answers enable row level security;

create policy "Couple members can read answers"
  on public.prompt_answers for select
  using (
    prompt_id in (
      select dp.id from public.daily_prompts dp
      join public.couples c on dp.couple_id = c.id
      where c.user1_id = auth.uid() or c.user2_id = auth.uid()
    )
  );

create policy "Users can write own answers"
  on public.prompt_answers for insert
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- PINGS
-- ─────────────────────────────────────────
create table public.pings (
  id              uuid default uuid_generate_v4() primary key,
  from_user_id    uuid references public.profiles(id) not null,
  to_user_id      uuid references public.profiles(id) not null,
  type            text not null,
  seen            boolean default false,
  created_at      timestamptz default now()
);

alter table public.pings enable row level security;

create policy "Users can send pings"
  on public.pings for insert
  with check (auth.uid() = from_user_id);

create policy "Users can read their pings"
  on public.pings for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Recipients can mark pings seen"
  on public.pings for update
  using (auth.uid() = to_user_id);

-- ─────────────────────────────────────────
-- KAUN ZYADA VOTES
-- ─────────────────────────────────────────
create table public.kz_votes (
  id          uuid default uuid_generate_v4() primary key,
  couple_id   uuid references public.couples(id) on delete cascade not null,
  question    text not null,
  category    text not null,
  voted_for   uuid references public.profiles(id) not null,
  voted_by    uuid references public.profiles(id) not null,
  date        date not null default current_date,
  created_at  timestamptz default now()
);

alter table public.kz_votes enable row level security;

create policy "Couple members can access votes"
  on public.kz_votes for all
  using (
    couple_id in (
      select id from public.couples
      where user1_id = auth.uid() or user2_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- STORAGE BUCKET for avatars
-- ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict do nothing;

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─────────────────────────────────────────
-- REALTIME — enable for pings
-- ─────────────────────────────────────────
alter publication supabase_realtime add table public.pings;
alter publication supabase_realtime add table public.prompt_answers;
