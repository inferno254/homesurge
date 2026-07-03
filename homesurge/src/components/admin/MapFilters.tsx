import { useState } from 'react'
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { DbProperty } from '../../types/property'

export type MapFilters = {
  q: string
  status: 'all' | 'published' | 'draft'
  availability: 'all' | 'available' | 'unavailable'
  center: string
  minPrice: number | null
  maxPrice: number | null
  bedrooms: number | null
  furnished: boolean | null
  hasCoordinates: boolean
  hideReviewed: boolean
}

const DEFAULT_FILTERS: MapFilters = {
  q: '',
  status: 'all',
  availability: 'all',
  center: 'all',
  minPrice: null,
  maxPrice: null,
  bedrooms: null,
  furnished: null,
  hasCoordinates: false,
  hideReviewed: false,
}

export function getDefaultFilters(): MapFilters {
  return { ...DEFAULT_FILTERS }
}

export function filtersToParams(filters: MapFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status !== 'all') params.set('status', filters.status)
  if (filters.availability !== 'all') params.set('avail', filters.availability)
  if (filters.center !== 'all') params.set('center', filters.center)
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice))
  if (filters.bedrooms != null) params.set('beds', String(filters.bedrooms))
  if (filters.furnished === true) params.set('furnished', '1')
  else if (filters.furnished === false) params.set('furnished', '0')
  if (filters.hasCoordinates) params.set('hasCoords', '1')
  if (filters.hideReviewed) params.set('hideRev', '1')
  return params
}

export function paramsToFilters(params: URLSearchParams): MapFilters {
  const furnishedParam = params.get('furnished')
  return {
    q: params.get('q') ?? '',
    status: (params.get('status') as MapFilters['status']) ?? 'all',
    availability: (params.get('avail') as MapFilters['availability']) ?? 'all',
    center: params.get('center') ?? 'all',
    minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : null,
    maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : null,
    bedrooms: params.get('beds') ? Number(params.get('beds')) : null,
    furnished: furnishedParam === '1' ? true : furnishedParam === '0' ? false : null,
    hasCoordinates: params.get('hasCoords') === '1',
    hideReviewed: params.get('hideRev') === '1',
  }
}

export function applyFilters(items: DbProperty[], filters: MapFilters): DbProperty[] {
  return items.filter((p) => {
    if (filters.q) {
      const haystack = [p.title, p.town, p.estate, p.county, p.listing_reference]
        .filter(Boolean)
        .map(String)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(filters.q.toLowerCase())) return false
    }
    if (filters.status === 'published' && !p.is_published) return false
    if (filters.status === 'draft' && p.is_published) return false
    if (filters.availability === 'available' && !p.is_available) return false
    if (filters.availability === 'unavailable' && p.is_available) return false
    if (filters.center !== 'all' && p.town !== filters.center) return false
    if (filters.minPrice != null && Number(p.price) < filters.minPrice) return false
    if (filters.maxPrice != null && Number(p.price) > filters.maxPrice) return false
    if (filters.bedrooms != null && p.bedrooms !== filters.bedrooms) return false
    if (filters.furnished === true && !p.furnished) return false
    if (filters.furnished === false && p.furnished) return false
    if (filters.hasCoordinates && (p.latitude == null || p.longitude == null)) return false
    return true
  })
}

export function countActiveFilters(filters: MapFilters): number {
  let n = 0
  if (filters.q) n += 1
  if (filters.status !== 'all') n += 1
  if (filters.availability !== 'all') n += 1
  if (filters.minPrice != null || filters.maxPrice != null) n += 1
  if (filters.bedrooms != null) n += 1
  if (filters.furnished !== null) n += 1
  if (filters.hasCoordinates) n += 1
  if (filters.hideReviewed) n += 1
  return n
}

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5]

export function MapFilters({
  filters,
  onChange,
}: {
  filters: MapFilters
  onChange: (next: MapFilters) => void
}) {
  const [open, setOpen] = useState(true)
  const activeCount = countActiveFilters(filters)

  const handleChange = (updates: Partial<MapFilters>) => {
    onChange({ ...filters, ...updates })
  }

  const clearAll = () => onChange(DEFAULT_FILTERS)

  return (
    <div className="rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-zinc-200">Filters</span>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="text-zinc-400 hover:text-white"
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="space-y-3 px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              value={filters.q}
              onChange={(e) => handleChange({ q: e.target.value })}
              placeholder="Search title, town, estate..."
              className="w-full rounded-lg border border-white/10 bg-black/20 pl-8 pr-8 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none"
            />
            {filters.q && (
              <button
                type="button"
                onClick={() => handleChange({ q: '' })}
                className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <select
              value={filters.status}
              onChange={(e) => handleChange({ status: e.target.value as MapFilters['status'] })}
              className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-zinc-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="all">Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={filters.availability}
              onChange={(e) => handleChange({ availability: e.target.value as MapFilters['availability'] })}
              className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-zinc-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="all">Availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <select
              value={filters.bedrooms ?? ''}
              onChange={(e) => handleChange({ bedrooms: e.target.value ? Number(e.target.value) : null })}
              className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-zinc-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="">Beds</option>
              {BEDROOM_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} bed{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="number"
              placeholder="Min price"
              value={filters.minPrice ?? ''}
              onChange={(e) => handleChange({ minPrice: e.target.value ? Number(e.target.value) : null })}
              className="w-24 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-zinc-200 placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Max price"
              value={filters.maxPrice ?? ''}
              onChange={(e) => handleChange({ maxPrice: e.target.value ? Number(e.target.value) : null })}
              className="w-24 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-zinc-200 placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleChange({ furnished: filters.furnished === true ? null : true })}
              className={`rounded-lg border px-2 py-1.5 ${
                filters.furnished ? 'border-violet-400/50 bg-violet-400/10 text-violet-200' : 'border-white/10 bg-black/20 text-zinc-400'
              }`}
            >
              Furnished
            </button>
            <button
              type="button"
              onClick={() => handleChange({ hasCoordinates: !filters.hasCoordinates })}
              className={`rounded-lg border px-2 py-1.5 ${
                filters.hasCoordinates ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200' : 'border-white/10 bg-black/20 text-zinc-400'
              }`}
            >
              Has pin
            </button>
            <button
              type="button"
              onClick={() => handleChange({ hideReviewed: !filters.hideReviewed })}
              className={`rounded-lg border px-2 py-1.5 ${
                filters.hideReviewed ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-black/20 text-zinc-400'
              }`}
            >
              Hide reviewed
            </button>
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-zinc-500 underline hover:text-white"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}
