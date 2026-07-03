-- homesurge: Nairobi & environs seed data
-- Run AFTER schema.sql. Provides reference estates, areas, and sample listings.

-- Areas reference table for insights & admin helpers
create table if not exists public.nairobi_areas (
  id uuid primary key default gen_random_uuid(),
  county text not null default 'Nairobi',
  town text not null,
  area_label text,
  estate text,
  latitude numeric,
  longitude numeric,
  typical_rent_min numeric,
  typical_rent_max numeric,
  security_rating text check (security_rating in ('low', 'medium', 'high', 'premium')),
  transport_notes text,
  amenities_nearby text[],
  schools_nearby text[],
  hospitals_nearby text[],
  shopping_nearby text[],
  created_at timestamptz not null default now()
);

alter table public.nairobi_areas enable row level security;
create policy "areas_public_read" on public.nairobi_areas for select using (true);
create policy "areas_admin_all" on public.nairobi_areas for all using (public.is_admin());

grant select on public.nairobi_areas to anon, authenticated;

-- Seed major Nairobi areas
insert into public.nairobi_areas (town, area_label, estate, latitude, longitude, typical_rent_min, typical_rent_max, security_rating, transport_notes, amenities_nearby, schools_nearby, hospitals_nearby, shopping_nearby) values

-- Central / High-rise
('Nairobi', 'Westlands', 'Westlands Business District', -1.2675, 36.8095, 45000, 150000, 'high',
 'Matatu C43, C44, C46; accessible to Thika Rd & Waiyaki Way',
 ARRAY['24hr water', 'electricity', 'gym', 'parking', 'cctv', 'backup generator'],
 ARRAY['Westlands Primary', 'St. Mary''s School', 'Brookhouse School'],
 ARRAY['Aga Khan Hospital', 'Nairobi Women''s Hospital', 'MP Shah Hospital'],
 ARRAY['Westgate Mall', 'Sarit Centre', 'The Mall Westlands']),

('Nairobi', 'Kilimani', 'Kilimani Estate', -1.2821, 36.7915, 40000, 120000, 'high',
 'Matatu C8, C10, C15; frequent along Ngong Rd',
 ARRAY['24hr water', 'electricity', 'cctv', 'parking', 'water tank'],
 ARRAY['Kilimani Primary', 'Oshwal Academy', 'New Generation School'],
 ARRAY['Nairobi South Hospital', 'Gertrude''s Hospital', 'The Mater Hospital'],
 ARRAY['Yaya Centre', 'Adlife Plaza', 'The Junction Mall']),

('Nairobi', 'Lavington', 'Lavington Estate', -1.2720, 36.7689, 60000, 200000, 'high',
 'Matatu C3, C5, C7; private access via James Gichuru Rd',
 ARRAY['24hr water', 'electricity', 'cctv', 'backup generator', 'garden', 'parking'],
 ARRAY['Lavington Primary', 'St. Austin''s Academy', 'Hillside School'],
 ARRAY['Aga Khan Hospital', 'The Nairobi Hospital'],
 ARRAY['Lavington Mall', 'Valley Arcade', 'ABC Place']),

('Nairobi', 'Kileleshwa', 'Kileleshwa Estate', -1.2741, 36.7785, 50000, 180000, 'high',
 'Matatu C6, C9; near James Gichuru Rd & Waiyaki Way',
 ARRAY['24hr water', 'electricity', 'cctv', 'parking'],
 ARRAY['Kileleshwa Academy', 'The Banda School', 'Riverside School'],
 ARRAY['Nairobi West Hospital', 'MP Shah Hospital'],
 ARRAY['Kileleshwa Mall', 'Nextgen Mall']),

