import { useState, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Edit3, Trash2, Search, X, Check, EyeOff, Phone,
  ChevronUp, ChevronDown, ArrowUpDown, Copy, Download,
  CheckSquare, Square, Sparkles, Eye, LayoutDashboard,
  Map, PlusCircle, Inbox, TrendingUp, Camera, ScrollText
} from 'lucide-react'
import { useToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'
import type { DbProperty, ListingQuality } from '../../types/property'

type SortKey = keyof DbProperty | 'quality'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 25

async function adminLoad(): Promise<DbProperty[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.from('properties').select('*')
  if (error) throw new Error(error.message)
  return (data ?? []) as DbProperty[]
}

async function fetchInquiries(): Promise<number> {
  if (!supabase) return 0
  const { count, error } = await supabase.from('property_inquiries').select('*', { count: 'exact', head: true })
  if (error) return 0
  return count ?? 0
}

function calcQuality(p: DbProperty): ListingQuality {
  const bedroomsOk = p.bedrooms != null || ['bedsitter', 'studio'].includes(p.property_type ?? '')
  const fields: [string, unknown][] = [
    ['Title', p.title],
    ['Price', p.price && p.price > 0],
    ['Bedrooms', bedroomsOk],
    ['Bathrooms', p.bathrooms != null],
    ['County', p.county],
    ['Town', p.town],
    ['Description', p.description],
    ['Cover image', p.cover_image_url],
    ['Lat/Lng', p.latitude != null && p.longitude != null],
    ['Estate', p.estate],
    ['Owner phone', p.owner_phone],
    ['Size', p.size_sqm],
  ]
  const filled = fields.filter(([, v]) => Boolean(v)).length
  const missing = fields.filter(([, v]) => !Boolean(v)).map(([k]) => k)
  return { completeness: Math.round((filled / fields.length) * 100), missing }
}

function exportCSV(rows: DbProperty[]) {
  const headers = [
    'listing_reference', 'title', 'price', 'price_type', 'bedrooms', 'bathrooms',
    'property_type', 'county', 'town', 'area_label', 'estate', 'is_published',
    'is_available', 'furnished', 'size_sqm', 'owner_phone', 'created_at'
  ]
  const escape = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(',')]
  rows.forEach((r) => {
    lines.push(headers.map((h) => escape((r as unknown as Record<string, unknown>)[h])).join(','))
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `homesurge-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof LayoutDashboard
  label: string
  value: string | number
  sub?: string
  color: 'cyan' | 'violet' | 'amber' | 'emerald'
}) {
  const colorMap = {
    cyan: 'text-trace-cyan bg-trace-cyan/10 border-trace-cyan/20',
    violet: 'text-trace-violet bg-trace-violet/10 border-trace-violet/20',
    amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-trace-card p-5 transition-all hover:border-white/[0.12]">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${colorMap[color]}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className="font-display text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}

function PropertyPreview({ property, onClose }: { property: DbProperty; onClose: () => void }) {
  const quality = calcQuality(property)
  const images = [
    property.cover_image_url,
    ...(property as unknown as Record<string, unknown>).image_urls as string[] || []
  ].filter(Boolean) as string[]

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg rounded-l-3xl border border-white/[0.1] bg-trace-card/95 backdrop-blur-xl shadow-2xl animate-slide-in-right">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <h3 className="font-display font-semibold text-white">Property Preview</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-5" style={{ maxHeight: 'calc(100vh - 70px)' }}>
          {images[0] && (
            <div className="aspect-video rounded-2xl overflow-hidden bg-black/30">
              <img src={images[0]} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <p className="text-xs font-mono text-trace-cyan">{property.listing_reference}</p>
            <h4 className="text-lg font-bold text-white mt-1">{property.title}</h4>
            <p className="text-trace-cyan font-semibold mt-1">
              KSh {Number(property.price).toLocaleString()}{property.price_type === 'monthly' ? '/mo' : property.price_type === 'sale' ? ' (sale)' : ' (negotiable)'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
            <span className="rounded-lg bg-white/[0.04] px-2.5 py-1">{property.bedrooms ?? '?'} bed</span>
            <span className="rounded-lg bg-white/[0.04] px-2.5 py-1">{property.bathrooms ?? '?'} bath</span>
            <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 capitalize">{property.property_type}</span>
            {property.furnished && <span className="rounded-lg bg-trace-cyan/10 text-trace-cyan px-2.5 py-1">Furnished</span>}
            {property.size_sqm && <span className="rounded-lg bg-white/[0.04] px-2.5 py-1">{property.size_sqm} m²</span>}
          </div>
          {property.estate && <p className="text-sm text-zinc-400">📍 {[property.estate, property.town, property.county].filter(Boolean).join(', ')}</p>}
          {property.owner_phone && <p className="text-sm text-zinc-400">📞 {property.owner_phone}</p>}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-semibold text-zinc-500">Listing quality</h5>
              <span className="text-xs font-bold text-white">{quality.completeness}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  quality.completeness >= 80 ? 'bg-emerald-400' : quality.completeness >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                }`}
                style={{ width: `${quality.completeness}%` }}
              />
            </div>
            {quality.missing.length > 0 && (
              <p className="text-[10px] text-rose-400 mt-1.5">Missing: {quality.missing.join(', ')}</p>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            {property.owner_phone && (
              <a href={`tel:${property.owner_phone}`} className="btn-secondary rounded-xl px-4 py-2.5 text-xs flex-1">
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            )}
            <Link to={`/admin/edit/${property.id}`} className="btn-primary rounded-xl px-4 py-2.5 text-xs flex-1 text-center">
              <Edit3 className="h-3.5 w-3.5 inline mr-1" /> Edit
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export function AdminDashboardPage() {
  const q = useQuery({ queryKey: ['admin-properties'], queryFn: adminLoad })
  const inqQ = useQuery({ queryKey: ['admin-inquiry-count'], queryFn: fetchInquiries })
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState<SortKey>((searchParams.get('sort') as SortKey) || 'updated_at')
  const [sortDir, setSortDir] = useState<SortDir>((searchParams.get('dir') as SortDir) || 'desc')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewId, setPreviewId] = useState<string | null>(null)

  const allRows = q.data ?? []
  const filteredRows = useMemo(() => {
    if (!searchText.trim()) return allRows
    const st = searchText.toLowerCase()
    return allRows.filter((r) => (
      r.title?.toLowerCase().includes(st) ||
      r.listing_reference?.toLowerCase().includes(st) ||
      r.town?.toLowerCase().includes(st) ||
      r.county?.toLowerCase().includes(st) ||
      r.estate?.toLowerCase().includes(st)
    ))
  }, [allRows, searchText])

  const sortedRows = useMemo(() => {
    const arr = [...filteredRows]
    arr.sort((a, b) => {
      let aVal: unknown, bVal: unknown
      if (sortKey === 'quality') {
        aVal = calcQuality(a).completeness
        bVal = calcQuality(b).completeness
      } else {
        aVal = (a as unknown as Record<string, unknown>)[sortKey]
        bVal = (b as unknown as Record<string, unknown>)[sortKey]
      }
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return sortDir === 'asc' ? 1 : -1
      if (bVal == null) return sortDir === 'asc' ? -1 : 1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      if (aStr < bStr) return sortDir === 'asc' ? -1 : 1
      if (aStr > bStr) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filteredRows, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE))
  const pagedRows = sortedRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const previewProperty = previewId ? allRows.find((r) => r.id === previewId) ?? null : null

  const published = filteredRows.filter((r) => r.is_published).length
  const drafts = filteredRows.length - published
  const geocoded = filteredRows.filter((r) => r.latitude != null && r.longitude != null).length
  const avgQuality = filteredRows.length
    ? Math.round(filteredRows.reduce((s, r) => s + calcQuality(r).completeness, 0) / filteredRows.length)
    : 0

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      const newDir = sortDir === 'asc' ? 'desc' : 'asc'
      setSortDir(newDir)
      setSearchParams({ sort: key, dir: newDir }, { replace: true })
    } else {
      setSortKey(key)
      setSortDir('asc')
      setSearchParams({ sort: key, dir: 'asc' }, { replace: true })
    }
    setPage(0)
  }, [sortKey, sortDir, setSearchParams])

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
    return sortDir === 'asc'
      ? <ChevronUp className="h-3.5 w-3.5 text-trace-cyan" />
      : <ChevronDown className="h-3.5 w-3.5 text-trace-cyan" />
  }

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allPageIds = new Set(pagedRows.map((r) => r.id))
      if (allPageIds.size > 0 && [...allPageIds].every((id) => prev.has(id))) {
        return new Set([...prev].filter((id) => !allPageIds.has(id)))
      }
      return new Set([...prev, ...allPageIds])
    })
  }, [pagedRows])

  const allSelected = pagedRows.length > 0 && pagedRows.every((r) => selectedIds.has(r.id))
  const someSelected = pagedRows.some((r) => selectedIds.has(r.id)) && !allSelected

  const handleBulkAction = useCallback(async (action: string) => {
    try {
      if (!supabase) throw new Error('Supabase not configured')
      if (action === 'delete') {
        const { error } = await supabase.from('properties').delete().in('id', Array.from(selectedIds))
        if (error) throw error
      } else if (action === 'publish') {
        const { error } = await supabase.from('properties').update({ is_published: true }).in('id', Array.from(selectedIds))
        if (error) throw error
      } else if (action === 'unpublish') {
        const { error } = await supabase.from('properties').update({ is_published: false }).in('id', Array.from(selectedIds))
        if (error) throw error
      } else {
        throw new Error('Unknown action')
      }
      toast(`Action ${action} completed for ${selectedIds.size} properties`, 'success')
      setSelectedIds(new Set())
      qc.invalidateQueries({ queryKey: ['admin-properties'] })
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }, [selectedIds, qc, toast])

  const confirmDelete = async (id: string) => {
    if (!window.confirm('Delete this property permanently? This cannot be undone.')) return
    setDeleting(id)
    try {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('properties').delete().eq('id', id)
      if (error) throw error
      toast('Property deleted', 'success')
      qc.invalidateQueries({ queryKey: ['admin-properties'] })
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleDuplicate = async (id: string) => {
    setDuplicating(id)
    try {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('duplicate_property', { source_id: id })
      if (error) throw error
      toast('Property duplicated', 'success')
      navigate(`/admin/edit/${data}`)
      qc.invalidateQueries({ queryKey: ['admin-properties'] })
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setDuplicating(null)
    }
  }

  const togglePublished = async (id: string, current: boolean) => {
    setToggling(id)
    try {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('properties').update({ is_published: !current }).eq('id', id)
      if (error) throw error
      toast(current ? 'Unpublished' : 'Published', 'success')
      qc.invalidateQueries({ queryKey: ['admin-properties'] })
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setToggling(null)
    }
  }

  if (q.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.08] bg-trace-card p-5">
              <div className="skeleton h-3 w-20 mb-3" />
              <div className="skeleton h-9 w-16" />
            </div>
          ))}
        </div>
        <div className="skeleton h-[300px] w-full rounded-2xl" />
      </div>
    )
  }

  if (q.error) return <p className="text-red-400">{(q.error as Error).message}</p>

  return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={LayoutDashboard} label="Total pipeline" value={filteredRows.length} color="cyan" />
          <StatCard icon={TrendingUp} label="Live listings" value={published} sub={`${drafts} drafts`} color="emerald" />
          <StatCard icon={Map} label="Pins on map" value={geocoded} sub="Add lat/lng to appear" color="violet" />
          <StatCard icon={Sparkles} label="Avg. quality" value={`${avgQuality}%`} sub={`${inqQ.data ?? 0} inquiries`} color="amber" />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Quick filters:</span>
          <button
            type="button"
            onClick={() => navigate('/admin/map')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
          >
            <Map className="h-3.5 w-3.5" /> Map view
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/activity')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
          >
            <ScrollText className="h-3.5 w-3.5" /> Activity
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/inquiries')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
          >
            <Phone className="h-3.5 w-3.5" /> Inquiries
          </button>
          <span className="text-[10px] text-zinc-600 ml-auto">Showing {filteredRows.length} of {allRows.length} listings</span>
        </div>

      {/* Inquiry alert */}
      {inqQ.data && inqQ.data > 0 && (
        <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 border border-cyan-400/20">
              <Inbox className="h-4.5 w-4.5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-300">
                <strong className="text-white font-semibold">{inqQ.data}</strong> new inquiry{inqQ.data !== 1 ? 'ies' : 'y'}
              </p>
              <p className="text-xs text-zinc-600">Waiting for your response</p>
            </div>
          </div>
          <Link to="/admin/inquiries" className="btn-ghost rounded-xl text-xs">
            View all
          </Link>
        </div>
      )}

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="rounded-2xl border border-white/[0.1] bg-white/[0.04] p-4 flex items-center gap-3 animate-scale-in">
          <span className="text-xs text-zinc-400 font-medium">{selectedIds.size} selected</span>
          <button onClick={() => handleBulkAction('publish')} className="badge badge-emerald cursor-pointer hover:bg-emerald-400/20 transition-colors">
            Publish
          </button>
          <button onClick={() => handleBulkAction('unpublish')} className="badge badge-amber cursor-pointer hover:bg-amber-400/20 transition-colors">
            Unpublish
          </button>
          <button onClick={() => handleBulkAction('delete')} className="badge badge-rose cursor-pointer hover:bg-rose-400/20 transition-colors">
            Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-zinc-600 hover:text-white ml-auto transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              className="glass-input w-full pl-10 pr-10 py-2.5 text-sm"
              placeholder="Search by ref, title, town, estate..."
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setPage(0) }}
            />
            {searchText && (
              <button onClick={() => setSearchText('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => exportCSV(sortedRows)}
            className="btn-ghost rounded-xl px-3 py-2.5"
            title="Export to CSV"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
        <Link
          to="/admin/new"
          className="btn-primary rounded-2xl px-5 py-2.5 text-sm"
        >
          <PlusCircle className="h-4 w-4" />
          Add property
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-trace-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-left">
              <tr className="text-xs uppercase tracking-wider text-zinc-500">
                <th className="p-3 w-10">
                  <button onClick={toggleSelectAll} className="text-zinc-400 hover:text-white transition-colors">
                    {allSelected ? <CheckSquare className="h-4 w-4 text-trace-cyan" /> : someSelected ? <CheckSquare className="h-4 w-4 text-amber-400" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="p-3 cursor-pointer hover:text-white transition-colors font-medium" onClick={() => handleSort('listing_reference')}>
                  <div className="flex items-center gap-1.5">Reference <SortIcon col="listing_reference" /></div>
                </th>
                <th className="p-3 cursor-pointer hover:text-white transition-colors font-medium" onClick={() => handleSort('title')}>
                  <div className="flex items-center gap-1.5">Title <SortIcon col="title" /></div>
                </th>
                <th className="p-3 hidden md:table-cell cursor-pointer hover:text-white transition-colors font-medium" onClick={() => handleSort('town')}>
                  <div className="flex items-center gap-1.5">Location <SortIcon col="town" /></div>
                </th>
                <th className="p-3 cursor-pointer hover:text-white transition-colors font-medium" onClick={() => handleSort('is_published')}>
                  <div className="flex items-center gap-1.5">Status <SortIcon col="is_published" /></div>
                </th>
                <th className="p-3 hidden md:table-cell cursor-pointer hover:text-white transition-colors font-medium" onClick={() => handleSort('updated_at')}>
                  <div className="flex items-center gap-1.5">Updated <SortIcon col="updated_at" /></div>
                </th>
                <th className="p-3 hidden lg:table-cell cursor-pointer hover:text-white transition-colors font-medium" onClick={() => handleSort('price')}>
                  <div className="flex items-center gap-1.5">Price <SortIcon col="price" /></div>
                </th>
                <th className="p-3 hidden xl:table-cell cursor-pointer hover:text-white transition-colors font-medium" onClick={() => handleSort('bedrooms')}>
                  <div className="flex items-center gap-1.5">Beds <SortIcon col="bedrooms" /></div>
                </th>
                <th className="p-3 hidden xl:table-cell cursor-pointer hover:text-white transition-colors font-medium" onClick={() => handleSort('quality')}>
                  <div className="flex items-center gap-1.5">Quality <SortIcon col="quality" /></div>
                </th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {pagedRows.map((r) => {
                const quality = calcQuality(r)
                const rowSelected = selectedIds.has(r.id)
                return (
                  <tr
                    key={r.id}
                    className={`transition-colors ${
                      rowSelected ? 'bg-cyan-500/5' :
                      !r.cover_image_url && !(r as any).image_urls?.length
                        ? 'bg-amber-400/[0.03]'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedIds((prev) => {
                          const next = new Set(prev)
                          if (next.has(r.id)) next.delete(r.id); else next.add(r.id)
                          return next
                        })}
                        className={`transition-colors ${rowSelected ? 'text-trace-cyan' : 'text-zinc-600 hover:text-zinc-300'}`}
                      >
                        {rowSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setPreviewId(r.id)}
                        className="font-mono text-xs text-trace-cyan hover:text-trace-cyan-light transition-colors"
                      >
                        {r.listing_reference}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white max-w-[200px] truncate font-medium">{r.title}</span>
                        <div className="flex items-center gap-1">
                          {!r.cover_image_url && !(r as any).image_urls?.length && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300 border border-amber-400/20" title="No media">
                              <Camera className="h-2.5 w-2.5" />
                              No media
                            </span>
                          )}
                          {quality.missing.length === 0 && <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-zinc-400 hidden md:table-cell">
                      {[r.estate, r.town, r.county].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="p-3 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePublished(r.id, r.is_published)}
                          disabled={toggling === r.id}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                            r.is_published
                              ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/20'
                              : 'bg-amber-400/10 text-amber-300 border border-amber-400/20 hover:bg-amber-400/20'
                          }`}
                        >
                          {r.is_published ? <Check className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {r.is_published ? 'Live' : 'Draft'}
                        </button>
                        {!r.is_available && <span className="text-rose-400 text-[10px] font-medium">Unavail.</span>}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-zinc-500 hidden md:table-cell">
                      {new Date(r.updated_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-xs text-zinc-300 font-medium hidden lg:table-cell">
                      KSh {Number(r.price).toLocaleString()}
                    </td>
                    <td className="p-3 text-xs text-zinc-400 hidden xl:table-cell">
                      {r.bedrooms ?? '—'}
                    </td>
                    <td className="p-3 hidden xl:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-10 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              quality.completeness >= 80 ? 'bg-emerald-400' : quality.completeness >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                            }`}
                            style={{ width: `${quality.completeness}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-medium">{quality.completeness}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => setPreviewId(r.id)}
                          className="rounded-lg p-2 text-zinc-500 hover:text-trace-cyan hover:bg-white/[0.06] transition-all"
                          title="Quick preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(r.id)}
                          disabled={duplicating === r.id}
                          className="rounded-lg p-2 text-zinc-500 hover:text-trace-violet hover:bg-white/[0.06] transition-all disabled:opacity-30"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/admin/edit/${r.id}`}
                          className="rounded-lg p-2 text-zinc-500 hover:text-trace-cyan hover:bg-white/[0.06] transition-all"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => confirmDelete(r.id)}
                          disabled={deleting === r.id}
                          className="rounded-lg p-2 text-zinc-500 hover:text-rose-400 hover:bg-white/[0.06] transition-all disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {pagedRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-12 text-center">
                    <p className="text-zinc-500">{searchText ? 'No listings match your search.' : 'No listings yet.'}</p>
                    {!searchText && (
                      <Link to="/admin/new" className="inline-flex items-center gap-2 mt-4 text-sm text-trace-cyan hover:text-trace-cyan-light transition-colors">
                        <PlusCircle className="h-4 w-4" />
                        Add your first property
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-zinc-600">
         <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] text-zinc-600 self-center ml-auto">
             Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sortedRows.length)} of {sortedRows.length}
             {sortedRows.length !== filteredRows.length && ` (filtered from ${filteredRows.length})`}
           </span>
          </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-ghost rounded-lg px-3 py-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span>Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="btn-ghost rounded-lg px-3 py-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Preview drawer */}
      {previewProperty && (
        <PropertyPreview property={previewProperty} onClose={() => setPreviewId(null)} />
      )}
    </div>
  )
}
