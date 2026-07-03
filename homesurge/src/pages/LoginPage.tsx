import { FormEvent, useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PropertyShowcase } from '../components/PropertyShowcase'

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const query = new URLSearchParams(location.search)
  const adminMode = query.get('admin') === '1'
  const { signInEmail, loading, role, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && user && role) {
      if (adminMode && role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (adminMode) {
        navigate('/', { replace: true })
      } else if (role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/browse', { replace: true })
      }
    }
  }, [adminMode, loading, role, user, navigate])

  if (!loading && role === 'admin' && user && !adminMode) {
    return <Navigate to="/admin" replace />
  }

  if (!loading && user && !adminMode && role && role !== 'admin') {
    return <Navigate to="/browse" replace />
  }

  if (user && role === null && !loading) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-trace-dusk px-4 py-14">
        <div className="mx-auto w-full max-w-md">
          <div className="glass-card p-8 text-center">
            <p className="text-sm text-zinc-400">Finishing sign in...</p>
          </div>
        </div>
      </div>
    )
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setBusy(true)

    const { error: authError } = await signInEmail(email.trim(), password)
    setBusy(false)

    if (authError) {
      setError(authError.message)
      return
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-trace-dusk px-4 py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4">
          <PropertyShowcase />
        </div>
        <div className="glass-card p-8">
          <p className="font-display text-sm font-semibold text-trace-violet uppercase tracking-[0.2em] mb-2">homesurge</p>
          <h1 className="font-display text-2xl font-bold text-white mb-6">
            {adminMode ? 'Admin sign in' : 'Sign in to homesurge'}
          </h1>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-2.5 text-sm font-bold text-trace-dusk disabled:opacity-50"
            >
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="mt-6 text-xs text-zinc-600 leading-relaxed">
            {adminMode
              ? 'Use your admin account to manage listings, inquiries, and the operations map.'
              : 'Use your homesurge account to save favorites, compare listings, and access member tools.'}
          </p>
          <div className="mt-8 text-sm text-zinc-400 space-y-2">
            {!adminMode ? (
              <>
                <p>
                  Need admin access? <Link to="/admin/login" className="text-cyan-300 hover:underline">Admin sign in</Link>
                </p>
                <p>
                  New here? <Link to="/register" className="text-cyan-300 hover:underline">Create an account</Link>
                </p>
              </>
            ) : (
              <p>
                Back to <Link to="/" className="text-cyan-300 hover:underline">public site</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}