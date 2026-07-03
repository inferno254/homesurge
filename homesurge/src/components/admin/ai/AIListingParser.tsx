import { useState } from 'react'
import { Sparkles, FileText, Loader2 } from 'lucide-react'
import { aiParseListing, type ParsedListing } from '../../../lib/aiClient'
import { useToast } from '../../../components/Toast'

type Props = {
  onParsed: (data: Partial<ParsedListing>) => void
}

export function AIListingParser({ onParsed }: Props) {
  const [raw, setRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const run = async () => {
    if (!raw.trim()) return
    setLoading(true)
    try {
      const data = await aiParseListing(raw)
      onParsed(data)
      toast('Listing parsed successfully', 'success')
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-violet-400" />
        <p className="text-xs font-semibold text-violet-200 uppercase tracking-wider">AI listing parser</p>
      </div>
      <p className="text-xs text-zinc-400">Paste a raw agent/WhatsApp listing and AI will extract structured fields for you.</p>
      <textarea
        className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-400 focus:outline-none"
        rows={4}
        placeholder={'e.g. "Spacious 2-bed apartment for rent in Kilimani near Yaya. KSh 45,000 monthly. 2 bed, 1 bath, furnished, 65 sqm. Call 0712..."'}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />
      <button
        onClick={run}
        disabled={loading || !raw.trim()}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-500/20 px-4 py-2 text-sm text-violet-100 hover:bg-violet-500/30 transition-colors disabled:opacity-40"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? 'Reading listing...' : 'Extract fields'}
      </button>
    </div>
  )
}
