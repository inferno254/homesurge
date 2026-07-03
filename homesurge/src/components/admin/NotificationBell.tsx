import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRealtimeInquiries } from '../../hooks/useRealtimeInquiries'

export function NotificationBell() {
  const { count } = useRealtimeInquiries()
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
