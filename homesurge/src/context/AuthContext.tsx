import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type Role = 'customer' | 'admin' | 'updater' | null

type AuthState = {
  session: Session | null
  user: User | null
  role: Role
  fullName: string | null
  loading: boolean
  signOut: () => Promise<void>
  refreshRole: () => Promise<void>
  signInEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpEmail: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>
  signInEmailCustomer: (email: string, password: string) => Promise<{ error: Error | null }>
}

const AuthCtx = createContext<AuthState | null>(null)


export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [fullName, setFullName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshRole = useCallback(async () => {
    if (!supabase || !session?.user?.id) {
      setRole(null)
      setFullName(null)
      return
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .maybeSingle()

      const r = data?.role === 'admin' ? 'admin' : data?.role === 'updater' ? 'updater' : data?.role === 'customer' ? 'customer' : null
      setRole(r)
      setFullName(data?.full_name ?? null)
    } catch (e) {
      console.error('[AuthContext] refreshRole failed', e)
      setRole(null)
      setFullName(null)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      if (!mounted) return
      setSession(null)
      setUser(null)
      setRole(null)
      setFullName(null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'SIGNED_OUT' || event === ('USER_DELETED' as any)) {
        setSession(null)
        setUser(null)
        setRole(null)
        setFullName(null)
      } else if (next) {
        setSession(next)
        setUser(next.user ?? null)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    void refreshRole()
  }, [refreshRole])

  const signOut = useCallback(async () => {
    if (!supabase) {
      setSession(null)
      setUser(null)
      setRole(null)
      setFullName(null)
      return
    }
    await supabase.auth.signOut()
    setRole(null)
    setFullName(null)
    setSession(null)
    setUser(null)
  }, [])

  // Auto sign-out after 2 hours of inactivity (only when tab is visible)
  useEffect(() => {
    const IDLE_MS = 2 * 60 * 60 * 1000

    let lastActive = Date.now()
    let timer: number | undefined

    const markActive = () => {
      if (document.visibilityState === 'visible') {
        lastActive = Date.now()
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        lastActive = Date.now()
      }
    }

    window.addEventListener('mousemove', markActive, { passive: true })
    window.addEventListener('keydown', markActive, { passive: true })
    window.addEventListener('scroll', markActive, { passive: true })
    window.addEventListener('click', markActive, { passive: true })
    window.addEventListener('touchstart', markActive, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (role && session && Date.now() - lastActive >= IDLE_MS) {
        void signOut()
      }
    }, 30_000)

    return () => {
      window.removeEventListener('mousemove', markActive as any)
      window.removeEventListener('keydown', markActive as any)
      window.removeEventListener('scroll', markActive as any)
      window.removeEventListener('click', markActive as any)
      window.removeEventListener('touchstart', markActive as any)
      document.removeEventListener('visibilitychange', onVisibility)
      if (timer) window.clearInterval(timer)
    }
  }, [role, session, signOut])

  


  const signInEmail = useCallback(async (email: string, password: string) => {
    try {
      if (typeof window === 'undefined') {
        return { error: new Error('Local login is only available in browser') }
      }

// 1. Try real Supabase auth first (for admin + updaters with real accounts)
      if (!supabase) {
        return { error: new Error('Supabase not configured') }
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        return { error: new Error(error.message) }
      }
      // Real auth succeeded — role will be loaded from profiles table by refreshRole
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Sign in failed') }
    }
  }, [])

  const signUpEmail = useCallback(async (email: string, password: string, fullName?: string) => {
    // Customer signup via Supabase
    if (!supabase) {
      return { error: new Error('Supabase not configured') }
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          }
        }
      })
      if (error) return { error }
      if (data.user) {
        // Profile is auto-created by handle_new_user() trigger
        // Update full_name if provided
        if (fullName && data.user.id) {
          await supabase.from('profiles').update({ full_name: fullName }).eq('id', data.user.id)
        }
      }
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Sign up failed') }
    }
  }, [])

  const signInEmailCustomer = useCallback(async (email: string, password: string) => {
    // Customer sign-in via Supabase
    if (!supabase) {
      return { error: new Error('Supabase not configured') }
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) return { error }
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Sign in failed') }
    }
  }, [])


  const value = useMemo(
    () => ({
      session,
      user,
      role,
      fullName,
      loading,
      signOut,
      refreshRole,
      signInEmail,
      signUpEmail,
      signInEmailCustomer,
    }),
    [session, user, role, fullName, loading, signOut, refreshRole, signInEmail, signUpEmail, signInEmailCustomer],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
