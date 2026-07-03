# Nairobi Homes Expert â€” Master build prompt & living specification

> **Product name:** Nairobi Homes Expert (NHE)  
> **Primary goal:** A Rongaiâ€‘focused housing discovery platform where **customers see enough to shortlist**, but **precise placements and direct owner contact stay behind your operations**.  
> **Repository root (this machine):** `Downloads/Telegram Desktop/homesurge` (To be migrated to a PHP-friendly folder)
> **Audience for this doc:** Humans + AI coding agents continuing the build. Update this file when scope changes.

---

## 1. Vision (Rongai Focus)

### 1.1 Oneâ€‘sentence pitch
Nairobi Homes Expert helps renters and buyers **browse real homes in Rongai** (Town, Kware, Maasai Lodge, Tuala, Rimpa) with **transparent price signals**, while **protecting exact addresses and map pins from the public web**.

### 1.2 Business rules derived from stakeholder input

| Actor | Allowed to see | Not allowed to see (public UX) |
|-------|-----------------|--------------------------------|
| **Customer / anonymous visitor** | Availability, headline, curated photos, specs (bed/bath/type), amenity tags, price + cadence (`/mo`, `/sale`), **broad geography** (`county`, `town`, optional fuzzy `area_label` like "Northern Kiambu" **without street/estate/pin**), furnished status, size (mÂ²), area price insights | Exact `latitude/longitude`, `estate`, `address`, landlord/agent **phone**, internal notes, draft listings |
| **Admin (authenticated, role=admin)** | Full property row, coordinates, map markers, contact phone(s), internal fields, upload paths, AI drafts, inquiry/lead submissions | N/A (subject to future superâ€‘admin splits) |

**Contact model (default):** Public detail pages show a **"Call homesurge"** callâ€‘toâ€‘action with your **business number** and/or **WhatsApp business link** (configured in app env), not the owner's private line. Admin records `owner_phone` for internal followâ€‘up.

### 1.3 "Realistic map" interpretation
- **Customer experience:** No streetâ€‘level pin map for individual listings. Optional future: **choropleth / region cards** only.  
- **Admin experience:** **Leaflet + OSM** (or similar) with **true coordinates**, satellite toggle later, marker clustering at scale.

---

## 2. Tech stack decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Web SPA | **React 18 + TypeScript + Vite** | Faster dev loop than CRA; aligns with modern deploy targets |
| Styling | **Tailwind CSS** | Rapid iteration; easy theming for "cool" marketing surfaces |
| Data | **Custom PHP / MySQL API** | Openâ€‘minded architecture; full control over data & auth |
| Serverless AI | **Gemini** via `fetch` (optional) | Listing copy assist; never blocks core CRUD |
| Client data | **TanStack Query + Axios** | Cache + optimistic patterns for admin |
| Routing | **React Router v6** | Split `/` public vs `/admin/*` |
| Maps | **reactâ€‘leaflet + leaflet** | Admin map; keep dynamic import if SSR ever added |
| State | **localStorage** (favorites, compare) | No auth required for save/compare features |

**Explicit nonâ€‘goals for v1:** Flutter app (spec preserved below as Phase 2), native push, payments, KYC, automated voice IVR.

---

## 3. Data model (Supabase / Postgres)

### 3.1 Extensions
- `postgis` optional for radius queries later; v1 can use `numeric` lat/lng.

### 3.2 Tables

**`profiles`** (1:1 with `auth.users`)
- `id uuid PK references auth.users`
- `full_name text`
- `role text check in ('customer','admin') default 'customer'`
- `created_at timestamptz default now()`
- *Bootstrap first admin via SQL or Supabase dashboard insert after first signup.*

**`properties`**
- `id uuid PK default gen_random_uuid()`
- `title text not null`
- `slug text unique` (optional, for pretty URLs)
- `description text`
- `ai_generated_description text`
- `price numeric not null`
- `price_type text default 'monthly'` â€” enumâ€‘like: `monthly | sale | negotiable`
- `bedrooms int`, `bathrooms int`
- `property_type text` â€” `apartment | bedsitter | bungalow | maisonette | studio | townhouse | land | commercial`
- `furnished boolean default false`
- `size_sqm numeric`
- **Public geography (broad):** `county text`, `town text`, `area_label text` *(marketing zone, still not street level)*
- **Hidden from public:** `estate text`, `address text`, `latitude numeric`, `longitude numeric`
- **Contacts:** `owner_phone text` *(admin only)*, `listing_reference text` *(public ref code like HTâ€‘2026â€‘00017)*
- `is_available boolean default true`
- `is_published boolean default false` *(admin marks ready for public)*
- `cover_image_url text` *(denormalized cache optional)*
- `created_at`, `updated_at`

**`property_images`**
- `id`, `property_id FK`, `image_url`, `is_cover`, `sort_order int default 0`, `created_at`

**`amenities`**
- `id`, `property_id FK`, `name text`

**`property_inquiries`**
- `id uuid PK default gen_random_uuid()`
- `property_id uuid FK references properties (id) on delete cascade`
- `name text not null`
- `phone text not null`
- `message text`
- `created_at timestamptz not null default now()`

### 3.3 Storage bucket
- `property-images` â€” **public read** OK (images are marketing); **write** restricted to admin policies.

### 3.4 API Auth Strategy
- All admin endpoints require a **Bearer Token** (JWT).
- **`properties`**
  - `GET /api/properties`: returns only safe columns for published/available rows.
  - `POST/PUT/DELETE /api/admin/properties`: requires Admin role.
