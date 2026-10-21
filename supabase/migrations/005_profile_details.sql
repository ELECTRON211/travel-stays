-- 005 — Profile details (phone, bio) that users can edit themselves.
-- Run once in Supabase → SQL Editor, after 004. Safe to re-run.

alter table public.profiles
  add column if not exists phone text,
  add column if not exists bio text,
  add column if not exists created_at timestamptz not null default now();

alter table public.profiles drop constraint if exists profiles_phone_check;
alter table public.profiles add constraint profiles_phone_check
  check (phone is null or phone ~ '^[0-9+() -]{7,20}$');

alter table public.profiles drop constraint if exists profiles_bio_check;
alter table public.profiles add constraint profiles_bio_check
  check (bio is null or char_length(bio) <= 500);

-- Each user reads and edits only their own profile. (Hosts can also read the
-- profile of guests who booked with them — see 004.)
alter table public.profiles enable row level security;

drop policy if exists "Users read their own profile" on public.profiles;
create policy "Users read their own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Users may change their name, phone and bio — but never their own role.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, bio) on public.profiles to authenticated;
