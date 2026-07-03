import { FormEvent, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, ArrowLeft } from 'lucide-react'

export function CustomerLoginPage() {
  const { signInEmailCustomer, signUpEmail, loading, role } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  if (!loading && role === 'customer') {
    return <Navigate to="/account" replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      if (isLogin) {
        const { error } = await signInEmailCustomer(email.trim(), password)
        if (error) setErr(error.message)
      } else {
        const { error } = await signUpEmail(email.trim(), password, name.trim())
        if (error) setErr(error.message)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-trace-dusk px-4 py-14 relative overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-trace-cyan/10 via-trace-violet/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-trace-violet/8 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-md relative">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to site
        </Link>

        <div className="rounded-3xl border border-white/[0.08] bg-trace-card p-8 shadow-card">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-trace-cyan to-trace-violet">
              <User className="h-6 w-6 text-trace-dusk" />
            </div>
            <div>
              <p className="font-display text-xs font-semibold text-trace-violet uppercase tracking-[0.2em]">homesurge</p>
              <h1 className="font-display text-xl font-bold text-white">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h1>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Your name</label>
                <input
                  type="text"
                  autoComplete="name"
                  required
                  className="glass-input w-full px-4 py-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Erick Mwangi"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Email</label>
              <input
                type="email"
                autoComplete="email"
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
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                minLength={6}
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
              {busy ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <button
              onClick={() => { setIsLogin(!isLogin); setErr(null) }}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}