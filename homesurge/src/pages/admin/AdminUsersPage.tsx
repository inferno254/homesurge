import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/Toast'
import { Shield, UserCheck, UserX } from 'lucide-react'

type ProfileUser = {
  id: string
  email: string
  role: string
  created_at: string
  full_name?: string
}

async function fetchUsers(): Promise<ProfileUser[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) throw new Error('Not authenticated')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    throw new Error('Admin access required')
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, role, created_at, full_name')
    .order('created_at', { ascending: false })

  if (error) throw error

  const out: ProfileUser[] = []
  for (const p of (profiles ?? [])) {
    let email = `user-${(p.id as string).slice(0, 8)}@no-email.com`
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(p.id as string)
      if (authUser?.user?.email) email = authUser.user.email
    } catch {
      // service role may not be available in all contexts
    }
    out.push({
      id: p.id as string,
      email,
      role: p.role ?? 'customer',
      created_at: p.created_at as string,
      full_name: p.full_name ?? undefined,
    })
  }
  return out
}

export function AdminUsersPage() {
  const q = useQuery({ queryKey: ['admin-users'], queryFn: fetchUsers })
  const { toast } = useToast()

  const updateRole = async (userId: string, newRole: string) => {
    if (!supabase) return
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) {
      toast(error.message, 'error')
    } else {
      toast(`Role updated to ${newRole}`, 'success')
      q.refetch()
    }
  }

  if (q.isLoading) return <p className="text-zinc-500">Loading users...</p>
  if (q.error) return <p className="text-red-400">{(q.error as Error).message}</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Users & roles</h1>
        <p className="text-sm text-zinc-500 mt-2">
          Manage who can access the admin panel. Updaters can edit listings, admins have full access.
        </p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-left">
              <tr className="text-xs uppercase tracking-wider text-zinc-500">
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {q.data?.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.015] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-trace-cyan to-trace-violet text-xs font-bold text-trace-dusk">
                        {u.email[0].toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{u.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold ${
                      u.role === 'admin' ? 'bg-violet-400/10 text-violet-300 border border-violet-400/20' :
                      u.role === 'updater' ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/20' :
                      'bg-white/5 text-zinc-400 border border-white/10'
                    }`}>
                      {u.role === 'admin' && <Shield className="h-3 w-3" />}
                      {u.role === 'updater' && <UserCheck className="h-3 w-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-zinc-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        className="rounded-lg border border-white/[0.1] bg-black/30 px-3 py-1.5 text-xs text-white"
                      >
                        <option value="customer">Customer</option>
                        <option value="updater">Updater</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {q.data?.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    No users yet. Sign up via the public site.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-trace-card p-6 space-y-4">
        <h3 className="font-display text-sm font-semibold text-white">Role guide</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-semibold text-violet-300">Admin</span>
            </div>
            <p className="text-[11px] text-zinc-500">Full access. Can manage users, publish listings, delete, and access all admin pages.</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300">Updater</span>
            </div>
            <p className="text-[11px] text-zinc-500">Can add and edit listings on the admin map and dashboard. Cannot manage users or delete.</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-300">Customer</span>
            </div>
            <p className="text-[11px] text-zinc-500">Public access only. Can browse, save, compare, and send inquiries. No admin panel.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