-- Eastlands
('Nairobi', 'Eastlands', 'Buruburu', -1.2889, 36.8766, 20000, 50000, 'medium',
 'Matatu C2, C4, C12; accessible via Jogoo Rd & Outer Ring Rd',
 ARRAY['water', 'electricity', 'market', 'schools'],
 ARRAY['Buruburu Primary', 'Nyangoma School', 'Buruburu Girls'],
 ARRAY['Nairobi East Hospital', 'Coptic Hospital', 'Mama Lucy Hospital'],
 ARRAY['Buruburu Market', 'Savannah Mall', 'East View Mall']),

('Nairobi', 'Eastlands', 'Umoja Estate', -1.2746, 36.8912, 15000, 35000, 'medium',
 'Matatu C12, C2; accessible via Jogoo Rd & Outering Rd',
 ARRAY['water', 'electricity', 'market', 'schools', 'health center'],
 ARRAY['Umoja Primary', 'Umoja High School'],
 ARRAY['Nairobi East Hospital', 'Umoja Health Center'],
 ARRAY['Umoja Market', 'Eastgate Mall']),

('Nairobi', 'Eastlands', 'Donholm / Savannah', -1.2780, 36.9078, 18000, 40000, 'medium',
 'Matatu 32, C2, C12; near Outering & Jogoo Rd junction',
 ARRAY['water', 'electricity', 'schools', 'shopping'],
 ARRAY['Donholm Primary', 'Savannah High School'],
 ARRAY['Nairobi East Hospital', 'Savannah Medical'],
 ARRAY['Savannah Mall', 'Donholm Market']),

('Nairobi', 'Eastlands', 'South B / South C', -1.3056, 36.8487, 30000, 70000, 'high',
 'Matatu 24, 28, C8; near Langata Rd & Mombasa Rd',
 ARRAY['water', 'electricity', 'cctv', 'parking', 'schools'],
 ARRAY['South B Primary', 'Nairobi Muslim Academy', 'Arena Primary'],
 ARRAY['Coptic Hospital', 'Nairobi South Hospital'],
 ARRAY['T-Mall', 'Nextgen Mall', 'Bellevue Mall']),

-- South / Langata
('Nairobi', 'Langata', 'Langata Estate', -1.3653, 36.7472, 30000, 80000, 'medium',
 'Matatu 15, 125; along Langata Rd; accessible to Mombasa Rd & Magadi Rd',
 ARRAY['water', 'electricity', 'security', 'schools'],
 ARRAY['Langata Primary', 'Moi Forces Academy', 'Langata High School'],
 ARRAY['Kenya Airforce Hospital', 'Nairobi West Hospital'],
 ARRAY['The Hub Karen', 'Langata Shopping Centre']),

('Nairobi', 'Karen', 'Karen Estate', -1.3506, 36.7085, 80000, 300000, 'premium',
 'Private access; limited matatu options; best with car via Langata Rd & Ngong Rd',
 ARRAY['borehole water', 'electricity', 'generator', 'cctv', 'large compound', 'garden'],
 ARRAY['Karen Primary', 'St. Mary''s Karen', 'Banda School', 'Braeburn School'],
 ARRAY['Karen Hospital', 'Aga Khan Hospital'],
 ARRAY['The Hub Karen', 'Karen Shopping Centre', 'Waterfront Karen']),

('Nairobi', 'Langata', 'Madaraka Estate', -1.3188, 36.7872, 40000, 90000, 'high',
 'Matatu 15, 24; near Daystar University; adjacent to Nairobi National Park Ngong Rd access',
 ARRAY['24hr water', 'electricity', 'cctv', 'parking', 'schools'],
 ARRAY['Madaraka Primary', 'Daystar University', 'Nairobi Aviation College'],
 ARRAY['Nairobi West Hospital', 'Gertrude''s Children Hospital'],
 ARRAY['T-Mall', 'Adlife Plaza']),

