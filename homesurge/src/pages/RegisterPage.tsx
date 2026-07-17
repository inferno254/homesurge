import { FormEvent, useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PropertyShowcase } from '../components/PropertyShowcase'

export function RegisterPage() {
  const navigate = useNavigate()
  const { signUpEmail, loading, user, role } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const redirect = new URLSearchParams(useLocation().search).get('redirect')

  useEffect(() => {
    if (!loading && user) {
      const dest = redirect || (role === 'admin' || role === 'publisher' ? '/admin' : '/browse')
      navigate(dest, { replace: true })
    }
  }, [loading, role, user, navigate, redirect])

  if (!loading && user) {
    return <Navigate to={redirect || (role === 'admin' || role === 'publisher' ? '/admin' : '/browse')} replace />
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setBusy(true)

    const { error: authError } = await signUpEmail(email.trim(), password, `${firstName.trim()} ${lastName.trim()}`.trim())
    setBusy(false)

    if (authError) {
      setError(authError.message)
      return
    }

    setSuccess('Check your email to confirm your account before signing in.')
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-trace-dusk px-4 py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4">
          <PropertyShowcase />
        </div>
        <div className="glass-card p-8">
          <p className="font-display text-sm font-semibold text-trace-violet uppercase tracking-[0.2em] mb-2">homesurge</p>
          <h1 className="font-display text-2xl font-bold text-white mb-6">Create your account</h1>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">First name</label>
                <input
                  type="text"
                  autoComplete="given-name"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Last name</label>
                <input
                  type="text"
                  autoComplete="family-name"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </div>
            </div>
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
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            {success && <p className="text-xs text-green-400">{success}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-2.5 text-sm font-bold text-trace-dusk disabled:opacity-50"
            >
              {busy ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="mt-6 text-xs text-zinc-600 leading-relaxed">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-300 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}