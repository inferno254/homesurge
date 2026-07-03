import { useState } from 'react'
import { Globe, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { showToast } from '../../lib/toast'
import { useQueryClient } from '@tanstack/react-query'
import type { DbProperty } from '../../types/property'

type GeocodeResult =
  | { id: string; title: string; status: 'pending' }
  | { id: string; title: string; status: 'skipped' }
  | { id: string; title: string; status: 'failed'; error: string }
  | { id: string; title: string; status: 'success'; lat: number; lng: number }

export function BulkGeocodeHelper({ ungeocoded }: { ungeocoded: DbProperty[] }) {
  const qc = useQueryClient()
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [progress, setProgress] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const geocodeEstate = async (estate: string, town: string, county: string) => {
    const query = encodeURIComponent(estate + ', ' + town + ', ' + county + ', Kenya')
    try {
      const res = await fetch('https://nominatim.openstreetmap.org/search?q=' + query + '&format=json&limit=1', { headers: { 'User-Agent': 'homesurge/1.0' } })
      const data = await res.json()
      if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    } catch {}
    return null
  }

  const runGeocode = async () => {
    if (!supabase) { showToast('Supabase not configured', 'error'); return }
    setConfirmOpen(false); setRunning(true); setProgress(0); setResults([])
    const batch: GeocodeResult[] = ungeocoded.map((p) => ({ id: p.id, title: p.title, status: 'pending' }))
    setResults([...batch])
    for (let i = 0; i < ungeocoded.length; i++) {
      const p = ungeocoded[i]
      if (!p.estate && !p.town) { batch[i].status = 'skipped'; setResults([...batch]); setProgress(((i+1)/ungeocoded.length)*100); await new Promise((r) => setTimeout(r, 1100)); continue }
      await new Promise((r) => setTimeout(r, 1100))
      const coords = await geocodeEstate(p.estate ?? '', p.town ?? '', p.county ?? '')
      if (coords) {
        const { error } = await supabase.from('properties').update({ latitude: coords.lat, longitude: coords.lng, updated_at: new Date().toISOString() }).eq('id', p.id)
        if (error) {
          batch[i] = { id: p.id, title: p.title, status: 'failed', error: error.message }
        } else {
          batch[i] = { id: p.id, title: p.title, status: 'success', lat: coords.lat, lng: coords.lng }
        }
      } else {
        batch[i] = { id: p.id, title: p.title, status: 'failed', error: 'No result' }
      }
      setResults([...batch]); setProgress(((i+1)/ungeocoded.length)*100)
    }
    setRunning(false); void qc.invalidateQueries({ queryKey: ['admin-properties-realtime'] })
    const s = batch.filter((r) => r.status === 'success').length
    const f = batch.filter((r) => r.status === 'failed').length
    showToast('Geocoded ' + s + ' properties', f > 0 ? 'info' : 'success')
  }

  return (
    <div className='glass-card rounded-xl p-4 space-y-3'>
      <div className='flex items-center gap-2'>
        <Globe className='h-4 w-4 text-cyan-400' />
        <span className='text-sm font-medium'>Bulk Geocode</span>
        <span className='text-xs text-zinc-500 ml-auto'>{ungeocoded.length} unlocated</span>
      </div>
      {!running && results.length === 0 && (<>
        <p className='text-xs text-zinc-500'>Geocode via Nominatim (1 req/sec).</p>
        <button type='button' onClick={() => setConfirmOpen(true)} disabled={ungeocoded.length === 0}
          className='w-full rounded-lg bg-cyan-500 text-white px-3 py-2 text-xs font-medium hover:bg-cyan-600 disabled:opacity-40'>
          Geocode all ({ungeocoded.length})
        </button>
      </>)}
      {running && (<div className='space-y-2'>
        <div className='h-2 bg-white/5 rounded-full overflow-hidden'>
          <div className='h-full bg-gradient-to-r from-cyan-400 to-violet-400' style={{ width: progress + '%' }} />
        </div>
        <div className='flex justify-between text-[10px] text-zinc-500'>
          <span>{Math.round(progress)}%</span>
          <span>{results.filter((r) => r.status === 'success').length} done</span>
        </div>
      </div>)}
      {results.length > 0 && (<div className='max-h-48 overflow-y-auto space-y-1'>
        {results.map((r) => (<div key={r.id} className='flex items-center gap-2 text-[11px]'>
          {r.status === 'success' && <Check className='h-3 w-3 text-green-400 shrink-0' />}
          {r.status === 'failed' && <X className='h-3 w-3 text-red-400 shrink-0' />}
          {r.status === 'pending' && <div className='h-3 w-3 rounded-full border border-zinc-600 shrink-0' />}
          {r.status === 'skipped' && <div className='h-3 w-3 rounded-full bg-zinc-600 shrink-0' />}
          <span className='text-zinc-400 truncate flex-1'>{r.title}</span>
          {r.status === 'success' && <span className='text-green-400 shrink-0'>{r.lat?.toFixed(4)}, {r.lng?.toFixed(4)}</span>}
          {r.status === 'failed' && <span className='text-red-400 shrink-0'>{r.error}</span>}
        </div>))}
      </div>)}
      {!running && results.length > 0 && (<button type='button' onClick={() => { setResults([]); setProgress(0) }}
        className='w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-400 hover:text-white'>Done</button>)}
      {confirmOpen && (<div className='border border-amber-400/20 rounded-lg p-3 space-y-2 bg-amber-400/5'>
        <p className='text-xs text-amber-300'>Geocode <strong>{ungeocoded.length}</strong> properties (~{Math.round(ungeocoded.length * 1.2)}s).</p>
        <div className='flex gap-2'>
          <button type='button' onClick={runGeocode} className='flex-1 rounded-lg bg-amber-500 text-white px-3 py-1.5 text-xs font-medium hover:bg-amber-600'>Yes, geocode</button>
          <button type='button' onClick={() => setConfirmOpen(false)} className='flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400'>Cancel</button>
        </div>
      </div>)}
    </div>
  )
}

