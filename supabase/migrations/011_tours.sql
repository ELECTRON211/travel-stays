-- 011 — Tours & experiences (PRD phase 2): guides list tours, travellers book
-- a date and a number of people, guides accept or decline.
-- Run once in Supabase → SQL Editor, after 010. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Who is a guide? (same idea as is_host() in 002)
-- ---------------------------------------------------------------------------
create or replace function public.is_guide()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'guide');
$$;

-- ---------------------------------------------------------------------------
-- 2. Tours
-- ---------------------------------------------------------------------------
create table if not exists public.tours (
  id               uuid primary key default gen_random_uuid(),
  guide_id         uuid not null references auth.users (id) on delete cascade,
  title            text not null check (char_length(title) between 5 and 100),
  description      text check (description is null or char_length(description) <= 2000),
  city             text not null,
  category         text not null default 'culture' check (category in ('food', 'adventure', 'culture', 'nature')),
  duration_hours   numeric(3, 1) not null check (duration_hours > 0 and duration_hours <= 24),
  start_time       text not null default '09:00' check (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  meeting_point    text,
  max_group        integer not null check (max_group between 1 and 50),
  price_per_person integer not null check (price_per_person >= 0), -- in naira
  itinerary        text check (itinerary is null or char_length(itinerary) <= 2000), -- one stop per line
  included         text[] not null default '{}',
  languages        text not null default 'English',
  days             text[] not null default '{mon,tue,wed,thu,fri,sat,sun}'
                   check (days <@ array['mon','tue','wed','thu','fri','sat','sun'] and cardinality(days) > 0),
  photos           text[] not null default '{}',
  status           text not null default 'active' check (status in ('active', 'paused')),
  created_at       timestamptz not null default now()
);

create index if not exists tours_city_idx on public.tours (city);
create index if not exists tours_guide_idx on public.tours (guide_id);

alter table public.tours enable row level security;

drop policy if exists "Active tours are public" on public.tours;
create policy "Active tours are public"
  on public.tours for select
  using (status = 'active' or guide_id = auth.uid());

drop policy if exists "Guides add their own tours" on public.tours;
create policy "Guides add their own tours"
  on public.tours for insert to authenticated
  with check (guide_id = auth.uid() and public.is_guide());

drop policy if exists "Guides edit their own tours" on public.tours;
create policy "Guides edit their own tours"
  on public.tours for update to authenticated
  using (guide_id = auth.uid())
  with check (guide_id = auth.uid());

drop policy if exists "Guides delete their own tours" on public.tours;
create policy "Guides delete their own tours"
  on public.tours for delete to authenticated
  using (guide_id = auth.uid());

grant select on public.tours to anon, authenticated;
grant insert, update, delete on public.tours to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Tour bookings — created and changed only through the functions below
-- ---------------------------------------------------------------------------
create table if not exists public.tour_bookings (
  id               uuid primary key default gen_random_uuid(),
  tour_id          uuid not null references public.tours (id) on delete cascade,
  traveler_id      uuid not null references auth.users (id) on delete cascade,
  guide_id         uuid not null references auth.users (id) on delete cascade,
  tour_date        date not null,
  people           integer not null check (people > 0),
  price_per_person integer not null,
  service_fee      integer not null,
  total            integer not null,
  status           text not null default 'pending'
                   check (status in ('pending', 'confirmed', 'declined', 'cancelled', 'completed')),
  created_at       timestamptz not null default now()
);

create index if not exists tour_bookings_tour_date_idx on public.tour_bookings (tour_id, tour_date);

alter table public.tour_bookings enable row level security;

drop policy if exists "Travellers and guides see their tour bookings" on public.tour_bookings;
create policy "Travellers and guides see their tour bookings"
  on public.tour_bookings for select to authenticated
  using (traveler_id = auth.uid() or guide_id = auth.uid());

revoke all on public.tour_bookings from anon, authenticated;
grant select on public.tour_bookings to authenticated;

-- A guide's public card on a tour page: first name and bio only (profiles
-- themselves stay private).
create or replace function public.guide_profile(p_guide_id uuid)
returns table (first_name text, bio text)
language sql
stable
security definer set search_path = public
as $$
  select split_part(coalesce(p.full_name, ''), ' ', 1), p.bio
    from public.profiles p
   where p.id = p_guide_id and p.role = 'guide';
$$;

grant execute on function public.guide_profile(uuid) to anon, authenticated;

-- Places still free on a date (anyone may ask — it reveals no personal data).
create or replace function public.tour_spots_left(p_tour_id uuid, p_date date)
returns integer
language sql
stable
security definer set search_path = public
as $$
  select greatest(t.max_group - coalesce((
           select sum(b.people) from public.tour_bookings b
            where b.tour_id = t.id and b.tour_date = p_date and b.status in ('pending', 'confirmed')
         ), 0), 0)::integer
    from public.tours t
   where t.id = p_tour_id;
$$;