-- Westlands / Parklands
('Nairobi', 'Parklands', 'Parklands Estate', -1.2615, 36.8065, 55000, 180000, 'high',
 'Matatu 44, C43; near Chiromo Rd & Limuru Rd; accessible to Thika Rd & Waiyaki Way',
 ARRAY['24hr water', 'electricity', 'cctv', 'backup generator', 'gym'],
 ARRAY['Parklands Primary', 'Banda School', 'Consolata School'],
 ARRAY['Aga Khan Hospital', 'Nairobi Hospital'],
 ARRAY['Sarit Centre', 'Westgate Mall', 'Diamond Plaza']),

('Nairobi', 'Westlands', 'Mountain View', -1.2555, 36.7875, 35000, 80000, 'medium',
 'Matatu 106, 102; accessible via Waiyaki Way & Lower Kabete Rd',
 ARRAY['water', 'electricity', 'schools', 'shopping'],
 ARRAY['Mountain View Primary', 'Kabete High School'],
 ARRAY['Kabete Health Centre', 'Nairobi West Hospital'],
 ARRAY['Mountain View Mall', 'Kabete Shopping Centre']),

('Nairobi', 'Gigiri', 'Gigiri / UN Ave', -1.2431, 36.8036, 80000, 250000, 'premium',
 'Private security; matatu 106, C43; access from Limuru Rd & UN Ave',
 ARRAY['24hr water', 'electricity', 'backup generator', 'cctv', 'private security', 'gym'],
 ARRAY['Gigiri School', 'International School of Kenya', 'Rosslyn Academy'],
 ARRAY['Aga Khan Hospital', 'Gertrude''s Children Hospital'],
 ARRAY['Village Market', 'Two Rivers Mall']),

-- Upper Hill / CBD
('Nairobi', 'Upper Hill', 'Upper Hill', -1.2956, 36.8196, 60000, 200000, 'high',
 'Matatu C8, C10; walking distance to CBD; near Valley Rd & Ngong Rd',
 ARRAY['24hr water', 'electricity', 'cctv', 'parking', 'backup generator'],
 ARRAY['Upper Hill Primary', 'Nairobi School', 'Kenya High School'],
 ARRAY['The Nairobi Hospital', 'Aga Khan Hospital', 'Mater Hospital'],
 ARRAY['The Junction Mall', 'Yaya Centre', 'CBD malls']),

('Nairobi', 'CBD', 'Nairobi Central', -1.2833, 36.8167, 30000, 100000, 'medium',
 'All matatu routes terminate here; CBD accessible by bus, rail, boda-boda',
 ARRAY['electricity', 'water', 'shopping', 'restaurants'],
 ARRAY['Nairobi Primary', 'State House Girls', 'Nairobi School'],
 ARRAY['Kenyatta National Hospital', 'Nairobi Hospital', 'Mater Hospital'],
 ARRAY['Nairobi CBD', 'TSN Mall', 'Nairobi Gallery']),

-- Kiambu / Satellite towns
('Kiambu', 'Thika', 'Thika Town', -1.0396, 37.0839, 15000, 40000, 'medium',
 'Matatu connections to Nairobi (C42, 143); Thika Superhighway; accessible to Nairobi in 45-90 min',
 ARRAY['water', 'electricity', 'market', 'schools', 'hospitals'],
 ARRAY['Thika Primary', 'Chania Girls', 'Thika High School'],
 ARRAY['Thika Level 5 Hospital', 'Thika Nursing Home'],
 ARRAY['Thika Greens Mall', 'Easymall Thika', 'Thika Town Market']),

('Kiambu', 'Ruaka', 'Ruaka Town', -1.2150, 36.7520, 25000, 60000, 'medium',
 'Matatu 106, 102; accessible via Limuru Rd; heavy traffic during peak hours',
 ARRAY['water', 'electricity', 'schools', 'shopping'],
 ARRAY['Ruaka Primary', 'Braestar School', 'Ruiru High'],
 ARRAY['Ruaka Health Centre', 'Tatu Hospital'],
 ARRAY['Two Rivers Mall', 'Ruaka Shopping Centre', 'Quickmart Ruaka']),

