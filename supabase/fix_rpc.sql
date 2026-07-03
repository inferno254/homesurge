CREATE OR REPLACE FUNCTION get_buildings_by_bounds(
  min_lon DOUBLE PRECISION,
  min_lat DOUBLE PRECISION,
  max_lon DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  p_status TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  bbox geometry := ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326);
BEGIN
  IF p_status IS NULL THEN
    SELECT COALESCE(jsonb_agg(t.feature), '[]'::jsonb)
    INTO result
    FROM (
      SELECT jsonb_build_object(
        'id', b.id,
        'osm_id', b.osm_id,
        'building_type', b.building_type,
        'height_m', b.height_m,
        'name', b.name,
        'status', b.status,
        'property_id', b.property_id,
        'geometry', ST_AsGeoJSON(ST_SimplifyPreserveTopology(b.geometry, 0.00015))::jsonb
      ) AS feature
      FROM public.buildings b
      WHERE ST_Intersects(b.geometry, bbox)
      ORDER BY b.id
      LIMIT 5000
    ) t;
  ELSE
    SELECT COALESCE(jsonb_agg(t.feature), '[]'::jsonb)
    INTO result
    FROM (
      SELECT jsonb_build_object(
        'id', b.id,
        'osm_id', b.osm_id,
        'building_type', b.building_type,
        'height_m', b.height_m,
        'name', b.name,
        'status', b.status,
        'property_id', b.property_id,
        'geometry', ST_AsGeoJSON(ST_SimplifyPreserveTopology(b.geometry, 0.00015))::jsonb
      ) AS feature
      FROM public.buildings b
      WHERE ST_Intersects(b.geometry, bbox) AND b.status = p_status
      ORDER BY b.id
      LIMIT 5000
    ) t;
  END IF;
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;
