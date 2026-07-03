# Homesurge

React + TypeScript real estate platform for Nairobi/Rongai property listings, deployed on Vercel.

## Structure

- `homesurge/` — Vite + React frontend with Supabase backend
- `supabase/` — Database migrations and seed data
- `.vercel/` — Vercel deployment configuration

## Local Development

```bash
cd homesurge
npm install
npm run dev
```

## Deployment

Deployed to Vercel. Environment variables configured via Vercel dashboard:

- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (client-side)
- `GROQ_API_KEY`, `GEMINI_API_KEY`, etc. (server-side API routes)

## Contact

- WhatsApp helpline: [0115061381](https://wa.me/254115061381)
- Email: erickneko12@gmail.com

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Supabase (database + auth)
- Leaflet maps
- TanStack Query
- Vercel serverless functions (`api/`)
