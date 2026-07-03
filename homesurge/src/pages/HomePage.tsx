import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Heart, GitCompare, Calculator, Phone, Home as HomeIcon } from 'lucide-react'
import { usePageMeta } from '../lib/seo'
import { env } from '../lib/env'
import { PropertyCard } from '../components/PropertyCard'
import { FadeIn } from '../components/FadeIn'
import { AreaInsights } from '../components/AreaInsights'
import { BudgetCalculator } from '../components/BudgetCalculator'
import { PropertyShowcase } from '../components/PropertyShowcase'
import { fetchPublicProperties } from '../lib/supabaseApi'
import { supabase } from '../lib/supabase'
import type { PublicPropertyRow } from '../types/property'

async function loadFeatured(): Promise<PublicPropertyRow[]> {
  return fetchPublicProperties().then((rows) => rows.slice(0, 6))
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-trace-card overflow-hidden">
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-3 w-2/3" />
      </div>
    </div>
  )
}

export function HomePage() {
  usePageMeta('', 'Search available homes across Nairobi, Kiambu, Machakos, Kajiado and more — honest prices, broad locations, real availability.')
  const configured = Boolean(supabase)
  const [showCalc, setShowCalc] = useState(false)

  const q = useQuery({
    queryKey: ['public-properties'],
    queryFn: loadFeatured,
    enabled: configured,
  })

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-trace-cyan/10 via-trace-violet/5 to-transparent blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-trace-violet/8 via-transparent to-transparent blur-3xl" />
          <div className="absolute inset-0 bg-hero-grid bg-grid-size opacity-[0.03]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Hero text */}
            <FadeIn className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-trace-violet/20 bg-trace-violet/8 px-4 py-1.5 text-xs font-semibold text-trace-violet-light backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-trace-violet-light">Kenya homes, curated signal</span>
              </div>

              <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
                Trace what&apos;s{' '}
                <span className="text-gradient">available</span>.
                <br />
                We place you on the map.
              </h1>

              <p className="max-w-lg text-base text-zinc-400 leading-relaxed">
                Browse real listings with <strong className="text-zinc-200 font-semibold">prices and broad locations</strong>.
                Save favorites, compare side-by-side, and check your budget — all before you call.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/browse"
                  className="btn-primary rounded-2xl px-6 py-3 text-sm"
                >
                  Browse homes
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {env.publicPhone && (
                  <a
                    href={`tel:${env.publicPhone.replace(/\s/g, '')}`}
                    className="btn-secondary rounded-2xl px-6 py-3 text-sm"
                  >
                    <Phone className="h-4 w-4" />
                    Call {env.publicPhone}
                  </a>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-2xl font-bold text-white font-display">
                    {q.data?.length ?? '—'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Active listings</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-2xl font-bold text-white font-display">
                    {q.data ? new Set(q.data.map(p => p.county).filter(Boolean)).size : '—'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Counties covered</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-2xl font-bold text-white font-display">100%</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Verified listings</p>
                </div>
              </div>
            </FadeIn>

            {/* Hero visual */}
            <div className="relative h-[280px] w-full mx-auto lg:mx-0">
              <PropertyShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to: '/browse', icon: HomeIcon, label: 'Browse homes', desc: 'Explore listings', color: 'cyan' },
              { to: '/saved', icon: Heart, label: 'Saved homes', desc: 'Your shortlist', color: 'rose' },
              { to: '/compare', icon: GitCompare, label: 'Compare', desc: 'Side by side', color: 'violet' },
              { action: () => setShowCalc(true), icon: Calculator, label: 'Budget', desc: 'Rent calculator', color: 'amber' },
            ].map((item, i) => (
              <Link
                key={i}
                to={item.to || '#'}
                onClick={item.action ? (e) => { e.preventDefault(); item.action?.() } : undefined}
                className="group relative flex flex-col items-center gap-3 rounded-2xl border border-white/[0.08] bg-trace-card p-6 text-center transition-all duration-300 hover:border-white/[0.15] hover:shadow-card-hover hover:-translate-y-0.5"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                  item.color === 'cyan' ? 'bg-trace-cyan/10 text-trace-cyan group-hover:bg-trace-cyan/15' :
                  item.color === 'rose' ? 'bg-rose-400/10 text-rose-400 group-hover:bg-rose-400/15' :
                  item.color === 'violet' ? 'bg-trace-violet/10 text-trace-violet group-hover:bg-trace-violet/15' :
                  'bg-amber-400/10 text-amber-400 group-hover:bg-amber-400/15'
                }`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Featured Listings */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <FadeIn>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
                Featured availability
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Published & verified for public view · wide-area context only
              </p>
            </div>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 text-sm font-semibold text-trace-cyan hover:text-trace-cyan-light transition-colors"
            >
              See all listings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FadeIn>

        {!configured && (
          <div className="glass-card rounded-2xl p-8 text-center text-zinc-400">
            <p>API backend is not reachable.</p>
          </div>
        )}

        {configured && q.isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <FadeIn key={i} delay={i * 100}>
                <SkeletonCard />
              </FadeIn>
            ))}
          </div>
        )}
        {configured && q.error && (
          <p className="text-red-400 text-center py-12">{(q.error as Error).message}</p>
        )}
        {configured && q.data && q.data.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-zinc-400">No published listings yet.</p>
          </div>
        )}
        {configured && q.data && q.data.length > 0 && (
          <>
            <FadeIn className="mb-8">
              <AreaInsights properties={q.data} />
            </FadeIn>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {q.data.map((p, i) => (
                <FadeIn key={p.id} delay={i * 80}>
                  <PropertyCard property={p} />
                </FadeIn>
              ))}
            </div>
          </>
        )}
      </section>

      {showCalc && <BudgetCalculator onClose={() => setShowCalc(false)} />}
    </>
  )
}