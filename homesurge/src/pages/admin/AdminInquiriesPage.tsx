import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/Toast'
import { Phone, Trash2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

type Inquiry = {
  id: string
  property_id: string
  name: string
  phone: string
  message: string | null
  created_at: string
  property_title?: string
  property_ref?: string
}

async function fetchInquiriesWithProperties(): Promise<Inquiry[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data: inquiries, error } = await supabase
    .from('property_inquiries')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error

  const propertyIds = [...new Set(inquiries.map((i: Inquiry) => i.property_id))]
  if (propertyIds.length === 0) return []

  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, listing_reference')
    .in('id', propertyIds)

  const propMap = new Map((properties ?? []).map((p: { id: string; title: string; listing_reference: string }) => [p.id, p]))

  return (inquiries as Inquiry[]).map((inq) => {
    const prop = propMap.get(inq.property_id)
    return {
      ...inq,
      property_title: prop?.title ?? 'Unknown property',
      property_ref: prop?.listing_reference ?? '—',
    }
  })
}

async function deleteInquiry(id: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('property_inquiries').delete().eq('id', id)
  if (error) throw error
}

export function AdminInquiriesPage() {
  const q = useQuery({ queryKey: ['admin-inquiries'], queryFn: fetchInquiriesWithProperties })
  const qc = useQueryClient()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const confirmDelete = async (id: string) => {
    if (!window.confirm('Delete this inquiry permanently?')) return
    setDeleting(id)
    try {
      await deleteInquiry(id)
      toast('Inquiry deleted', 'success')
      qc.invalidateQueries({ queryKey: ['admin-inquiries'] })
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Leads & inquiries</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {q.data?.length ?? 0} total inquiry{q.data?.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      </div>

      {q.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-4"><div className="skeleton h-12 w-full" /></div>
          ))}
        </div>
      )}

      {q.error && <p className="text-red-400">{(q.error as Error).message}</p>}

      {q.data && q.data.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Phone className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 mb-1">No inquiries yet</p>
          <p className="text-sm text-zinc-600">Inquiries appear here when customers submit interest on listing detail pages.</p>
        </div>
      )}

      {q.data && q.data.length > 0 && (
        <div className="space-y-3">
          {q.data.map((inq) => {
            const isOpen = expanded === inq.id
            const date = new Date(inq.created_at)
            const today = new Date()
            const isToday = date.toDateString() === today.toDateString()
            const daysAgo = Math.floor((today.getTime() - date.getTime()) / 86400000)

            return (
              <div key={inq.id} className="glass-card rounded-xl overflow-hidden transition-all duration-200">
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-cyan-500/15 flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4 text-cyan-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{inq.name}</p>
                        <p className="text-xs text-cyan-200 font-mono">{inq.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                      {isToday ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
                      <br />
                      <span className="text-zinc-600">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    <button
                      onClick={() => setExpanded(isOpen ? null : inq.id)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <a href={`tel:${inq.phone.replace(/\s/g, '')}`} className="rounded-lg p-1.5 text-green-400 hover:bg-green-400/10 transition-all" title="Call lead">
                      <Phone className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => confirmDelete(inq.id)}
                      disabled={deleting === inq.id}
                      className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-all disabled:opacity-30"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-white/5 px-4 py-3 space-y-3 animate-fade-in">
                    {inq.property_title && (
                      <div className="text-xs">
                        <span className="text-zinc-500">Property: </span>
                        <Link to={`/admin/edit/${inq.property_id}`} className="text-cyan-300 hover:underline inline-flex items-center gap-1">
                          {inq.property_title} <ExternalLink className="h-3 w-3" />
                        </Link>
                        <span className="text-zinc-600 ml-2">({inq.property_ref})</span>
                      </div>
                    )}
                    {inq.message && (
                      <div className="text-xs text-zinc-400 bg-black/20 rounded-lg p-3">
                        <span className="text-zinc-500 block mb-1">Message:</span>
                        {inq.message}
                      </div>
                    )}
                    <p className="text-[10px] text-zinc-600">
                      Submitted {date.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}