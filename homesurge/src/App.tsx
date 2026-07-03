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
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { CustomerLoginPage } from './pages/CustomerLoginPage'
import { CustomerDashboard } from './pages/CustomerDashboard'
import { CompareBar } from './components/CompareBar'
import { useCompare } from './hooks/useCompare'
import { CustomerChatWidget } from './components/ai/CustomerChatWidget'

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
      <CustomerChatWidget />
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

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="map" element={<AdminMapPage />} />
              <Route path="inquiries" element={<AdminInquiriesPage />} />
              <Route path="activity" element={<AdminActivityPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="new" element={<AdminPropertyFormPage />} />
              <Route path="edit/:id" element={<AdminPropertyFormPage />} />
            </Route>
            <Route path="/login" element={<CustomerLoginPage />} />
            <Route path="/register" element={<CustomerLoginPage />} />
            <Route path="/account" element={<CustomerDashboard />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </RootErrorBoundary>
  </BrowserRouter>
  )
}
