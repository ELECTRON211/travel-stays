-- Travel & Stays — database schema (Supabase / Postgres)
--
-- This file records how the database is set up so it lives with the code.
-- It was reconstructed from the app and the live `listings` table; compare it
-- with the Supabase dashboard (Table Editor / SQL Editor) and keep it in sync
-- whenever you change a table.

-- ---------------------------------------------------------------------------
-- profiles: one row per user, linked to Supabase Auth
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        text not null default 'traveler'
              check (role in ('traveler', 'host', 'guide', 'admin')),
  created_at  timestamptz not null default now()
);

-- When someone signs up, copy the name and role they chose (sent from
-- Signup.jsx as user metadata) into `profiles`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'traveler')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- listings: accommodation listed by hosts
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  city             text not null,
  price_per_night  integer not null check (price_per_night >= 0), -- in naira
  max_guests       integer not null check (max_guests > 0),
  created_at       timestamptz not null default now()
);

alter table public.listings enable row level security;

-- Anyone (even logged-out visitors) can browse listings.
create policy "Listings are public"
  on public.listings for select
  using (true);
