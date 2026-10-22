-- DEMO DATA — creates a finished stay so you can show reviews.
--
-- Real bookings can't start in the past, so this inserts one directly as the
-- database owner. It books the traveller (by email) into one listing for two
-- nights last week, confirmed and paid. Then log in as that traveller → My
-- trips → Past → open the stay → "Rate your stay".
--
-- 1. Change the email below to your TRAVELLER account's email.
-- 2. Run in Supabase → SQL Editor. Run it again for more demo stays.

with traveller as (
  select id from auth.users where email = 'YOUR-TRAVELLER-EMAIL@gmail.com'
),
listing as (
  -- any active listing the traveller doesn't own, without an overlapping booking
  select l.* from public.listings l, traveller t
   where l.status = 'active' and l.host_id is distinct from t.id
     and not exists (
       select 1 from public.bookings b
        where b.listing_id = l.id and b.status in ('pending', 'confirmed')
          and daterange(b.check_in, b.check_out, '[)') && daterange(current_date - 7, current_date - 5, '[)')
     )
   order by l.created_at
   limit 1
)
insert into public.bookings (
  listing_id, traveler_id, host_id, check_in, check_out, guests, status,
  nights, price_per_night, cleaning_fee, service_fee, total, payment_status, paid_at
)
select l.id, t.id, l.host_id, current_date - 7, current_date - 5, 1, 'confirmed',
       2, l.price_per_night, l.cleaning_fee,
       round((2 * l.price_per_night + l.cleaning_fee) * 0.10),
       2 * l.price_per_night + l.cleaning_fee + round((2 * l.price_per_night + l.cleaning_fee) * 0.10),
       'paid', now() - interval '8 days'
  from listing l, traveller t
returning id, check_in, check_out, total;
