import { supabaseConfigured } from './env'

export type PublicPropertyRow = {
  id: string
  title: string
  description: string | null
  ai_generated_description: string | null
  price: number
  price_type: 'monthly' | 'sale' | 'negotiable'
  bedrooms: number | null
  bathrooms: number | null
  property_type: string
  county: string | null
  town: string | null
  area_label: string | null
  listing_reference: string | null
  cover_image_url: string | null
  image_urls: string[] | null
  amenity_names: string[] | null
  furnished: boolean
  size_sqm: number | null
  created_at: string
}

export type DbProperty = {
  id: string
  title: string
  slug: string | null
  description: string | null
  ai_generated_description: string | null
  price: number
  price_type: 'monthly' | 'sale' | 'negotiable'
  bedrooms: number | null
  bathrooms: number | null
  property_type: 'apartment' | 'bedsitter' | 'bungalow' | 'maisonette' | 'studio' | 'townhouse' | 'bnb' | 'land' | 'commercial' | string
  furnished: boolean
  size_sqm: number | null
  county: string | null
  town: string | null
  area_label: string | null
  estate: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  owner_phone: string | null
  listing_reference: string | null
  is_available: boolean
  is_published: boolean
  cover_image_url: string | null
  created_at: string
  updated_at: string
  image_urls: string[] | null
  amenity_names: string[] | null
}

export interface Inquiry {
  id: string
  property_id: string
  name: string
  phone: string
  message: string | null
  created_at: string
  property_title?: string | null
  property_ref?: string | null
}

export interface NairobiArea {
  id: string
  town: string | null
  area_label: string | null
  estate: string | null
  typical_rent_min: number | null
  typical_rent_max: number | null
  security_rating: number | null
  transport_notes: string | null
  amenities_nearby: string | null
}

export interface ActivityEntry {
  id: string
  admin_id: string
  action: string
  property_id: string | null
  property_ref: string | null
  details: string | null
  created_at: string
}

export function isApiConfigured() {
  return supabaseConfigured()
}
