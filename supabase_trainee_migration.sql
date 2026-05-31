-- ============================================================
-- SUPABASE MIGRATION — Trainee Module
-- Run this ONCE in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. TRAINEE_PROFILES
--    Stores the extended profile for each trainee user.
-- ──────────────────────────────────────────────────────────

create table if not exists public.trainee_profiles (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null unique references auth.users(id) on delete cascade,
  full_name          text        not null default '',
  photo_url          text        not null default '',
  formation          text        not null default '',
  school             text        not null default '',
  education_level    text        not null default '',
  skills             text[]      not null default '{}',
  linkedin_url       text        not null default '',
  bio                text        not null default '',
  availability_start date,
  availability_end   date,
  cv_url             text,
  updated_at         timestamptz not null default now()
);

-- Row Level Security
alter table public.trainee_profiles enable row level security;

-- Trainee: full control over own profile
create policy "trainee_profiles_own"
  on public.trainee_profiles
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anyone authenticated can read profiles (org needs to see them)
create policy "trainee_profiles_read_all"
  on public.trainee_profiles
  for select
  using (auth.role() = 'authenticated');


-- ──────────────────────────────────────────────────────────
-- 2. INTERNSHIP_OFFERS
--    Published by organizations; visible to all trainees.
-- ──────────────────────────────────────────────────────────

create table if not exists public.internship_offers (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  org_id          uuid        not null references auth.users(id) on delete cascade,
  org_name        text        not null default '',
  org_logo_url    text,
  title           text        not null,
  description     text        not null default '',
  missions        text[]      not null default '{}',
  required_skills text[]      not null default '{}',
  domain          text        not null default '',
  duration        text        not null default '',
  location_type   text        not null default 'remote'
                  check (location_type in ('remote', 'on-site', 'hybrid')),
  location_city   text,
  start_date      date,
  is_active       boolean     not null default true
);

-- Row Level Security
alter table public.internship_offers enable row level security;

-- All authenticated users can read active offers
create policy "internship_offers_read_active"
  on public.internship_offers
  for select
  using (is_active = true and auth.role() = 'authenticated');

-- Organization: full control over own offers
create policy "internship_offers_org_manage"
  on public.internship_offers
  for all
  using  (auth.uid() = org_id)
  with check (auth.uid() = org_id);


-- ──────────────────────────────────────────────────────────
-- 3. TRAINEE_APPLICATIONS
--    A trainee applies to an internship_offer.
-- ──────────────────────────────────────────────────────────

create table if not exists public.trainee_applications (
  id             uuid        primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  offer_id       uuid        not null references public.internship_offers(id) on delete cascade,
  trainee_id     uuid        not null references auth.users(id) on delete cascade,
  cover_letter   text,
  cv_url         text,
  status         text        not null default 'pending'
                 check (status in ('pending', 'reviewed', 'accepted', 'rejected', 'interview')),
  interview_date timestamptz,
  unique (offer_id, trainee_id)
);

-- Auto-update updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trainee_applications_set_updated_at on public.trainee_applications;
create trigger trainee_applications_set_updated_at
  before update on public.trainee_applications
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.trainee_applications enable row level security;

-- Trainee: full control over own applications
create policy "trainee_applications_own"
  on public.trainee_applications
  for all
  using  (auth.uid() = trainee_id)
  with check (auth.uid() = trainee_id);

-- Organization: read applications on their own offers
create policy "trainee_applications_org_read"
  on public.trainee_applications
  for select
  using (
    exists (
      select 1 from public.internship_offers o
      where o.id = offer_id
        and o.org_id = auth.uid()
    )
  );

-- Organization: update status of applications on their own offers
create policy "trainee_applications_org_update"
  on public.trainee_applications
  for update
  using (
    exists (
      select 1 from public.internship_offers o
      where o.id = offer_id
        and o.org_id = auth.uid()
    )
  );


-- ──────────────────────────────────────────────────────────
-- 4. TRAINEE_BOOKMARKS
--    A trainee saves an offer for later.
-- ──────────────────────────────────────────────────────────

create table if not exists public.trainee_bookmarks (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  trainee_id uuid        not null references auth.users(id) on delete cascade,
  offer_id   uuid        not null references public.internship_offers(id) on delete cascade,
  unique (trainee_id, offer_id)
);

-- Row Level Security
alter table public.trainee_bookmarks enable row level security;

create policy "trainee_bookmarks_own"
  on public.trainee_bookmarks
  for all
  using  (auth.uid() = trainee_id)
  with check (auth.uid() = trainee_id);


-- ──────────────────────────────────────────────────────────
-- 5. PROFILES TABLE — ensure trainee users get a row
--    If your project already has an on-signup trigger that
--    inserts into profiles, skip this section.
-- ──────────────────────────────────────────────────────────

-- Make sure the profiles table has a role column
-- (already exists in this project — verified from workspaceService.ts)
-- alter table public.profiles add column if not exists role text default 'volunteer';

-- Create or replace the handle_new_user trigger to support 'trainee' role
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'volunteer')
  )
  on conflict (id) do update
    set role = excluded.role,
        email = excluded.email;

  return new;
end;
$$;

-- Attach trigger to auth.users (recreate if already exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ──────────────────────────────────────────────────────────
-- DONE — Refresh your Supabase schema cache:
--   Supabase Dashboard > Settings > API > "Reload schema"
-- ──────────────────────────────────────────────────────────
