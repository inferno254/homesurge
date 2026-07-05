# Homesurge Mobile App

A Flutter mobile application for Kenya housing discovery. The mobile app can be deployed as a web app or to mobile app stores.

## Deployment Options

### Option 1: Deploy to Vercel (Static Site)
Since Vercel CLI doesn't recognize Flutter, deploy the pre-built static files:

1. **Build the web version:**
   ```bash
   flutter build web --release
   ```

2. **Deploy via Vercel Dashboard:**
   - Go to https://vercel.com/dashboard
   - Create new project
   - Drag & drop the `build/web` folder
   - Or use GitHub: push to a separate repo and connect

3. **Or use Vercel CLI:**
   ```bash
   cd build/web
   vercel --prod
   ```

### Option 2: Deploy to Netlify
```bash
npm install -g netlify-cli
cd build/web
netlify deploy --prod
```

### Option 3: Deploy to GitHub Pages
```bash
# Install gh-pages
flutter pub add --dev gh_pages

# Deploy
flutter pub run gh_pages:publish
```

### Option 4: Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Option 5: Deploy to Your Own Server
- Upload `build/web` contents to any static web hosting (Apache, Nginx, etc.)
- Ensure server rewrites all routes to `index.html`

## Mobile App Stores

### Android (Google Play Store)
```bash
flutter build apk --release
# Or for app bundle:
flutter build appbundle --release
```

### iOS (Apple App Store)
```bash
flutter build ios --release
# Then use Xcode to upload
```

## Features

### Public Features
- Browse Listings - Filter by county, area, property type, price range
- Saved Properties - localStorage-backed favorites system
- Compare Listings - Compare up to 4 properties side-by-side
- Recently Viewed - Track last 10 viewed properties
- Property Details - Photo carousel, specs, amenities, area insights
- Budget Calculator - Calculate affordable rent based on income

### Admin Features
- Secure Authentication - Email/password login via Supabase
- Dashboard - Property management with quality score indicators
- Map View - Leaflet map with property markers
- Property CRUD - Add/edit/delete with image uploads
- Inquiry Management - Lead tracking and follow-up
- Activity Log - Audit trail of all property changes
- User Management - View and manage admin users

## Required Environment Variables

Create `.env` with:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_homesurge_PUBLIC_PHONE=+2547XXXXXXXX
VITE_homesurge_WHATSAPP_URL=https://wa.me/2547XXXXXXXX
```

## Supabase Setup

Run in Supabase SQL Editor:
1. `supabase/schema.sql` - Create tables, indexes, and triggers
2. `supabase/seed-nairobi.sql` - Seed Nairobi/Rongai area data
3. Create storage bucket `property-images` (public read, admin write)

## Troubleshooting

**Vercel deployment issues:**
- Use `vercel --prod` from `build/web` directory, not mobile root
- Or use drag & drop in Vercel dashboard

**Supabase connection error:**
- Verify `.env` has correct URL and anon key
- Check that the Supabase project is not paused

**"Call" button not working:**
- Set `VITE_homesurge_PUBLIC_PHONE` in `.env`