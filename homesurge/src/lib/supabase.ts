import { createClient } from '@supabase/supabase-js'
import { env, supabaseConfigured } from './env'

export const supabase = supabaseConfigured()
  ? createClient(env.supabaseUrl, env.supabaseAnonKey)
  : null
