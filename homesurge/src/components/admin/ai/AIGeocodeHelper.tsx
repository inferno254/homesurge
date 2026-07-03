import { useState } from 'react'
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react'
import { aiGeocode, type GeocodeResult } from '../../../lib/aiClient'
import { useToast } from '../../../components/Toast'

type Props = {
  onSelect: (result: GeocodeResult) => void
  currentValue?: string
}

export function AIGeocodeHelper({ onSelect, currentValue }: Props) {
  const [query, setQuery] = useState(currentValue ?? '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeocodeResult | null>(null)
  const { toast } = useToast()

  const run = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const data = await aiGeocode(query)
      setResult(data)
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const apply = () => {
    if (!result) return
    onSelect(result)
    toast(`Pinned: ${result.display}`, 'success')
  }

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-cyan-400" />
        <p className="text-xs font-semibold text-cyan-200 uppercase tracking-wider">AI geocode helper</p>
      </div>
      <p className="text-xs text-zinc-400">Type an estate or landmark and AI will suggest coordinates.</p>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder="e.g. Near Yaya Centre, Kilimani"
          className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-400 focus:outline-none"
        />
        <button
          onClick={run}
          disabled={loading}
          className="rounded-xl bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-500/30 transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pin'}
        </button>
      </div>
      {result && (
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-zinc-300">
            <p className="font-semibold text-white">{result.display}</p>
            <p className="text-zinc-500">
              {result.lat.toFixed(5)}, {result.lng.toFixed(5)}
            </p>
          </div>
          <button
            onClick={apply}
            className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/30 transition-colors"
          >
            <CheckCircle2 className="h-3 w-3" /> Apply
          </button>
        </div>
      )}
    </div>
  )
}
