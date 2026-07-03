import { supabase } from './supabase'
import type { PublicPropertyRow } from '../types/property'

export interface NairobiArea {
  id: string
  town: string | null
  area_label: string | null
  estate: string | null
  typical_rent_min: number | null
  typical_rent_max: number | null
  security_rating: string | null
  transport_notes: string | null
  amenities_nearby: string[] | null
  schools_nearby: string[] | null
  hospitals_nearby: string[] | null
  shopping_nearby: string[] | null
}

export async function fetchPublicProperties(): Promise<PublicPropertyRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('fetch_public_properties')
  if (error) throw new Error(error.message)
  return (data ?? []) as PublicPropertyRow[]
}

export async function fetchPublicProperty(id: string): Promise<PublicPropertyRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('fetch_public_property', { target_id: id })
  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] ?? null : data ?? null
  return row as PublicPropertyRow | null
}

export async function fetchNairobiAreas({
  town,
  county,
}: {
  town?: string
  county?: string
}): Promise<NairobiArea[]> {
  if (!supabase) return []
  let q = supabase.from('nairobi_areas').select('*')
  if (town) q = q.ilike('town', town)
  if (county && !town) q = q.ilike('county', county)
  const { data } = await q.limit(10)
  return (data ?? []) as NairobiArea[]
}

export async function fetchBuildingsByBounds(minLon: number, minLat: number, maxLon: number, maxLat: number): Promise<GeoJSON.FeatureCollection> {
  if (!supabase) return { type: 'FeatureCollection', features: [] }
  const { data, error } = await supabase.rpc('get_buildings_by_bounds', {
    min_lon: minLon,
    min_lat: minLat,
    max_lon: maxLon,
    max_lat: maxLat,
  })
  if (error) {
    console.error('fetchBuildingsByBounds error:', error.message)
    return { type: 'FeatureCollection', features: [] }
  }
  const features = ((data ?? []) as any[]).slice(0, 300)
  return {
    type: 'FeatureCollection',
    features: features.map((f: any) => ({
      type: 'Feature',
      properties: {
        id: f.id,
        osm_id: f.osm_id,
        building_type: f.building_type,
        height_m: Number(f.height_m) || 8,
        name: f.name,
        status: f.status,
        property_id: f.property_id,
      },
      geometry: f.geometry,
    })),
  }
}
