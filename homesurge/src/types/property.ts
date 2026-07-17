export interface DbProperty {
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
  deposit_amount: number | null
  water_deposit: number | null
  electricity_deposit: number | null
  water_price_per_unit: number | null
  has_balcony: boolean
  has_rooftop: boolean
  created_at: string
  updated_at: string
  image_urls: string[] | null
  amenity_names: string[] | null
}

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
  deposit_amount: number | null
  water_deposit: number | null
  electricity_deposit: number | null
  water_price_per_unit: number | null
  has_balcony: boolean
  has_rooftop: boolean
  created_at: string
  is_available: boolean
}

export type ListingQuality = { completeness: number; missing: string[] }
export type SortDir = 'asc' | 'desc'
export type SortKey = keyof DbProperty | 'quality' | 'actions'
export type BulkAction = 'publish' | 'unpublish' | 'delete'
