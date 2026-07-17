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
  const isAuthed = !loading && (role === 'customer' || role === 'admin' || role === 'publisher')
  const isAdmin = role === 'admin' || role === 'publisher'
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
              className="btn-primary rounded-xl px-4 py-2 text-xs"
            >
              Browse homes
            </Link>
            <Link
              to="/saved"
              className="btn-ghost rounded-xl px-3 py-2 relative"
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
              className="btn-ghost rounded-xl px-3 py-2"
            >
              <GitCompare className="h-4 w-4 text-trace-cyan" />
            </Link>
            <div className="w-px h-5 bg-white/10 mx-2" />
          </nav>

          <div className="flex items-center gap-1">
            {isAuthed ? (
              <>
                {isAdmin ? (
                  <Link to="/admin" className="btn-ghost rounded-xl px-4 py-2">Admin</Link>
                ) : (
                  <Link
                    to="/account"
                    className="btn-ghost rounded-xl px-4 py-2 flex items-center gap-2"
                  >
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-trace-cyan to-trace-violet flex items-center justify-center overflow-hidden">
                      {(user?.user_metadata as any)?.avatar_url ? (
                        <img src={(user?.user_metadata as any)?.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-trace-dusk" />
                      )}
                    </div>
                    {displayName}
                  </Link>
                )}
                <button onClick={signOut} className="btn-ghost rounded-xl px-4 py-2">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost rounded-xl px-4 py-2">Sign in</Link>
                <Link to="/login" className="btn-primary rounded-xl px-4 py-2 text-xs">Get started</Link>
              </>
            )}
          </div>

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
                className="btn-primary rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                Browse homes
              </Link>
              {isAuthed && !isAdmin && (
                <Link
                  to="/account"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <User className="h-4 w-4 text-trace-cyan" />
                  Account
                </Link>
              )}
              {isAuthed && isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <User className="h-4 w-4 text-trace-cyan" />
                  Admin
                </Link>
              )}
              {!isAuthed && (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <User className="h-4 w-4 text-trace-cyan" />
                  Sign in
                </Link>
              )}
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
              {env.whatsappUrl && env.whatsappUrl !== '#' && (
                <a
                  href={env.whatsappUrl}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-trace-cyan hover:bg-white/[0.06] transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
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
                  <a href={`tel:${env.publicPhone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 hover:text-trace-cyan transition-colors">
                    <Phone className="h-4 w-4" />
                    {env.publicPhone}
                  </a>
                )}
                {env.whatsappUrl && env.whatsappUrl !== '#' && (
                  <a href={env.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-emerald-400 transition-colors">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
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
