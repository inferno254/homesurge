import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Phone, ChevronLeft, MapPinned, Image as ImageIcon, Calculator, Check } from 'lucide-react'
import { usePageMeta } from '../lib/seo'
import { env } from '../lib/env'
import { ImageCarousel } from '../components/ImageCarousel'
import { FadeIn } from '../components/FadeIn'
import { SaveButton } from '../components/SaveButton'
import { ShareButton } from '../components/ShareButton'
import { BudgetCalculator } from '../components/BudgetCalculator'
import { InquiryForm } from '../components/InquiryForm'
import { AreaInsights } from '../components/AreaInsights'
import { useFavorites } from '../hooks/useFavorites'
import { fetchPublicProperties, fetchPublicProperty } from '../lib/supabaseApi'
import { supabase } from '../lib/supabase'
import { DealBadge } from '../components/DealBadge'
import { SwahiliToggle } from '../components/ai/SwahiliToggle'
import type { PublicPropertyRow } from '../types/property'

async function loadOne(id: string): Promise<PublicPropertyRow | null> {
  return fetchPublicProperty(id)
}

async function loadAll(): Promise<PublicPropertyRow[]> {
  return fetchPublicProperties()
}

function formatPrice(p: PublicPropertyRow) {
  const n = Number(p.price)
  const formatted = Number.isFinite(n) ? `KSh ${n.toLocaleString()}` : 'Price on request'
  if (p.price_type === 'sale') return `${formatted} · sale`
  if (p.price_type === 'negotiable') return `${formatted}+ · negotiable`
  return `${formatted} · /mo`
}

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const configured = Boolean(supabase)
  const [carouselOpen, setCarouselOpen] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const { isFavorite, toggle: toggleFav } = useFavorites()

  const q = useQuery({
    queryKey: ['public-property', id],
    queryFn: () => loadOne(id!),
    enabled: Boolean(configured && id),
  })

  const allQuery = useQuery({
    queryKey: ['public-properties-all'],
    queryFn: loadAll,
    enabled: configured,
  })

  usePageMeta(
    q.data?.title ?? 'Loading...',
    q.data ? `${q.data.bedrooms ?? '?'} bed · ${q.data.bathrooms ?? '?'} bath · KSh ${Number(q.data.price).toLocaleString()} · ${q.data.town}, ${q.data.county}` : undefined,
    q.data?.image_urls?.[0] ?? undefined,
  )

  if (!id) return null

  const imgCount = q.data?.image_urls?.length ?? 0

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <FadeIn>
        <Link
          to="/browse"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to browse
        </Link>
      </FadeIn>

      {!configured && <p className="text-zinc-500">Supabase not configured.</p>}
      {q.isLoading && (
        <div className="rounded-2xl border border-white/[0.08] bg-trace-card overflow-hidden">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="skeleton aspect-[4/3]" />
            <div className="space-y-4 p-8">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-8 w-3/4" />
              <div className="skeleton h-6 w-1/2" />
              <div className="skeleton h-4 w-2/3" />
              <div className="flex gap-2"><div className="skeleton h-6 w-16" /><div className="skeleton h-6 w-16" /></div>
            </div>
          </div>
        </div>
      )}
      {q.error && <p className="text-red-400">{(q.error as Error).message}</p>}
      {q.data === null && !q.isLoading && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-zinc-400">Listing not found or not published.</p>
        </div>
      )}

      {q.data && (
        <>
          <FadeIn>
            <article className="rounded-3xl border border-white/[0.08] bg-trace-card overflow-hidden shadow-card">
              <div className="grid gap-0 md:grid-cols-2">
                {/* Image */}
                <div className="relative aspect-[4/3] bg-black/60 group">
                  {q.data.image_urls && q.data.image_urls[0] ? (
                    <>
                      <img
                        src={q.data.image_urls[0]}
                        alt=""
                        className="h-full w-full object-contain cursor-pointer transition duration-500 group-hover:scale-105"
                        onClick={() => setCarouselOpen(true)}
                      />
                      <button
                        onClick={() => setCarouselOpen(true)}
                        className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur-md px-4 py-2 text-xs font-medium text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        {imgCount} photo{imgCount > 1 ? 's' : ''}
                      </button>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-white/10" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col justify-center gap-5 p-8 md:p-10">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-trace-violet mb-3">
                      {q.data.listing_reference}
                    </p>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight">
                      {q.data.title}
                    </h1>
                  </div>

                  <p className="text-2xl font-bold text-trace-cyan">
                    {formatPrice(q.data)}
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 text-sm text-zinc-400">
                    <DealBadge
                      price={q.data.price}
                      price_type={q.data.price_type}
                      town={q.data.town ?? ''}
                      county={q.data.county ?? ''}
                      property_type={q.data.property_type}
                      bedrooms={q.data.bedrooms}
                      size_sqm={q.data.size_sqm}
                    />
                    {q.data.bedrooms != null && (
                      <span className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2">
                        <span className="text-white font-semibold">{q.data.bedrooms}</span> bedroom{q.data.bedrooms !== 1 ? 's' : ''}
                      </span>
                    )}
                    {q.data.bathrooms != null && (
                      <span className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2">
                        <span className="text-white font-semibold">{q.data.bathrooms}</span> bathroom{q.data.bathrooms !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2 capitalize">
                      {q.data.property_type}
                    </span>
                    {q.data.furnished != null && (
                      <span className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 ${
                        q.data.furnished ? 'bg-trace-cyan/10 text-trace-cyan border border-trace-cyan/20' : 'bg-white/[0.04] text-zinc-500 border border-white/[0.06]'
                      }`}>
                        {q.data.furnished ? 'Furnished' : 'Unfurnished'}
                      </span>
                    )}
                    {q.data.size_sqm && (
                      <span className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2">
                        {q.data.size_sqm} m²
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-3 text-sm text-zinc-400">
                    <MapPinned className="mt-0.5 h-5 w-5 shrink-0 text-trace-violet" />
                    <div>
                      <span className="text-zinc-200 font-medium">
                        {[q.data.town, q.data.county].filter(Boolean).join(', ')}
                      </span>
                      {q.data.area_label && (
                        <span className="text-zinc-500"> · {q.data.area_label} corridor</span>
                      )}
                      <p className="text-xs text-zinc-600 mt-1.5">
                        Street-level pins are withheld. Call Homesurge for placement & verified viewing slots.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <SaveButton id={id} isFavorite={isFavorite(id)} onToggle={toggleFav} />
                    <ShareButton url={`/listing/${id}`} title={q.data.title} />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row pt-2">
                    {env.publicPhone && (
                      <a
                        href={`tel:${env.publicPhone.replace(/\s/g, '')}`}
                        className="btn-primary rounded-2xl px-6 py-3.5 text-sm flex-1"
                      >
                        <Phone className="h-4 w-4" />
                        Call Homesurge
                      </a>
                    )}
                    <button
                      onClick={() => setShowCalc(true)}
                      className="btn-secondary rounded-2xl px-6 py-3.5 text-sm flex-1"
                    >
                      <Calculator className="h-4 w-4" />
                      Budget check
                    </button>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {(q.data.amenity_names?.length ?? 0) > 0 && (
                <div className="border-t border-white/[0.06] p-8 md:p-10">
                  <h2 className="font-display text-sm font-semibold text-white mb-4 uppercase tracking-wider">Amenity signal</h2>
                  <div className="flex flex-wrap gap-2.5">
                    {q.data.amenity_names!.map((a) => (
                      <span key={a} className="badge badge-cyan rounded-xl px-3.5 py-1.5 text-xs">
                        <Check className="h-3 w-3" />
                        {a === 'balcony' ? 'Balcony' : a === 'rooftop' ? 'Rooftop' : a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Financials */}
              {(q.data as any).deposit_amount > 0 || (q.data as any).water_deposit > 0 || (q.data as any).electricity_deposit > 0 || (q.data as any).water_price_per_unit > 0 || (q.data as any).has_balcony || (q.data as any).has_rooftop ? (
                <div className="border-t border-white/[0.06] p-8 md:p-10">
                  <h2 className="font-display text-sm font-semibold text-white mb-4 uppercase tracking-wider">Financials & features</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {(q.data as any).deposit_amount > 0 && (
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                        <p className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Deposit</p>
                        <p className="text-sm font-bold text-white">KSh {Number((q.data as any).deposit_amount).toLocaleString()}</p>
                      </div>
                    )}
                    {(q.data as any).water_price_per_unit > 0 && (
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                        <p className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Water price/unit</p>
                        <p className="text-sm font-bold text-trace-cyan">KSh {Number((q.data as any).water_price_per_unit).toLocaleString()}</p>
                      </div>
                    )}
                    {(q.data as any).water_deposit > 0 && (
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                        <p className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Water deposit</p>
                        <p className="text-sm font-bold text-white">KSh {Number((q.data as any).water_deposit).toLocaleString()}</p>
                      </div>
                    )}
                    {(q.data as any).electricity_deposit > 0 && (
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                        <p className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Electricity deposit</p>
                        <p className="text-sm font-bold text-white">KSh {Number((q.data as any).electricity_deposit).toLocaleString()}</p>
                      </div>
                    )}
                    {(q.data as any).has_balcony && (
                      <div className="rounded-xl bg-cyan-400/5 border border-cyan-400/20 p-4">
                        <p className="text-[10px] text-cyan-400 mb-1 uppercase tracking-wider">Feature</p>
                        <p className="text-sm font-bold text-cyan-300">Balcony</p>
                      </div>
                    )}
                    {(q.data as any).has_rooftop && (
                      <div className="rounded-xl bg-violet-400/5 border border-violet-400/20 p-4">
                        <p className="text-[10px] text-violet-400 mb-1 uppercase tracking-wider">Feature</p>
                        <p className="text-sm font-bold text-violet-300">Rooftop access</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Description */}
              {(q.data.description || q.data.ai_generated_description) && (
                <div className="border-t border-white/[0.06] p-8 md:p-10 space-y-6">
                  {q.data.description && (
                    <div>
                      <h2 className="font-display text-sm font-semibold text-white mb-3 uppercase tracking-wider">About</h2>
                      <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{q.data.description}</p>
                      <SwahiliToggle text={q.data.description} title="About (Swahili)" />
                    </div>
                  )}
                  {q.data.ai_generated_description && (
                    <div>
                      <h2 className="font-display text-sm font-semibold text-white mb-3 uppercase tracking-wider">Draft narrative</h2>
                      <p className="text-sm text-zinc-500 leading-relaxed whitespace-pre-wrap">{q.data.ai_generated_description}</p>
                      <SwahiliToggle text={q.data.ai_generated_description} title="Draft narrative (Swahili)" />
                    </div>
                  )}
                </div>
              )}
            </article>
          </FadeIn>

          {/* Inquiry + Area Insights */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <FadeIn>
              <InquiryForm propertyId={id} listingRef={q.data.listing_reference ?? 'HT'} />
            </FadeIn>
            <FadeIn delay={100}>
              {allQuery.data && (
                <AreaInsights
                  properties={allQuery.data}
                  targetCounty={q.data.county ?? ''}
                  targetTown={q.data.town ?? ''}
                />
              )}
            </FadeIn>
          </div>
        </>
      )}

      {carouselOpen && q.data?.image_urls && (
        <ImageCarousel images={q.data.image_urls} onClose={() => setCarouselOpen(false)} />
      )}

      {showCalc && <BudgetCalculator onClose={() => setShowCalc(false)} />}
    </div>
  )
}
