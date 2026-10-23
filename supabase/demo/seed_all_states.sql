-- One demo stay in every remaining Nigerian state, so all 36 states + the FCT
-- have at least one place to stay (seed_listings.sql already covers Lagos,
-- FCT, Cross River, Rivers, Enugu, Oyo and Akwa Ibom).
--
-- 1. Replace YOUR-HOST-EMAIL below with the email of your HOST account.
-- 2. Run the whole script in Supabase → SQL Editor.
-- Safe to re-run: a listing is skipped if that host already has one with the same title.

with host as (
  select u.id
    from auth.users u
    join public.profiles p on p.id = u.id
   where lower(u.email) = lower('YOUR-HOST-EMAIL@gmail.com')
     and p.role = 'host'
),
photos(n, url) as (
  values
    (0, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=75'),
    (1, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=75'),
    (2, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=75'),
    (3, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=75'),
    (4, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=75'),
    (5, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600&q=75'),
    (6, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=75'),
    (7, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=75'),
    (8, 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1600&q=75'),
    (9, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1600&q=75')
),
stays(city, state, area, title, property_type, bedrooms, max_guests, price, photo, highlight) as (
  values
    ('Umuahia',        'Abia',        'Ikot Ekpene Road',     'Umuahia Garden Apartment',          'apartment',  2, 4, 30000, 0, 'close to the National War Museum'),
    ('Yola',           'Adamawa',     'Jimeta',               'Jimeta Riverside Guesthouse',       'guesthouse', 1, 2, 22000, 6, 'a short drive from the Benue River'),
    ('Awka',           'Anambra',     'Ifite Road',           'Awka Executive Apartment',          'apartment',  2, 4, 35000, 1, 'near UNIZIK and the state secretariat'),
    ('Bauchi',         'Bauchi',      'GRA',                  'Bauchi GRA Family Home',            'house',      3, 6, 40000, 3, 'a good base for trips to Yankari Game Reserve'),
    ('Yenagoa',        'Bayelsa',     'Ovom',                 'Yenagoa Creekside Apartment',       'apartment',  2, 4, 38000, 2, 'minutes from the Ox-Bow Lake'),
    ('Makurdi',        'Benue',       'High Level',           'Makurdi High Level Guesthouse',     'guesthouse', 1, 2, 20000, 9, 'close to the Benue River bridges'),
    ('Maiduguri',      'Borno',       'GRA',                  'Maiduguri GRA Hotel Room',          'hotel_room', 1, 2, 25000, 5, 'in the quiet, secure GRA'),
    ('Asaba',          'Delta',       'Okpanam Road',         'Asaba Riverview Apartment',         'apartment',  2, 4, 45000, 0, 'near the Niger Bridge and the Asaba waterfront'),
    ('Abakaliki',      'Ebonyi',      'Kpirikpiri',           'Abakaliki Cosy Guesthouse',         'guesthouse', 1, 2, 18000, 6, 'close to the city centre'),
    ('Benin City',     'Edo',         'GRA',                  'Benin GRA Heritage Home',           'house',      3, 6, 55000, 7, 'near the Oba''s Palace and the National Museum'),
    ('Ado-Ekiti',      'Ekiti',       'Ajilosun',             'Ado-Ekiti Hillside Apartment',      'apartment',  2, 4, 25000, 1, 'with views of the Ekiti hills'),
    ('Gombe',          'Gombe',       'Tudun Wada',           'Gombe Quiet Apartment',             'apartment',  2, 4, 24000, 8, 'close to the Gombe Main Market'),
    ('Owerri',         'Imo',         'New Owerri',           'New Owerri Luxury Apartment',       'apartment',  2, 4, 45000, 2, 'in the heart of New Owerri''s restaurants and lounges'),
    ('Dutse',          'Jigawa',      'Takur',                'Dutse Simple Guesthouse',           'guesthouse', 1, 2, 15000, 9, 'near the Dutse rock formations'),
    ('Kaduna',         'Kaduna',      'Malali',               'Kaduna Malali Family Home',         'house',      3, 6, 45000, 3, 'in leafy Malali, close to the city centre'),
    ('Kano',           'Kano',        'Nassarawa GRA',        'Kano GRA Courtyard House',          'house',      3, 6, 50000, 7, 'a short drive from Kurmi Market and the old city walls'),
    ('Katsina',        'Katsina',     'GRA',                  'Katsina GRA Guesthouse',            'guesthouse', 1, 2, 18000, 6, 'near the Emir''s Palace and Gobarau Minaret'),
    ('Birnin Kebbi',   'Kebbi',       'GRA',                  'Birnin Kebbi Hotel Room',           'hotel_room', 1, 2, 16000, 5, 'close to the Argungu fishing festival route'),
    ('Lokoja',         'Kogi',        'Lokongoma',            'Lokoja Confluence View Apartment',  'apartment',  2, 4, 30000, 0, 'overlooking where the Niger and Benue rivers meet'),
    ('Ilorin',         'Kwara',       'GRA',                  'Ilorin GRA Serviced Apartment',     'apartment',  2, 4, 32000, 1, 'near the Ilorin Central Mosque'),
    ('Lafia',          'Nasarawa',    'Shabu',                'Lafia Peaceful Guesthouse',         'guesthouse', 1, 2, 17000, 9, 'a calm stop between Abuja and Jos'),
    ('Minna',          'Niger',       'Bosso',                'Minna Bosso Family Home',           'house',      3, 6, 35000, 3, 'close to Zuma Rock and Gurara Falls trips'),
    ('Abeokuta',       'Ogun',        'Ibara GRA',            'Abeokuta Olumo View Apartment',     'apartment',  2, 4, 30000, 2, 'minutes from Olumo Rock'),
    ('Akure',          'Ondo',        'Alagbaka',             'Akure Alagbaka Apartment',          'apartment',  2, 4, 28000, 8, 'near Idanre Hills day trips'),
    ('Osogbo',         'Osun',        'Oke-Fia',              'Osogbo Sacred Grove Guesthouse',    'guesthouse', 1, 2, 20000, 6, 'close to the Osun-Osogbo Sacred Grove'),
    ('Jos',            'Plateau',     'Rayfield',             'Jos Rayfield Cool-Climate Home',    'house',      3, 6, 45000, 7, 'in the cool hills of Rayfield, near the Jos Wildlife Park'),
    ('Sokoto',         'Sokoto',      'GRA',                  'Sokoto GRA Hotel Room',             'hotel_room', 1, 2, 18000, 5, 'near the Sultan''s Palace'),
    ('Jalingo',        'Taraba',      'Mayo-Gwoi',            'Jalingo Gateway Guesthouse',        'guesthouse', 1, 2, 18000, 9, 'a stop on the way to the Mambilla Plateau'),
    ('Damaturu',       'Yobe',        'GRA',                  'Damaturu Simple Hotel Room',        'hotel_room', 1, 2, 15000, 4, 'in the quiet GRA'),
    ('Gusau',          'Zamfara',     'GRA',                  'Gusau GRA Guesthouse',              'guesthouse', 1, 2, 15000, 6, 'close to the city centre')
)
insert into public.listings (
  host_id, title, description, city, address, property_type, bedrooms, max_guests,
  price_per_night, photos, amenities, house_rules, booking_mode, cancellation_policy, host_verified
)
select host.id,
       s.title,
       format('A comfortable %s in the %s area of %s, %s. Clean rooms, reliable power and a friendly host who can point you to the best local food and sights.',
              case s.property_type when 'house' then 'home' when 'hotel_room' then 'hotel room' else s.property_type end,
              s.area, s.city, s.highlight),
       s.city,
       format('%s, %s, %s State', s.area, s.city, s.state),
       s.property_type, s.bedrooms, s.max_guests, s.price,
       array[p.url],
       array['wifi', 'power', 'ac', 'security', 'hot_water'],
       array['no_smoking', 'no_parties'],
       case when s.price < 25000 then 'instant' else 'request' end,
       'moderate',
       s.price >= 35000
  from host
 cross join stays s
  join photos p on p.n = s.photo
 where not exists (
   select 1 from public.listings l where l.host_id = host.id and l.title = s.title
 );

-- Check: stays per city
select city, count(*) as stays from public.listings where status = 'active' group by city order by city;
