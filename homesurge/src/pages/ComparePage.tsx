import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, X, Check, GitCompare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { supabaseConfigured } from '../lib/env'
import { FadeIn } from '../components/FadeIn'
import { useCompare } from '../hooks/useCompare'
import type { PublicPropertyRow } from '../types/property'

export function ComparePage() {
  const configured = supabaseConfigured()
  const { compare, count, toggle, clear } = useCompare()

  const q = useQuery({
    queryKey: ['public-properties-all'],
    queryFn: async () => {
      if (!supabase) return []
      const { data } = await supabase.rpc('fetch_public_properties')
      return (data ?? []) as PublicPropertyRow[]
    },
    enabled: configured && compare.length > 0,
  })

  const items = useMemo(() => {
    return (q.data ?? []).filter((p) => compare.includes(p.id))
  }, [q.data, compare])

  function formatPrice(p: PublicPropertyRow) {
    const n = Number(p.price)
    const formatted = Number.isFinite(n) ? `KSh ${n.toLocaleString()}` : '—'
    if (p.price_type === 'sale') return `${formatted}`
    if (p.price_type === 'negotiable') return `${formatted}+`
    return `${formatted}/mo`
  }

  if (!configured) {
    return <div className="mx-auto max-w-7xl px-6 py-10 text-zinc-400">Configure Supabase first.</div>
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <FadeIn>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to browse
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-trace-violet/10 border border-trace-violet/20">
                <GitCompare className="h-5 w-5 text-trace-violet" />
              </div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
                  Compare listings
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  {count} selected · side-by-side comparison
                </p>
              </div>
            </div>
          </div>
          {count > 0 && (
            <button
              onClick={clear}
              className="btn-ghost rounded-xl text-xs"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
        </div>
      </FadeIn>

      {count === 0 && (
        <FadeIn>
          <div className="glass-card rounded-3xl p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] mx-auto mb-5">
              <GitCompare className="h-7 w-7 text-zinc-600" />
            </div>
            <p className="text-zinc-400 mb-2 text-lg font-medium">No listings selected</p>
            <p className="text-sm text-zinc-600 mb-8 max-w-sm mx-auto">
              Select 2-4 listings using the compare button on any listing card.
            </p>
            <Link
              to="/browse"
              className="btn-primary rounded-2xl px-6 py-3 text-sm inline-flex"
            >
              Browse & select
            </Link>
          </div>
        </FadeIn>
      )}

      {count > 0 && items.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-zinc-500">Loading comparison data...</p>
        </div>
      )}

      {items.length >= 2 && (
        <FadeIn>
          <div className="rounded-2xl border border-white/[0.08] bg-trace-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="w-40 p-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Feature
                    </th>
                    {items.map((p) => (
                      <th key={p.id} className="p-4 min-w-[220px] align-top">
                        <div className="relative">
                          <button
                            onClick={() => toggle(p.id)}
                            className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-rose-500/80 text-white flex items-center justify-center hover:bg-rose-500 transition-colors shadow-lg shadow-rose-500/20"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="h-32 w-full rounded-xl overflow-hidden bg-trace-line mb-3">
                            {p.cover_image_url || p.image_urls?.[0] ? (
                              <img src={p.cover_image_url || p.image_urls![0]} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-zinc-600 text-xs">No image</div>
                            )}
                          </div>
                          <Link
                            to={`/listing/${p.id}`}
                            className="font-display font-semibold text-white hover:text-trace-cyan transition-colors text-sm leading-tight block"
                          >
                            {p.title}
                          </Link>
                          <p className="text-xs text-zinc-500 mt-1">{p.listing_reference}</p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {[
                    { label: 'Price', render: (p: PublicPropertyRow) => <span className="font-bold text-trace-cyan">{formatPrice(p)}</span> },
                    { label: 'Type', render: (p: PublicPropertyRow) => <span className="capitalize text-zinc-300">{p.property_type}</span> },
                    { label: 'Bedrooms', render: (p: PublicPropertyRow) => <span className="text-zinc-300">{p.bedrooms ?? '—'}</span> },
                    { label: 'Bathrooms', render: (p: PublicPropertyRow) => <span className="text-zinc-300">{p.bathrooms ?? '—'}</span> },
                    { label: 'Furnished', render: (p: PublicPropertyRow) => p.furnished
                      ? <span className="badge badge-emerald text-[10px]"><Check className="h-3 w-3" /> Yes</span>
                      : <span className="text-zinc-600">No</span>
                    },
                    { label: 'Size', render: (p: PublicPropertyRow) => <span className="text-zinc-300">{p.size_sqm ? `${p.size_sqm} m²` : '—'}</span> },
                    { label: 'Location', render: (p: PublicPropertyRow) => <span className="text-xs text-zinc-400">{[p.town, p.county].filter(Boolean).join(', ')}</span> },
                    { label: 'Area', render: (p: PublicPropertyRow) => <span className="text-xs text-zinc-500">{p.area_label || '—'}</span> },
                    { label: 'Amenities', render: (p: PublicPropertyRow) => (
                      <div className="flex flex-wrap gap-1.5">
                        {p.amenity_names?.length ? p.amenity_names.slice(0, 4).map((a) => (
                          <span key={a} className="text-[10px] bg-white/[0.04] rounded-md px-2 py-0.5 text-zinc-400 border border-white/[0.05]">{a}</span>
                        )) : <span className="text-zinc-600">—</span>}
                      </div>
                    )},
                    { label: 'Listed', render: (p: PublicPropertyRow) => <span className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</span> },
                  ].map((row) => (
                    <tr key={row.label} className="hover:bg-white/[0.015] transition-colors">
                      <td className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        {row.label}
                      </td>
                      {items.map((p) => (
                        <td key={p.id} className="p-4">
                          {row.render(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>
      )}

      {items.length === 1 && (
        <FadeIn>
          <div className="glass-card rounded-3xl p-16 text-center">
            <p className="text-zinc-400 mb-2">Select at least <strong className="text-white">2</strong> listings to compare</p>
            <p className="text-sm text-zinc-600 mb-8">You have {count} selected · add {Math.max(0, 2 - count)} more</p>
            <Link
              to="/browse"
              className="btn-primary rounded-2xl px-6 py-3 text-sm inline-flex"
            >
              Add more listings
            </Link>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
