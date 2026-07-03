import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { aiDealAnalysis, type DealAnalysis } from '../lib/aiClient'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

type Props = {
  price: number
  price_type: string
  town: string
  county?: string
  property_type?: string
  bedrooms?: number | null
  size_sqm?: number | null
}

export function DealBadge({ price, price_type, town, county, property_type, bedrooms, size_sqm }: Props) {
  const { data: areaData } = useQuery({
    queryKey: ['area-rent', town],
    queryFn: async () => {
      if (!supabase) return null
      const { data } = await supabase.from('nairobi_areas').select('typical_rent_min,typical_rent_max').ilike('town', `%${town}%`).limit(1).maybeSingle()
      return data ?? null
    },
    enabled: price_type === 'monthly' && Boolean(supabase),
  })

  const { data: analysis } = useQuery({
    queryKey: ['deal-analysis', price, town, property_type],
    queryFn: async () => {
      const d = await aiDealAnalysis({ price, price_type, town, county, property_type, bedrooms, size_sqm })
      return d
    },
    enabled: price_type === 'monthly' && !!town,
  })

  const verdict = useMemo<DealAnalysis['verdict'] | null>(() => {
    if (analysis) return analysis.verdict
    if (!areaData) return null
    const { typical_rent_min, typical_rent_max } = areaData
    if (typical_rent_min && price < typical_rent_min) return 'good_deal'
    if (typical_rent_max && price > typical_rent_max) return 'overpriced'
    return 'fair'
  }, [analysis, areaData, price])

  if (price_type !== 'monthly' || !verdict) return null

  const colorMap: Record<string, string> = {
    good_deal: 'bg-green-500/15 text-green-300 border-green-500/30',
    fair: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
    overpriced: 'bg-red-500/15 text-red-300 border-red-500/30',
  }
  const iconMap: Record<string, JSX.Element> = {
    good_deal: <TrendingDown className="h-3 w-3" />,
    fair: <Minus className="h-3 w-3" />,
    overpriced: <TrendingUp className="h-3 w-3" />,
  }
  const labelMap: Record<string, string> = {
    good_deal: 'Below area avg',
    fair: 'Fair price',
    overpriced: 'Above area avg',
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${colorMap[verdict]}`}>
      {iconMap[verdict]}
      {labelMap[verdict]}
    </span>
  )
}
