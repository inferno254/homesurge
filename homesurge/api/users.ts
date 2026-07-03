import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL ?? 'https://vxhsftwixqepzxvctsvp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function json(res: VercelResponse, status: number, body: unknown) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v))
  return res.status(status).json(body)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v))
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  // Require admin authorization
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return json(res, 401, { error: 'Missing or invalid authorization header' })
  }

  const token = authHeader.slice(7)
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) {
    return json(res, 401, { error: 'Invalid token' })
  }

  // Check if user is admin
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return json(res, 403, { error: 'Admin access required' })
  }

  // Fetch all profiles with their auth emails
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, role, created_at, full_name')
    .order('created_at', { ascending: false })

  if (error) {
    return json(res, 500, { error: error.message })
  }

  const users = []
  for (const p of profiles ?? []) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(p.id as string)
    users.push({
      id: p.id,
      email: authUser?.user?.email ?? `user-${p.id.slice(0, 8)}@placeholder.com`,
      role: p.role ?? 'customer',
      created_at: p.created_at,
      full_name: p.full_name,
    })
  }

  return json(res, 200, { users })
}