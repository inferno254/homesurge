import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useState } from 'react'
import { RefreshCw, ChevronDown, ChevronUp, Filter } from 'lucide-react'

type ActivityEntry = {
  id: string
  admin_id: string | null
  action: string
  property_id: string | null
  property_ref: string | null
  details: Record<string, unknown> | null
  created_at: string
  profiles?: { full_name: string | null } | null
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-500/15 text-green-300 border-green-400/30',
  UPDATE: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
  PUBLISH: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
  UNPUBLISH: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  DELETE: 'bg-red-500/15 text-red-300 border-red-400/30',
}

const PAGE_SIZE = 30

export function AdminActivityPage() {
  const [page, setPage] = useState(0)
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState<number>(0)

  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-activity', page, actionFilter],
    queryFn: async (): Promise<ActivityEntry[]> => {
      if (!supabase) return []
      let query = supabase
        .from('admin_activity_log')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      const { count } = await supabase
        .from('admin_activity_log')
        .select('*', { count: 'exact', head: true })

      if (count != null) setTotalCount(count)

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter)
      }

      const { data, error } = await query
      if (error) return []
      return (data as ActivityEntry[]) ?? []
    },
  })

  const totalEntries = entries.length
  const hasMore = totalEntries === PAGE_SIZE

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Activity Log</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Every property create, update, publish, and delete is tracked here automatically via database trigger.
            </p>
            {totalCount > 0 && (
              <p className="text-xs text-zinc-600 mt-1">Total entries: {totalCount}</p>
            )}
          </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={'h-3.5 w-3.5' + (isLoading ? ' animate-spin' : '')} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-zinc-500" />
        <button
          type="button"
          onClick={() => setActionFilter('all')}
          className={`rounded-lg px-2.5 py-1 text-xs border transition-colors ${
            actionFilter === 'all'
              ? 'bg-white/10 border-white/20 text-white'
              : 'border-white/10 text-zinc-400 hover:text-white'
          }`}
        >
          All
        </button>
        {['CREATE', 'UPDATE', 'PUBLISH', 'UNPUBLISH', 'DELETE'].map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => setActionFilter(action)}
            className={`rounded-lg px-2.5 py-1 text-xs border transition-colors ${
              actionFilter === action
                ? ACTION_COLORS[action] + ' border-current'
                : 'border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            {action}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-zinc-500 text-sm">Loading activity...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-zinc-500 text-sm">No activity recorded yet.</p>
            <p className="text-zinc-600 text-xs mt-1">
              Actions like creating, editing, publishing, or deleting properties will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {entries.map((entry) => {
              const isExpanded = expandedId === entry.id
              const before = (entry.details as Record<string, unknown>)?.before as Record<string, unknown> | undefined
              const after = (entry.details as Record<string, unknown>)?.after as Record<string, unknown> | undefined

              return (
                <div key={entry.id} className="hover:bg-white/[0.015] transition-colors">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3"
                  >
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        ACTION_COLORS[entry.action] ?? 'text-zinc-300 border-white/10'
                      }`}
                    >
                      {entry.action}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="text-xs text-white font-medium truncate block">
                        {entry.property_ref ?? entry.property_id ?? 'Unknown property'}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {entry.profiles?.full_name ?? 'Unknown admin'} • {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (before || after) && (
                    <div className="px-4 pb-3 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {before && (
                          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Before</p>
                            <pre className="text-[11px] text-zinc-400 whitespace-pre-wrap break-words font-mono leading-relaxed">
                              {JSON.stringify(before, null, 2)}
                            </pre>
                          </div>
                        )}
                        {after && (
                          <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3">
                            <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-2">After</p>
                            <pre className="text-[11px] text-cyan-100 whitespace-pre-wrap break-words font-mono leading-relaxed">
                              {JSON.stringify(after, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {hasMore && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-xs text-zinc-500">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span>Page {page + 1}</span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 hover:text-white transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
