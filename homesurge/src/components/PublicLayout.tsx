import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { MapPin, Phone, Menu, X, Heart, GitCompare, Sparkles, User, LogOut } from 'lucide-react'
import { env } from '../lib/env'
import { useFavorites } from '../hooks/useFavorites'
import { useAuth } from '../context/AuthContext'

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { count } = useFavorites()
  const { user, role, loading, signOut, fullName } = useAuth()
  const isAuthed = !loading && (role === 'customer' || role === 'admin' || role === 'updater')
  const isAdmin = role === 'admin' || role === 'updater'
  const displayName = fullName || user?.email?.split('@')[0] || 'Account'

  return (
    <div className="min-h-screen flex flex-col bg-trace-dusk">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-trace-dusk/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="group flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-trace-cyan to-trace-violet">
              <MapPin className="h-5 w-5 text-trace-dusk" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Home<span className="text-gradient">surge</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/browse"
              className="btn-ghost rounded-xl px-4 py-2"
            >
              Browse
            </Link>
            <Link
              to="/saved"
              className="btn-ghost rounded-xl px-4 py-2 relative"
            >
              <Heart className="h-4 w-4 text-rose-400" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30">
                  {count}
                </span>
              )}
            </Link>
            <Link
              to="/compare"
              className="btn-ghost rounded-xl px-4 py-2"
            >
              <GitCompare className="h-4 w-4 text-trace-cyan" />
            </Link>
            <div className="w-px h-5 bg-white/10 mx-2" />
            {isAuthed && !isAdmin ? (
              <>
                <Link
                  to="/account"
                  className="btn-ghost rounded-xl px-4 py-2 flex items-center gap-2"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-trace-cyan to-trace-violet flex items-center justify-center overflow-hidden">
                    {(user?.user_metadata as any)?.avatar_url ? (
                      <img src={(user?.user_metadata as any).avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-trace-dusk" />
                    )}
                  </div>
                  {displayName}
                </Link>
                <button
                  onClick={signOut}
                  className="btn-ghost rounded-xl px-4 py-2"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : isAdmin ? (
              <Link
                to="/admin"
                className="btn-primary rounded-xl px-4 py-2 text-xs"
              >
                Admin panel
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn-ghost rounded-xl px-4 py-2"
                >
                  Sign in
                </Link>
                <Link
                  to="/login"
                  className="btn-primary rounded-xl px-4 py-2 text-xs"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>

          <button
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl glass-card text-zinc-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-trace-dusk/95 backdrop-blur-2xl animate-slide-in-up">
            <nav className="flex flex-col gap-1 p-4">
              <Link
                to="/browse"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                Browse homes
              </Link>
              <Link
                to="/saved"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <Heart className="h-4 w-4 text-rose-400" />
                Saved ({count})
              </Link>
              <Link
                to="/compare"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <GitCompare className="h-4 w-4 text-trace-cyan" />
                Compare
              </Link>
              {isAuthed && !isAdmin ? (
                <>
                  <Link
                    to="/account"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Hi, {displayName}
                  </Link>
                  <button
                    onClick={() => { signOut(); setMenuOpen(false) }}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </>
              ) : isAdmin ? (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-trace-cyan hover:bg-white/[0.06] transition-colors"
                >
                  Admin panel
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-trace-cyan hover:bg-white/[0.06] transition-colors"
                  >
                    Get started
                  </Link>
                </>
              )}
              {env.whatsappUrl && env.whatsappUrl !== '#' && (
                <a
                  href={env.whatsappUrl}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-trace-cyan hover:bg-white/[0.06] transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  WhatsApp us
                </a>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-trace-dusk/50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-trace-cyan to-trace-violet">
                  <MapPin className="h-4 w-4 text-trace-dusk" />
                </div>
                <span className="font-display text-lg font-bold text-white">
                  Home<span className="text-gradient">surge</span>
                </span>
              </div>
              <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
                Kenya's most transparent home-hunting platform. Broad locations, honest prices, real availability — with privacy by design.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Platform</h4>
              <div className="flex flex-col gap-2 text-sm text-zinc-500">
                <Link to="/browse" className="hover:text-white transition-colors">Browse homes</Link>
                <Link to="/saved" className="hover:text-white transition-colors">Saved listings</Link>
                <Link to="/compare" className="hover:text-white transition-colors">Compare</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Contact</h4>
              <div className="flex flex-col gap-2 text-sm text-zinc-500">
                {env.publicPhone && (
                  <a href={`tel:${env.publicPhone.replace(/\s/g, '')}`} className="hover:text-trace-cyan transition-colors">
                    {env.publicPhone}
                  </a>
                )}
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-trace-violet" />
                  Serving Kenya-wide
                </span>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
            <p>Exact pins stay offline — you reach real homes through us.</p>
            <p>© {new Date().getFullYear()} Homesurge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
