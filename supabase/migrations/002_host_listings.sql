-- 002 — Hosts can create and manage their own listings, with photos.
-- Run once in Supabase → SQL Editor. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. New listing columns
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists host_id uuid references auth.users (id) on delete cascade,
  add column if not exists property_type text not null default 'apartment',
  add column if not exists bedrooms integer not null default 1,
  add column if not exists address text,
  add column if not exists photos text[] not null default '{}',
  add column if not exists status text not null default 'active',
  add column if not exists booking_mode text not null default 'request',
  add column if not exists host_verified boolean not null default false,
  add column if not exists rating numeric(2, 1),
  add column if not exists review_count integer not null default 0;

alter table public.listings drop constraint if exists listings_booking_mode_check;
alter table public.listings add constraint listings_booking_mode_check
  check (booking_mode in ('instant', 'request'));

alter table public.listings drop constraint if exists listings_property_type_check;
alter table public.listings add constraint listings_property_type_check
  check (property_type in ('apartment', 'guesthouse', 'hotel_room', 'house'));

alter table public.listings drop constraint if exists listings_bedrooms_check;
alter table public.listings add constraint listings_bedrooms_check check (bedrooms >= 0);

alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings add constraint listings_status_check
  check (status in ('active', 'paused'));

create index if not exists listings_host_id_idx on public.listings (host_id);

-- ---------------------------------------------------------------------------
-- 2. Who can do what with listings (row-level security)
-- ---------------------------------------------------------------------------
-- Checks the caller's role without being blocked by the profiles table's own
-- security rules.
create or replace function public.is_host()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'host');
$$;

alter table public.listings enable row level security;

drop policy if exists "Listings are public" on public.listings;
create policy "Listings are public"
  on public.listings for select
  using (status = 'active' or host_id = auth.uid());

drop policy if exists "Hosts create their own listings" on public.listings;
create policy "Hosts create their own listings"
  on public.listings for insert to authenticated
  with check (host_id = auth.uid() and public.is_host());

drop policy if exists "Hosts update their own listings" on public.listings;
create policy "Hosts update their own listings"
  on public.listings for update to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

drop policy if exists "Hosts delete their own listings" on public.listings;
create policy "Hosts delete their own listings"
  on public.listings for delete to authenticated
  using (host_id = auth.uid());

-- Hosts may only write the columns they own. `host_verified` is set by an
-- admin after checking documents, and `rating` / `review_count` are filled
-- in from reviews — a host can't give themselves a badge or a 5-star rating.
revoke insert, update on public.listings from authenticated;
grant insert (host_id, title, description, city, address, property_type, bedrooms,
              max_guests, price_per_night, photos, status, booking_mode)
  on public.listings to authenticated;
grant update (title, description, city, address, property_type, bedrooms,
              max_guests, price_per_night, photos, status, booking_mode)
  on public.listings to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Photo storage
-- ---------------------------------------------------------------------------
-- Public bucket: anyone can view photos; files are stored as <host id>/<file>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Hosts upload listing photos" on storage.objects;
create policy "Hosts upload listing photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_host()
  );

drop policy if exists "Hosts delete their listing photos" on storage.objects;
create policy "Hosts delete their listing photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
