import { FormEvent, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Shield, ArrowLeft } from 'lucide-react'

function FloatingHouses() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute opacity-[0.04]"
          style={{
            left: `${10 + i * 16}%`,
            top: `${15 + (i % 3) * 25}%`,
            animation: `floatHouse ${8 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.7}s`,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-white">
            <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z" />
          </svg>
        </div>
      ))}
    </div>
  )
}

export function AdminLoginPage() {
  const { signInEmail, loading, role, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  console.log('[AdminLoginPage] render', { loading, role, user: user ? 'set' : 'null' })

  if (!loading && role === 'admin' && user) {
    return <Navigate to="/admin" replace />
  }

  if (user && role === null && !loading) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-trace-dusk px-4 py-14 relative overflow-hidden">
        <FloatingHouses />
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-trace-cyan/10 via-trace-violet/5 to-transparent blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-trace-violet/8 via-transparent to-transparent blur-3xl" />
        </div>
        <div className="mx-auto w-full max-w-md relative">
          <div className="rounded-3xl border border-white/[0.08] bg-trace-card p-8 shadow-card text-center">
            <p className="text-sm text-zinc-400">Finishing sign in...</p>
          </div>
        </div>
      </div>
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      const { error } = await signInEmail(email.trim(), password)
      setBusy(false)
      if (error) {
        setErr(error.message)
        return
      }
    } catch (e) {
      console.error('[AdminLoginPage] submit threw', e)
      setBusy(false)
      setErr(e instanceof Error ? e.message : 'Sign in failed')
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-trace-dusk px-4 py-14 relative overflow-hidden">
      <FloatingHouses />
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-trace-cyan/10 via-trace-violet/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-trace-violet/8 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-md relative">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to site
        </Link>

        {/* Login card */}
        <div className="rounded-3xl border border-white/[0.08] bg-trace-card p-8 shadow-card">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-trace-cyan to-trace-violet">
              <Shield className="h-6 w-6 text-trace-dusk" />
            </div>
            <div>
              <p className="font-display text-xs font-semibold text-trace-violet uppercase tracking-[0.2em]">Homesurge</p>
              <h1 className="font-display text-xl font-bold text-white">Admin access</h1>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Username or email</label>
              <input
                type="text"
                autoComplete="username"
                required
                className="glass-input w-full px-4 py-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                className="glass-input w-full px-4 py-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {err && (
              <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full rounded-2xl py-3.5 text-sm"
            >
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <p className="text-xs text-zinc-600 leading-relaxed">
              Sign in with your Supabase admin account. To create or promote a user, open the Supabase Dashboard and set their profile role to <code className="text-zinc-400 bg-white/[0.04] px-1.5 py-0.5 rounded">admin</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