('Kiambu', 'Ruiru', 'Ruiru Town', -1.1489, 36.9494, 10000, 30000, 'medium',
 'Matatu C42, 145; accessible via Thika Superhighway; commuter rail station',
 ARRAY['water', 'electricity', 'market', 'schools'],
 ARRAY['Ruiru Primary', 'Ruiru Girls', 'Kenya Medical Training College'],
 ARRAY['Ruiru Subcounty Hospital', 'Unity Hospital'],
 ARRAY['Ruiru Market', 'Tuskys Ruiru']),

('Kiambu', 'Kiambu Town', 'Kiambu Town', -1.1720, 36.8350, 20000, 50000, 'medium',
 'Matatu 102, 103; accessible via Kiambu Rd; ~45 min to Nairobi CBD',
 ARRAY['water', 'electricity', 'market', 'schools'],
 ARRAY['Kiambu Primary', 'Kiambu High School', 'Keveye Girls'],
 ARRAY['Kiambu County Hospital', 'Kiambu Nursing Home'],
 ARRAY['Kiambu Town Market', 'Quickmart Kiambu']),

-- Machakos / Satellite
('Machakos', 'Athi River', 'Athi River', -1.4611, 36.9814, 12000, 35000, 'medium',
 'Matatu 111, 112; accessible via Mombasa Rd; SGR stations nearby',
 ARRAY['water', 'electricity', 'market', 'schools'],
 ARRAY['Athi River Primary', 'Mavoko High School', 'Kitengela International'],
 ARRAY['Athi River Subcounty Hospital', 'Mavoko Health Centre'],
 ARRAY['Athi River Market', 'Kitengela Mall']),

('Machakos', 'Kitengela', 'Kitengela Town', -1.4890, 36.9536, 15000, 40000, 'medium',
 'Matatu 111, 112; accessible via Mombasa Rd; ~40 min to Nairobi CBD non-peak',
 ARRAY['water', 'electricity', 'market', 'schools', 'shopping'],
 ARRAY['Kitengela Primary', 'Kitengela High', 'Kitengela International School'],
 ARRAY['Kitengela Hospital', 'St. Elizabeth Health Centre'],
 ARRAY['Kitengela Mall', 'Kitengela Market']),

('Machakos', 'Machakos Town', 'Machakos Town', -1.5167, 37.2667, 10000, 30000, 'medium',
 'Matatu 112; accessible via Mombasa Rd & Machakos Rd; SGR at Athi River',
 ARRAY['water', 'electricity', 'market', 'schools', 'hospitals'],
 ARRAY['Machakos Primary', 'Machakos Girls', 'Machakos School'],
 ARRAY['Machakos Level 5 Hospital', 'Machakos Medical Centre'],
 ARRAY['Machakos Town Mall', 'Machakos Market']),

-- Kajiado
('Kajiado', 'Ongata Rongai', 'Rongai Town', -1.3800, 36.7432, 15000, 40000, 'medium',
 'Matatu 125, 126; accessible via Langata Rd & Magadi Rd; ~30 min to CBD non-peak',
 ARRAY['water', 'electricity', 'market', 'schools'],
 ARRAY['Rongai Primary', 'Rongai Girls', 'Edinburg School'],
 ARRAY['Rongai Hospital', 'Immaculate Hospital'],
 ARRAY['Rongai Market', 'Mega Mall Rongai']),

('Kajiado', 'Ngong', 'Ngong Town', -1.3610, 36.6582, 12000, 30000, 'medium',
 'Matatu 124, 126; accessible via Ngong Rd; ~35 min to CBD',
 ARRAY['water', 'electricity', 'market', 'schools'],
 ARRAY['Ngong Primary', 'Ngong High', 'Ololua School'],
 ARRAY['Ngong Subcounty Hospital', 'Ngong Health Centre'],
 ARRAY['Ngong Market', 'Ngong Hills Mall']),

