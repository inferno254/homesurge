import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import { PublicLayout } from './components/PublicLayout'
import { HomePage } from './pages/HomePage'
import { BrowsePage } from './pages/BrowsePage'
import { SavedPage } from './pages/SavedPage'
import { ComparePage } from './pages/ComparePage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { RecentlyViewedPage } from './pages/RecentlyViewedPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminMapPage } from './pages/admin/AdminMapPage'
import { AdminInquiriesPage } from './pages/admin/AdminInquiriesPage'
import { AdminPropertyFormPage } from './pages/admin/AdminPropertyFormPage'
import { AdminActivityPage } from './pages/admin/AdminActivityPage'
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { CustomerLoginPage } from './pages/CustomerLoginPage'
import { CustomerDashboard } from './pages/CustomerDashboard'
import { CompareBar } from './components/CompareBar'
import { useCompare } from './hooks/useCompare'
import { AdminRoute } from './components/AdminRoute'
import { useAuth } from './context/AuthContext'
import { useEffect, useState } from 'react'

function EmailConfirmPage() {
  const [status, setStatus] = useState('Verifying your email...')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const type = params.get('type')
    const error = params.get('error')
    const errorDescription = params.get('error_description')
    const next = params.get('next') || '/login?confirmed=1'

    if (error) {
      setStatus(errorDescription || error || 'Email verification failed')
      setDone(true)
      return
    }

    if (token && type === 'signup') {
      setStatus('Email confirmed! Redirecting...')
      setDone(true)
      setTimeout(() => {
        window.location.href = next
      }, 1500)
    } else if (token && type === 'magiclink') {
      setStatus('Magic link verified! Redirecting...')
      setDone(true)
      setTimeout(() => {
        window.location.href = next
      }, 1500)
    } else {
      setStatus('Invalid or expired verification link')
      setDone(true)
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-trace-dusk px-4">
      <div className="text-center">
        <p className="text-sm text-zinc-400">{status}</p>
        {done && (
          <button
            onClick={() => { window.location.href = '/login' }}
            className="mt-4 text-xs text-cyan-300 hover:text-cyan-200"
          >
            Go to login
          </button>
        )}
      </div>
    </div>
  )
}

function AuthCallback() {
  const { refreshRole, role, loading, user } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')
    const errorDescription = params.get('error_description')

    if (error) {
      console.error('[AuthCallback] error', error, errorDescription)
      document.title = 'Sign in failed'
      return
    }

    if (!code) {
      document.title = 'Sign in complete'
      return
    }

    if (loading) {
      document.title = 'Completing sign in...'
      return
    }

    if (!user?.id) {
      document.title = 'Signing you in...'
      return
    }

    refreshRole()
  }, [refreshRole, loading, user?.id])

  useEffect(() => {
    if (loading) return
    if (role === 'admin' || role === 'publisher') {
      window.location.href = '/admin'
    } else if (role === 'customer') {
      window.location.href = '/browse'
    } else {
      window.location.href = '/'
    }
  }, [loading, role])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-trace-dusk">
      <div className="text-center">
        <p className="text-sm text-zinc-400">Completing sign in...</p>
      </div>
    </div>
  )
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[RootErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[9999] bg-red-950/90 text-red-200 p-8 overflow-auto font-mono text-xs">
          <h2 className="text-lg font-bold mb-4">Runtime Error</h2>
          <p className="mb-2">{this.state.error.message}</p>
          <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children as any
  }
}

function PublicShell() {
  const { compare, toggle, clear } = useCompare()

  return (
    <>
      <PublicLayout />
      <CompareBar ids={compare} onRemove={toggle} onClear={clear} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <RootErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <Routes>
            <Route element={<PublicShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/listing/:id" element={<ListingDetailPage />} />
              <Route path="/recent" element={<RecentlyViewedPage />} />
            </Route>

            <Route path="/admin/login" element={<AdminLoginPage />} />

            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="map" element={<AdminMapPage />} />
              <Route path="inquiries" element={<AdminInquiriesPage />} />
              <Route path="activity" element={<AdminActivityPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="new" element={<AdminPropertyFormPage />} />
              <Route path="edit/:id" element={<AdminPropertyFormPage />} />
            </Route>
            <Route path="/login" element={<CustomerLoginPage />} />
            <Route path="/register" element={<CustomerLoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset" element={<AuthCallback />} />
            <Route path="/auth/v1/verify" element={<EmailConfirmPage />} />
            <Route path="/account" element={<CustomerDashboard />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </RootErrorBoundary>
  </BrowserRouter>
  )
}
