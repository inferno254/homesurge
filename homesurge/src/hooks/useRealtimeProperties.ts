import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { DbProperty } from '../types/property'

export function useProperties() {
  const q = useQuery({
    queryKey: ['admin-properties'],
    queryFn: async (): Promise<DbProperty[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.from('properties').select('*')
      if (error) throw new Error(error.message)
      return (data ?? []) as DbProperty[]
    },
    enabled: Boolean(supabase),
  })

  const refresh = useCallback(() => { void q.refetch() }, [q])

  return {
    properties: q.data ?? [],
    isLoading: q.isLoading,
    error: q.error,
    status: q.status,
    isLive: Boolean(supabase),
    refresh,
  }
}
