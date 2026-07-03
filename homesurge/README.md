# Nairobi Homes Expert

Rongai-focused housing explorer: customers see **broad geography + pricing + visuals** while **pins, estates, addresses, and owner phones stay admin-side**. Operational staff manage the **truth map** privately via Supabase.

Detailed product spec lives in **`todo.md`**.

## Quick start

```bash
cd homesurge
copy .env.example .env          # PowerShell: Copy-Item .env.example .env
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY VITE_* keys (see Environment below)
npm install
npm run dev
```

## Environment

| Key | Purpose | Example |
|-----|---------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGci...` |
| `VITE_GEMINI_API_KEY` | Optional: AI listing blurbs | |
| `VITE_homesurge_PUBLIC_PHONE` | Customer-facing bureau line shown on listings | |
| `VITE_homesurge_WHATSAPP_URL` | Optional WhatsApp deeplink | |

> Do not commit real API keys to git.

## Supabase setup (required)

1. Create a free Supabase project at https://supabase.com.
2. In the Supabase SQL Editor, run the SQL in **`supabase/schema.sql`** to create tables, RPCs, triggers, and RLS policies.
3. Run **`supabase/seed-nairobi.sql`** to create the `nairobi_areas` reference table and seed sample listings.
4. (Optional) Create a storage bucket named `property-images` and enable public read; the admin form uses Supabase Storage for images.
5. Copy your project URL and anon key into `.env`.

## Deploy to Vercel

```bash
npm run build     # emits dist/
vercel --prod
```

In your Vercel project settings, add the same `VITE_*` environment variables.

## Routes

| Path | Audience |
|------|----------|
| `/`, `/browse`, `/listing/:id` | Public / customers |
| `/admin/login` | Operators |
| `/admin`, `/admin/map`, `/admin/new` | Admin console + map ingest |

## Licensing

Template code for homesurge MVP â€” adapt for your tenancy & compliance regime.

