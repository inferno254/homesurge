CREATE OR REPLACE FUNCTION public.fetch_public_property(target_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  ai_generated_description text,
  price numeric,
  price_type text,
  bedrooms int,
  bathrooms int,
  property_type text,
  county text,
  town text,
  area_label text,
  listing_reference text,
  cover_image_url text,
  image_urls text[],
  amenity_names text[],
  furnished boolean,
  size_sqm numeric,
  is_published boolean,
  is_available boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select * from public.fetch_public_properties() fp where fp.id = target_id limit 1;
$$;

grant execute on function public.fetch_public_property(uuid) to anon, authenticated;
