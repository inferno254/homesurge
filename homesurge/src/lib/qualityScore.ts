export type QualityScore = {
  score: number
  total: number
  percentage: number
  label: 'excellent' | 'good' | 'fair' | 'poor' | 'incomplete'
  fields: Array<{ field: string; value: string; missing: boolean }>
}

export function calcListingQuality(p: Record<string, unknown>): QualityScore {
  const checks = [
    { field: 'title', value: String(p.title ?? '').trim(), required: true },
    { field: 'description', value: String(p.description ?? '').trim(), required: true },
    { field: 'ai_description', value: String(p.ai_generated_description ?? '').trim(), required: false },
    { field: 'price', value: String(p.price ?? ''), required: true },
    { field: 'bedrooms', value: String(p.bedrooms ?? ''), required: false },
    { field: 'bathrooms', value: String(p.bathrooms ?? ''), required: false },
    { field: 'size_sqm', value: String(p.size_sqm ?? ''), required: false },
    { field: 'cover_image', value: String(p.cover_image_url ?? ''), required: true },
    { field: 'estate', value: String(p.estate ?? '').trim(), required: false },
    { field: 'town', value: String(p.town ?? '').trim(), required: true },
    { field: 'owner_phone', value: String(p.owner_phone ?? '').trim(), required: true },
    { field: 'coordinates', value: String(p.latitude ?? '') + String(p.longitude ?? ''), required: false },
  ]
  const results = checks.map((c) => ({ field: c.field, value: c.value, missing: !c.value }))
  const filled = results.filter((r) => !r.missing).length
  const percentage = Math.round((filled / checks.length) * 100)
  let label: QualityScore['label'] = 'incomplete'
  if (percentage >= 90) label = 'excellent'
  else if (percentage >= 70) label = 'good'
  else if (percentage >= 50) label = 'fair'
  else if (percentage >= 30) label = 'poor'
  return { score: filled, total: checks.length, percentage, label, fields: results }
}

export function getQualityColor(pct: number): string {
  if (pct >= 90) return 'text-green-400'
  if (pct >= 70) return 'text-cyan-400'
  if (pct >= 50) return 'text-amber-400'
  if (pct >= 30) return 'text-orange-400'
  return 'text-red-400'
}

export function getQualityBg(pct: number): string {
  if (pct >= 90) return 'bg-green-400'
  if (pct >= 70) return 'bg-cyan-400'
  if (pct >= 50) return 'bg-amber-400'
  if (pct >= 30) return 'bg-orange-400'
  return 'bg-red-400'
}