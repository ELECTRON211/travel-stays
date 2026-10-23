-- 012 — Trust & safety (PRD 5.1 verification workflow, 5.6 trust & safety):
--   • hosts and guides submit an ID + selfie; an admin approves or rejects it
--   • anyone logged in can report a listing, tour or guide; admins review
-- Run once in Supabase → SQL Editor, after 011. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Verified status lives on the profile (set only by admins)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists verified boolean not null default false;
-- Users can't change it: 005 only lets them update full_name, phone and bio.

-- New listings take the host's verified status automatically.
create or replace function public.set_listing_verified()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.host_verified := coalesce((select verified from public.profiles where id = new.host_id), false);
  return new;
end;
$$;

drop trigger if exists listings_set_verified on public.listings;
create trigger listings_set_verified
  before insert on public.listings
  for each row execute function public.set_listing_verified();

-- The guide card on tour pages now also says whether the guide is verified.
drop function if exists public.guide_profile(uuid);
create function public.guide_profile(p_guide_id uuid)
returns table (first_name text, bio text, verified boolean)
language sql
stable
security definer set search_path = public
as $$
  select split_part(coalesce(p.full_name, ''), ' ', 1), p.bio, p.verified
    from public.profiles p
   where p.id = p_guide_id and p.role = 'guide';
$$;
grant execute on function public.guide_profile(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. ID documents — a PRIVATE bucket (no public links, ever)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification-docs', 'verification-docs', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

drop policy if exists "Users upload their own ID documents" on storage.objects;
create policy "Users upload their own ID documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (public.is_host() or public.is_guide())
  );

-- Owners can see their own files; admins can see everyone's (to review them).
drop policy if exists "Owners and admins read ID documents" on storage.objects;
create policy "Owners and admins read ID documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'verification-docs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- 3. Verification requests
-- ---------------------------------------------------------------------------
create table if not exists public.verification_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  id_type     text not null check (id_type in ('nin', 'drivers_licence', 'passport', 'voters_card')),
  id_doc_path text not null,
  selfie_path text not null,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reason      text check (reason is null or char_length(reason) <= 300),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists verification_requests_user_idx on public.verification_requests (user_id, created_at desc);

alter table public.verification_requests enable row level security;

drop policy if exists "Users see their own verification requests" on public.verification_requests;
create policy "Users see their own verification requests"
  on public.verification_requests for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

revoke all on public.verification_requests from anon, authenticated;
grant select on public.verification_requests to authenticated;

-- Host or guide sends their documents (already uploaded to their own folder).
create or replace function public.submit_verification(p_id_type text, p_id_doc_path text, p_selfie_path text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not (public.is_host() or public.is_guide()) then
    raise exception 'Only hosts and guides can request verification.';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid() and verified) then
    raise exception 'You are already verified.';
  end if;
  if exists (select 1 from public.verification_requests where user_id = auth.uid() and status = 'pending') then
    raise exception 'Your documents are already being reviewed.';
  end if;
  if split_part(p_id_doc_path, '/', 1) <> auth.uid()::text or split_part(p_selfie_path, '/', 1) <> auth.uid()::text then
    raise exception 'Invalid document upload.';
  end if;

  insert into public.verification_requests (user_id, id_type, id_doc_path, selfie_path)
  values (auth.uid(), p_id_type, p_id_doc_path, p_selfie_path);
end;
$$;

