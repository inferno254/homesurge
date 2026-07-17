import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { RefreshCw, TrendingUp, Home, Eye, EyeOff, Phone, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'

type ActivityEntry = {
  id: string
  admin_id: string | null
  action: string
  property_id: string | null
  property_ref: string | null
  details: Record<string, unknown> | null
  created_at: string
}

type AnalyticsData = {
  totalProperties: number
  publishedProperties: number
  draftProperties: number
  unavailableProperties: number
  totalInquiries: number
  avgPrice: number
  totalValue: number
  recentActivity: ActivityEntry[]
  activityByDay: { date: string; count: number }[]
  actionBreakdown: { action: string; count: number }[]
  topTowns: { town: string; count: number }[]
  propertyTypes: { type: string; count: number }[]
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-500/15 text-green-300 border-green-400/30',
  UPDATE: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
  PUBLISH: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
  UNPUBLISH: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  DELETE: 'bg-red-500/15 text-red-300 border-red-400/30',
  MARKED_UNAVAILABLE: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  MARKED_AVAILABLE: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  PRICE_CHANGE: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'New listing',
  UPDATE: 'Updated',
  PUBLISH: 'Published',
  UNPUBLISH: 'Unpublished',
  DELETE: 'Deleted',
  MARKED_UNAVAILABLE: 'Marked unavailable',
  MARKED_AVAILABLE: 'Marked available',
  PRICE_CHANGE: 'Price changed',
}

async function fetchAnalytics(): Promise<AnalyticsData> {
  if (!supabase) throw new Error('Supabase not configured')

  const [propsResult, inquiriesResult, activityResult] = await Promise.all([
    supabase.from('properties').select('*', { count: 'exact' }),
    supabase.from('property_inquiries').select('*', { count: 'exact', head: true }),
    supabase.from('admin_activity_log').select('*').order('created_at', { ascending: false }).limit(100),
  ])

  const properties = (propsResult.data ?? []) as any[]
  const totalProperties = propsResult.count ?? 0
  const publishedProperties = properties.filter((p) => p.is_published).length
  const draftProperties = properties.filter((p) => !p.is_published).length
  const unavailableProperties = properties.filter((p) => !p.is_available).length
  const totalInquiries = inquiriesResult.count ?? 0

  const prices = properties.filter((p) => p.price > 0).map((p) => Number(p.price))
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0
  const totalValue = prices.reduce((a, b) => a + b, 0)

  const activity = (activityResult.data ?? []) as ActivityEntry[]

  const now = new Date()
  const activityByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    return {
      date: dateStr,
      count: activity.filter((a) => a.created_at.startsWith(dateStr)).length,
    }
  })

  const actionBreakdown = Object.entries(
    activity.reduce((acc, a) => {
      acc[a.action] = (acc[a.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)

  const townCount = properties.reduce((acc, p) => {
    if (p.town) acc[p.town] = (acc[p.town] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topTowns = Object.entries(townCount)
    .map(([town, count]) => ({ town, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const typeCount = properties.reduce((acc, p) => {
    if (p.property_type) acc[p.property_type] = (acc[p.property_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const propertyTypes = Object.entries(typeCount)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalProperties,
    publishedProperties,
    draftProperties,
    unavailableProperties,
    totalInquiries,
    avgPrice,
    totalValue,
    recentActivity: activity.slice(0, 20),
    activityByDay,
    actionBreakdown,
    topTowns,
    propertyTypes,
  }
}

function StatCard({ icon: Icon, label, value, sub, color, trend }: {
  icon: typeof Home
  label: string
  value: string | number
  sub?: string
  color: 'cyan' | 'violet' | 'amber' | 'emerald' | 'rose' | 'blue'
  trend?: { value: number; up: boolean }
}) {
  const colorMap = {
    cyan: 'text-trace-cyan bg-trace-cyan/10 border-trace-cyan/20',
    violet: 'text-trace-violet bg-trace-violet/10 border-trace-violet/20',
    amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    rose: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-trace-card p-5 transition-all hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20">
      <div className="flex items-center justify-between mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${colorMap[color]}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${trend.up ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend.value}%
          </div>
        )}
      </div>
      <p className="font-display text-3xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  )
}

function MiniBarChart({ data, color = 'bg-trace-cyan' }: { data: { date: string; count: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-md bg-white/[0.06] relative overflow-hidden" style={{ height: '100%' }}>
            <div
              className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${color}`}
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
            />
          </div>
          <span className="text-[9px] text-zinc-600 font-medium">
            {new Date(d.date).toLocaleDateString('en-KE', { weekday: 'short' })}
          </span>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data, colors }: { data: { action: string; count: number }[]; colors: string[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return <p className="text-xs text-zinc-600">No activity yet</p>

  let cumulative = 0
  const segments = data.map((d, i) => {
    const pct = (d.count / total) * 100
    const start = cumulative
    cumulative += pct
    return { ...d, pct, start, color: colors[i % colors.length] }
  })

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {segments.map((s, i) => {
            const r = 15.9155
            const circumference = 2 * Math.PI * r
            const offset = (s.start / 100) * circumference
            const dash = (s.pct / 100) * circumference
            return (
              <circle
                key={i}
                cx="18" cy="18" r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="3.5"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                className="transition-all duration-500"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{total}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 flex-1">
        {segments.slice(0, 5).map((s) => (
          <div key={s.action} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-zinc-400">{ACTION_LABELS[s.action] || s.action}</span>
            </div>
            <span className="text-zinc-500 font-medium">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminAnalyticsPage() {
  const { role } = useAuth()
  const { toast } = useToast()
  const qc = useQueryClient()

  if (role !== 'admin') {
    return <Navigate to="/admin" replace />
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: fetchAnalytics,
    staleTime: 30_000,
  })

  const handleRefresh = async () => {
    await refetch()
    toast('Analytics refreshed', 'success')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

  if (!data) return <p className="text-red-400">Failed to load analytics</p>

  const actionColors = [
    '#22d3ee', '#a78bfa', '#4ade80', '#fbbf24', '#fb7185', '#f472b6', '#60a5fa', '#34d399'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Real-time overview of listings, activity, and inquiries
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Home} label="Total listings" value={data.totalProperties} sub={`${data.publishedProperties} published · ${data.draftProperties} drafts`} color="cyan" />
        <StatCard icon={Eye} label="Published" value={data.publishedProperties} sub={`${Math.round((data.publishedProperties / Math.max(data.totalProperties, 1)) * 100)}% of total`} color="emerald" />
        <StatCard icon={EyeOff} label="Unavailable" value={data.unavailableProperties} sub="Marked off-market" color="rose" />
        <StatCard icon={Phone} label="Inquiries" value={data.totalInquiries} sub="Customer leads" color="violet" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Avg. listing price" value={`KSh ${data.avgPrice.toLocaleString()}`} sub="Per property" color="amber" />
        <StatCard icon={TrendingUp} label="Total portfolio value" value={`KSh ${(data.totalValue / 1_000_000).toFixed(1)}M`} sub="Sum of all prices" color="blue" />
        <StatCard icon={Activity} label="Total actions logged" value={data.recentActivity.length} sub="Last 100 entries" color="cyan" />
        <StatCard icon={Home} label="Top area" value={data.topTowns[0]?.town ?? '—'} sub={`${data.topTowns[0]?.count ?? 0} listings`} color="violet" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Timeline */}
        <div className="rounded-2xl border border-white/[0.08] bg-trace-card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Activity timeline</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Actions per day · last 7 days</p>
          </div>
          <MiniBarChart data={data.activityByDay} color="bg-gradient-to-t from-trace-cyan to-trace-violet" />
          <div className="flex items-center justify-between text-[10px] text-zinc-600">
            <span>7 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Action Breakdown */}
        <div className="rounded-2xl border border-white/[0.08] bg-trace-card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Action breakdown</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Distribution of logged actions</p>
          </div>
          <DonutChart data={data.actionBreakdown} colors={actionColors} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Towns */}
        <div className="rounded-2xl border border-white/[0.08] bg-trace-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Top towns</h3>
          <div className="space-y-3">
            {data.topTowns.map((town, i) => {
              const maxCount = data.topTowns[0]?.count || 1
              return (
                <div key={town.town} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">{i + 1}. {town.town}</span>
                    <span className="text-zinc-500 font-medium">{town.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-trace-cyan to-trace-violet transition-all duration-500"
                      style={{ width: `${(town.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {data.topTowns.length === 0 && (
              <p className="text-xs text-zinc-600">No town data yet</p>
            )}
          </div>
        </div>

        {/* Property Types */}
        <div className="rounded-2xl border border-white/[0.08] bg-trace-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Property types</h3>
          <div className="space-y-3">
            {data.propertyTypes.map((pt, i) => {
              const maxCount = data.propertyTypes[0]?.count || 1
              return (
                <div key={pt.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 capitalize">{pt.type}</span>
                    <span className="text-zinc-500 font-medium">{pt.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-500"
                      style={{ width: `${(pt.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {data.propertyTypes.length === 0 && (
              <p className="text-xs text-zinc-600">No property types yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-white/[0.08] bg-trace-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Recent activity</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Last 20 actions across all properties</p>
        </div>
        {data.recentActivity.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-zinc-500 text-sm">No activity recorded yet.</p>
            <p className="text-zinc-600 text-xs mt-1">Actions like creating, editing, publishing, or deleting properties will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data.recentActivity.map((entry) => (
              <div key={entry.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.015] transition-colors">
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    ACTION_COLORS[entry.action] ?? 'text-zinc-300 border-white/10'
                  }`}
                >
                  {ACTION_LABELS[entry.action] || entry.action}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="text-xs text-white font-medium truncate block">
                    {entry.property_ref ?? entry.property_id ?? 'Unknown property'}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {new Date(entry.created_at).toLocaleString('en-KE', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
