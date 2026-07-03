import { Link } from 'react-router-dom'
import { Bath, Bed, Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { PublicPropertyRow } from '../types/property'

type Props = { property: PublicPropertyRow }

function formatPrice(p: PublicPropertyRow) {
  const n = Number(p.price)
  const formatted = Number.isFinite(n) ? `KSh ${n.toLocaleString()}` : 'Price on request'
  if (p.price_type === 'sale') return `${formatted}`
  if (p.price_type === 'negotiable') return `${formatted}+`
  return `${formatted}/mo`
}

export function PropertyCard({ property: p }: Props) {
  const allImages = p.image_urls || []
  const [imgIdx, setImgIdx] = useState(0)
  const visibleImg = allImages.length > 0 ? allImages[imgIdx % allImages.length] : p.cover_image_url || null
  const areaLine = [p.town, p.county].filter(Boolean).join(', ')
  const fuzz = p.area_label ? `${p.area_label} area` : 'Broad location'
  const amenities = p.amenity_names || []
  
  return (
    <Link
      to={`/listing/${p.id}`}
      className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-trace-card overflow-hidden transition-all duration-300 hover:border-white/[0.15] hover:shadow-card-hover hover:-translate-y-0.5"
    >
{/* Image with inline nav arrows - only show on hover when multiple images */}
      <div className="relative aspect-[4/3] overflow-hidden bg-black/60">
        {visibleImg ? (
          <img
            src={visibleImg}
            alt={p.title || 'Property image'}
            className="h-full w-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 className="h-10 w-10 text-white/10" />
          </div>
        )}
        
        {!visibleImg && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-lg bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
              No photo yet
            </span>
          </div>
        )}
        
        {/* Image navigation arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(i => (i - 1 + allImages.length) % allImages.length) }}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(i => (i + 1) % allImages.length) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        
        {/* Image count indicator */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] text-white">
            {imgIdx + 1}/{allImages.length}
          </div>
        )}
        
        <div className="absolute left-3 top-3 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-trace-cyan border border-trace-cyan/20">
          {p.listing_reference ?? 'HT'}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex-1">
          <h3 className="font-display text-base font-semibold text-white leading-snug line-clamp-2 group-hover:text-trace-cyan transition-colors">
            {p.title}
          </h3>
          <p className="text-xs text-zinc-500 mt-1.5 line-clamp-1">
            {areaLine || 'Kenya'} · <span className="text-zinc-600">{fuzz}</span>
          </p>
        </div>

        <p className="text-lg font-bold text-trace-cyan flex items-center gap-2">
          {formatPrice(p)}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          {p.bedrooms != null && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
              <Bed className="h-3.5 w-3.5 text-trace-violet" />
              <span className="text-zinc-300">{p.bedrooms} bedroom{p.bedrooms !== 1 ? 's' : ''}</span>
            </span>
          )}
          {p.bathrooms != null && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
              <Bath className="h-3.5 w-3.5 text-trace-violet" />
              <span className="text-zinc-300">{p.bathrooms} bathroom{p.bathrooms !== 1 ? 's' : ''}</span>
            </span>
          )}
          {p.property_type && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 capitalize">
              <Building2 className="h-3.5 w-3.5 text-trace-violet" />
              <span className="text-zinc-300">{p.property_type}</span>
            </span>
          )}
        </div>

        {/* All amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {amenities.map((a) => (
              <span key={a} className="text-[10px] text-zinc-400 bg-white/[0.03] rounded-md px-2 py-0.5 border border-white/[0.05]">
                {a}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}