/*
Dev-only helper to:
- ensure a profile row exists for an auth user
- set that profile role to 'admin'
- reset the user's password

WARNING: requires Supabase service_role key (high privilege). Never commit to git.

Usage (example):
  1) create .env.local in scripts/ OR set env vars directly
  2) node -r ts-node/register scripts/set_admin_user_dev.ts

Env vars:
  SUPABASE_URL=...
  SUPABASE_SERVICE_ROLE_KEY=...  (service_role)
  TARGET_EMAIL=erickneko12@gmail.com
  TARGET_PASSWORD=inferno254
*/

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const TARGET_EMAIL = process.env.TARGET_EMAIL as string;
const TARGET_PASSWORD = process.env.TARGET_PASSWORD as string;


if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !TARGET_EMAIL || !TARGET_PASSWORD) {
  throw new Error(
    'Missing env vars. Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TARGET_EMAIL, TARGET_PASSWORD',
  );
}

async function main() {
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  console.log(`Finding auth user for email: ${TARGET_EMAIL}`);
  const { data: user, error: userErr } = await supabaseAdmin.auth.admin.getUserByEmail(
    TARGET_EMAIL,
  );
  if (userErr) throw userErr;
  if (!user?.user) throw new Error('User not found');

  const userId = user.user.id;
  console.log(`Auth user id: ${userId}`);

  console.log('Resetting password...');
  const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: TARGET_PASSWORD,
  });
  if (pwErr) throw pwErr;

  console.log('Ensuring profile row exists...');
  // Profile trigger should auto-create on new users, but if it didn’t, ensure it.
  const { error: upsertErr } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: userId, full_name: user.user.user_metadata?.full_name ?? '', role: 'admin' }, { onConflict: 'id' });
  if (upsertErr) throw upsertErr;

  console.log('Setting profile role=admin...');
  const { error: roleErr } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId);
  if (roleErr) throw roleErr;

  console.log('Done ✅');
}

main().catch((e) => {
  console.error('Failed:', e);
  process.exit(1);
});

