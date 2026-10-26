-- 013 — More safety: safety features on listings, hosts/guides can report
-- guests, and people can delete their own account.
-- Run once in Supabase → SQL Editor, after 012. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Safety features on listings (smoke alarm, first-aid kit, …)
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists safety_features text[] not null default '{}';

alter table public.listings drop constraint if exists listings_safety_features_check;
alter table public.listings add constraint listings_safety_features_check
  check (safety_features <@ array[
    'smoke_alarm', 'fire_extinguisher', 'first_aid', 'security_guard',
    'cctv_outside', 'gated', 'well_lit', 'emergency_exit', 'indoor_cameras'
  ]);

-- Hosts write this column like the other listing details (see 002 and 006).
grant insert (safety_features), update (safety_features) on public.listings to authenticated;

-- Demo data: give existing listings a sensible starting set, based on what
-- they already offer. Hosts can change it on the edit page.
update public.listings
   set safety_features = array['first_aid', 'fire_extinguisher', 'smoke_alarm']
                         || case when 'security' = any (amenities) then array['security_guard', 'gated'] else '{}'::text[] end
 where safety_features = '{}';

-- ---------------------------------------------------------------------------
-- 2. Hosts and guides can report a guest
-- ---------------------------------------------------------------------------
alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports add constraint reports_target_type_check
  check (target_type in ('listing', 'tour', 'guest'));

alter table public.reports drop constraint if exists reports_category_check;
alter table public.reports add constraint reports_category_check
  check (category in ('fraud', 'unsafe', 'fake', 'inappropriate', 'damage', 'rules', 'other'));

-- Replaces the version from 012: a guest can only be reported by a host or
-- guide who actually has a booking with them.
create or replace function public.submit_report(p_target_type text, p_target_id uuid, p_category text, p_details text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Please log in to report.';
  end if;
  if p_target_id = auth.uid() then
    raise exception 'You can''t report yourself.';
  end if;
  if p_target_type = 'guest' and not exists (
    select 1 from public.bookings where host_id = auth.uid() and traveler_id = p_target_id
    union all
    select 1 from public.tour_bookings where guide_id = auth.uid() and traveler_id = p_target_id
  ) then
    raise exception 'You can only report guests who booked with you.';
  end if;
  if exists (
    select 1 from public.reports
     where reporter_id = auth.uid() and target_id = p_target_id and status = 'open'
  ) then
    raise exception 'You have already reported this. Our team is looking into it.';
  end if;

  insert into public.reports (reporter_id, target_type, target_id, category, details)
  values (auth.uid(), p_target_type, p_target_id, p_category, nullif(trim(p_details), ''));
end;
$$;

-- Replaces the version from 012: guest reports show the guest's name.
create or replace function public.admin_reports()
returns table (
  id uuid, target_type text, target_id uuid, target_title text, target_status text,
  owner_name text, category text, details text, reporter_name text, created_at timestamptz
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
    select r.id, r.target_type, r.target_id,
           coalesce(l.title, t.title, case when r.target_type = 'guest' then 'Guest: ' || coalesce(g.full_name, 'unknown') end, 'Deleted'),
           coalesce(l.status, t.status, case when r.target_type = 'guest' then 'guest' end, 'deleted'),
           coalesce(o.full_name, g.full_name), r.category, r.details, rp.full_name, r.created_at
      from public.reports r
      left join public.listings l on r.target_type = 'listing' and l.id = r.target_id
      left join public.tours t on r.target_type = 'tour' and t.id = r.target_id
      left join public.profiles g on r.target_type = 'guest' and g.id = r.target_id
      left join public.profiles o on o.id = coalesce(l.host_id, t.guide_id)
      left join public.profiles rp on rp.id = r.reporter_id
     where r.status = 'open'
     order by r.created_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Delete my account
-- ---------------------------------------------------------------------------
-- Refuses while the person has a stay or tour coming up (as a guest, host or
-- guide), so nobody is left without a booking. Otherwise removes the account;
-- their profile, listings, tours and bookings are removed with it (on delete
-- cascade).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Please log in first.';
  end if;

  if exists (
    select 1 from public.bookings
     where (traveler_id = uid or host_id = uid)
       and status in ('pending', 'confirmed') and check_out >= current_date
    union all
    select 1 from public.tour_bookings
     where (traveler_id = uid or guide_id = uid)
       and status in ('pending', 'confirmed') and tour_date >= current_date
  ) then
    raise exception 'You have stays or tours coming up. Cancel or finish them first, then you can delete your account.';
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
