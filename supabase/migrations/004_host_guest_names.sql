-- 004 — Hosts can see the names of guests who booked with them.
-- Run once in Supabase → SQL Editor, after 003. Safe to re-run.

-- Only the profile of a traveller who has a booking with this host — not
-- every user in the system.
drop policy if exists "Hosts see their guests' profiles" on public.profiles;
create policy "Hosts see their guests' profiles"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1 from public.bookings b
       where b.traveler_id = profiles.id
         and b.host_id = auth.uid()
    )
  );
