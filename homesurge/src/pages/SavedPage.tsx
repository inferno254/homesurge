import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Heart, ArrowLeft, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { supabaseConfigured } from '../lib/env'
import { PropertyCard } from '../components/PropertyCard'
import { FadeIn } from '../components/FadeIn'
import { useFavorites } from '../hooks/useFavorites'
import type { PublicPropertyRow } from '../types/property'

export function SavedPage() {
  const configured = supabaseConfigured()
  const { favorites, count, clear } = useFavorites()

  const q = useQuery({
    queryKey: ['public-properties-all'],
    queryFn: async () => {
      if (!supabase) return []
      const { data } = await supabase.rpc('fetch_public_properties')
      return (data ?? []) as PublicPropertyRow[]
    },
    enabled: configured && favorites.length > 0,
  })

  const saved = (q.data ?? []).filter((p) => favorites.includes(p.id))

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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-400/10 border border-rose-400/20">
                <Heart className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
                  Saved listings
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  {count} saved · stored locally in your browser
                </p>
              </div>
            </div>
          </div>
          {count > 0 && (
            <button
              onClick={clear}
              className="btn-ghost rounded-xl text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
        </div>
      </FadeIn>

      {!configured && (
        <div className="glass-card p-6 text-zinc-400">Configure Supabase in <code className="text-trace-cyan">.env</code> first.</div>
      )}

      {configured && count === 0 && (
        <FadeIn>
          <div className="glass-card rounded-3xl p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] mx-auto mb-5">
              <Heart className="h-7 w-7 text-zinc-600" />
            </div>
            <p className="text-zinc-400 mb-2 text-lg font-medium">No saved listings yet</p>
            <p className="text-sm text-zinc-600 mb-8 max-w-sm mx-auto">
              Tap the heart icon on any listing to save it here for easy access later.
            </p>
            <Link
              to="/browse"
              className="btn-primary rounded-2xl px-6 py-3 text-sm inline-flex"
            >
              Browse homes
            </Link>
          </div>
        </FadeIn>
      )}

      {configured && count > 0 && (
        <>
          {q.isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.08] bg-trace-card overflow-hidden">
                  <div className="skeleton aspect-[4/3]" />
                  <div className="space-y-3 p-5">
                    <div className="skeleton h-5 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((p, i) => (
              <FadeIn key={p.id} delay={i * 80}>
                <PropertyCard property={p} />
              </FadeIn>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
