-- 009 — Reviews: only guests who actually stayed can review, once per booking.
-- Run once in Supabase → SQL Editor, after 008. Safe to re-run.

create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null unique references public.bookings (id) on delete cascade, -- one review per stay
  listing_id      uuid not null references public.listings (id) on delete cascade,
  author_id       uuid not null references auth.users (id) on delete cascade,
  host_id         uuid references auth.users (id) on delete set null,
  author_name     text not null,               -- first name only, so profiles stay private
  rating          integer not null check (rating between 1 and 5),
  comment         text not null check (char_length(comment) between 10 and 1000),
  host_reply      text check (host_reply is null or char_length(host_reply) <= 1000),
  host_replied_at timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists reviews_listing_idx on public.reviews (listing_id, created_at desc);

-- Anyone can read reviews. Nobody writes to the table directly — only
-- through the two functions below, which check who is allowed.
alter table public.reviews enable row level security;

drop policy if exists "Reviews are public" on public.reviews;
create policy "Reviews are public" on public.reviews for select using (true);

revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Leave a review
-- ---------------------------------------------------------------------------
-- Only the guest on the booking, only after check-out, only once. Then the
-- listing's average rating and review count are recalculated.
create or replace function public.submit_review(p_booking_id uuid, p_rating integer, p_comment text)
returns public.reviews
language plpgsql
security definer set search_path = public
as $$
declare
  b public.bookings;
  first_name text;
  r public.reviews;
begin
  select * into b from public.bookings where id = p_booking_id and traveler_id = auth.uid();
  if not found then
    raise exception 'Booking not found.';
  end if;
  if b.status not in ('confirmed', 'completed') then
    raise exception 'Only confirmed stays can be reviewed.';
  end if;
  if b.check_out > current_date then
    raise exception 'You can leave a review after your stay ends.';
  end if;
  if exists (select 1 from public.reviews where booking_id = b.id) then
    raise exception 'You have already reviewed this stay.';
  end if;
  if p_rating < 1 or p_rating > 5 then
    raise exception 'Please choose between 1 and 5 stars.';
  end if;
  if char_length(trim(coalesce(p_comment, ''))) < 10 then
    raise exception 'Please write at least a few words (10+ characters).';
  end if;

  select split_part(coalesce(nullif(trim(full_name), ''), 'Guest'), ' ', 1) into first_name
    from public.profiles where id = auth.uid();

  insert into public.reviews (booking_id, listing_id, author_id, host_id, author_name, rating, comment)
  values (b.id, b.listing_id, auth.uid(), b.host_id, coalesce(first_name, 'Guest'), p_rating, trim(p_comment))
  returning * into r;

  update public.bookings set status = 'completed' where id = b.id and status = 'confirmed';

  update public.listings l
     set rating = s.avg_rating, review_count = s.n
    from (select round(avg(rating)::numeric, 1) as avg_rating, count(*)::integer as n
            from public.reviews where listing_id = b.listing_id) s
   where l.id = b.listing_id;

  return r;
end;
$$;

-- ---------------------------------------------------------------------------
-- Host replies to a review on their listing (once)
-- ---------------------------------------------------------------------------
create or replace function public.reply_to_review(p_review_id uuid, p_reply text)
returns public.reviews
language plpgsql
security definer set search_path = public
as $$
declare
  r public.reviews;
begin
  if char_length(trim(coalesce(p_reply, ''))) < 2 then
    raise exception 'Please write a reply.';
  end if;

  update public.reviews
     set host_reply = trim(p_reply), host_replied_at = now()
   where id = p_review_id and host_id = auth.uid() and host_reply is null
  returning * into r;

  if not found then
    raise exception 'You can only reply once to reviews of your own listings.';
  end if;
  return r;
end;
$$;

revoke execute on function public.submit_review(uuid, integer, text) from public, anon;
revoke execute on function public.reply_to_review(uuid, text) from public, anon;
grant execute on function public.submit_review(uuid, integer, text) to authenticated;
grant execute on function public.reply_to_review(uuid, text) to authenticated;