- **`property_images` / `amenities`**: public `SELECT` only for images tied to published properties; writes admin only.
- **`profiles`**: users manage own row; `role` changes only by service role / SQL.
- **`property_inquiries`**: admin only (insert via `submit_inquiry()` RPC from public).

**Public function `fetch_public_properties` columns:**  
`id, title, description, ai_generated_description, price, price_type, bedrooms, bathrooms, property_type, county, town, area_label, listing_reference, cover_image_url, image_urls, amenity_names, furnished, size_sqm, created_at`  
*No lat/lng/estate/address/owner_phone.*

Admin app uses direct table for full CRUD.

### 3.5 Indexes
- `(is_published, is_available, county, town)`
- `listing_reference` unique

---

## 4. Application routes & UX

### 4.1 Public site (`/`)
- **Landing:** bold hero, value props ("See what's available â€” we'll place you"), quick links to Saved/Compare/Budget, featured listings with area insights.
- **Browse:** responsive card grid, **advanced filters** (price range, furnished, county, type, keyword search), **sort** (price low/high, newest/oldest), pagination, **area insights panel**. Save â™¡ and compare âœ“ buttons on every card.
- **Saved (`/saved`):** localStorage-backed favorites list with empty state and clear all.
- **Compare (`/compare`):** side-by-side comparison table (2-4 listings). Sticky bottom bar on browse page to manage compare selection.
- **Listing detail:** photo carousel, specs, amenities, furnished/size indicators, **broad location line only**, **no map embed**. Save, Share (WhatsApp + link copy), Budget Calculator, **Inquiry form** (name + phone â†’ `property_inquiries` table), Area insights sidebar.
- **Budget Calculator:** modal based on income â†’ safe rent (30% rule), max rent (50% rule), deposit estimate, monthly total.

### 4.2 Admin (`/admin/*`)
- **Login** (Supabase email + password).
- **Dashboard:** stats cards (total pipeline, live blurbs, map pins, avg listing quality %, inquiry count), searchable table with **inline publish/draft toggle**, **listing quality bar** (completeness %), edit/delete actions.
- **Map:** Leaflet full screen split with list; markers from `properties` where coords present.
- **Add / Edit property:** form with furnished checkbox, size (mÂ²) field, geocode helper, image multiâ€‘upload to storage, amenity chips, AI description button (Gemini), publish/available toggles.

### 4.3 Design direction ("cool & openâ€‘minded")
- **Aesthetic:** dark graphite base (`#0B0D10`), **trace line** accent gradient (`#22D3EE â†’ #A78BFA`), glassy cards, generous radius `rounded-2xl`, microâ€‘border `white/10`.
- **Typography:** `Outfit` (headings) + `DM Sans` (body) via Google Fonts.
- **Motion:** subtle Framerâ€‘less CSS transitions (150â€“250ms) on hover.
- **Brand motif:** faint map grid background on hero; "signal" pulse on primary CTA.

---

## 5. AI (Gemini) guardrails

- Prompt includes **no PII** beyond highâ€‘level location names present in public fields.
- If API key missing, UI hides AI button and uses template fallback.
- Rateâ€‘limit client calls; ideally move to Edge Function with server key later.

---

