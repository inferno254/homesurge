import { useQuery } from '@tanstack/react-query'
import { X, GitCompare, Image as ImageIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { PublicPropertyRow } from '../types/property'

type Props = {
  ids: string[]
  onRemove: (id: string) => void
  onClear: () => void
}

async function loadBatch(ids: string[]): Promise<PublicPropertyRow[]> {
  if (!supabase || ids.length === 0) return []
  const { data } = await supabase.rpc('fetch_public_properties')
  const rows = (data ?? []) as PublicPropertyRow[]
  return rows.filter((r) => ids.includes(r.id))
}

export function CompareBar({ ids, onRemove, onClear }: Props) {
  const navigate = useNavigate()
  const { data: items } = useQuery({
    queryKey: ['compare-items', ids],
    queryFn: () => loadBatch(ids),
    enabled: ids.length > 0,
  })

  if (ids.length === 0) return null

  return (
    <div id="compare-bar" className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.1] bg-trace-dusk/95 backdrop-blur-2xl px-6 py-4 transition-all">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-trace-violet/10 border border-trace-violet/20">
            <GitCompare className="h-4 w-4 text-trace-violet" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">{ids.length}</span>
            <span className="text-xs text-zinc-500 ml-1">selected</span>
          </div>
          <button onClick={onClear} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-wider font-medium">
            Clear
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center -space-x-2">
            {items?.slice(0, 4).map((p) => (
              <div key={p.id} className="relative">
                <div className="h-9 w-9 rounded-xl overflow-hidden border-2 border-trace-dusk bg-trace-line">
                  {p.cover_image_url || p.image_urls?.[0] ? (
                    <img src={p.cover_image_url || p.image_urls![0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-3.5 w-3.5 text-zinc-600" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onRemove(p.id)}
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-[8px] text-white flex items-center justify-center hover:bg-rose-400 transition-colors shadow-lg shadow-rose-500/30"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/compare')}
            disabled={ids.length < 2}
            className="btn-primary rounded-xl px-5 py-2.5 text-xs disabled:opacity-40"
          >
            Compare ({ids.length})
          </button>
        </div>
      </div>
    </div>
  )
}