-- Nairobi satellite sub-locations
('Nairobi', 'Kahawa', 'Kahawa West', -1.1960, 36.9097, 10000, 30000, 'medium',
 'Matatu 34, 45; accessible via Thika Superhighway; Kahawa railway station nearby',
 ARRAY['water', 'electricity', 'market', 'schools'],
 ARRAY['Kahawa Primary', 'Kahawa High School', 'MTB Academy'],
 ARRAY['Kahawa Health Centre', 'Kenha Hospital'],
 ARRAY['Kahawa Market', 'Tuskys Kahawa']),

('Nairobi', 'Kahawa', 'Kahawa Sukari', -1.1880, 36.9000, 15000, 40000, 'medium',
 'Matatu 34; near USIU Rd; accessible via Thika Superhighway',
 ARRAY['water', 'electricity', 'cctv', 'parking', 'schools'],
 ARRAY['Sukari Primary', 'USIU', 'Zawadi School'],
 ARRAY['Kahawa Health Centre', 'Aga Khan Hospital (nearby)'],
 ARRAY['Kahawa Market', 'Garden City Mall']),

('Nairobi', 'Kasarani', 'Kasarani Estate', -1.2220, 36.8860, 15000, 40000, 'medium',
 'Matatu 34, 36; accessible via Thika Rd & Kasarani Rd; near Moi Sports Centre',
 ARRAY['water', 'electricity', 'market', 'schools'],
 ARRAY['Kasarani Primary', 'Kasarani High School', 'Nova School'],
 ARRAY['Kasarani Health Centre', 'Nairobi North Hospital'],
 ARRAY['Kasarani Market', 'Garden City Mall', 'Thika Road Mall']),

('Nairobi', 'Roysambu', 'Roysambu / TRM', -1.2147, 36.8700, 20000, 55000, 'medium',
 'Matatu 34, 36, 45; accessible via Thika Superhighway; near TRM & Garden City',
 ARRAY['water', 'electricity', 'cctv', 'parking', 'shopping', 'schools'],
 ARRAY['Roysambu Primary', 'Roysambu High', 'Nairobi International School'],
 ARRAY['Nairobi North Hospital', 'Gertrude''s Kahawa'],
 ARRAY['Thika Road Mall', 'Garden City Mall', 'Roysambu Market']),

('Nairobi', 'Embakasi', 'Embakasi Estate', -1.3197, 36.9078, 12000, 35000, 'medium',
 'Matatu 33, 34, C12; near Jomo Kenyatta Intl Airport; Mombasa Rd & Outering Rd',
 ARRAY['water', 'electricity', 'market', 'schools'],
 ARRAY['Embakasi Primary', 'Embakasi High', 'Airport View School'],
 ARRAY['Embakasi Health Centre', 'Nairobi East Hospital'],
 ARRAY['Embakasi Market', 'T-Mall Embakasi']),

('Nairobi', 'Utawala', 'Utawala Estate', -1.2990, 36.9400, 12000, 30000, 'medium',
 'Matatu 33, 34; accessible via Eastern Bypass & Kangundo Rd',
 ARRAY['water', 'electricity', 'market', 'schools'],
 ARRAY['Utawala Primary', 'Utawala High School'],
 ARRAY['Utawala Health Centre', 'Nairobi East Hospital'],
 ARRAY['Utawala Market', 'Savannah Mall']),

('Nairobi', 'Dandora', 'Dandora Estate', -1.2545, 36.8776, 8000, 20000, 'low',
 'Matatu 12, C12; accessible via Jogoo Rd & Outering Rd',
 ARRAY['water', 'electricity', 'market', 'schools'],
 ARRAY['Dandora Primary', 'Dandora High', 'Moi Academy'],
 ARRAY['Dandora Health Centre', 'Nairobi East Hospital'],
 ARRAY['Dandora Market', 'Eastgate Mall']),

