import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { loading, role } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-trace-cyan" />
      </div>
    )
  }

  if (role !== 'admin' && role !== 'publisher') {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
