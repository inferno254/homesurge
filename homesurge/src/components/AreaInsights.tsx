import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPinned, TrendingUp, Home, DollarSign, Shield, Bus, School, Hospital, ShoppingBag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { PublicPropertyRow } from '../types/property'

type Props = {
  properties: PublicPropertyRow[]
  targetCounty?: string
  targetTown?: string
}

type NairobiArea = {
  id: string
  town: string
  area_label: string | null
  estate: string
  typical_rent_min: number | null
  typical_rent_max: number | null
  security_rating: string | null
  transport_notes: string | null
  amenities_nearby: string[] | null
  schools_nearby: string[] | null
  hospitals_nearby: string[] | null
  shopping_nearby: string[] | null
}

function RatingBadge({ rating }: { rating: string | null }) {
  if (!rating) return null
  const colors: Record<string, string> = {
    low: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
    medium: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
    high: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
    premium: 'bg-trace-violet/10 text-trace-violet border-trace-violet/20',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${colors[rating] || 'bg-white/5 text-zinc-400 border-white/10'}`}>
      <Shield className="h-3 w-3" />
      {rating}
    </span>
  )
}

export function AreaInsights({ properties, targetCounty, targetTown }: Props) {
  const { data: areas } = useQuery({
    queryKey: ['nairobi-areas', targetTown],
    queryFn: async () => {
      if (!supabase) return [] as NairobiArea[]
      let q = supabase.from('nairobi_areas').select('*')
      if (targetTown) q = q.ilike('town', targetTown)
      if (targetCounty && !targetTown) q = q.ilike('county', targetCounty)
      const { data } = await q.limit(10)
      return (data ?? []) as NairobiArea[]
    },
    enabled: Boolean(supabase),
  })

  const stats = useMemo(() => {
    const filtered = properties.filter((p) => {
      if (targetCounty && p.county !== targetCounty) return false
      if (targetTown && p.town !== targetTown) return false
      return true
    })

    if (filtered.length < 2 && (!areas || areas.length === 0)) return null

    const rentalPrices = filtered
      .filter((p) => p.price_type === 'monthly' && p.price > 0)
      .map((p) => Number(p.price))
    const salePrices = filtered
      .filter((p) => p.price_type === 'sale' && p.price > 0)
      .map((p) => Number(p.price))

    const avgRent = rentalPrices.length
      ? Math.round(rentalPrices.reduce((a, b) => a + b, 0) / rentalPrices.length)
      : null
    const avgSale = salePrices.length
      ? Math.round(salePrices.reduce((a, b) => a + b, 0) / salePrices.length)
      : null

    const typeCount: Record<string, number> = {}
    filtered.forEach((p) => {
      typeCount[p.property_type] = (typeCount[p.property_type] || 0) + 1
    })
    const topTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    return {
      total: filtered.length,
      avgRent,
      avgSale,
      topTypes,
      furnished: filtered.filter((p) => p.furnished).length,
    }
  }, [properties, targetCounty, targetTown, areas])

  if (!stats && (!areas || areas.length === 0)) return null

  return (
    <div className="space-y-4">
      {/* Price stats */}
      {stats && (
        <div className="rounded-2xl border border-white/[0.08] bg-trace-card p-5 space-y-4">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <MapPinned className="h-3.5 w-3.5 text-trace-violet" />
            Area insights
            {targetTown && <span className="text-zinc-600 normal-case">· {targetTown}</span>}
            {targetCounty && !targetTown && <span className="text-zinc-600 normal-case">· {targetCounty}</span>}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] mb-1.5">
                <Home className="h-3 w-3" /> Listings
              </div>
              <p className="text-lg font-bold text-white">{stats.total}</p>
            </div>
            {stats.avgRent && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] mb-1.5">
                  <DollarSign className="h-3 w-3" /> Avg. rent
                </div>
                <p className="text-lg font-bold text-trace-cyan">KSh {stats.avgRent.toLocaleString()}</p>
              </div>
            )}
            {stats.avgSale && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] mb-1.5">
                  <TrendingUp className="h-3 w-3" /> Avg. sale
                </div>
                <p className="text-lg font-bold text-trace-violet">KSh {stats.avgSale.toLocaleString()}</p>
              </div>
            )}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] mb-1.5">
                <Home className="h-3 w-3" /> Top types
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {stats.topTypes.map(([type, count]) => (
                  <span key={type} className="text-[10px] text-zinc-400 bg-white/[0.04] rounded-md px-2 py-0.5 border border-white/[0.05] capitalize">
                    {type} {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nairobi area context cards */}
      {areas && areas.length > 0 && areas.map((area) => (
        <div key={area.id} className="rounded-2xl border border-white/[0.08] bg-trace-card p-5 space-y-3">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <MapPinned className="h-3.5 w-3.5 text-trace-violet" />
            {area.estate}
            {area.area_label && <span className="text-zinc-600 normal-case">· {area.area_label}</span>}
          </h4>

          <div className="flex flex-wrap items-center gap-2">
            <RatingBadge rating={area.security_rating} />
            {area.typical_rent_min && area.typical_rent_max && (
              <span className="text-[10px] text-zinc-400 bg-white/[0.04] rounded-lg px-2.5 py-1 border border-white/[0.06]">
                KSh {area.typical_rent_min.toLocaleString()} – {area.typical_rent_max.toLocaleString()}
              </span>
            )}
          </div>

          {area.transport_notes && (
            <div className="flex items-start gap-2.5 text-xs text-zinc-400">
              <Bus className="h-3.5 w-3.5 mt-0.5 shrink-0 text-trace-cyan" />
              <span>{area.transport_notes}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            {area.schools_nearby && area.schools_nearby.length > 0 && (
              <div className="space-y-1.5">
                <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
                  <School className="h-3 w-3" /> Schools
                </span>
                <ul className="space-y-0.5">
                  {area.schools_nearby.slice(0, 3).map((s) => (
                    <li key={s} className="text-zinc-400 text-[11px]">· {s}</li>
                  ))}
                  {area.schools_nearby.length > 3 && (
                    <li className="text-zinc-600 text-[10px]">+{area.schools_nearby.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            {area.hospitals_nearby && area.hospitals_nearby.length > 0 && (
              <div className="space-y-1.5">
                <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
                  <Hospital className="h-3 w-3" /> Hospitals
                </span>
                <ul className="space-y-0.5">
                  {area.hospitals_nearby.slice(0, 3).map((h) => (
                    <li key={h} className="text-zinc-400 text-[11px]">· {h}</li>
                  ))}
                  {area.hospitals_nearby.length > 3 && (
                    <li className="text-zinc-600 text-[10px]">+{area.hospitals_nearby.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            {area.shopping_nearby && area.shopping_nearby.length > 0 && (
              <div className="space-y-1.5">
                <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
                  <ShoppingBag className="h-3 w-3" /> Shopping
                </span>
                <ul className="space-y-0.5">
                  {area.shopping_nearby.slice(0, 3).map((s) => (
                    <li key={s} className="text-zinc-400 text-[11px]">· {s}</li>
                  ))}
                  {area.shopping_nearby.length > 3 && (
                    <li className="text-zinc-600 text-[10px]">+{area.shopping_nearby.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            {area.amenities_nearby && area.amenities_nearby.length > 0 && (
              <div className="space-y-1.5">
                <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
                  <Home className="h-3 w-3" /> Amenities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {area.amenities_nearby.slice(0, 4).map((a) => (
                    <span key={a} className="text-[10px] text-zinc-400 bg-white/[0.04] rounded-md px-2 py-0.5 border border-white/[0.05]">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