-- prime suburbs
('Nairobi', 'Muthaiga', 'Muthaiga Estate', -1.2489, 36.8197, 100000, 400000, 'premium',
 'Private access; limited matatu; best with car via Limuru Rd & Thika Rd',
 ARRAY['24hr water', 'electricity', 'backup generator', 'cctv', 'private security', 'large compound'],
 ARRAY['Muthaiga Primary', 'Banda School', 'St. Mary''s School'],
 ARRAY['Aga Khan Hospital', 'The Nairobi Hospital', 'MP Shah Hospital'],
 ARRAY['Two Rivers Mall', 'Village Market', 'Sarit Centre']),

('Nairobi', 'Spring Valley', 'Spring Valley', -1.2646, 36.7919, 70000, 250000, 'high',
 'Matatu C5, C6; near Waiyaki Way & James Gichuru Rd',
 ARRAY['24hr water', 'electricity', 'cctv', 'backup generator', 'parking', 'garden'],
 ARRAY['Spring Valley Primary', 'Riverside School', 'Brookhouse School'],
 ARRAY['Aga Khan Hospital', 'MP Shah Hospital', 'Gertrude''s Hospital'],
 ARRAY['Westgate Mall', 'Sarit Centre', 'The Mall Westlands']),

('Nairobi', 'Riverside', 'Riverside Drive', -1.2656, 36.7989, 80000, 300000, 'premium',
 'Private access; limited matatu; best with car; near Waiyaki Way & Riverside Gardens',
 ARRAY['24hr water', 'electricity', 'backup generator', 'cctv', 'gym', 'swimming pool'],
 ARRAY['Riverside School', 'Parklands Primary', 'Banda School'],
 ARRAY['Aga Khan Hospital', 'The Nairobi Hospital'],
 ARRAY['Westgate Mall', 'Sarit Centre', 'Village Market']);

-- Sample listing: a bedsitter in Kilimani
INSERT INTO public.properties (title, description, price, price_type, bedrooms, bathrooms, property_type, furnished, size_sqm, county, town, area_label, estate, address, latitude, longitude, owner_phone, is_published, is_available)
VALUES (
  'Modern bedsitter in Kilimani â€” fully furnished',
  'Clean, well-lit bedsitter on Ngong Rd. Water 24/7, backup generator, shared cctv, walking distance to Yaya Centre and Junction Mall. Quiet compound, friendly neighbours.',
  18000, 'monthly', 1, 1, 'bedsitter', true, 22, 'Nairobi', 'Kilimani', 'Kilimani', 'Kilimani Estate', 'Off Ngong Rd, near Yaya', -1.2820, 36.7910, '+254712345678', true, true
);

-- Sample: 2-bedroom in Buruburu
INSERT INTO public.properties (title, description, price, price_type, bedrooms, bathrooms, property_type, furnished, size_sqm, county, town, area_label, estate, address, latitude, longitude, owner_phone, is_published, is_available)
VALUES (
  'Spacious 2-bedroom in Buruburu phase 5',
  'Semi-furnished 2 bedroom on first floor. Water and electricity included in service charge. Walking distance to Buruburu Market & Savanna Mall. Matatu stage 50m away.',
  32000, 'monthly', 2, 1, 'apartment', false, 65, 'Nairobi', 'Eastlands', 'Buruburu', 'Buruburu', 'Phase 5, near Buruburu Institute', -1.2892, 36.8770, '+254723456789', true, true
);