-- Admin queue: pending requests with the person's name, email and role.
create or replace function public.admin_verifications()
returns table (
  id uuid, user_id uuid, full_name text, email text, role text,
  id_type text, id_doc_path text, selfie_path text, created_at timestamptz
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
    select v.id, v.user_id, p.full_name, u.email::text, p.role, v.id_type, v.id_doc_path, v.selfie_path, v.created_at
      from public.verification_requests v
      join public.profiles p on p.id = v.user_id
      join auth.users u on u.id = v.user_id
     where v.status = 'pending'
     order by v.created_at;
end;
$$;

-- Admin approves (→ Verified badge on the profile and every listing) or rejects with a reason.
create or replace function public.review_verification(p_request_id uuid, p_approve boolean, p_reason text default null)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid;
begin
  if not public.is_admin() then
    raise exception 'Admins only.';
  end if;

  update public.verification_requests
     set status = case when p_approve then 'approved' else 'rejected' end,
         reason = case when p_approve then null else nullif(trim(p_reason), '') end,
         reviewed_at = now()
   where id = p_request_id and status = 'pending'
  returning user_id into uid;

  if uid is null then
    raise exception 'This request has already been reviewed.';
  end if;

  if p_approve then
    update public.profiles set verified = true where id = uid;
    update public.listings set host_verified = true where host_id = uid;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Reports
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('listing', 'tour')),
  target_id   uuid not null,
  category    text not null check (category in ('fraud', 'unsafe', 'fake', 'inappropriate', 'other')),
  details     text check (details is null or char_length(details) <= 1000),
  status      text not null default 'open' check (status in ('open', 'dismissed', 'actioned')),
  created_at  timestamptz not null default now()
);

alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated; -- only through the functions below

create or replace function public.submit_report(p_target_type text, p_target_id uuid, p_category text, p_details text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Please log in to report.';
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
           coalesce(l.title, t.title, 'Deleted'),
           coalesce(l.status, t.status, 'deleted'),
           o.full_name, r.category, r.details, rp.full_name, r.created_at
      from public.reports r
      left join public.listings l on r.target_type = 'listing' and l.id = r.target_id
      left join public.tours t on r.target_type = 'tour' and t.id = r.target_id
      left join public.profiles o on o.id = coalesce(l.host_id, t.guide_id)
      left join public.profiles rp on rp.id = r.reporter_id
     where r.status = 'open'
     order by r.created_at;
end;
$$;

-- Dismiss a report, or pause the reported listing/tour so it leaves search.
create or replace function public.resolve_report(p_report_id uuid, p_pause boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  r public.reports;
begin
  if not public.is_admin() then
    raise exception 'Admins only.';
  end if;

  select * into r from public.reports where id = p_report_id and status = 'open';
  if not found then
    raise exception 'This report has already been handled.';
  end if;

  if p_pause then
    if r.target_type = 'listing' then
      update public.listings set status = 'paused' where id = r.target_id;
    else
      update public.tours set status = 'paused' where id = r.target_id;
    end if;
  end if;

  -- Close this and any other open reports about the same thing.
  update public.reports
     set status = case when p_pause then 'actioned' else 'dismissed' end
   where target_id = r.target_id and status = 'open';
end;
$$;

revoke execute on function public.submit_verification(text, text, text) from public, anon;
revoke execute on function public.admin_verifications() from public, anon;
revoke execute on function public.review_verification(uuid, boolean, text) from public, anon;
revoke execute on function public.submit_report(text, uuid, text, text) from public, anon;
revoke execute on function public.admin_reports() from public, anon;
revoke execute on function public.resolve_report(uuid, boolean) from public, anon;
grant execute on function public.submit_verification(text, text, text) to authenticated;
grant execute on function public.admin_verifications() to authenticated;
grant execute on function public.review_verification(uuid, boolean, text) to authenticated;
grant execute on function public.submit_report(text, uuid, text, text) to authenticated;
grant execute on function public.admin_reports() to authenticated;
grant execute on function public.resolve_report(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Admin dashboard counts (replaces the version from 011)
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
    'verified_users',   (select count(*) from public.profiles where verified),
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
    'open_reports',     (select count(*) from public.reports where status = 'open'),
    'pending_verifications', (select count(*) from public.verification_requests where status = 'pending'),
    'signups_14d', (
      select json_agg(json_build_object('day', d::date, 'count', (
        select count(*) from public.profiles p where p.created_at::date = d::date
      )) order by d)
      from generate_series(current_date - 13, current_date, interval '1 day') d
    )
  );
end;
$$;
