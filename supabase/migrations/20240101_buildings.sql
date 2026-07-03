-- Supabase PostGIS migration for homesurge buildings
-- Run this in Supabase Dashboard Ã¢â€ â€™ SQL Editor

-- Enable PostGIS (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Buildings table
CREATE TABLE IF NOT EXISTS public.buildings (
  id BIGSERIAL PRIMARY KEY,
  osm_id BIGINT,
  building_type TEXT DEFAULT 'yes',
  height_m NUMERIC DEFAULT 8,
  name TEXT,
  status TEXT DEFAULT 'unverified' CHECK (status IN ('unverified','verified','claimed','custom')),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  added_by UUID REFERENCES auth.users(id),
  geometry geometry(Polygon, 4326) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Spatial index
CREATE INDEX IF NOT EXISTS idx_buildings_geometry ON public.buildings USING GIST (geometry);

-- B-tree indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_buildings_osm_id ON public.buildings(osm_id);
CREATE INDEX IF NOT EXISTS idx_buildings_status ON public.buildings(status);
CREATE INDEX IF NOT EXISTS idx_buildings_property_id ON public.buildings(property_id);

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION update_buildings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_buildings_updated_at ON public.buildings;
CREATE TRIGGER trg_buildings_updated_at
  BEFORE UPDATE ON public.buildings
  FOR EACH ROW EXECUTE FUNCTION update_buildings_updated_at();

-- RPC: get buildings within a bounding box (fast spatial query)
-- Simplified geometries + capped at 5000 to keep responses fast
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
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'osm_id', b.osm_id,
        'building_type', b.building_type,
        'height_m', b.height_m,
        'name', b.name,
        'status', b.status,
        'property_id', b.property_id,
        'geometry', ST_AsGeoJSON(ST_SimplifyPreserveTopology(b.geometry, 0.00015))::jsonb
      )
    ) INTO result
    FROM public.buildings b
    WHERE ST_Intersects(b.geometry, bbox)
    ORDER BY b.id
    LIMIT 5000;
  ELSE
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'osm_id', b.osm_id,
        'building_type', b.building_type,
        'height_m', b.height_m,
        'name', b.name,
        'status', b.status,
        'property_id', b.property_id,
        'geometry', ST_AsGeoJSON(ST_SimplifyPreserveTopology(b.geometry, 0.00015))::jsonb
      )
    ) INTO result
    FROM public.buildings b
    WHERE ST_Intersects(b.geometry, bbox) AND b.status = p_status
    ORDER BY b.id
    LIMIT 5000;
  END IF;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

-- RPC: upsert building metadata (tap to claim / set height / link property)
CREATE OR REPLACE FUNCTION upsert_building(
  p_id BIGINT,
  p_height_m NUMERIC DEFAULT NULL,
  p_building_type TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_property_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  updated_row public.buildings;
BEGIN
  UPDATE public.buildings
  SET
    height_m = COALESCE(p_height_m, height_m),
    building_type = COALESCE(p_building_type, building_type),
    name = COALESCE(p_name, name),
    status = COALESCE(p_status, status),
    property_id = COALESCE(p_property_id, property_id),
    metadata = COALESCE(p_metadata, metadata)
  WHERE id = p_id
  RETURNING * INTO updated_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Building id % not found', p_id;
  END IF;

  RETURN jsonb_build_object(
    'id', updated_row.id,
    'osm_id', updated_row.osm_id,
    'building_type', updated_row.building_type,
    'height_m', updated_row.height_m,
    'name', updated_row.name,
    'status', updated_row.status,
    'property_id', updated_row.property_id,
    'geometry', ST_AsGeoJSON(updated_row.geometry)::jsonb,
    'metadata', updated_row.metadata
  );
END;
$$ LANGUAGE plpgsql;

-- RPC: bulk insert buildings from GeoJSON-like data
CREATE OR REPLACE FUNCTION bulk_insert_buildings(
  p_features JSONB,
  p_default_height_m NUMERIC DEFAULT 8,
  p_default_status TEXT DEFAULT 'unverified'
)
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER := 0;
  feat JSONB;
  geom geometry;
  props JSONB;
BEGIN
  FOR feat IN SELECT * FROM jsonb_array_elements(p_features)
  LOOP
    BEGIN
      geom := ST_SetSRID(ST_GeomFromGeoJSON(feat->'geometry'::TEXT), 4326);
      IF geom IS NOT NULL AND ST_IsValid(geom) THEN
        props := feat->'properties';
        INSERT INTO public.buildings (
          osm_id, building_type, height_m, name, status, geometry, metadata
        ) VALUES (
          (props->>'osm_id')::BIGINT,
          COALESCE(props->>'building', 'yes'),
          COALESCE((props->>'height')::NUMERIC, p_default_height_m),
          props->>'name',
          p_default_status,
          geom,
          props
        );
        inserted_count := inserted_count + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- skip invalid features silently
      CONTINUE;
    END;
  END LOOP;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- RLS: allow authenticated users to read buildings
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "buildings_public_read" ON public.buildings;
CREATE POLICY "buildings_public_read"
  ON public.buildings FOR SELECT
  USING (true);

-- Enable inserts/updates for authenticated users (admin/updater roles)
DROP POLICY IF EXISTS "buildings_auth_write" ON public.buildings;
CREATE POLICY "buildings_auth_write"
  ON public.buildings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Grant RPC to anon for public read access
GRANT EXECUTE ON FUNCTION get_buildings_by_bounds TO anon, authenticated;

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'buildings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.buildings;
  END IF;
END $$;