-- Sample: 3-bedroom in Karen
INSERT INTO public.properties (title, description, price, price_type, bedrooms, bathrooms, property_type, furnished, size_sqm, county, town, area_label, estate, address, latitude, longitude, owner_phone, is_published, is_available)
VALUES (
  'Executive 3-bedroom townhouse in Karen',
  'Beautifully finished 3-bedroom townhouse with garden, borehole water, solar backup, and private parking. Gated community with 24hr security. Near The Hub Karen and Karen Shopping Centre.',
  120000, 'monthly', 3, 2, 'townhouse', true, 120, 'Nairobi', 'Karen', 'Karen', 'Karen Estate', 'Off Langata Rd, near Karen Country Club', -1.3520, 36.7090, '+254734567890', true, true
);

-- Sample: land in Athi River
INSERT INTO public.properties (title, description, price, price_type, bedrooms, bathrooms, property_type, county, town, area_label, estate, address, latitude, longitude, owner_phone, is_published, is_available)
VALUES (
  '1/4 acre plot â€” Athi River, Mavoko',
  'Freehold title, ready for development. Near Mombasa Rd, SGR station 3km away. Ideal for home or investment. Water and electricity on site.',
  2500000, 'sale', null, null, 'land', 'Machakos', 'Athi River', 'Mavoko', 'Athi River', 'Near Mavoko Town, off Mombasa Rd', -1.4620, 36.9820, '+254745678901', true, true
);

-- Sample: bedsitter in Ruaka
INSERT INTO public.properties (title, description, price, price_type, bedrooms, bathrooms, property_type, furnished, size_sqm, county, town, area_label, estate, address, latitude, longitude, owner_phone, is_published, is_available)
VALUES (
  'Affordable bedsitter in Ruaka town centre',
  'Ground floor bedsitter near Two Rivers Mall and Quickmart. Tiled floor, kitchen area, reliable water. Ideal for single professional. 5 min walk to matatu stage.',
  12000, 'monthly', 1, 1, 'bedsitter', false, 18, 'Kiambu', 'Ruaka', 'Ruaka Town', 'Ruaka Town', 'Off Limuru Rd, near Quickmart', -1.2155, 36.7525, '+254756789012', true, true
);

-- Sample: 1-bedroom in Kileleshwa
INSERT INTO public.properties (title, description, price, price_type, bedrooms, bathrooms, property_type, furnished, size_sqm, county, town, area_label, estate, address, latitude, longitude, owner_phone, is_published, is_available)
VALUES (
  'Elegant 1-bedroom in Kileleshwa',
  'Furnished 1-bedroom apartment with ensuite bathroom, fitted kitchen, and balcony. Borehole water, backup generator, gym access. Close to Kileleshwa Mall.',
  45000, 'monthly', 1, 1, 'apartment', true, 45, 'Nairobi', 'Kileleshwa', 'Kileleshwa', 'Kileleshwa Estate', 'Off James Gichuru Rd', -1.2745, 36.7789, '+254767890123', true, true
);

-- Seed amenities for sample properties
-- (We'll reference property IDs in a deterministic way using listing_reference)
-- The trigger assigns listing_reference automatically. Let's update based on slug.

-- Note: Run this part AFTER the inserts above (listing_references will be auto-generated)
-- Update amenities for the first samples:
-- HT-2026-000001 bedsitter in Kilimani
INSERT INTO public.amenities (property_id, name)
SELECT id, 'WiFi' FROM public.properties WHERE listing_reference LIKE 'HT-2026-%' ORDER BY created_at LIMIT 1;
INSERT INTO public.amenities (property_id, name)
SELECT id, 'Water 24/7' FROM public.properties WHERE listing_reference LIKE 'HT-2026-%' ORDER BY created_at LIMIT 1;
INSERT INTO public.amenities (property_id, name)
SELECT id, 'Security' FROM public.properties WHERE listing_reference LIKE 'HT-2026-%' ORDER BY created_at LIMIT 1;
INSERT INTO public.amenities (property_id, name)
SELECT id, 'CCTV' FROM public.properties WHERE listing_reference LIKE 'HT-2026-%' ORDER BY created_at LIMIT 1;

-- (We'll skip full amenity seeding â€” admins can add via the form. This establishes the pattern.)
