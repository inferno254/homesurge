import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'

type Props = {
  title?: string
  subtitle?: string
  redirectTo?: string
}

export function SignInGate({
  title = 'Sign in to continue',
  subtitle = 'Sign in or create a free account to access your saved homes and comparisons.',
  redirectTo = '/saved',
}: Props) {
  const loginTo = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="glass-card rounded-3xl p-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] mx-auto mb-5">
          <Lock className="h-7 w-7 text-zinc-600" />
        </div>
        <p className="text-zinc-300 mb-2 text-lg font-medium">{title}</p>
        <p className="text-sm text-zinc-600 mb-8 max-w-sm mx-auto">{subtitle}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={loginTo}
            className="btn-primary rounded-2xl px-6 py-3 text-sm inline-flex w-full sm:w-auto justify-center"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="btn-ghost rounded-2xl px-6 py-3 text-sm inline-flex w-full sm:w-auto justify-center"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
