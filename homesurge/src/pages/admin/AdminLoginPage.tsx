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
  const { signInEmail, signInWithGoogle, resetPassword, loading, role, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
        const msg = error.message || ''
        if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('wrong password')) {
          setErr('Invalid email or password. Please check your credentials and try again.')
        } else if (msg.toLowerCase().includes('email not confirmed')) {
          setErr('Please confirm your email before signing in. Check your inbox for the confirmation link.')
        } else if (msg.toLowerCase().includes('too many requests')) {
          setErr('Too many sign-in attempts. Please wait a moment and try again.')
        } else if (msg) {
          setErr(msg)
        } else {
          setErr('Invalid email or password')
        }
        return
      }
    } catch (e) {
      console.error('[AdminLoginPage] submit threw', e)
      setBusy(false)
      setErr(e instanceof Error ? e.message : 'Sign in failed')
    }
  }

  const onForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErr('Please enter your email address first')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      await resetPassword(email.trim())
      setErr('Password reset link sent to your email')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to send reset link')
    } finally {
      setBusy(false)
    }
  }

  const onGoogleSignIn = async () => {
    setBusy(true)
    setErr(null)
    try {
      await signInWithGoogle()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Google sign in failed')
      setBusy(false)
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
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onForgotPassword}
                disabled={busy}
                className="text-xs text-cyan-300 hover:text-cyan-200 disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full rounded-2xl py-3.5 text-sm"
            >
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4">
            <button
              onClick={onGoogleSignIn}
              disabled={busy}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
            >
              Continue with Google
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <p className="text-xs text-zinc-600 leading-relaxed">
              Restricted access. Only authorized administrators may sign in.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