## 6. Environment variables (`.env`)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=            # optional
VITE_homesurge_PUBLIC_PHONE=    # e.g. +2547xxxxxxxx
VITE_homesurge_WHATSAPP_URL=    # optional wa.me link
```

---

## 7. Security checklist

- [x] No service role key in frontend.
- [x] Admin routes gated by auth + `role === 'admin'` (client) **and** enforced by RLS (server).
- [x] Storage policies: only admin can upload.
- [x] Validate image MIME types & size limits clientâ€‘side; add server policy when possible.
- [ ] SQL migrations reviewed before prod.

---

## 8. Delivery phases (execution order)

### Phase A â€” Foundation
- [x] Scaffold Vite app + Tailwind + router + query client
- [x] Supabase schema + RLS + public functions + RPCs
- [x] Public pages: Home, Browse, Detail with save/compare/share/inquiry
- [x] Admin: login, dashboard (stats + quality + quick toggle + search), map, CRUD form (with furnished/size)
- [x] Favorites (localStorage) + Saved page
- [x] Compare (localStorage, 2-4 listings) + Compare page + sticky bar
- [x] Budget calculator (modal)
- [x] Area insights (county/town price stats)
- [x] Share via WhatsApp + copy link
- [x] Inquiry form â†’ `property_inquiries` table
- [x] Advanced filtering (price range, furnished, sort, county, type, keyword)
- [x] Loading skeletons, toast notifications, fade-in animations, mobile nav
- [x] Nairobi-specific seed data (30+ estates with coordinates, security ratings, transport, nearby amenities)
- [x] Fixed SQL column-order bug in `fetch_public_properties()` function
- [x] Admin inquiries page with lead management, call action, expand/collapse

### Phase B â€” Hardening
- [x] SEO meta + OG images (dynamic per-page via `usePageMeta` hook)
- [x] Area insights with real Nairobi context (security, transport, schools, hospitals, shopping from `nairobi_areas` seed data)
- [x] Admin inquiry/lead management dashboard (`/admin/inquiries`)
- [x] Admin dashboard now shows inquiry count + link
- [x] Admin property form uses county/town dropdowns with full Kenya coverage
- [ ] Edge Function for AI + rate limits
- [ ] Customer auth + saved favourites (server-side)
- [ ] Analytics (Plausible/PostHog)

### SPRINT 2 - MAP POLISH:
- [ ] Marker clustering (react-leaflet-cluster)
- [ ] Basemap toggle + localStorage persistence
- [ ] PropertyListSidebar + hover sync
- [ ] MapControls toolbar
- [ ] Right-click context menu

### Phase C â€” Mobile
- [ ] Flutter client (reuse schema) OR Capacitor wrapper

### Phase D â€” Deploy
- [ ] Vercel/Netlify static build
- [ ] Supabase prod project + migration apply
- [ ] Custom domain + TLS

---

## 9. Open questions (ask when unblocking)

1. **Business phone + WhatsApp** you want printed on every listing?
2. **Photos:** any listings that must be **private** until call? (would change `is_published` workflow)
3. **Exact definition of `area_label`:** marketing copy only vs tied to ward?
4. **Multiâ€‘agency:** will multiple admins need separate orgs? (impacts schema tenancy)

---

## 10. Agent instructions (for future sessions)

1. Read `README.md` and `supabase/schema.sql` before editing.  
2. Never expose `latitude`, `longitude`, `estate`, `address`, or `owner_phone` in public components or the `properties_public` view.  
3. Prefer small PRâ€‘sized commits with clear messages.  
4. When changing RLS, include **policy tests** (SQL) in comments.  
5. After structural edits, update this `todo.md` Â§8 checkboxes.

---

## 11. Original roadmap appendix (from source prompt â€” reference only)

The source document included CRA setup, raw SQL, MapView sample, Gemini sample, AddProperty sample, Flutter map sample, and Vercel deploy. This repository **intentionally modernizes** the web stack to Vite+TS and **narrows v1 scope** to the privacy model in Â§1.2. Flutter remains Phase C.

---
## 12. Interactive Admin Map Feature (Phase A-Extended)

### 12.1 Overview

Transform the current basic AdminMap into a fully interactive, realtime-enabled property visualization platform. This section details every component, hook, SQL function, UI element, and edge case needed to ship a production-grade admin map experience.

CURRENT STATE: AdminMap.tsx renders a static Leaflet map with plain markers. AdminMapPage.tsx fetches all properties via supabase.from(properties).select(*). No realtime, no clustering, no filters, no inline editing.

TARGET STATE: Admin map with realtime Supabase subscriptions, marker clustering, multi-filter panel, click-to-edit property drawer, add new at location via right-click, satellite/terrain basemap toggle, and a sidebar list synced with map state.

---

### 12.2 Feature Breakdown

#### 12.2.1 Realtime Supabase Subscriptions

WHAT: Subscribe to properties table changes via Supabase Realtime so the map updates instantly when another admin adds/edits/deletes a property.

IMPLEMENTATION:
- Create a custom hook useRealtimeProperties() in src/hooks/useRealtimeProperties.ts
- Uses supabase.channel(admin-properties) -> .on(postgres_changes, { event: *, schema: public, table: properties }, callback) pattern
- Merges insert/update/delete events into the TanStack Query cache via queryClient.setQueryData
- Returns { properties, isLive, connectionStatus }
- isLive = true when channel is subscribed; connectionStatus = connected | connecting | disconnected | error
- Cleanup subscription on unmount

EDGE CASES:
- If Supabase URL/key missing: skip subscription, show Realtime unavailable badge, fall back to polling every 30s
- If user loses connection: show orange Reconnecting indicator in map header
- On reconnect: full refetch() to reconcile any missed events

#### 12.2.2 Marker Clustering with react-leaflet-cluster

WHAT: When zoomed out (zoom < 13), group nearby markers into clusters. When zoomed in, expand clusters to individual markers.

PACKAGE: npm install react-leaflet-cluster

IMPLEMENTATION:
- Replace individual Marker renders with MarkerClusterGroup wrapper
- Configure: chunkedLoading, maxClusterRadius: 80, showCoverageOnHover: false, spiderfyOnMaxZoom, disableClusteringAtZoom: 15
- Style cluster markers with custom icon: gradient fill cyan->violet, count label centered
- Custom iconCreateFunction for clusters that reflects property type color coding
- Cluster click -> map flies to cluster bounds + zoom in one level
- Individual marker click -> open enhanced Popup with full property details

CLUSTER ICON CSS:
.cluster-marker {
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #22d3ee, #a78bfa);
  border: 2px solid rgba(255,255,255,0.3);
  color: #0b0d10; font-weight: 700; font-size: 12px;
  cursor: pointer; box-shadow: 0 0 16px rgba(34, 211, 238, 0.4);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.cluster-marker:hover {
  transform: scale(1.15);
  box-shadow: 0 0 24px rgba(167, 139, 250, 0.6);
}

#### 12.2.3 Multi-Filter Panel

WHAT: A collapsible filter bar above the map to narrow down visible markers by: status (published/draft), availability, property type, price range slider, bedrooms, furnished, and search text.

UI LAYOUT:
- Horizontal filter bar below the page header (collapsible with chevron toggle)
- Chips/dropdowns + text search input + price range slider
- Active filter count badge on the Filters label
- Clear all button when any filter is active
- Map markers update in real time as filters change (no submit button needed)
- Sidebar list on the right also filters to match (synced state)
- Filter state stored in URL query params so the map view is bookmarkable/shareable among admins

FILTER STATE SHAPE:
type MapFilters = {
  q: string,  // text search
  status: all | published | draft,
  availability: all | available | unavailable,
  property_type: string | all,
  minPrice: number | null,
  maxPrice: number | null,
  bedrooms: number | null,
  furnished: boolean | null,
  hasCoordinates: boolean
}

#### 12.2.4 Enhanced Property Marker Popup

WHAT: When an admin clicks a marker, show a rich popup with property title + reference, price + type, location (estate town county), photo thumbnail, status badges, bedroom bathroom size row, and action buttons (Edit property + Call owner).

IMPLEMENTATION:
- Extend Popup content with styled mini-card matching glass-card aesthetic
- Use maxWidth: 280px
- On popup open, show latest data
- If property deleted while popup open: auto-close with toast

#### 12.2.5 Right-Click to Add Property at Location

WHAT: Right-click (context menu) on the map shows Add new listing here option. Clicking it pre-fills lat/lng in the property form and navigates to /admin/new?lat=X&lng=Y.

IMPLEMENTATION:
- Add contextmenu event handler to MapContainer
- Prevent default browser context menu
- Show a custom styled context menu div positioned at click point
- Menu options: Add new listing here, Copy coordinates, Center map here
- Close menu on click outside or Escape key
- AdminPropertyFormPage reads lat/lng from URL query params and pre-fills those fields

#### 12.2.6 Basemap Toggle (Satellite/Terrain)

WHAT: Switch between CARTO Voyager (default, clean), satellite imagery, and OpenStreetMap tiles.

IMPLEMENTATION:
- useState for active layer index (0=Voyager, 1=ESRI satellite, 2=OSM standard)
- Define tile layers array with URLs and attributions
- Layer switcher: pill-button group in top-right of map container
- Persist chosen layer in localStorage key homesurge_map_layer
- Also persist zoom/center: homesurge_map_center, homesurge_map_zoom

TILE LAYERS:
const TILE_LAYERS = [
  { label: Voyager, url: https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png, attribution: CARTO },
  { label: Satellite, url: https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}, attribution: Esri },
  { label: Streets, url: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png, attribution: OpenStreetMap },
]

#### 12.2.7 Sidebar List Synced with Map

WHAT: A resizable sidebar (right side, 320px default) showing the filtered property list. Hovering a list item highlights the corresponding marker on the map (and vice versa).

IMPLEMENTATION:
- Create PropertyListSidebar.tsx in src/components/admin/
- Receives properties, filters, hoveredId, onHover, onSelect
- Renders scrollable list of mini cards (title, ref, price, location, status badge)
- Marker hover -> list item scrolls into view + highlighted background
- List item click -> map flies to marker + opens popup
- Sidebar toggle button in map header to collapse/expand
- On mobile: sidebar becomes a bottom sheet (slides up, draggable)

#### 12.2.8 Inline Status Toggles from Map

WHAT: From the sidebar list or popup, admin can toggle is_published and is_available without leaving the map.

IMPLEMENTATION:
- Optimistic update: immediately update TanStack Query cache
- Supabase update() call in background
- On failure: revert cache + show error toast
- Success: show green toast
- Marker icon color changes based on status:
  - Published + available: cyan
  - Published + unavailable: grey
  - Draft + available: amber
  - Draft + unavailable: red

#### 12.2.9 Map Controls Custom Toolbar

WHAT: Replace default Leaflet zoom controls with a custom styled toolbar matching homesurge design language.


IMPLEMENTATION:
- Hide default zoomControl={false} from MapContainer
- Create MapControls.tsx with:
  - Zoom in / Zoom out buttons (styled glass buttons)
  - Locate me button (navigator.geolocation)
  - Fullscreen toggle
  - Layer switcher pills
  - Realtime status indicator dot (green/amber/red)
- Position: top-right corner, glass-card style

#### 12.2.10 Bulk Geocode Helper for Unlocated Properties

WHAT: Show Unlocated listings (properties with null lat/lng) and a Geocode from estate button that uses Nominatim (OpenStreetMap).

IMPLEMENTATION:
- Fetch properties where latitude IS NULL OR longitude IS NULL
- Group by estate name to batch geocode requests
- Use Nominatim (free, 1 req/sec, no API key needed)
- For each unlocated property with estate field: query Nominatim with estate, town, county, Kenya
- Extract lat/lon from first result, update property row via Supabase
- UI: progress bar, count of geocoded / failed / skipped
- Geocode all unlocated button in map header (admin-only, confirmation dialog)

#### 12.2.11 Stats Bar Above the Map

WHAT: A compact stats strip above the map showing: total properties with pins vs total without, published count, draft count, average listing quality %, unlocated count (clickable to filter to unlocated only).

IMPLEMENTATION:
- Computed via useMemo from filtered properties array
- Clicking Unlocated sets hasCoordinates: false filter
- Updates reactively when filter changes

---


### 12.3 New and Modified Files

| File | Action | Description |
|------|--------|-------------|
| src/hooks/useRealtimeProperties.ts | CREATE | Custom hook with Supabase realtime channel + TanStack Query integration |
| src/components/admin/PropertyListSidebar.tsx | CREATE | Synced sidebar list with hover highlighting |
| src/components/admin/MapControls.tsx | CREATE | Custom zoom/layer/realtime toolbar |
| src/components/admin/MapFilters.tsx | CREATE | Collapsible multi-filter panel |
| src/components/admin/AdminMap.tsx | MODIFY | Add clustering, custom icons, right-click context, marker color coding, hover callbacks |
| src/pages/admin/AdminMapPage.tsx | MODIFY | Replace basic query with useRealtimeProperties, add filter state, sidebar toggle, stats bar |
| src/pages/admin/AdminPropertyFormPage.tsx | MODIFY | Read lat/lng from URL query params for right-click pre-fill |
| src/index.css | MODIFY | Add .cluster-marker, .property-popup, .map-context-menu, .map-toolbar-btn styles |
| supabase/schema.sql | MODIFY | Add geocode_property RPC function (optional) |
| src/types/property.ts | MODIFY | Add MapFilters type export |

---

### 12.4 SQL Changes

```sql
-- Geocoding helper RPC
create or replace function public.geocode_property(
  p_id uuid, p_lat numeric, p_lng numeric
)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.properties
  set latitude = p_lat, longitude = p_lng, updated_at = now()
  where id = p_id and public.is_admin();
