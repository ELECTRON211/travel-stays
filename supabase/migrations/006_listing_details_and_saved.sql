-- 006 — Amenities, house rules, cancellation policy, and saved listings (wishlist).
-- Run once in Supabase → SQL Editor, after 005. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Listing details
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists amenities text[] not null default '{}',
  add column if not exists house_rules text[] not null default '{}',
  add column if not exists extra_rules text,
  add column if not exists check_in_time text not null default '14:00',
  add column if not exists check_out_time text not null default '11:00',
  add column if not exists cancellation_policy text not null default 'moderate';

alter table public.listings drop constraint if exists listings_cancellation_policy_check;
alter table public.listings add constraint listings_cancellation_policy_check
  check (cancellation_policy in ('flexible', 'moderate', 'strict'));

alter table public.listings drop constraint if exists listings_times_check;
alter table public.listings add constraint listings_times_check
  check (check_in_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     and check_out_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

alter table public.listings drop constraint if exists listings_extra_rules_check;
alter table public.listings add constraint listings_extra_rules_check
  check (extra_rules is null or char_length(extra_rules) <= 500);

grant insert (amenities, house_rules, extra_rules, check_in_time, check_out_time, cancellation_policy),
      update (amenities, house_rules, extra_rules, check_in_time, check_out_time, cancellation_policy)
  on public.listings to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Saved listings (wishlist)
-- ---------------------------------------------------------------------------
create table if not exists public.saved_listings (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- Each user sees and changes only their own saved list.
alter table public.saved_listings enable row level security;

drop policy if exists "Users read their saved listings" on public.saved_listings;
create policy "Users read their saved listings"
  on public.saved_listings for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users save listings" on public.saved_listings;
create policy "Users save listings"
  on public.saved_listings for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users unsave listings" on public.saved_listings;
create policy "Users unsave listings"
  on public.saved_listings for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.saved_listings from anon, authenticated;
grant select, insert, delete on public.saved_listings to authenticated;
