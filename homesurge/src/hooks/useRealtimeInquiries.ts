import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

let channelCreated = false

export function useRealtimeInquiries() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('connecting')
  const { data: inquiries = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: async () => { if (!supabase) return []
      const { data, error } = await supabase.from('property_inquiries').select('*').order('created_at',{ascending:false})
      if (error) throw error
      return data
    },
    staleTime: Infinity,
  })
  useEffect(() => {
    if (!supabase) { setStatus('error'); return }
    if (channelCreated) { setStatus('connected'); return }
    channelCreated = true
    setStatus('connecting')
    const name = 'admin-inquiries-realtime'
    try {
      const existing = supabase.getChannels().find((c: any) => c.topic === `realtime:${name}`)
      const ch = existing ?? supabase.channel(name)
      if (!existing) {
        ch.on('postgres_changes',
          {event:'INSERT',schema:'public',table:'property_inquiries'},
          (p) => {
            const incoming = p.new as unknown
            qc.setQueryData(['admin-inquiries'], (o) => {
              const prev = (o ?? []) as any[]
              return [incoming as any, ...prev]
            })
          }
        ).subscribe((s) => {
          if(s==='SUBSCRIBED') setStatus('connected')
          else if(s==='CHANNEL_ERROR') setStatus('error')
          else if(s==='CLOSED') setStatus('disconnected')
        })
      } else {
        setStatus('connected')
      }
    } catch (e) {
      setStatus('error')
    }
  },[])
  return { inquiries, isLoading, status, refetch, count: inquiries.length }
}
