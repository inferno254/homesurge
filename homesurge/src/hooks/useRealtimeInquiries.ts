import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useRealtimeInquiries() {
  const { data: inquiries = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: async () => { if (!supabase) return []
      const { data, error } = await supabase.from('property_inquiries').select('*').order('created_at',{ascending:false})
      if (error) throw error
      return data
    },
    staleTime: Infinity,
  })
  return { inquiries, isLoading, status: 'connected', refetch, count: inquiries.length }
}