-- Book a tour. The price is worked out here, never trusted from the browser.
-- Locking the tour row makes two people booking the last places at the same
-- moment safe: the second waits, then sees the updated count.
create or replace function public.create_tour_booking(p_tour_id uuid, p_date date, p_people integer)
returns public.tour_bookings
language plpgsql
security definer set search_path = public
as $$
declare
  t public.tours;
  taken integer;
  subtotal integer;
  fee integer;
  b public.tour_bookings;
begin
  if auth.uid() is null then
    raise exception 'Please log in to book.';
  end if;

  select * into t from public.tours where id = p_tour_id and status = 'active' for update;
  if not found then
    raise exception 'This tour is not available for booking.';
  end if;
  if t.guide_id = auth.uid() then
    raise exception 'You can''t book your own tour.';
  end if;
  if p_date < current_date then
    raise exception 'Pick a date from today onwards.';
  end if;
  if p_date > current_date + 180 then
    raise exception 'Tours can be booked up to 6 months ahead.';
  end if;
  if not (lower(to_char(p_date, 'Dy')) = any (t.days)) then
    raise exception 'This tour doesn''t run on that day of the week.';
  end if;
  if p_people < 1 or p_people > t.max_group then
    raise exception 'This tour takes up to % people.', t.max_group;
  end if;

  select coalesce(sum(people), 0) into taken
    from public.tour_bookings
   where tour_id = t.id and tour_date = p_date and status in ('pending', 'confirmed');
  if taken + p_people > t.max_group then
    raise exception 'Only % places left on that date.', greatest(t.max_group - taken, 0);
  end if;

  subtotal := p_people * t.price_per_person;
  fee := round(subtotal * 0.10); -- 10% service fee, same as stays

  insert into public.tour_bookings (
    tour_id, traveler_id, guide_id, tour_date, people, price_per_person, service_fee, total
  ) values (
    t.id, auth.uid(), t.guide_id, p_date, p_people, t.price_per_person, fee, subtotal + fee
  )
  returning * into b;

  return b;
end;
$$;

-- Guide accepts or declines a pending request.
create or replace function public.respond_tour_booking(p_booking_id uuid, p_accept boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.tour_bookings
     set status = case when p_accept then 'confirmed' else 'declined' end
   where id = p_booking_id and guide_id = auth.uid() and status = 'pending';
  if not found then
    raise exception 'This request can no longer be changed.';
  end if;
end;
$$;

-- Traveller cancels a booking that hasn't happened yet.
create or replace function public.cancel_tour_booking(p_booking_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.tour_bookings
     set status = 'cancelled'
   where id = p_booking_id and traveler_id = auth.uid()
     and status in ('pending', 'confirmed') and tour_date >= current_date;
  if not found then
    raise exception 'This booking can no longer be cancelled.';
  end if;
end;
$$;

revoke execute on function public.create_tour_booking(uuid, date, integer) from public, anon;
revoke execute on function public.respond_tour_booking(uuid, boolean) from public, anon;
revoke execute on function public.cancel_tour_booking(uuid) from public, anon;
grant execute on function public.create_tour_booking(uuid, date, integer) to authenticated;
grant execute on function public.respond_tour_booking(uuid, boolean) to authenticated;
grant execute on function public.cancel_tour_booking(uuid) to authenticated;
grant execute on function public.tour_spots_left(uuid, date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Admin dashboard: include tours (replaces the version from 010)
-- ---------------------------------------------------------------------------
create or replace function public.admin_stats()
returns json
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only.';
  end if;

  return json_build_object(
    'users',            (select count(*) from public.profiles),
    'travelers',        (select count(*) from public.profiles where role = 'traveler'),
    'hosts',            (select count(*) from public.profiles where role = 'host'),
    'guides',           (select count(*) from public.profiles where role = 'guide'),
    'admins',           (select count(*) from public.profiles where role = 'admin'),
    'new_users_7d',     (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'active_24h',       (select count(*) from public.profiles where last_seen_at > now() - interval '24 hours'),
    'active_7d',        (select count(*) from public.profiles where last_seen_at > now() - interval '7 days'),
    'listings',         (select count(*) from public.listings),
    'active_listings',  (select count(*) from public.listings where status = 'active'),
    'tours',            (select count(*) from public.tours where status = 'active'),
    'tour_bookings',    (select count(*) from public.tour_bookings),
    'bookings',         (select count(*) from public.bookings),
    'pending_bookings', (select count(*) from public.bookings where status = 'pending'),
    'paid_bookings',    (select count(*) from public.bookings where payment_status = 'paid'),
    'revenue',          (select coalesce(sum(total), 0) from public.bookings where payment_status = 'paid'),
    'platform_fees',    (select coalesce(sum(service_fee), 0) from public.bookings where payment_status = 'paid'),
    'reviews',          (select count(*) from public.reviews),
    'avg_rating',       (select round(avg(rating)::numeric, 1) from public.reviews),
    'signups_14d', (
      select json_agg(json_build_object('day', d::date, 'count', (
        select count(*) from public.profiles p where p.created_at::date = d::date
      )) order by d)
      from generate_series(current_date - 13, current_date, interval '1 day') d
    )
  );
end;
$$;