end; $$;

create policy geocode_admin on public.properties
  for update using (public.is_admin());

grant execute on function public.geocode_property(uuid, numeric, numeric) to authenticated;
```

---

### 12.5 Environment Variables

VITE_GEOCODE_API_KEY=        # Optional: Positionstack or similar

---

### 12.6 Testing Checklist

- [ ] Map loads with correct center (first property with coords or Nairobi default)
- [ ] All existing markers render at correct positions
- [ ] Clusters form at zoom < 13, expand at zoom >= 13
- [ ] Cluster click navigates to expand
- [ ] Marker click opens popup with all property details
- [ ] Edit button in popup navigates to correct edit URL
- [ ] Call button dials correct phone number
- [ ] Filter bar filters markers in real time
- [ ] Sidebar list matches filtered markers
- [ ] Sidebar item hover highlights corresponding marker
- [ ] Map marker hover highlights corresponding sidebar item
- [ ] Sidebar item click flies map to marker + opens popup
- [ ] Right-click context menu appears at cursor position
- [ ] Right-click Add new pre-fills lat/lng in form
- [ ] Right-click Copy coordinates copies to clipboard
- [ ] Layer toggle switches basemap correctly
- [ ] Layer preference persists across page reload
- [ ] Zoom/center persists across page reload
- [ ] Realtime: insert a property in another tab appears on map within 2s
- [ ] Realtime: update a property in another tab marker updates within 2s
- [ ] Realtime: delete a property in another tab marker disappears within 2s
- [ ] Realtime indicator shows correct status (green/amber/red)
- [ ] Inline publish toggle updates marker color immediately (optimistic)
- [ ] Publish toggle reverts with toast on API failure
- [ ] Geocode batch: unlocated properties get coordinates after batch
- [ ] Stats bar shows accurate counts
- [ ] Mobile: sidebar collapses to bottom sheet
- [ ] Performance: 500+ markers render without jank

---

### 12.7 Open Questions (Map-Specific)

1. MARKER DENSITY TUNING: What maxClusterRadius works best for Nairobi?
2. GEOCODING API CHOICE: Nominatim (free, 1 req/sec) vs. Positionstack (paid, higher rate)?
3. OFFLINE TILES: Should the map support offline tile caching?
4. MARKER ICONS: Keep default Leaflet pins with status-based coloring, or custom SVG icons?
5. BULK ACTIONS FROM MAP: Should admins be able to lasso select markers to publish/delete in batch?
6. EMBEDDABLE MAP: Should the map page support being embedded in the public site as a blurred/fuzzed overview?

---

## 13. Additional Quality-of-Life Enhancements

### 13.1 Priority Enhancements


#### 13.1.1 Property Quick-Preview Panel on Dashboard
WHAT: Clicking a property row in AdminDashboardPage opens an inline slide-over panel showing full property details + quick action buttons.
IMPLEMENTATION:
- Add selectedProperty: DbProperty | null state to AdminDashboardPage
- Render a right-side drawer with all fields, image carousel, amenity chips, action buttons (Edit, Toggle Publish, Delete)
- Close on Escape or clicking outside
- For mobile: full-screen bottom sheet

#### 13.1.2 Duplicate Property Shortcut
WHAT: Add a Duplicate action in AdminDashboardPage next to Edit/Delete. Pre-fills the property form with all fields copied, is_published: false.

SQL:
create or replace function public.duplicate_property(source_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  insert into public.properties (title, description, ai_generated_description, price, price_type, bedrooms, bathrooms, property_type, furnished, size_sqm, county, town, area_label, estate, address, latitude, longitude, owner_phone, is_available, is_published, cover_image_url)
  select title || (Copy), description, ai_generated_description, price, price_type, bedrooms, bathrooms, property_type, furnished, size_sqm, county, town, area_label, estate, address, latitude, longitude, owner_phone, false, false, cover_image_url
  from public.properties where id = source_id and public.is_admin() returning id into new_id;
  return new_id;
end; $$;
grant execute on function public.duplicate_property(uuid) to authenticated;

#### 13.1.3 Listing Quality Improvement Suggestions
WHAT: Show concrete missing fields with one-click Fill this for me buttons using the existing Gemini API.
IMPLEMENTATION:
- Use existing calcQuality() function missing array
- For each missing field, show icon-button that calls Gemini with a targeted prompt
- Missing description -> Write a compelling 150-word description for a [type] in [town], [county]...
- Missing size_sqm -> Estimate from property_type
- After AI fills, auto-populate the field in the form or update via API
- Show AI-improved badge on the field

#### 13.1.4 Bulk Publish/Unpublish from Dashboard
WHAT: Checkboxes on dashboard table header (select all) + row level checkboxes + bulk action toolbar (Publish selected, Delete selected).
IMPLEMENTATION:
- Add selectedIds: Set<string> state
- Header checkbox toggles all visible rows
- Bulk action toolbar appears when any selected
- Batch update: Promise.allSettled (graceful partial failure)
- Delete with confirmation: Delete N properties permanently?

#### 13.1.5 Image Upload Progress Indicator
WHAT: In AdminPropertyFormPage, show individual upload progress bars for each image being uploaded.
IMPLEMENTATION:
- For each selected file, upload to Supabase Storage via supabase.storage.from(property-images).upload()
- Track progress per file using XHR
- Show per-file: filename, progress bar (0-100%), status (uploading / done / error)
- If any fail: show red error state with retry button

#### 13.1.6 Public Recently Viewed Tracking
WHAT: localStorage-backed recently viewed list for the public browse experience (last 10 viewed listing detail pages).
IMPLEMENTATION:
- New hook useRecentlyViewed() in src/hooks/useRecentlyViewed.ts
- On ListingDetailPage mount, push property ID to front of list, dedupe, cap at 10
- New page /recent showing recently viewed listings

#### 13.1.7 Advanced Search with Typeahead
WHAT: Add typeahead/autocomplete to the header search bar.
IMPLEMENTATION:
- Create HeaderSearch.tsx component
- On input focus/typing: debounce 300ms, query fetch_public_properties() filtered by text, show dropdown of up to 5 results
- Result items: show thumbnail + title + price + location
- Arrow key navigation + Enter to go to listing
- Escape to close dropdown

#### 13.1.8 Notification Bell Icon for Inquiry Alerts
WHAT: A bell icon in the admin layout showing real-time inquiry count with a red badge.
IMPLEMENTATION:
- Subscribe to property_inquiries table via Supabase Realtime in AdminLayout
- Show unread count badge (persisted count in localStorage)
- Notification dropdown: list recent inquiries with property title, lead name, time ago
- Click notification -> navigate to /admin/inquiries?highlight=:id

#### 13.1.9 Admin Activity Log (Table Audit)
WHAT: An admin_activity_log table tracking every property create/update/delete/publish event with admin user ID and timestamp.

SQL:
create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id),
  action text not null, -- CREATE | UPDATE | DELETE | PUBLISH | UNPUBLISH
  property_id uuid references public.properties(id),
  property_ref text,
  details jsonb,
  created_at timestamptz default now()
);
alter table public.admin_activity_log enable row level security;
create policy activity_admin_read on public.admin_activity_log for select using (public.is_admin());
create policy activity_append on public.admin_activity_log for insert with check (public.is_admin());

create or replace function public.log_property_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare action_text text;
begin
  if tg_op = INSERT then action_text := CREATE;
  elsif tg_op = UPDATE then
    if new.is_published and not old.is_published then action_text := PUBLISH;
    elsif not new.is_published and old.is_published then action_text := UNPUBLISH;
    else action_text := UPDATE; end if;
  elsif tg_op = DELETE then action_text := DELETE; end if;
  insert into public.admin_activity_log (admin_id, action, property_id, property_ref, details)
  values (auth.uid(), action_text, coalesce(new.id, old.id), coalesce(new.listing_reference, old.listing_reference),
    jsonb_build_object(before, case when tg_op <> INSERT then old else null end, after, case when tg_op <> DELETE then new else null end));
  return coalesce(new, old);
end; $$;
create trigger tr_log_property_changes
  after insert or update or delete on public.properties
  for each row execute function public.log_property_change();

UI: New /admin/activity page showing timeline view grouped by date, admin avatar, action type badge (color-coded), property ref/title, and View details modal with before/after JSON diff.

#### 13.1.10 Sortable Columns on Admin Dashboard
WHAT: Click column headers in dashboard table to sort by that column. Default sort: updated_at DESC.
IMPLEMENTATION:
- Add sortBy: keyof DbProperty and sortDir: asc | desc state
- Sort the rows array before rendering
- Visual indicator (arrow icon) on the active sort column
- Persist sort preferences in localStorage

#### 13.1.11 Keyboard Shortcuts for Power Admins
WHAT: Global keyboard shortcuts to navigate faster.
- G + D -> goto /admin (Dashboard)
- G + M -> goto /admin/map (Map)
- G + N -> goto /admin/new (New property)
- G + I -> goto /admin/inquiries
- Esc -> close any modal/drawer/toast
- / -> focus header search bar
- S -> save (when on property form with changes)
IMPLEMENTATION:
- Create useKeyboardShortcuts.ts hook
- Register global keydown listener in App.tsx
- Show keyboard shortcut hint overlay when ? is pressed
- Guard shortcuts to only fire when no input is focused

#### 13.1.12 CSV Export for Admin Dashboard
WHAT: Export all (or filtered) properties to a CSV file for offline analysis.
IMPLEMENTATION:
- Export CSV button in dashboard header
- Client-side CSV generation
- Columns: listing_reference, title, price, price_type, bedrooms, bathrooms, property_type, county, town, area_label, estate, is_published, is_available, furnished, size_sqm, owner_phone, created_at
- Exclude: id, latitude, longitude, address (privacy)
- Filename: homesurge-export-YYYY-MM-DD.csv

### 13.2 Lower-Priority Enhancements (Phase C+)
- SMS notifications via Africas Talking when new inquiry comes in
- WhatsApp Business API integration for auto-reply to inquiries
- PDF brochure generation for properties to send via WhatsApp
- Scheduled availability toggles (available from/until date)
- Tenant reference system with reference letter generation
- Multi-currency support (USD/EUR alongside KES)
- Map-based pricing heatmap (choropleth overlay)
- Customer accounts with saved searches and email alerts
- Property video tours with embedded player
- 3D virtual tours (Matterport integration)

### 13.3 Recommended Implementation Order

SPRINT 1 - MAP FOUNDATION:
1. Custom marker colors + status coding
2. useRealtimeProperties hook
3. Replace AdminMapPage query with realtime hook
4. Filter panel + URL params sync
5. Enhanced marker popup with Edit/Call buttons

SPRINT 2 - MAP POLISH:
6. Marker clustering (react-leaflet-cluster)
7. Basemap toggle + localStorage persistence
8. PropertyListSidebar + hover sync
9. MapControls toolbar
10. Right-click context menu

SPRINT 3 - ADMIN UX:
11. Bulk geocode helper
12. Property quick-preview panel
13. Duplicate property shortcut
14. Bulk publish/delete from dashboard
15. Sortable dashboard columns

SPRINT 4 - NOTIFICATIONS + POLISH:
16. Realtime inquiry notifications (bell icon)
17. Admin activity log (table + UI)
18. Keyboard shortcuts
19. CSV export
20. Image upload progress
21. Quality improvement suggestions

SPRINT 5 - PUBLIC UX:
22. Recently viewed tracking
23. Header typeahead search
24. Realtime map (if customer-facing choropleth is approved)

---

## 14. Testing and QA Infrastructure

### 14.1 Recommended Testing Setup
npm install --save-dev vitest @testing-library/react jsdom
Add to package.json scripts: test, test:ui, test:coverage, test:e2e (playwright)

### 14.2 Unit Test Targets
| Component/Hook | Test cases |
|----------------|-----------|
| useFavorites | Add, remove, clear, dedupe, persistence across tabs |
| useCompare | Add up to 4, reject 5th, remove, clear, limit message |
| calcQuality | 0%, 50%, 100% completeness, missing fields array |
| filterProperties | All filter combinations, empty results, boundary values |
| useRealtimeProperties | Insert/update/delete events, connection status transitions |
| AdminPropertyFormPage | Submit with all fields, validation errors, AI button |
| AdminDashboardPage | Sort, search, toggle publish, delete confirmation |
| AdminInquiriesPage | Expand/collapse, delete, call link |
| BudgetCalculator | Monthly rent calc, mortgage calc, affordability thresholds |
| AreaInsights | Stats computation, empty data, mixed price types |

### 14.3 E2E Test Targets (Playwright)
- [ ] Public: browse page loads, filters work, listing card click opens detail
- [ ] Public: save/unsave favorites, count updates
- [ ] Public: compare bar appears, compare page shows differences
- [ ] Public: inquiry form submits, success toast shown
- [ ] Admin: login, dashboard loads with stats
- [ ] Admin: create new property, upload images, publish
- [ ] Admin: map page loads, markers visible, filters work
- [ ] Admin: inline publish toggle, marker color changes
- [ ] Admin: realtime - open 2 tabs, add property in one, appears in other
- [x] Admin: right-click context menu, add new at location
- [ ] Admin: geocode batch, coordinates populated
- [ ] Admin: activity log page loads, entries visible
- [ ] Mobile: all pages responsive, no horizontal scroll
- [ ] Performance: browse page with 100 listings loads < 3s
- [ ] Performance: map with 500 markers loads < 5s

---

## 15. Performance Optimization

### 15.1 Current Performance Profile

| Area | Current state | Optimization target |
|------|--------------|---------------------|
| Browse page | 3 images loaded upfront | Lazy load images below fold with loading=lazy |
| Admin dashboard | All properties fetched in one query | Add pagination (100/page) + infinite scroll |
| Map rendering | No clustering | Cluster markers for 100+ properties |
| Property form | All images re-uploaded on every edit | Upload only new images, keep existing URLs |
| Realtime | Full table re-fetch on reconnect | Use postgres_changes delta events only |
| TanStack Query | No staleTime on admin queries | Set staleTime: 30_000 (30s) to reduce refetches |
| Images | No compression | Serve WebP images via Supabase Image Transform |

### 15.2 Specific Optimizations

PAGINATION FOR ADMIN DASHBOARD:
const { data } = useQuery({
  queryKey: [admin-properties, page],
  queryFn: () => supabase.from(properties).select(*).order(updated_at, { ascending: false }).range(page * 100, (page + 1) * 100 - 1),
  staleTime: 30_000,
})

IMAGE OPTIMIZATION VIA SUPABASE TRANSFORMS:
export function thumbUrl(url: string, w: number, q = 70): string {
  if (!url) return 
  return `${url.split(?)[0]}?width=${w}&quality=${q}&format=webp`
}

---

## 16. Documentation and Onboarding

### 16.1 Admin User Guide
Create docs/admin-guide.md with step-by-step instructions for:
- How to add a new listing (walkthrough)
- How to geocode a property manually
- How to publish/unpublish a listing
- How to manage inquiry leads
- How to use the map page for lead routing
- How to export data to CSV
- How to duplicate a listing
- Troubleshooting: My property isnt showing checklist

### 16.2 Database ERD
Create a visual ERD (use dbdiagram.io or Mermaid) embedded in docs/schema.md showing table relationships, RLS policies, and trigger chains. Update whenever schema changes.

### 16.3 Supabase Project Setup Checklist
1. Create project at supabase.com
2. Run schema.sql in SQL editor (extensions -> tables -> triggers -> functions -> RLS -> storage policies)
3. Run seed-nairobi.sql for area reference data
4. Create first admin user via Supabase dashboard
5. Update profile role to admin for that user
6. Create storage bucket property-images (public)
7. Set RLS policies on storage bucket (public read, admin write)
8. Configure Realtime for properties and property_inquiries tables in Supabase dashboard
9. Add environment variables to .env
10. Set up Edge Functions for AI (Phase B)
11. Configure Row Level Security email templates
12. Set up automated backups (Supabase Pro tier)


---
## 17. Hyper-Detailed Evolutionary Roadmap (The "Open-Minded" Expansion)

### SPRINT 1 - MAP FOUNDATION:
- [x] Custom marker colors + status coding
- [x] useRealtimeProperties hook
- [x] Replace AdminMapPage query with realtime hook
This section details the long-term vision to transform homesurge from a listing site into a full-scale real estate ecosystem.

### 17.1 Advanced Architectural Improvements
#### 17.1.1 Type-Safe Database Layer
- [ ] **Kysely or Zod Integration:** Generate TypeScript types directly from the Supabase schema to ensure zero runtime errors during data fetching.
- [ ] **Global Error Boundary Strategy:** Implement a multi-tier error handling system that differentiates between network errors, Supabase RLS violations, and UI rendering crashes.
#### 17.1.2 Multi-Region Scaling (Kenya Context)
- [ ] **Edge Functions for Geo-Routing:** Use Supabase Edge Functions to serve area insights based on the user's nearest CDN node (Mombasa vs Nairobi nodes).
- [ ] **Offline-First Admin Map:** Allow admins to cache map tiles for specific Nairobi estates (e.g., Kilimani, Westlands) to use while "on-site" where 4G/5G might be spotty.

### 17.2 Security & Trust Hardening
#### 17.2.1 Biometric Authentication (WebAuthn/Passkeys)
- [ ] **Admin Passkey Login:** Enable admins to log in via TouchID/FaceID using the `@supabase/auth-js` WebAuthn features identified in the codebase.
- [ ] **Identity Proofing for Admins:** Implement an audit trail that logs which admin viewed which `owner_phone` or `latitude/longitude` to prevent internal data leaks.
#### 17.2.2 Public Data Obfuscation
- [ ] **Dynamic Watermarking:** Automatically apply a homesurge gradient watermark to all uploaded images in the `property-images` bucket using an Edge Function + Sharp library.
- [ ] **Bot Protection:** Integrate Turnstile or reCAPTCHA v3 on the inquiry form and "Call" buttons to prevent lead-scraping bots.

### 17.3 The "Smart" AI Layer (Gemini Integration)
#### 17.3.1 Listing Quality Scorer
- [ ] **Vision AI Analysis:** Use Gemini Vision to analyze uploaded photos. If a photo is blurry, dark, or shows a competitor's watermark, flag it for the admin.
- [ ] **Automated Area Insights:** Feed `nairobi_areas` data to Gemini to generate "Neighborhood Vibe" summaries (e.g., "Perfect for young professionals who value nightlife and proximity to CBD").
#### 17.3.2 Multilingual Support
- [ ] **Swahili Translation Toggle:** Use Gemini to provide high-quality localized descriptions in Swahili for a broader Kenyan audience.

### 17.4 Admin Experience (Mobile-Ready)
#### 17.4.1 Field Survey Tool
- [ ] **Direct Upload from Camera:** Optimize the Admin Form for mobile browsers so agents can take a photo of a house and have it instantly upload to the Supabase bucket.
- [ ] **GPS Pin Drop:** A "Current Location" button in the Admin Form that uses the mobile device's GPS to fill the `latitude` and `longitude` fields while standing in the property.
#### 17.4.2 Lead Management CRM
- [ ] **One-Tap WhatsApp:** Admin dashboard inquiries should have a "Open in WhatsApp" button that pre-fills a message: "Hi [Name], I'm calling from homesurge regarding your inquiry for [Property Ref]..."

---
## 18. Mobile App Integration Strategy

### SPRINT 1 - MAP FOUNDATION:
- [x] Filter panel + URL params sync
- [x] Enhanced marker popup with Edit/Call buttons

To enable admin login on a mobile app (Capacitor or Flutter), we must ensure the authentication flow handles deep links and persistent sessions correctly.

### 18.1 Deep Linking for Admin Auth
- [ ] Configure `app.homesurge.co` as the site URL in Supabase.
- [ ] Implement `PKCE` flow to handle secure handshakes between the mobile OS and the Supabase Auth server.

### 18.2 Session Persistence
- [ ] Set `persistSession: true` in the `GoTrueClient` configuration.
- [ ] Ensure the `role === 'admin'` check is performed on the initial session load to redirect users to the correct dashboard immediately.

---
## 19. UX/UI & Branding Refinements

### 19.1 The "Cool" Aesthetic
- [ ] **Glassmorphism 2.0:** Use `backdrop-blur-xl` and `bg-white/5` for all modals.
- [ ] **Interactive Trace Lines:** Use SVG animations for the "Trace" accent gradient that follows the user's scroll path.
- [ ] **Micro-interactions:** Add haptic feedback for mobile users when they "Save" a property or submit an inquiry.

---
## 20. Conversion & Growth

### 20.1 Referral Loop
- [ ] **Shareable Shortlinks:** Generate `htrc.co/xyz` links for listings that open the app or detail page.
- [ ] **Area Price Trends:** Show a "Is this a good deal?" badge based on the average price for that town/type in the database.

---
## 21. Database Migrations & DevOps

### 21.1 Staging Environment
- [ ] Set up a `homesurge-staging` project in Supabase to test new RLS policies before pushing to production.
- [ ] GitHub Actions for automatic deployment of Edge Functions and Database schema changes.
---

