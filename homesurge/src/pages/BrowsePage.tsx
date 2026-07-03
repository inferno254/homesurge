import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, SlidersHorizontal, X, Search } from 'lucide-react'
import { usePageMeta } from '../lib/seo'
import { PropertyCard } from '../components/PropertyCard'
import { FadeIn } from '../components/FadeIn'
import { SaveButton } from '../components/SaveButton'
import { CompareButton } from '../components/CompareButton'
import { AreaInsights } from '../components/AreaInsights'
import { useFavorites } from '../hooks/useFavorites'
import { useCompare } from '../hooks/useCompare'
import { fetchPublicProperties } from '../lib/supabaseApi'
import { supabase } from '../lib/supabase'
import type { PublicPropertyRow } from '../types/property'

const PAGE_SIZE = 12

async function loadAll(): Promise<PublicPropertyRow[]> {
  return fetchPublicProperties()
}

export function BrowsePage() {
  usePageMeta('Browse listings', 'Filter and search homes by county, price, type, and more. Broad area context only — exact pins stay private.')
  const configured = Boolean(supabase)
  const [qText, setQText] = useState('')
  const [county, setCounty] = useState('')
  const [type, setType] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [area, setArea] = useState('')
  const { isFavorite, toggle: toggleFav } = useFavorites()
  const { isSelected, toggle: toggleCompare } = useCompare()

  const query = useQuery({
    queryKey: ['public-properties-all'],
    queryFn: loadAll,
    enabled: configured,
  })

  const filtered = useMemo(() => {
    const list = query.data ?? []
    const qt = qText.trim().toLowerCase()
    const pMin = priceMin ? Number(priceMin) : 0
    const pMax = priceMax ? Number(priceMax) : Infinity

    const result = list.filter((p) => {
      if (county) {
        const candidate = p.county ?? ''
        if (!candidate || candidate.toLowerCase() !== county.toLowerCase()) return false
      }
      if (type && p.property_type !== type) return false
      if (Number(p.price) < pMin || Number(p.price) > pMax) return false
      if (area) {
        const candidate = p.area_label ?? ''
        if (!candidate || candidate.toLowerCase() !== area.toLowerCase()) return false
      }
      if (!qt) return true
      const blob = [p.title, p.town, p.area_label, p.description, p.listing_reference]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return blob.includes(qt)
    })

    if (sortBy === 'price-low') result.sort((a, b) => Number(a.price) - Number(b.price))
    else if (sortBy === 'price-high') result.sort((a, b) => Number(b.price) - Number(a.price))
    else if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortBy === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return result
  }, [query.data, qText, county, type, priceMin, priceMax, sortBy, area])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const counties = useMemo(() => {
    return ['Kajiado']
  }, [])

  const RONGAI_AREAS = [
    'Kandisi',
    'Rimpa',
    'Nkoroi',
    'Merisho',
    'Olekasasi',
    'Tuala',
    'Rangau',
    'Maasai Lodge',
    'Kware',
    'Kiserian',
    'Namanga Colony',
    'Community',
    'Mlimani',
    'Noonikiria',
    'St. Mary\'s',
    'Pillar',
    'Kware Kona',
    'Riara',
    'Milimani',
    'Mbaru Kware',
    'Ekerubo',
    'Koko Agency',
    'Tumaini',
    'St. Patrick\'s',
    'Nsambiti',
    'Tumaini Shopping Centre',
    'Kware To Ecclesia',
    'Riara Centre',
    'Majengo',
    'Kware Qc',
    'Kware Plaza',
    'Kware Centre',
    'Oltukai',
    'Kware Stage',
  ]

  const areaOptions = useMemo(() => {
    if (!county) return []
    const s = new Set(RONGAI_AREAS)
    ;(query.data ?? []).forEach((p) => {
      if (p.county?.toLowerCase() === county.toLowerCase() && p.area_label) {
        s.add(p.area_label)
      }
    })
    return [...s].sort()
  }, [query.data, county])

  const resetPage = () => setPage(1)
  const hasActiveFilters = priceMin || priceMax || sortBy !== 'newest' || area

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <FadeIn>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
              Browse homes
            </h1>
            <p className="text-sm text-zinc-500 mt-2">
              {filtered.length} listing{filtered.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
              showFilters
                ? 'border-trace-cyan/30 bg-trace-cyan/10 text-trace-cyan'
                : 'border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/[0.15]'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? 'Hide filters' : 'Filters'}
          </button>
        </div>
      </FadeIn>

      {/* Search bar */}
      <FadeIn delay={100}>
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            className="glass-input w-full pl-11 pr-4 py-3 text-sm"
            placeholder="Search by title, town, reference..."
            value={qText}
            onChange={(e) => { setQText(e.target.value); resetPage() }}
          />
          {qText && (
            <button
              onClick={() => { setQText(''); resetPage() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={150}>
        <div className="glass-card mb-8 space-y-4 p-5">
          <div className="grid gap-3 md:grid-cols-4">
            <select
              className="glass-input rounded-xl px-4 py-2.5 text-sm"
              value={county}
              onChange={(e) => { setCounty(e.target.value); setArea(''); resetPage() }}
            >
              <option value="">All counties</option>
              {counties.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="glass-input rounded-xl px-4 py-2.5 text-sm"
              value={area}
              onChange={(e) => { setArea(e.target.value); resetPage() }}
              disabled={!county}
            >
              <option value="">{county ? 'All areas' : 'Select county first'}</option>
              {areaOptions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select
              className="glass-input rounded-xl px-4 py-2.5 text-sm capitalize"
              value={type}
              onChange={(e) => { setType(e.target.value); resetPage() }}
            >
              <option value="">All property types</option>
              {['apartment', 'bedsitter', 'bungalow', 'maisonette', 'studio', 'townhouse', 'land', 'commercial'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                className="glass-input rounded-xl px-4 py-2.5 text-sm flex-1"
                placeholder="Min price"
                value={priceMin}
                onChange={(e) => { setPriceMin(e.target.value); resetPage() }}
              />
              <input
                type="number"
                className="glass-input rounded-xl px-4 py-2.5 text-sm flex-1"
                placeholder="Max price"
                value={priceMax}
                onChange={(e) => { setPriceMax(e.target.value); resetPage() }}
              />
            </div>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="grid gap-3 md:grid-cols-4 pt-3 border-t border-white/[0.06] animate-fade-in">
              <select
                className="glass-input rounded-xl px-4 py-2.5 text-sm"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); resetPage() }}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
              </select>
              {hasActiveFilters && (
                <button
                  onClick={() => { setPriceMin(''); setPriceMax(''); setSortBy('newest'); setArea(''); resetPage() }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] px-4 py-2.5 text-xs text-zinc-400 hover:text-white hover:border-white/[0.2] transition-colors"
                >
                  <X className="h-3 w-3" />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </FadeIn>

      {!configured && (
        <div className="glass-card p-6 text-zinc-400">API backend is not reachable.</div>
      )}

      {configured && (
        <>
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar insights */}
            <div className="lg:col-span-1">
              {query.data && query.data.length > 0 && (
                <FadeIn>
                  <AreaInsights
                    properties={query.data}
                    targetCounty={county || undefined}
                    targetTown={qText || undefined}
                  />
                </FadeIn>
              )}
            </div>

            {/* Listings grid */}
            <div className="lg:col-span-3">
              {query.isLoading && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <FadeIn key={i} delay={i * 80}>
                      <div className="rounded-2xl border border-white/[0.08] bg-trace-card overflow-hidden">
                        <div className="skeleton aspect-[4/3]" />
                        <div className="space-y-3 p-5">
                          <div className="skeleton h-5 w-3/4" />
                          <div className="skeleton h-4 w-1/2" />
                          <div className="skeleton h-3 w-2/3" />
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              )}
              {query.error && <p className="text-red-400">{(query.error as Error).message}</p>}
              {!query.isLoading && !query.error && (
                <>
                  <div className="flex items-center justify-between mb-5 text-xs text-zinc-600">
                    <span>
                      Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </span>
                    <span>Page {safePage} of {totalPages}</span>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {paged.map((p, i) => (
                      <FadeIn key={p.id} delay={(i % PAGE_SIZE) * 60}>
                        <div className="group relative">
                          <PropertyCard property={p} />
                          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <SaveButton id={p.id} isFavorite={isFavorite(p.id)} onToggle={toggleFav} compact />
                          </div>
                          <div className="absolute top-12 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CompareButton id={p.id} isSelected={isSelected(p.id)} onToggle={toggleCompare} />
                          </div>
                        </div>
                      </FadeIn>
                    ))}
                  </div>

                  {filtered.length === 0 && (
                    <div className="glass-card rounded-2xl p-12 text-center">
                      <p className="text-zinc-400 mb-2">No listings match your filters</p>
                      <p className="text-sm text-zinc-600">Try adjusting your search criteria</p>
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-10">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                        className="btn-ghost rounded-xl px-4 py-2.5 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </button>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum: number
                          if (totalPages <= 5) pageNum = i + 1
                          else if (safePage <= 3) pageNum = i + 1
                          else if (safePage >= totalPages - 2) pageNum = totalPages - 4 + i
                          else pageNum = safePage - 2 + i
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`h-9 w-9 rounded-lg text-xs font-semibold transition-all ${
                                pageNum === safePage
                                  ? 'bg-trace-cyan text-trace-dusk shadow-glow'
                                  : 'text-zinc-500 hover:text-white hover:bg-white/[0.06]'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages}
                        className="btn-ghost rounded-xl px-4 py-2.5 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
