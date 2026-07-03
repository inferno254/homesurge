import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function RecentlyViewedPage() {
  const { data: recentIds = [] } = useQuery({
    queryKey: ['recently-viewed'],
    queryFn: () => {
      try {
        const raw = localStorage.getItem('homesurge_recently_viewed')
        return raw ? JSON.parse(raw) : []
      } catch {
        return []
      }
    },
  })

  const propertiesQuery = useQuery({
    queryKey: ['public-properties-recent', recentIds],
    queryFn: async () => {
      if (!supabase || recentIds.length === 0) return []
      const { error } = await supabase.rpc('fetch_public_property', { target_id: recentIds[0] })
      if (error) throw error
      const results: unknown[] = []
      for (const id of recentIds) {
        const { data: row } = await supabase.rpc('fetch_public_property', { target_id: id })
        if (row) results.push(row)
      }
      return results
    },
    enabled: recentIds.length > 0,
  })

  const properties = propertiesQuery.data ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-white mb-6">Recently viewed</h1>
      {properties.length === 0 ? (
        <p className="text-zinc-500">No recently viewed listings yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p: unknown) => {
            const property = p as { id: string; title: string; price: number; price_type: string; cover_image_url: string | null; image_urls: string[]; town: string | null; county: string | null; listing_reference: string | null }
            return (
              <Link
                key={property.id}
                to={`/listing/${property.id}`}
                className="glass-card overflow-hidden group"
              >
                <div className="aspect-[5/3] bg-trace-line">
                  <img
                    src={property.cover_image_url ?? property.image_urls?.[0] ?? ''}
                    alt=""
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs font-mono text-cyan-300">{property.listing_reference}</p>
                  <h3 className="text-white font-semibold group-hover:text-cyan-300 transition-colors">{property.title}</h3>
                  <p className="text-cyan-300 font-semibold text-sm">
                    KSh {Number(property.price).toLocaleString()}
                    {property.price_type === 'monthly' ? '/mo' : property.price_type === 'sale' ? ' (sale)' : ' (negotiable)'}
                  </p>
                  <p className="text-xs text-zinc-500">{[property.town, property.county].filter(Boolean).join(', ')}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

