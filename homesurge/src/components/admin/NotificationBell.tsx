import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export function NotificationBell() {
  const { data: inquiries = [] } = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: async () => { if (!supabase) return []
      const { data, error } = await supabase.from('property_inquiries').select('*').order('created_at',{ascending:false})
      if (error) throw error
      return data
    },
    staleTime: 30000,
  })
  const count = inquiries.length
  return (
    <Link
      to='/admin/inquiries'
      className='relative flex items-center justify-center h-9 w-9 rounded-lg glass-card text-zinc-400 hover:text-white hover:border-white/20 transition-colors'
    >
      <Bell className='h-4 w-4' />
      {count > 0 && (
        <span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-lg'>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
