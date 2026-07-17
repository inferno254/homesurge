CREATE OR REPLACE FUNCTION public.fetch_public_properties()
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
  select
    p.id,
    p.title,
    p.description,
    p.ai_generated_description,
    p.price,
    p.price_type,
    p.bedrooms,
    p.bathrooms,
    p.property_type,
    p.county,
    p.town,
    p.area_label,
    p.listing_reference,
    p.cover_image_url,
    coalesce(
      (select array_agg(pi.image_url order by pi.sort_order, pi.created_at)
       from public.property_images pi where pi.property_id = p.id),
      array[]::text[]
    ) as image_urls,
    coalesce(
      (select array_agg(a.name order by a.name)
       from public.amenities a where a.property_id = p.id),
      array[]::text[]
    ) as amenity_names,
    p.furnished,
    p.size_sqm,
    p.is_published,
    p.is_available,
    p.created_at
  from public.properties p
  where p.is_published and p.is_available;
$$;

grant execute on function public.fetch_public_properties() to anon, authenticated;
