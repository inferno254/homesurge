import { useEffect, useRef, useState } from 'react'
import { MapPinned, ChevronRight, ChevronLeft, Edit, Phone, CheckCircle2 } from 'lucide-react'
import type { DbProperty } from '../../types/property'
import { timeAgo } from '../../lib/timeAgo'

export function PropertyListSidebar({
  properties,
  hoveredId,
  onHover,
  onSelect,
  visitedIds,
  onMarkVisited,
}: {
  properties: DbProperty[]
  hoveredId: string | null
  onHover: (id: string | null) => void
  onSelect: (property: DbProperty) => void
  visitedIds?: Set<string>
  onMarkVisited?: (id: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hoveredId) {
      const el = listRef.current?.querySelector(`[data-property-id="${hoveredId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [hoveredId])

  const geocodedCount = properties.filter((p) => p.latitude != null && p.longitude != null).length
  const ungeocodedCount = properties.length - geocodedCount

  return (
    <div className={`relative flex flex-col h-full transition-all duration-300 ${collapsed ? 'w-10' : 'w-96'} shrink-0`}>
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute right-0 top-0 z-10 rounded-lg glass-card p-1.5 text-zinc-400 hover:text-white transition-colors mt-16"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {!collapsed && (
        <>
          {/* Stats strip */}
          <div className="px-4 py-3 border-b border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <MapPinned className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-medium text-white">{geocodedCount}</span> with pins
              <span className="text-zinc-600">•</span>
              <span className="font-medium text-amber-400">{ungeocodedCount}</span> unlocated
            </div>
            <div className="flex gap-3 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                {properties.filter((p) => p.is_published).length} published
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                {properties.filter((p) => !p.is_published).length} draft
              </span>
              {visitedIds && visitedIds.size > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  {visitedIds.size} reviewed
                </span>
              )}
            </div>
          </div>

          {/* Property list */}
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {properties.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">No properties match the current filters.</div>
            ) : (
              properties.map((p) => {
                const isVisited = visitedIds?.has(p.id) ?? false
                return (
                  <div
                    key={p.id}
                    data-property-id={p.id}
                    className={`cursor-pointer border-l-2 px-4 py-3 transition-colors ${
                      hoveredId === p.id
                        ? 'border-cyan-400 bg-cyan-500/10'
                        : isVisited
                          ? 'border-emerald-500/30 bg-emerald-500/[0.03]'
                          : 'border-transparent hover:bg-white/[0.03]'
                    }`}
                    onMouseEnter={() => onHover(p.id)}
                    onMouseLeave={() => onHover(null)}
                    onClick={() => {
                      onMarkVisited?.(p.id)
                      onSelect(p)
                    }}
                  >
                    {/* Mini card */}
                    <div className="flex gap-2.5">
                      <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-trace-line">
                        {p.cover_image_url ? (
                          <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-zinc-600 text-xs">No photo</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-cyan-400 leading-tight line-clamp-1">{p.title}</p>
                        <p className="text-xs text-violet-300 font-medium mt-0.5">
                          KSh {Number(p.price).toLocaleString()}
                          {p.price_type === 'monthly' ? '/mo' : ''}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-zinc-500 text-[11px]">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                            p.is_published ? 'bg-green-400' : 'bg-amber-400'
                          }`} />
                          <span className="truncate">
                            {[p.estate, p.town, p.county].filter(Boolean).join(' • ')}
                          </span>
                          {isVisited && <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{timeAgo(p.created_at)}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); onSelect(p); }}
                            className="flex-1 text-center text-[10px] bg-cyan-500/20 text-cyan-300 rounded px-2 py-1 hover:bg-cyan-500/30 transition-colors font-medium flex items-center justify-center gap-1"
                          >
                            <Edit className="h-3 w-3" /> Edit
                          </button>
                          {p.owner_phone && (
                            <a
                              href={`tel:${p.owner_phone.replace(/\s/g, '')}`}
                              className="flex-1 text-center text-[10px] bg-green-500/20 text-green-300 rounded px-2 py-1 hover:bg-green-500/30 transition-colors font-medium flex items-center justify-center gap-1"
                            >
                              <Phone className="h-3 w-3" /> Call
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
