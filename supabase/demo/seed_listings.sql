-- Demo listings: more stays in Calabar plus other Nigerian cities, so search,
-- city filters and "More stays in …" have something to show.
--
-- 1. Replace YOUR-HOST-EMAIL below with the email of your HOST account.
-- 2. Run the whole script in Supabase → SQL Editor.
-- Safe to re-run: a listing is skipped if that host already has one with the
-- same title. Names are made up; the neighbourhoods are real.

with host as (
  select u.id
    from auth.users u
    join public.profiles p on p.id = u.id
   where lower(u.email) = lower('YOUR-HOST-EMAIL@gmail.com')
     and p.role = 'host'
)
insert into public.listings (
  host_id, title, description, city, address, property_type, bedrooms, max_guests,
  price_per_night, photos, amenities, house_rules, booking_mode, cancellation_policy, host_verified
)
select host.id, v.title, v.description, v.city, v.address, v.property_type, v.bedrooms, v.max_guests,
       v.price, v.photos, v.amenities, v.rules, v.booking_mode, v.policy, v.verified
  from host
 cross join (values
  -- ---------------------------------------------------------------- Calabar
  ('Diamond Hill Family Home',
   'A spacious three-bedroom home on quiet Diamond Hill, ten minutes from the city centre. Big sitting room, fitted kitchen and a shaded compound — ideal for families visiting for December Carnival.',
   'Calabar', 'Diamond Hill, Calabar', 'house', 3, 6, 85000,
   array['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=75',
         'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=75',
         'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=75'],
   array['wifi','power','ac','security','parking','kitchen','hot_water','tv'],
   array['no_smoking','no_parties','children_ok'], 'instant', 'moderate', true),

  ('Marina Waterfront Suite',
   'A bright one-bedroom suite a short walk from the Calabar Marina and the Slave History Museum. Wake up to river views and walk to restaurants in the evening.',
   'Calabar', 'Marina Road, Calabar South', 'apartment', 1, 2, 40000,
   array['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=75',
         'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=75'],
   array['wifi','power','ac','security','hot_water','tv'],
   array['no_smoking','quiet_hours'], 'request', 'flexible', true),

  ('Tinapa Lakeside Apartment',
   'Modern two-bedroom apartment near Tinapa with a calm lakeside feel. Fast Wi-Fi and a proper desk make it great for remote work.',
   'Calabar', 'Tinapa area, Calabar', 'apartment', 2, 4, 55000,
   array['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=75',
         'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=75'],
   array['wifi','power','ac','parking','kitchen','workspace','washer'],
   array['no_smoking','no_parties'], 'instant', 'moderate', false),

  ('State Housing Carnival Studio',
   'A neat studio in State Housing Estate — perfect base for Calabar Carnival, close to the route and to Watt Market.',
   'Calabar', 'State Housing Estate, Calabar', 'apartment', 1, 2, 28000,
   array['https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1600&q=75',
         'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1600&q=75'],
   array['wifi','power','ac','security','tv'],
   array['no_smoking','quiet_hours'], 'request', 'strict', false),

  ('Ekpo Abasi Boutique Guesthouse',
   'A friendly, family-run guesthouse with breakfast included. Clean rooms, hot showers and hosts who know every good spot for edikang ikong.',
   'Calabar', 'Ekpo Abasi Street, Calabar', 'guesthouse', 1, 2, 25000,
   array['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=75',
         'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1600&q=75'],
   array['wifi','power','ac','breakfast','hot_water','security'],
   array['no_smoking','no_pets'], 'instant', 'flexible', true),

  ('UNICAL Gate Budget Room',
   'Simple, affordable hotel room near the University of Calabar main gate. Great for students, parents on visiting day and short work trips.',
   'Calabar', 'Etta Agbor Road, Calabar', 'hotel_room', 1, 2, 18000,
   array['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600&q=75'],
   array['wifi','power','ac','security'],
   array['no_smoking','quiet_hours'], 'instant', 'flexible', false),

  -- ---------------------------------------------------------------- Lagos
  ('Lekki Phase 1 Ocean-Breeze Apartment',
   'Stylish two-bedroom apartment in Lekki Phase 1, minutes from the beach and Admiralty Way restaurants. Gated estate with 24/7 power.',
   'Lagos', 'Lekki Phase 1, Lagos', 'apartment', 2, 4, 95000,
   array['https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=75',
         'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=75'],
   array['wifi','power','ac','security','parking','kitchen','pool','tv'],
   array['no_smoking','no_parties'], 'instant', 'moderate', true),

  ('Ikoyi Executive Studio',
   'A quiet executive studio in Ikoyi for business travellers — dedicated workspace, fast internet and a short drive to Victoria Island.',
   'Lagos', 'Ikoyi, Lagos', 'apartment', 1, 2, 75000,
   array['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=75'],
   array['wifi','power','ac','security','workspace','hot_water'],
   array['no_smoking','quiet_hours'], 'request', 'strict', true),

  -- ---------------------------------------------------------------- Abuja
  ('Maitama Garden Villa',
   'A four-bedroom villa with a private garden and pool in leafy Maitama. Room for the whole family, with staff quarters and secure parking.',
   'Abuja', 'Maitama, Abuja', 'house', 4, 8, 150000,
   array['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=75',
         'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=75'],
   array['wifi','power','ac','security','parking','kitchen','pool','washer'],
   array['no_smoking','no_parties','children_ok'], 'request', 'strict', true),

  ('Wuse 2 Business Apartment',
   'Compact one-bedroom apartment in Wuse 2, walking distance to Banex and Aminu Kano Crescent.',
   'Abuja', 'Wuse 2, Abuja', 'apartment', 1, 2, 60000,
   array['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1600&q=75'],
   array['wifi','power','ac','security','workspace','tv'],
   array['no_smoking'], 'instant', 'moderate', false),

  -- ---------------------------------------------------------------- Others
  ('Old GRA Serviced Apartment',
   'Serviced two-bedroom apartment in Old GRA with daily cleaning and backup power — a comfortable base in the Garden City.',
   'Port Harcourt', 'Old GRA, Port Harcourt', 'apartment', 2, 4, 70000,
   array['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=75'],
   array['wifi','power','ac','security','parking','kitchen'],
   array['no_smoking','no_parties'], 'instant', 'moderate', true),

  ('Independence Layout Hillside Home',
   'A breezy three-bedroom home in Independence Layout with views of the Enugu hills.',
   'Enugu', 'Independence Layout, Enugu', 'house', 3, 6, 65000,
   array['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=75'],
   array['wifi','power','security','parking','kitchen','hot_water'],
   array['no_smoking','children_ok'], 'request', 'moderate', false),

  ('Bodija Quiet Guesthouse',
   'A peaceful guesthouse in Bodija, close to the University of Ibadan and UCH. Breakfast included.',
   'Ibadan', 'Bodija, Ibadan', 'guesthouse', 1, 2, 22000,
   array['https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1600&q=75'],
   array['wifi','power','breakfast','security'],
   array['no_smoking','quiet_hours'], 'instant', 'flexible', false),

  ('Ewet Housing Apartment',
   'Two-bedroom apartment in Ewet Housing Estate, a short drive from Ibom Plaza and the stadium.',
   'Uyo', 'Ewet Housing Estate, Uyo', 'apartment', 2, 4, 40000,
   array['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=75'],
   array['wifi','power','ac','security','kitchen'],
   array['no_smoking'], 'request', 'moderate', false),

  ('Obudu Plateau View Cabin',
   'A cosy two-bedroom cabin in Obudu with cool mountain air — a weekend escape from Calabar near the Obudu Plateau.',
   'Obudu', 'Obudu, Cross River', 'house', 2, 4, 80000,
   array['https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1600&q=75',
         'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1600&q=75'],
   array['power','parking','kitchen','hot_water'],
   array['no_smoking','children_ok'], 'request', 'moderate', true)
 ) as v(title, description, city, address, property_type, bedrooms, max_guests, price,
        photos, amenities, rules, booking_mode, policy, verified)
 where not exists (
   select 1 from public.listings l where l.host_id = host.id and l.title = v.title
 );

-- Check: how many stays each city now has
select city, count(*) as stays from public.listings where status = 'active' group by city order by stays desc;
