-- 010 — Admin dashboard (users, activity, platform stats) + Google sign-in role.
-- Run once in Supabase → SQL Editor, after 009. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. "Last seen" — updated by the app every few minutes while someone uses it
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists last_seen_at timestamptz;

create or replace function public.touch_last_seen()
returns void
language sql
security definer set search_path = public
as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 2. Who is an admin?
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- 3. Platform numbers for the dashboard (admins only)
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

-- ---------------------------------------------------------------------------
-- 4. User list for the dashboard (admins only) — includes email from auth
-- ---------------------------------------------------------------------------
create or replace function public.admin_users()
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  created_at timestamptz,
  last_seen_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only.';
  end if;

  return query
    select p.id, p.full_name, u.email::text, p.role, p.created_at, p.last_seen_at, u.last_sign_in_at
      from public.profiles p
      join auth.users u on u.id = p.id
     order by coalesce(p.last_seen_at, p.created_at) desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Google sign-up: pick your role once
-- ---------------------------------------------------------------------------
-- Google doesn't know whether someone is a traveller, host or guide, so new
-- Google users start as travellers. Right after their first sign-in the app
-- applies the role they picked on the sign-up page — allowed only for brand
-- new accounts (first 15 minutes) that are still travellers.
create or replace function public.set_initial_role(p_role text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_role not in ('traveler', 'host', 'guide') then
    raise exception 'Choose traveller, host or guide.';
  end if;

  update public.profiles
     set role = p_role
   where id = auth.uid()
     and role = 'traveler'
     and created_at > now() - interval '15 minutes';
end;
$$;

revoke execute on function public.touch_last_seen() from public, anon;
revoke execute on function public.admin_stats() from public, anon;
revoke execute on function public.admin_users() from public, anon;
revoke execute on function public.set_initial_role(text) from public, anon;
grant execute on function public.touch_last_seen() to authenticated;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_users() to authenticated;
grant execute on function public.set_initial_role(text) to authenticated;
