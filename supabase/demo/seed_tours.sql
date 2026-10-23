-- Demo tours: food walks, waterfalls, heritage and nature trips in Calabar
-- and other Nigerian destinations, so the Tours tab has something to show.
--
-- 1. Run migration 011_tours.sql first.
-- 2. Replace YOUR-GUIDE-EMAIL below with the email of your GUIDE account.
-- 3. Run the whole script in Supabase → SQL Editor.
-- Safe to re-run: a tour is skipped if that guide already has one with the same title.

with guide as (
  select u.id
    from auth.users u
    join public.profiles p on p.id = u.id
   where lower(u.email) = lower('anyhow680@gmail.com')
     and p.role = 'guide'
)
insert into public.tours (
  guide_id, title, description, city, category, duration_hours, start_time, meeting_point,
  max_group, price_per_person, itinerary, included, languages, days, photos
)
select guide.id, v.title, v.description, v.city, v.category, v.hours, v.start_time, v.meeting_point,
       v.max_group, v.price, v.itinerary, v.included, v.languages, v.days, v.photos
  from guide
 cross join (values
  -- ---------------------------------------------------------------- Calabar
  ('Calabar Food Walk: Watt Market to Edikang Ikong',
   'Taste your way through Calabar with a local who grew up here. Fresh fruit and spices at Watt Market, roadside roasted plantain and fish, then a sit-down plate of edikang ikong and afang at a family-run buka.',
   'Calabar', 'food', 4.0, '10:00', 'Watt Market main entrance, Calabar', 10, 15000,
   E'Meet at Watt Market and walk the spice and produce aisles\nTaste fresh fruit, garden egg and roasted plantain\nStop for grilled fish by the roadside\nLunch: edikang ikong and afang at a local buka\nFinish with zobo and chin-chin',
   array['All food tastings', 'Lunch', 'Bottled water'], 'English, Efik',
   array['wed','sat','sun'],
   array['https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1600&q=75',
         'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=75']),

  ('Agbokim Waterfalls Day Trip',
   'Escape the city for the seven streams of Agbokim Waterfalls near the Cameroon border. Swim in the pools, walk the rainforest trail and enjoy a picnic lunch with the falls as your backdrop.',
   'Calabar', 'adventure', 9.0, '07:00', 'Calabar Marina car park', 12, 35000,
   E'Pick-up in Calabar and scenic drive through Cross River\nGuided rainforest walk down to the falls\nSwim and relax at the pools\nPicnic lunch with a view\nReturn to Calabar by early evening',
   array['Return transport from Calabar', 'Picnic lunch', 'Park entry', 'Bottled water'], 'English',
   array['sat','sun'],
   array['https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1600&q=75',
         'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=75']),

  ('Old Calabar Heritage Walk',
   'Walk through four centuries of history: the Slave History Museum at the Marina, the Old Residency, Duke Town and the story of Mary Slessor. Ideal for first-time visitors.',
   'Calabar', 'culture', 3.0, '09:30', 'Slave History Museum, Calabar Marina', 15, 10000,
   E'Slave History Museum at the Marina Resort\nWalk up to the Old Residency (National Museum)\nDuke Town churches and Efik history\nMary Slessor''s story and her old house\nEnd with drinks overlooking the Calabar River',
   array['Museum entry', 'Bottled water'], 'English, Efik',
   array['tue','wed','thu','fri','sat','sun'],
   array['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=75']),

  ('Calabar Carnival Street Party Experience',
   'Join the biggest street party in Africa with a local who knows the best spots along the route — costumes, music bands and the famous Bikers'' Parade, with safe viewing and refreshments.',
   'Calabar', 'culture', 6.0, '12:00', 'U.J. Esuene Stadium gate, Calabar', 20, 25000,
   E'Meet the group and get your carnival wristband\nWatch the bands and costumes at our reserved spot\nStreet food break\nFollow the parade to the finish\nEvening music at the carnival village',
   array['Reserved viewing spot', 'Refreshments', 'Carnival wristband'], 'English',
   array['fri','sat','sun'],
   array['https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1600&q=75']),

  ('Afi Mountain Canopy Walk & Drill Ranch',
   'Walk among the treetops on one of Africa''s longest canopy walkways at Afi Mountain, then meet rescued drill monkeys and chimpanzees at the Drill Ranch sanctuary.',
   'Calabar', 'nature', 10.0, '06:30', 'Calabar Marina car park', 10, 40000,
   E'Early pick-up and drive to Afi Mountain\nGuided canopy walkway in the rainforest\nLunch at the ranch\nVisit the drill monkey and chimpanzee sanctuary\nReturn to Calabar',
   array['Return transport', 'Lunch', 'Sanctuary entry'], 'English',
   array['sat'],
   array['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=75',
         'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=75']),

  -- ---------------------------------------------------------------- Lagos
  ('Lagos Suya & Night Food Crawl',
   'Lagos comes alive after dark. Hop between the city''s best suya spots, try asun, boli and fish, and end with live music in Victoria Island.',
   'Lagos', 'food', 4.0, '18:30', 'Ozumba Mbadiwe Avenue, Victoria Island', 8, 20000,
   E'Start with peppered suya from a famous mai suya\nBoli and roasted fish by the lagoon\nAsun and chilled drinks\nLive music to finish the night',
   array['All food tastings', 'One drink', 'Transport between stops'], 'English, Yoruba',
   array['thu','fri','sat'],
   array['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=75']),

  ('Tarkwa Bay Beach Day by Boat',
   'Take a boat from the city to the calm, sheltered waters of Tarkwa Bay. Swim, relax under a beach umbrella and enjoy fresh grilled fish on the sand.',
   'Lagos', 'nature', 6.0, '09:00', 'Tarzan Jetty, Ikoyi', 12, 18000,
   E'Boat ride across the lagoon\nSwimming and beach games\nGrilled fish lunch on the beach\nBoat back to Ikoyi',
   array['Return boat ride', 'Life jackets', 'Beach umbrella', 'Lunch'], 'English',
   array['sat','sun'],
   array['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=75']),

  -- ---------------------------------------------------------------- Others
  ('Zuma Rock & Abuja Hills Hike',
   'A morning hike in the hills around Abuja with views of the famous Zuma Rock — a great way to see the green capital from above.',
   'Abuja', 'adventure', 5.0, '06:30', 'Millennium Park main gate, Abuja', 12, 15000,
   E'Drive out to the hills\nGuided hike to the viewpoint\nPhotos with Zuma Rock in the background\nBreakfast picnic and return',
   array['Transport', 'Breakfast picnic', 'Bottled water'], 'English, Hausa',
   array['sat','sun'],
   array['https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1600&q=75']),

  ('Yankari Game Reserve Safari Day',
   'Spot elephants, baboons and antelope on an open-vehicle safari in Yankari, then soak in the warm Wikki Springs.',
   'Bauchi', 'nature', 10.0, '06:00', 'Wikki Camp reception, Yankari', 8, 45000,
   E'Early morning game drive\nBreakfast at Wikki Camp\nSecond game drive to the elephant areas\nSwim in Wikki Warm Springs',
   array['Safari vehicle', 'Park entry', 'Breakfast'], 'English, Hausa',
   array['fri','sat','sun'],
   array['https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=75',
         'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=75']),

  ('Obudu Plateau Ridge Hike',
   'Cool mountain air and rolling green hills: hike the ridges of the Obudu Plateau, visit the natural swimming pool and enjoy the view from the top of the cable car route.',
   'Obudu', 'adventure', 5.0, '08:00', 'Obudu Mountain Resort main gate', 10, 20000,
   E'Meet at the resort gate\nRidge hike with views over the plateau\nNatural swimming pool and waterfall\nTea break with a view\nReturn to the resort',
   array['Guide', 'Tea and snacks'], 'English',
   array['mon','tue','wed','thu','fri','sat','sun'],
   array['https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1600&q=75',
         'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=75'])
 ) as v(title, description, city, category, hours, start_time, meeting_point, max_group, price,
        itinerary, included, languages, days, photos)
 where not exists (
   select 1 from public.tours t where t.guide_id = guide.id and t.title = v.title
 );

-- Check: tours per city
select city, count(*) as tours from public.tours where status = 'active' group by city order by tours desc;
