-- 003 — Bookings with double-booking protection.
-- Run once in Supabase → SQL Editor, after 002. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Optional cleaning fee on listings
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists cleaning_fee integer not null default 0;

alter table public.listings drop constraint if exists listings_cleaning_fee_check;
alter table public.listings add constraint listings_cleaning_fee_check check (cleaning_fee >= 0);

grant insert (cleaning_fee), update (cleaning_fee) on public.listings to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Bookings table
-- ---------------------------------------------------------------------------
-- Needed so the exclusion constraint below can combine "same listing" (=)
-- with "overlapping dates" (&&).
create extension if not exists btree_gist;

create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references public.listings (id) on delete cascade,
  traveler_id     uuid not null references auth.users (id) on delete cascade,
  host_id         uuid references auth.users (id) on delete set null,
  check_in        date not null,
  check_out       date not null,
  guests          integer not null check (guests > 0),
  status          text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'declined', 'cancelled', 'completed')),
  -- Price snapshot at booking time (naira), so later price changes don't
  -- affect existing bookings.
  nights          integer not null,
  price_per_night integer not null,
  cleaning_fee    integer not null default 0,
  service_fee     integer not null,
  total           integer not null,
  created_at      timestamptz not null default now(),

  constraint bookings_dates_check check (check_out > check_in),

  -- DOUBLE-BOOKING PROTECTION. Postgres itself refuses any new pending or
  -- confirmed booking whose nights overlap another one on the same listing.
  -- '[)' means the check-out day is free, so one guest can leave the same
  -- morning the next one arrives. Because the database enforces this, two
  -- people clicking "Book" at the same instant can never both succeed.
  constraint bookings_no_overlap exclude using gist (
    listing_id with =,
    daterange(check_in, check_out, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);

create index if not exists bookings_traveler_idx on public.bookings (traveler_id);
create index if not exists bookings_host_idx on public.bookings (host_id);

-- Travellers see their own bookings; hosts see bookings for their listings.
-- Nobody writes to the table directly — only through the functions below.
alter table public.bookings enable row level security;

drop policy if exists "Travellers and hosts see their bookings" on public.bookings;
create policy "Travellers and hosts see their bookings"
  on public.bookings for select to authenticated
  using (traveler_id = auth.uid() or host_id = auth.uid());

revoke all on public.bookings from anon, authenticated;
grant select on public.bookings to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Create a booking
-- ---------------------------------------------------------------------------
-- The price is worked out here on the server, never trusted from the
-- browser. Instant Book listings are confirmed straight away; others wait
-- for the host (status 'pending'), which still holds the dates.
create or replace function public.create_booking(
  p_listing_id uuid,
  p_check_in date,
  p_check_out date,
  p_guests integer
)
returns public.bookings
language plpgsql
security definer set search_path = public
as $$
declare
  l public.listings;
  n integer;
  subtotal integer;
  fee integer;
  b public.bookings;
begin
  if auth.uid() is null then
    raise exception 'Please log in to book.';
  end if;

  select * into l from public.listings where id = p_listing_id and status = 'active';
  if not found then
    raise exception 'This listing is not available for booking.';
  end if;
  if l.host_id = auth.uid() then
    raise exception 'You can''t book your own listing.';
  end if;
  if p_check_in < current_date then
    raise exception 'Check-in can''t be in the past.';
  end if;
  if p_check_out <= p_check_in then
    raise exception 'Check-out must be after check-in.';
  end if;

  n := p_check_out - p_check_in;
  if n > 30 then
    raise exception 'Stays are limited to 30 nights.';
  end if;
  if p_guests < 1 or p_guests > l.max_guests then
    raise exception 'This place fits up to % guests.', l.max_guests;
  end if;

  subtotal := n * l.price_per_night;
  fee := round((subtotal + l.cleaning_fee) * 0.10); -- 10% service fee; keep in sync with lib/bookings.js

  insert into public.bookings (
    listing_id, traveler_id, host_id, check_in, check_out, guests, status,
    nights, price_per_night, cleaning_fee, service_fee, total
  ) values (
    l.id, auth.uid(), l.host_id, p_check_in, p_check_out, p_guests,
    case when l.booking_mode = 'instant' then 'confirmed' else 'pending' end,
    n, l.price_per_night, l.cleaning_fee, fee, subtotal + l.cleaning_fee + fee
  )
  returning * into b;

  return b;
exception
  when exclusion_violation then
    raise exception 'Sorry, those dates were just booked by someone else. Please pick different dates.';
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Host accepts / declines a request, traveller cancels
-- ---------------------------------------------------------------------------
create or replace function public.respond_to_booking(p_booking_id uuid, p_accept boolean)
returns public.bookings
language plpgsql
security definer set search_path = public
as $$
declare
  b public.bookings;
begin
  update public.bookings
     set status = case when p_accept then 'confirmed' else 'declined' end
   where id = p_booking_id and host_id = auth.uid() and status = 'pending'
  returning * into b;

  if not found then
    raise exception 'This request can no longer be changed.';
  end if;
  return b;
end;
$$;

create or replace function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer set search_path = public
as $$
declare
  b public.bookings;
begin
  update public.bookings
     set status = 'cancelled'
   where id = p_booking_id
     and traveler_id = auth.uid()
     and status in ('pending', 'confirmed')
     and check_in > current_date
  returning * into b;

  if not found then
    raise exception 'This booking can no longer be cancelled.';
  end if;
  return b;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Booked dates for the calendar
-- ---------------------------------------------------------------------------
-- Lets anyone see which nights are taken on a listing — dates only, never who
-- booked them.
create or replace function public.listing_booked_ranges(p_listing_id uuid)
returns table (check_in date, check_out date)
language sql
stable
security definer set search_path = public
as $$
  select b.check_in, b.check_out
    from public.bookings b
   where b.listing_id = p_listing_id
     and b.status in ('pending', 'confirmed')
     and b.check_out > current_date
   order by b.check_in;
$$;

revoke execute on function public.create_booking(uuid, date, date, integer) from public, anon;
revoke execute on function public.respond_to_booking(uuid, boolean) from public, anon;
revoke execute on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.create_booking(uuid, date, date, integer) to authenticated;
grant execute on function public.respond_to_booking(uuid, boolean) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.listing_booked_ranges(uuid) to anon, authenticated;
