-- 007 — Paystack payments.
-- Run once in Supabase → SQL Editor, after 006. Safe to re-run.
--
-- Flow: the app calls start_payment() → opens the Paystack popup with the
-- returned reference and amount → the verify-payment Edge Function asks
-- Paystack whether that reference really succeeded for the right amount, and
-- only then marks the booking as paid.

-- ---------------------------------------------------------------------------
-- 1. Payment status on bookings
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists paid_at timestamptz,
  add column if not exists payment_reference text;

alter table public.bookings drop constraint if exists bookings_payment_status_check;
alter table public.bookings add constraint bookings_payment_status_check
  check (payment_status in ('unpaid', 'paid', 'refunded'));

-- ---------------------------------------------------------------------------
-- 2. One row per payment attempt
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id               uuid primary key default gen_random_uuid(),
  booking_id       uuid not null references public.bookings (id) on delete cascade,
  traveler_id      uuid not null references auth.users (id) on delete cascade,
  reference        text not null unique,
  amount           integer not null check (amount > 0), -- in kobo (₦1 = 100 kobo)
  status           text not null default 'pending'
                   check (status in ('pending', 'success', 'failed', 'abandoned')),
  channel          text,            -- card, bank_transfer, ussd… (from Paystack)
  gateway_response text,            -- Paystack's message, for support
  created_at       timestamptz not null default now(),
  verified_at      timestamptz
);

create index if not exists payments_booking_idx on public.payments (booking_id);

-- Travellers see their own payments; hosts see payments for their bookings.
-- Only the server (start_payment and the Edge Function) writes payments.
alter table public.payments enable row level security;

drop policy if exists "Travellers and hosts see payments" on public.payments;
create policy "Travellers and hosts see payments"
  on public.payments for select to authenticated
  using (
    traveler_id = auth.uid()
    or exists (select 1 from public.bookings b where b.id = booking_id and b.host_id = auth.uid())
  );

revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Start a payment
-- ---------------------------------------------------------------------------
-- Works out the amount on the server from the booking itself, so the price
-- can't be changed in the browser. Only confirmed, unpaid bookings can be paid.
create or replace function public.start_payment(p_booking_id uuid)
returns table (reference text, amount integer, email text)
language plpgsql
security definer set search_path = public
as $$
declare
  b public.bookings;
  ref text;
begin
  select * into b from public.bookings where id = p_booking_id and traveler_id = auth.uid();
  if not found then
    raise exception 'Booking not found.';
  end if;
  if b.status <> 'confirmed' then
    raise exception 'You can pay once your booking is confirmed by the host.';
  end if;
  if b.payment_status = 'paid' then
    raise exception 'This booking has already been paid.';
  end if;

  ref := 'TS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16));

  insert into public.payments (booking_id, traveler_id, reference, amount)
  values (b.id, auth.uid(), ref, b.total * 100);

  return query select ref, b.total * 100, (auth.jwt() ->> 'email')::text;
end;
$$;

revoke execute on function public.start_payment(uuid) from public, anon;
grant execute on function public.start_payment(uuid) to authenticated;
