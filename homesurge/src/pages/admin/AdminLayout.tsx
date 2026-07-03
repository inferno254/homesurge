import { useState } from 'react'
import { Link, Navigate, Outlet } from 'react-router-dom'
import { LayoutDashboard, Map, PlusCircle, Menu, X, Phone, HelpCircle, ScrollText, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { NotificationBell } from '../../components/admin/NotificationBell'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { AdminChatSidebar } from '../../components/ai/AdminChatSidebar'

export function AdminLayout() {
  const { loading, role, user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  useKeyboardShortcuts()

  if (user && role === null) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    )
  }

  if (!loading && role !== 'admin' && role !== 'updater') {
    return <Navigate to="/admin/login" replace />
  }

  const navLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/map', label: 'Operations map', icon: Map },
    { to: '/admin/inquiries', label: 'Inquiries', icon: Phone },
    { to: '/admin/activity', label: 'Activity log', icon: ScrollText },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/new', label: 'Add house', icon: PlusCircle, accent: true },
  ]

  return (
    <div className="min-h-screen bg-trace-dusk text-white">
      <header className="border-b border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-6">
          <span className="font-display font-bold text-lg tracking-tight shrink-0">
            Home<span className="text-gradient">surge</span> <span className="text-zinc-500 text-sm font-normal">Admin</span>
          </span>
          <nav className="hidden md:flex flex-wrap gap-4 text-sm text-zinc-400">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`inline-flex items-center gap-1.5 hover:text-white transition-colors ${
                  l.accent ? 'text-cyan-300' : ''
                }`}
              >
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            ))}
            <a href="/browse" className="hover:text-white transition-colors">
              Preview public
            </a>
          </nav>
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={() => setShowShortcuts(true)}
              className="text-zinc-500 hover:text-white transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <NotificationBell />
            <button
              type="button"
              onClick={() => signOut()}
              className="text-xs uppercase tracking-wide text-zinc-500 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
          <button
            className="md:hidden ml-auto text-zinc-400 hover:text-white transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-white/10 mt-4 pt-4 md:hidden animate-fade-in">
            <nav className="flex flex-col gap-2 text-sm text-zinc-400">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5 transition-colors ${
                    l.accent ? 'text-cyan-300' : ''
                  }`}
                >
                  <l.icon className="h-4 w-4" /> {l.label}
                </Link>
              ))}
              <a
                href="/browse"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5 transition-colors"
              >
                Preview public listings
              </a>
              <div className="flex items-center gap-2 px-3 py-2">
                <NotificationBell />
                <span className="text-zinc-500">Inquiries</span>
              </div>
              <button
                type="button"
                onClick={() => { setShowShortcuts(true); setMenuOpen(false) }}
                className="text-left rounded-xl px-3 py-2 text-zinc-500 hover:bg-white/5 transition-colors"
              >
                Shortcuts
              </button>
              <button
                type="button"
                onClick={() => { signOut(); setMenuOpen(false) }}
                className="text-left rounded-xl px-3 py-2 text-zinc-500 hover:bg-white/5 transition-colors"
              >
                Sign out
              </button>
            </nav>
          </div>
        )}
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {loading ? <p className="text-zinc-500">...</p> : <Outlet />}
      </div>
      <AdminChatSidebar />

      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowShortcuts(false)}>
          <div className="glass-card rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-white">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
               {[
                 ['Ctrl+D', 'Go to Dashboard'],
                 ['Ctrl+M', 'Go to Admin Map'],
                 ['Ctrl+N', 'New property'],
                 ['Ctrl+I', 'Go to Inquiries'],
                 ['Ctrl+A', 'Go to Activity log'],
                 ['Ctrl+U', 'Go to Users'],
                 ['Esc', 'Close modals/drawers'],
                 ['/', 'Focus search (when active)'],
               ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between text-zinc-400">
                  <span>{label}</span>
                  <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-300 font-mono">{key}</kbd>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600 mt-4">Press <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 text-zinc-500">?</kbd> anytime to view shortcuts</p>
          </div>
        </div>
      )}
    </div>
  )
}
