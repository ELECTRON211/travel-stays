-- 008 — Hosts can block dates on their listings.
-- Run once in Supabase → SQL Editor, after 007. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Blocked date ranges
-- ---------------------------------------------------------------------------
create table if not exists public.listing_blocks (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  start_date date not null,
  end_date   date not null, -- the first night that is free again (like check_out)
  note       text check (note is null or char_length(note) <= 100),
  created_at timestamptz not null default now(),
  constraint listing_blocks_dates_check check (end_date > start_date)
);

create index if not exists listing_blocks_listing_idx on public.listing_blocks (listing_id);

-- Only the listing's host can see, add or remove its blocks. Guests only see
-- that the dates are taken (through listing_booked_ranges below).
alter table public.listing_blocks enable row level security;

drop policy if exists "Hosts manage their listing blocks" on public.listing_blocks;
create policy "Hosts manage their listing blocks"
  on public.listing_blocks for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.host_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.host_id = auth.uid()));

revoke all on public.listing_blocks from anon, authenticated;
grant select, insert, delete on public.listing_blocks to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Bookings can't land on blocked dates
-- ---------------------------------------------------------------------------
-- Same as in 003, plus: the listing row is locked while booking (so a host
-- can't block dates at the same instant a guest books them) and blocked
-- nights are refused.
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

  select * into l from public.listings where id = p_listing_id and status = 'active' for update;
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

  if exists (
    select 1 from public.listing_blocks k
     where k.listing_id = l.id
       and daterange(k.start_date, k.end_date, '[)') && daterange(p_check_in, p_check_out, '[)')
  ) then
    raise exception 'The host isn''t available on some of these dates. Please pick different dates.';
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
-- 3. Guests' calendars also grey out blocked dates
-- ---------------------------------------------------------------------------
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
  union all
  select k.start_date, k.end_date
    from public.listing_blocks k
   where k.listing_id = p_listing_id
     and k.end_date > current_date
  order by 1;
$$;
