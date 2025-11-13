# Carzo - Vehicle Marketplace Platform

**Brand**: Carzo
**Domain**: carzo.net
**Project Type**: High-conversion vehicle marketplace for paid traffic

## Project Overview

Carzo is a Next.js 16 vehicle marketplace platform that earns revenue by driving paid traffic (Facebook Ads, Google Display) to conversion-optimized VDP bridge pages that lead to dealership websites. Built with Next.js 16, Supabase, and Tailwind CSS.

## Business Model - CRITICAL

### Revenue Structure
- **$0.80 per UNIQUE DEALER click per user per 30 days**
- ⚠️ **MOST IMPORTANT RULE**: Multiple clicks to same dealer = only paid ONCE in 30-day window
- **Traffic Source**: Paid ads (Facebook, Google Display) → Our VDP → Dealer site
- **Not a general car shopping site**: Focus is conversion optimization, not comprehensive features

### Revenue Optimization Strategy

**Key Constraint:** One payment per dealer per user per 30 days

**Critical Implications:**
1. **Dealer Diversification is EVERYTHING**
   - Search results MUST rotate dealers (not show 10 Toyotas from same dealer)
   - Featured vehicles MUST rotate through different dealers
   - Related vehicles MUST prioritize different dealers
   - Goal: Maximize unique dealer clicks per user

2. **Track Dealer Click History**
   - Store which dealers each user has clicked (30-day window)
   - Mark subsequent clicks to same dealer as non-billable
   - Show UI feedback: "You've already viewed this dealer"

3. **All Dealer Links Open in New Tab**
   - `target="_blank" rel="noopener noreferrer"`
   - Keep user on our site for more browsing

## Tech Stack

- **Framework**: Next.js 16 (with Turbopack - 2-5x faster builds)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4 (CSS-first configuration)
- **Deployment**: Vercel
- **Images**: Sharp (blur generation for photo tease)
- **User Tracking**: Cookie-based (no JWT - anonymous tracking only)
- **Feed Source**: LotLinx Publisher Feed (72K+ vehicles, 4x daily updates)

## Tailwind CSS Design System

Carzo uses **Tailwind v4** with a custom design system for brand consistency.

### Brand Colors

**Semantic Color Tokens** (use these, not hard-coded colors):
- `bg-primary` / `text-primary` - Red (#dc2626) - Primary CTAs
- `bg-primary-hover` - Red (#b91c1c) - Hover state for primary CTAs
- `bg-brand` / `text-brand` - Blue (#2563eb) - Brand accent color
- `bg-brand-hover` / `text-brand-hover` - Blue (#1d4ed8) - Hover state for brand
- `bg-dealer` - Violet (#7c3aed) - Dealer-specific elements (Phase 2)
- `bg-muted` / `text-muted-foreground` - Gray - Muted backgrounds/text
- `border-border` - Gray (#e5e7eb) - Default borders

**Semantic Colors** (for specific purposes):
- `bg-success` / `text-success` - Green - Success states
- `bg-warning` / `text-warning` - Orange - Warning states
- `bg-error` / `text-error` - Red - Error states
- `bg-info` / `text-info` - Sky blue - Info states

### Configuration

Located in `app/globals.css` using Tailwind v4's `@theme` directive:

```css
@theme {
  --color-primary: #dc2626;
  --color-primary-hover: #b91c1c;
  --color-brand: #2563eb;
  --color-brand-hover: #1d4ed8;
  /* ... see globals.css for full config */
}
```

### Usage Examples

**Buttons:**
```tsx
// Primary CTA (red)
<button className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg">
  See Photos
</button>

// Brand accent (blue)
<button className="bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-lg">
  Search
</button>
```

**Conditional Classes with `cn()` Utility:**
```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'p-4 rounded-lg',
  isActive && 'bg-brand text-white',
  !isActive && 'bg-muted text-foreground'
)}>
  Content
</div>
```

### Dark Mode

**Status:** Infrastructure in place, implementation deferred to Phase 2.

Dark mode will be activated via `prefers-color-scheme: dark` media query. All brand colors have dark mode variants pre-defined in `globals.css` (currently commented out).

### Design Tokens

- **Fonts**: Geist Sans (primary), Geist Mono (code)
- **Border Radius**: `rounded-lg` (buttons/inputs), `rounded-xl` (cards), `rounded-2xl` (hero sections)
- **Spacing**: Use Tailwind defaults (`p-4`, `p-6`, `p-8`, etc.)
- **Shadows**: `shadow-lg` (cards), `shadow-2xl` (CTAs)

### Custom Utilities

**Gradient Utility** (for primary CTAs):
```tsx
<Button className="bg-primary-gradient">
  // Applies linear-gradient from primary → primary-hover
</Button>
```

**Accessibility Focus States** (always use `focus-visible:`):
```tsx
// ✅ CORRECT (WCAG 2.1 compliant):
<input className="outline-none focus-visible:ring-2 focus-visible:ring-brand" />

// ❌ WRONG (shows focus on mouse clicks):
<input className="focus:outline-none focus:ring-2 focus:ring-brand" />
```

### Important Rules

1. **Always use semantic colors** (`bg-primary`, `bg-brand`) instead of hard-coded values (`bg-red-600`, `bg-blue-500`)
2. **Use `cn()` utility** from `lib/utils.ts` for conditional classes
3. **Preserve semantic colors** - Red for errors, green for success (don't change these)
4. **All CTAs use primary color** (red) for maximum conversion
5. **Brand accents use brand color** (blue) for consistency
6. **Use `focus-visible:` instead of `focus:`** for accessibility (WCAG 2.1) - focus rings only on keyboard nav, not mouse clicks
7. **Use Button component** from `@/components/ui` instead of raw `<button>` elements for consistency

## UI Component Library

Carzo uses a custom UI component library built on top of the Tailwind design system for consistency and maintainability.

### Available Components

Located in `components/ui/` with a central export from `components/ui/index.ts`.

#### Button Component

**Usage:**
```tsx
import { Button } from '@/components/ui';

<Button variant="primary">See Photos</Button>
<Button variant="brand">Search</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="outline">More Info</Button>
<Button variant="ghost">Clear</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

**Variants:**
- `primary` (default) - Red background, white text (main CTAs)
- `brand` - Blue background, white text (brand actions)
- `dealer` - Violet background, white text (dealer-specific, Phase 2)
- `secondary` - Muted gray background
- `outline` - White background with border
- `ghost` - Transparent background, text only

**Sizes:**
- `sm` - Small (px-3 py-1.5, text-sm)
- `md` (default) - Medium (px-6 py-3, text-base)
- `lg` - Large (px-8 py-4, text-lg)

#### Input Component

**Usage:**
```tsx
import { Input } from '@/components/ui';

<Input type="text" placeholder="Enter value" />
<Input type="email" error={hasError} />
<Input type="number" className="text-sm" />
```

**Props:**
- `error?: boolean` - Shows red border and error focus ring
- All standard HTML input attributes supported

#### Badge Component

**Usage:**
```tsx
import { Badge } from '@/components/ui';

<Badge variant="brand">New</Badge>
<Badge variant="success">Certified</Badge>
<Badge variant="warning">Low Stock</Badge>
<Badge variant="error">Sold</Badge>
```

**Variants:**
- `default` - Dark gray background
- `brand` - Blue background
- `success` - Green background
- `warning` - Orange background
- `error` - Red background
- `info` - Sky blue background
- `secondary` - Muted gray background

#### Card Components

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Main content
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

**Components:**
- `Card` - Container with border and shadow
- `CardHeader` - Header section with padding
- `CardTitle` - Bold title (h3)
- `CardDescription` - Muted description text
- `CardContent` - Main content area
- `CardFooter` - Footer section

### Component Usage Guidelines

1. **Always use UI components** instead of raw HTML elements when available
2. **Import from `@/components/ui`** for cleaner imports
3. **Extend with className prop** when custom styling needed
4. **Use cn() utility** for conditional classes
5. **Maintain consistency** - Don't create one-off button styles

### Example Refactoring

**Before:**
```tsx
<button className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg">
  See Photos
</button>
```

**After:**
```tsx
import { Button } from '@/components/ui';

<Button variant="primary">See Photos</Button>
```

### When to Create New Components

Create new UI components when:
1. A pattern is used 3+ times across the codebase
2. A component has multiple style variants
3. A component has complex logic that should be encapsulated
4. TypeScript types would improve developer experience

## Mobile Optimization

Carzo is **mobile-first** - most paid ad traffic (Facebook/Google) comes from mobile devices.

### Mobile Filter Drawer

**Component:** `components/Search/FilterSidebar.tsx`

**Desktop Behavior (≥1024px):**
- Sticky sidebar in left column (always visible)
- Standard filter interface

**Mobile Behavior (<1024px):**
- **Fixed bottom button** with active filter count badge
- **Slide-in drawer** from left (300ms ease-in-out)
- **Backdrop overlay** (z-50) with fade-in animation
- **Body scroll lock** when drawer is open
- **Tap backdrop to close**

**Z-index Layering:**
```tsx
Mobile filter button: z-40  // Fixed bottom
Filter overlay: z-50        // Backdrop
Filter drawer: z-[60]       // Above overlay
VDP sticky CTA: z-50        // Different page, no conflict
```

**Implementation:**
```tsx
// Mobile button shows on mobile, hidden on desktop
<div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
  <Button onClick={() => setDrawerOpen(true)}>
    Filters {activeCount > 0 && <Badge>{activeCount}</Badge>}
  </Button>
</div>

// Overlay with fade animation
{isOpen && (
  <div
    className="lg:hidden fixed inset-0 bg-black/50 z-50 animate-fade-in"
    onClick={() => setDrawerOpen(false)}
  />
)}

// Drawer slides in from left
// NOTE: Use inline style to target only transform property for better performance
<div
  className={cn(
    'lg:hidden fixed top-0 left-0 bottom-0 z-[60]',
    isOpen ? 'translate-x-0' : '-translate-x-full'
  )}
  style={{ transition: 'transform 300ms ease-in-out' }}
>
  {/* Filter content */}
</div>

// Desktop sidebar (hidden on mobile)
<div className="hidden lg:block sticky top-8">
  {/* Same filter content */}
</div>
```

**Key UX Features:**
- **Body Scroll Lock**: When drawer opens, adds `overflow-hidden` class to body
- **Escape Key**: Press Escape to close drawer (keyboard accessibility)
- **Active Filter Count**: Badge shows total count of all active filters (including model)
- **Component Pattern**: FilterContent extracted as separate component to avoid React anti-pattern of defining components inside render functions

**Performance Optimizations:**
- Drawer animation targets only `transform` property (not `transition: all`)
- FilterContent component defined outside render function (prevents recreation on every render)
- Event listeners properly cleaned up in useEffect return functions

### Responsive Breakpoints

**Tailwind Breakpoints:**
- `sm:` - 640px (small tablets)
- `md:` - 768px (tablets)
- `lg:` - 1024px (desktop) - **Primary mobile/desktop split**
- `xl:` - 1280px (large desktop)

**Mobile-First Approach:**
1. Base styles are mobile (320px+)
2. Add `sm:`, `md:`, `lg:` for progressive enhancement
3. Touch targets minimum 40x40px (WCAG Level AAA)

**Example:**
```tsx
// Mobile: stacks vertically, desktop: horizontal
<div className="flex flex-col sm:flex-row gap-3">

// Mobile: full width, desktop: auto width
<Button className="w-full sm:w-auto">

// Mobile: small text, desktop: large text
<h1 className="text-3xl sm:text-4xl lg:text-5xl">
```

### Mobile Layout Adjustments

**Search Page:**
```tsx
// Add bottom padding on mobile for filter button
<main className="pb-24 lg:pb-8">
```

**Hero Search:**
```tsx
// Stacks vertically on mobile, horizontal on desktop
<form className="flex flex-col sm:flex-row gap-3">
  <input className="flex-1" />
  <Button className="w-full sm:w-auto">Search</Button>
</form>
```

## Animations & Transitions

All animations support **prefers-reduced-motion** for accessibility.

### Custom Animations

**Location:** `app/globals.css`

**Available Animations:**
```css
.animate-fade-in          // 0.3s fade in with slight upward movement
.animate-fade-in-slow     // 0.6s slower fade in
.animate-slide-in-left    // 0.3s slide in from left
.animate-slide-in-right   // 0.3s slide in from right
.animate-scale-in         // 0.2s scale up from 95% to 100%
.animate-skeleton-pulse   // 2s infinite smooth pulse for loading states
```

**Transition Utilities:**
```css
.transition-smooth        // 0.3s cubic-bezier easing
.transition-smooth-slow   // 0.5s cubic-bezier easing
```

### Usage Examples

**Page Transitions:**
```tsx
// Loading screens fade in
<div className="min-h-screen animate-fade-in">
  <LoadingSkeleton />
</div>

// Modal/drawer overlays
<div className="fixed inset-0 bg-black/50 animate-fade-in">
```

**Loading States:**
```tsx
// Skeleton loaders use custom pulse
<div className="h-10 bg-slate-200 rounded animate-skeleton-pulse" />

// Spinner with scale-in entrance
<div className="animate-scale-in">
  <div className="animate-spin" />
</div>
```

**Interactive Elements:**
```tsx
// Button hover effects (built into Button component)
<Button className="transition-all duration-300 hover:scale-105">

// Drawer slide animations
<div className={cn(
  'transform transition-transform duration-300',
  isOpen ? 'translate-x-0' : '-translate-x-full'
)}>
```

### Accessibility Support

**Prefers Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

All animations automatically respect user's motion preferences (WCAG 2.1 compliance).

### Smooth Scroll

**Global behavior:**
```css
html {
  scroll-behavior: smooth;
}
```

Disabled automatically for users with `prefers-reduced-motion: reduce`.

## Page Architecture

### Three Page Types (Not a Full Car Shopping Site)

1. **Homepage** (`/`)
   - Purpose: Legitimacy + funnel to VDPs
   - Hero search
   - Featured vehicles (dealer-diversified)
   - Shop by make/body style
   - Minimal content - just enough to look real

2. **Search Results** (`/search`)
   - Purpose: Filter & find vehicles → send to VDP
   - Filter sidebar (make, model, price, condition, year)
   - Vehicle cards with "See Photos" CTA
   - **Dealer diversity algorithm applied**
   - Pagination

3. **VDP Bridge Page** (`/vehicles/[vin]`) - THE MONEY PAGE
   - Purpose: Maximize CTR to dealer site (40%+ target)
   - "Confirm, Tempt, Convert" strategy
   - Verified listing badge (trust)
   - Photo gallery tease (blurred thumbnails + "+X More")
   - Primary CTA: "See Full Photo Gallery" (opens dealer site in new tab)
   - Secondary CTAs: "View FREE Vehicle History", "Estimate Monthly Payments"
   - All CTAs go to same dealer URL, open in new tab

## A/B Test Flow Routing

Carzo implements URL parameter-based A/B testing to optimize the user journey and maximize revenue per impression. Three flow variants are supported:

### Flow Variants

**Flow A: Direct to Dealer** (`?flow=direct`)
- **Path**: SERP → Dealer Site (skip VDP)
- **Strategy**: Minimal friction, direct links from search results
- **UX**: Vehicle cards link directly to dealer VDP, open in new tab
- **Button**: "View at Dealer" with ExternalLink icon
- **Use Case**: Test if VDP bridge adds or removes value
- **Tracking**: Click tracked with `flow: 'direct'` and `ctaClicked: 'serp_direct'`

**Flow B: VDP-Only** (`?flow=vdp-only`)
- **Path**: Ad → VDP → Dealer (skip SERP, auto-redirect)
- **Strategy**: Vehicle-specific landing pages for targeted ads
- **UX**: VDP shows loading spinner for 1.5s, then auto-opens dealer site in new tab
- **Use Case**: Direct traffic from Facebook/Google Ads to specific vehicles
- **Tracking**: Impression + click both tracked with `flow: 'vdp-only'` before redirect

**Flow C: Full Funnel** (default, no parameter or `?flow=full`)
- **Path**: SERP → VDP → Dealer (traditional flow)
- **Strategy**: Full trust-building funnel with photo gallery tease
- **UX**: Search → Vehicle card → VDP bridge → Dealer CTAs
- **Button**: "See Full Photo Gallery" with Camera icon
- **Use Case**: Default behavior, maximizes session depth
- **Tracking**: Standard impression/click tracking with `flow: 'full'`

### Flow Detection & Preservation

**Detection**: `lib/flow-detection.ts`
```typescript
export function getFlowFromUrl(): UserFlow {
  const params = new URLSearchParams(window.location.search);
  const flow = params.get('flow');
  if (flow === 'direct' || flow === 'vdp-only') return flow;
  return 'full'; // Default
}
```

**Preservation**: Flow parameter automatically preserved through all navigation:
- Filter changes (make, model, price, condition, etc.)
- Pagination (page 1, 2, 3...)
- Sorting (price, year, mileage)
- Clear filters (preserves flow, clears other params)

**Implementation**: All components use `new URLSearchParams(window.location.search)` to preserve existing parameters.

### Edge Case Handling

**Missing `dealer_vdp_url`**:
- VehicleCard: Falls back to VDP flow (not direct) if URL missing
- VDPRedirect: Shows error state with "Return to Search" button
- Prevents broken links or opening about:blank

**Invalid flow values**:
- Client-side: Default to `'full'` if not `'direct'` or `'vdp-only'`
- Server-side: API normalizes to `'full'` if invalid value passed

### Testing Flows

**URL Examples**:
```
# Flow A: Direct to dealer from search
/search?make=toyota&flow=direct

# Flow B: Auto-redirect VDP (for ads)
/vehicles/1HGBH41JXMN109186?flow=vdp-only

# Flow C: Default full funnel
/search?make=toyota
```

**Marketing Use Cases**:
- **Facebook Ads → Flow B**: Link directly to VDP with auto-redirect
- **Google Display → Flow A**: Test direct dealer links from search
- **Organic/Referral → Flow C**: Default experience with VDP bridge

### Analytics Tracking

All flows tracked in database:
- `clicks.flow`: Which variant generated the click
- `impressions.flow`: Which variant generated the impression
- Analytics dashboard shows performance by flow variant

## Database Schema

See `supabase-schema.sql` for complete schema.

### Core Tables

```sql
-- vehicles: 72K+ from LotLinx feed (denormalized with dealer info)
CREATE TABLE vehicles (
  id UUID PRIMARY KEY,
  vin VARCHAR(17) UNIQUE,
  -- vehicle fields (year, make, model, price, miles, etc.)
  dealer_id VARCHAR(50) NOT NULL, -- CRITICAL for deduplication
  dealer_name, dealer_city, dealer_state, dealer_zip,
  dealer_vdp_url TEXT NOT NULL, -- LotLinx click URL
  primary_image_url TEXT,
  total_photos INT DEFAULT 15, -- For "+X More" display
  -- Location fields for spatial queries
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  targeting_radius INT DEFAULT 30, -- Search radius in miles
  location GEOGRAPHY(Point, 4326), -- PostGIS spatial column (auto-populated)
  -- Note: Blur effect done via CSS, not stored images
  is_active BOOLEAN DEFAULT true
);

-- clicks: All click events with billable flag
CREATE TABLE clicks (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  dealer_id VARCHAR(50) NOT NULL, -- CRITICAL
  user_id VARCHAR(255) NOT NULL, -- Cookie ID
  session_id VARCHAR(255),
  is_billable BOOLEAN DEFAULT true, -- First click to this dealer?
  cta_clicked VARCHAR(50), -- 'primary', 'history', 'payment'
  utm_source, utm_medium, utm_campaign VARCHAR,
  created_at TIMESTAMP
);

-- dealer_click_history: Tracks unique dealer clicks per user (30-day window)
CREATE TABLE dealer_click_history (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  dealer_id VARCHAR(50) NOT NULL,
  first_click_at TIMESTAMP NOT NULL,
  last_click_at TIMESTAMP NOT NULL,
  click_count INT DEFAULT 1,
  UNIQUE(user_id, dealer_id)
);

-- impressions: For CTR calculation
CREATE TABLE impressions (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  page_type VARCHAR(20), -- 'search', 'homepage', 'direct'
  created_at TIMESTAMP
);
```

### Critical Indexes

```sql
-- Dealer diversification
CREATE INDEX idx_dealer ON vehicles(dealer_id);
CREATE INDEX idx_dealer_make ON vehicles(dealer_id, make);

-- Click deduplication
CREATE INDEX idx_clicks_user ON clicks(user_id, created_at);
CREATE INDEX idx_history_user ON dealer_click_history(user_id);

-- Search performance
CREATE INDEX idx_make ON vehicles(make);
CREATE INDEX idx_search_combo ON vehicles(make, model, body_style, is_active);

-- PostGIS spatial queries (100x faster location-based search)
CREATE INDEX idx_vehicles_location_gist ON vehicles USING GIST(location);
CREATE INDEX idx_vehicles_active_location ON vehicles(is_active) WHERE is_active = true;
```

## User Tracking System

### Cookie-Based Approach (No JWT)

**Why cookies, not JWT:**
- No user accounts = no authentication needed
- JWT is overkill for anonymous tracking
- Cookies are simpler, faster, industry standard
- Google Analytics, Facebook Pixel all use cookies

```typescript
// lib/user-tracking.ts
export function getUserId(): string {
  // Get or create persistent user ID (UUID)
  // Stored in cookie with 1 year expiration
  // Used to track dealer clicks across sessions
}

export function getSessionId(): string {
  // Per-tab session ID
  // Stored in sessionStorage
  // Cleared when tab closes
}
```

**Cookie:** `carzo_user_id=550e8400-e29b-41d4-a916-446655440000` (1 year)
**Session Storage:** `carzo_session_id=...` (per-tab)

## Dealer Diversification Algorithm

**CRITICAL for revenue optimization**

```typescript
// lib/dealer-diversity.ts

/**
 * Round-robin dealer rotation
 * Input:  [Toyota-DealerA, Toyota-DealerA, Ford-DealerB, Toyota-DealerC]
 * Output: [Toyota-DealerA, Ford-DealerB, Toyota-DealerC, Toyota-DealerA]
 */
export function diversifyByDealer<T extends { dealer_id: string }>(
  vehicles: T[],
  limit: number
): T[]
```

**Applied to:**
- Search results (max 1-2 vehicles per dealer per page)
- Featured vehicles on homepage
- Related vehicles on VDP

**Goal:** Maximize dealer diversity score (> 80%)

## Click Tracking with Deduplication

```typescript
// app/api/track-click/route.ts

export async function POST(req: Request) {
  const { vehicleId, dealerId, userId, sessionId } = await req.json();

  // Check if user already clicked this dealer in last 30 days
  const history = await supabase
    .from('dealer_click_history')
    .select('*')
    .eq('user_id', userId)
    .eq('dealer_id', dealerId)
    .gte('first_click_at', thirtyDaysAgo);

  const isBillable = !history; // First time = billable

  // Log click with billable flag
  await supabase.from('clicks').insert({
    vehicle_id: vehicleId,
    dealer_id: dealerId,
    user_id: userId,
    is_billable: isBillable,
    created_at: new Date()
  });

  // Update dealer click history
  // ...

  return { billable: isBillable };
}
```

## Revenue Calculation

```typescript
// lib/revenue.ts

// ONLY count billable clicks (unique dealers)
const billableClicks = clicks.filter(c => c.is_billable).length;
const revenue = billableClicks * 0.80;

// NOT total clicks (would overcount)
const totalClicks = clicks.length; // ❌ WRONG
```

## Feed Synchronization

### LotLinx Publisher Feed

- **Source**: `https://feed.lotlinx.com/`
- **Schedule**: 4x daily at 03:00, 09:00, 15:00, 21:00 PST/PDT
- **Format**: ZIP containing TSV file (34 fields, 72K+ vehicles)
- **Authentication**: Username/password in `.env.local`

### Feed Sync Process

1. Download ZIP from LotLinx
2. Extract TSV file
3. Parse vehicles (34 fields per row)
4. Upsert to Supabase (batch 1000 at a time)
5. Mark removed vehicles as inactive

Note: Photo blur effect implemented via CSS `filter: blur()`, not pre-generated images

### Scheduled Feed Sync (Vercel Cron)

**Schedule**: 4x daily at 03:00, 09:00, 15:00, 21:00 UTC (configured in `vercel.json`)

**Endpoint**: `/api/cron/sync-feed`

**Authentication**: Bearer token using `CRON_SECRET` env var

**Manual Testing**:
```bash
# Test locally
./scripts/test-cron.sh

# Or manually sync entire feed
npx tsx scripts/sync-feed.ts
```

**Vercel Setup** (after deployment):
1. Cron jobs auto-configured from `vercel.json`
2. Vercel automatically adds `Authorization: Bearer <CRON_SECRET>` header
3. Monitor cron logs in Vercel dashboard → Logs → Filter by `/api/cron/sync-feed`

### Budget Management

- **Vehicles in feed = vehicles with active budgets**
- When advertiser budget depletes, vehicle removed from feed
- No separate budget tracking needed on our side
- Simple and reliable

## Environment Variables

```bash
# Supabase (from dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LotLinx Feed
LOTLINX_FEED_USERNAME=your_username
LOTLINX_FEED_PASSWORD=your_password
LOTLINX_PUBLISHER_ID=your_publisher_id

# Vercel Cron
CRON_SECRET=your_cron_secret

# Domain
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # Production: https://carzo.net

# Admin Dashboard
ADMIN_PASSWORD=your_admin_password

# MaxMind GeoIP2 (for IP-based location detection)
MAXMIND_ACCOUNT_ID=your_maxmind_account_id
MAXMIND_LICENSE_KEY=your_maxmind_license_key
```

## File Structure

```
carzo/
├── app/
│   ├── page.tsx                        # Homepage with hero search
│   ├── layout.tsx                      # Root layout (Carzo branding + SEO)
│   ├── loading.tsx                     # Global loading state
│   ├── error.tsx                       # Global error boundary
│   ├── search/
│   │   ├── page.tsx                    # Search results with location filtering
│   │   ├── loading.tsx                 # Search page loading skeleton
│   │   └── error.tsx                   # Search page error boundary
│   ├── vehicles/[vin]/
│   │   ├── page.tsx                    # VDP bridge page (THE MONEY PAGE)
│   │   ├── loading.tsx                 # VDP loading skeleton
│   │   └── error.tsx                   # VDP error boundary
│   ├── admin/
│   │   ├── page.tsx                    # Analytics dashboard
│   │   └── login/page.tsx              # Admin login
│   └── api/
│       ├── track-click/route.ts        # Click tracking with deduplication
│       ├── detect-location/route.ts    # IP geolocation (MaxMind)
│       ├── zipcode-lookup/route.ts     # Zip code to coordinates
│       └── cron/sync-feed/route.ts     # Feed sync (4x daily)
├── components/
│   ├── ui/                             # Reusable UI component library
│   │   ├── Button.tsx                  # Button with variants (primary, brand, etc.)
│   │   ├── Input.tsx                   # Input field with error states
│   │   ├── Badge.tsx                   # Badge component with variants
│   │   ├── Card.tsx                    # Card components (Card, CardHeader, etc.)
│   │   └── index.ts                    # Central export for all UI components
│   ├── Search/
│   │   ├── SearchResults.tsx           # Results grid with pagination
│   │   ├── FilterSidebar.tsx           # Filter controls
│   │   ├── VehicleCard.tsx             # Vehicle card component
│   │   └── LocationDetector.tsx        # IP-based location detection
│   ├── Location/
│   │   └── ZipCodeInput.tsx            # Zip code search input
│   ├── Home/
│   │   └── HeroSearch.tsx              # Homepage hero with search
│   ├── VDP/
│   │   └── VehicleBridgePage.tsx       # VDP bridge page component
│   └── Admin/
│       └── DashboardStats.tsx          # Analytics widgets
├── lib/
│   ├── supabase.ts                     # Supabase client + types
│   ├── user-tracking.ts                # Cookie-based user tracking
│   ├── dealer-diversity.ts             # Revenue optimization algorithm
│   ├── feed-sync.ts                    # LotLinx feed integration
│   ├── geolocation.ts                  # MaxMind GeoIP + Haversine
│   ├── revenue.ts                      # Revenue calculation
│   └── utils.ts                        # Utility functions (cn() for class merging)
├── types/
│   └── zipcodes.d.ts                   # TypeScript types for zipcodes package
├── supabase/
│   └── migrations/
│       ├── 20251111000000_initial_schema.sql
│       ├── 20251111000001_fix_all_column_sizes.sql
│       ├── 20251111000002_add_location_columns.sql
│       └── 20251111000003_add_radius_column.sql
├── scripts/
│   ├── test-feed-sync.ts               # Manual feed sync (all 72K vehicles)
│   └── test-cron.sh                    # Test cron endpoint locally
├── public/
│   └── placeholder-vehicle.svg         # Fallback image for missing vehicle photos
├── .env.local                          # Environment variables (DO NOT COMMIT)
├── .env.example                        # Template
├── vercel.json                         # Cron schedule configuration
├── tsconfig.json                       # TypeScript config (excludes reference_vdp)
├── next.config.ts                      # Next.js config with outputFileTracingRoot
├── supabase-schema.sql                 # Database schema
├── CLAUDE.md                           # This file
└── README.md                           # Setup instructions
```

## Development Guidelines

### Adding New Features

1. **Always consider dealer diversification**
   - Any feature that shows multiple vehicles MUST rotate dealers
   - Use `diversifyByDealer()` function

2. **Track all dealer clicks**
   - Every link to dealer site must call `/api/track-click`
   - Pass dealer_id, vehicle_id, user_id, session_id
   - Check is_billable flag

3. **Open dealer links in new tab**
   - `target="_blank" rel="noopener noreferrer"`
   - Keep user on our site

4. **Performance targets**
   - Homepage: < 1.5s LCP
   - Search: < 1s response
   - VDP: < 2s LCP
   - Database queries: < 100ms p95

### Feed Sync Best Practices

1. Check file size/timestamp before downloading
2. Parse TSV in streaming fashion for memory efficiency
3. Batch upserts in chunks of 1000 vehicles
4. Log sync metrics (added, updated, removed)
5. Handle errors gracefully with retries

### Click Tracking Requirements

1. Track every click with dealer_id
2. Check dealer_click_history for deduplication
3. Mark is_billable appropriately
4. Update dealer_click_history table
5. Return billable status to frontend (for UI feedback)

## Testing

### Framework & Tools

**Testing Stack:**
- **Framework**: Vitest v4 (faster than Jest, same API, better TypeScript support)
- **React Testing**: @testing-library/react v16 (React 19 compatible)
- **DOM Environment**: happy-dom (2x faster than jsdom, sufficient for React tests)
- **Coverage**: @vitest/coverage-v8 (built-in V8 coverage)
- **UI**: @vitest/ui (browser-based test runner with visual debugging)

**Why Vitest over Jest:**
- 2-5x faster test execution
- Native ESM support (no babel/ts-jest needed)
- Built-in TypeScript support
- Better Next.js integration
- Same API as Jest (easy migration)
- Modern and actively maintained

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Open Vitest UI in browser (visual test runner)
npm run test:ui

# Run with coverage report
npm run test:coverage

# TypeScript type checking (no tests)
npm run type-check
```

### Test Structure

```
carzo/
├── lib/__tests__/              # Unit tests for business logic
│   ├── utils.test.ts           # Tailwind cn() utility (26 tests, 100% coverage)
│   ├── dealer-diversity.test.ts # Round-robin algorithm (35 tests, 97.61% coverage)
│   ├── flow-detection.test.ts  # A/B testing flows (61 tests, 100% coverage)
│   └── user-tracking.test.ts   # Cookie tracking (48 tests, 100% coverage)
├── components/**/__tests__/    # Component tests (future)
├── app/api/**/__tests__/       # API route tests (future)
├── tests/
│   ├── setup.ts                # Global test setup (mocks for window, localStorage, etc.)
│   ├── mocks/
│   │   └── supabase.ts         # Supabase client mocking utilities
│   └── utils.ts                # Test helper functions (renderWithProviders, etc.)
└── vitest.config.ts            # Vitest configuration
```

### Coverage Requirements

**Revenue-critical files require 95% coverage** (lines, functions, statements):

- `lib/dealer-diversity.ts` - Round-robin dealer algorithm (THE MONEY ALGORITHM)
  - Lines: 95%, Functions: 95%, Branches: 94%, Statements: 95%
  - Achieved: 100% lines, 100% functions, 94.44% branches, 97.61% statements ✅

- `lib/flow-detection.ts` - A/B testing flow routing
  - Lines: 95%, Functions: 95%, Branches: 95%, Statements: 95%
  - Achieved: 100% all metrics ✅

- `lib/user-tracking.ts` - Cookie-based user tracking
  - Lines: 95%, Functions: 95%, Branches: 95%, Statements: 95%
  - Achieved: 100% all metrics ✅

- `app/api/track-click/route.ts` - Click tracking API (future)
  - Lines: 95%, Functions: 95%, Branches: 90%, Statements: 95%

**Current Status**: All tests passing with high coverage on revenue-critical files

### Test Writing Guidelines

**1. SSR-Safe Tests** (window checks):
```typescript
// ALWAYS check for window before accessing browser APIs
describe('Client-side (window defined)', () => {
  beforeEach(() => {
    // Ensure window is available
    global.window = {} as any;
  });

  it('should work in browser', () => {
    expect(getFlowFromUrl()).toBe('full');
  });
});

describe('Server-side (window undefined)', () => {
  beforeEach(() => {
    delete (global as any).window;
  });

  it('should default to "full" in SSR', () => {
    expect(getFlowFromUrl()).toBe('full');
  });
});
```

**2. Cookie/Storage Testing**:
```typescript
// Use mocked storage from tests/setup.ts
it('should store user ID in cookie', () => {
  const userId = getUserId();
  expect(document.cookie).toContain('carzo_user_id');
});

// Clean up after tests that modify storage
afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});
```

**3. Supabase Mocking**:
```typescript
import { createMockQueryBuilder, createMockVehicle } from '@/tests/mocks/supabase';

const mockVehicle = createMockVehicle({ make: 'Toyota', model: 'Camry' });
const mockSupabase = {
  from: () => createMockQueryBuilder({ data: [mockVehicle], error: null })
};
```

**4. Component Testing** (future):
```typescript
import { renderWithProviders } from '@/tests/utils';

it('should render button correctly', () => {
  const { getByText } = renderWithProviders(<Button>Click me</Button>);
  expect(getByText('Click me')).toBeInTheDocument();
});
```

### CI/CD Strategy

**Beginner-friendly approach** (not on every commit):

**Option 1: Manual Trigger + Pre-commit** (RECOMMENDED FOR MVP)
- **Pre-commit hook**: Runs tests locally before commit (fast feedback)
- **GitHub Actions**: Manual trigger only (button in Actions tab)
- **Benefits**: No surprises, full control, saves CI minutes
- **Setup**: Husky for pre-commit hooks

**Option 2: PR-Only Testing** (RECOMMENDED FOR PRODUCTION)
- **On PR creation/update**: Run full test suite automatically
- **On push to main**: Skip tests (assumed passing from PR)
- **Benefits**: Catches issues before merge, doesn't slow down development
- **Setup**: GitHub Actions with `on: pull_request`

**Option 3: Scheduled Testing** (NICE-TO-HAVE)
- **Daily or weekly**: Run full test suite including E2E
- **Benefits**: Catches regressions from external changes (APIs, deps)
- **Setup**: GitHub Actions with `on: schedule`

**Current Status**: No CI/CD yet (Phase 6 of testing plan)

### Testing Phases

**Completed:**
- ✅ **Phase 1**: Testing infrastructure (Vitest, config, mocks, utilities)
- ✅ **Phase 2**: Revenue-critical unit tests
  - ✅ lib/utils.ts - Tailwind cn() utility
  - ✅ lib/dealer-diversity.ts - Round-robin dealer algorithm
  - ✅ lib/flow-detection.ts - A/B testing flow routing
  - ✅ lib/user-tracking.ts - Cookie-based tracking
  - ✅ lib/rate-limit.ts - PostgreSQL rate limiting
  - ✅ lib/geolocation.ts - Distance calculations

**Upcoming:**
- ⏳ **Phase 3**: API route tests (track-click, track-impression, search-vehicles, etc.)
- ⏳ **Phase 4**: React component tests (Button, Input, VehicleCard, FilterSidebar)
- ⏳ **Phase 5**: E2E tests with Playwright (critical user flows)
- ⏳ **Phase 6**: CI/CD setup (GitHub Actions, pre-commit hooks)
- ⏳ **Phase 7**: Database tests (stored procedures, triggers - optional)

### Key Testing Principles

1. **Test business logic, not implementation details**
   - Test what the code DOES, not HOW it does it
   - Focus on inputs/outputs, not internal state

2. **Revenue-critical code gets 95%+ coverage**
   - Dealer diversification algorithm
   - Click tracking and deduplication
   - Flow routing logic

3. **SSR safety is mandatory**
   - All client-side functions must handle `typeof window === 'undefined'`
   - Test both browser and server environments

4. **Fast feedback loop**
   - Unit tests run in < 1s
   - Watch mode for instant feedback during development

5. **No flaky tests**
   - Deterministic tests only
   - No reliance on timing, external APIs, or network

### Debugging Tests

```bash
# Run a single test file
npm test lib/__tests__/dealer-diversity.test.ts

# Run tests matching a pattern
npm test -- --grep="round-robin"

# Run with verbose output
npm test -- --reporter=verbose

# Open Vitest UI for visual debugging
npm run test:ui
```

**Vitest UI Features:**
- Visual test runner in browser
- Click to run individual tests
- See test output, console logs, and errors
- Filter by test name or file
- Re-run failed tests only

## Key Metrics

### Success Metrics
- **Unique dealer clicks per session** (the money metric)
- **CTR to dealers** (target > 40% on VDP)
- **Dealer diversity score** (target > 80%)
- **Revenue per session** = unique_dealers_clicked × $0.80

### Analytics Dashboard Tracks
- Total clicks vs billable clicks
- Wasted clicks (duplicate dealers)
- Revenue (unique dealers × $0.80)
- Top performing vehicles
- CTR by traffic source (Facebook vs Google)
- Dealer diversity metrics
- **A/B Test Flow Performance** (Phase 6):
  - Flow A (Direct): Clicks, billable rate, revenue
  - Flow B (VDP-Only): Impressions, clicks, CTR, billable rate, revenue
  - Flow C (Full Funnel): Clicks, billable rate, revenue
  - Performance comparison summary (highest revenue, highest billable rate, most traffic)

## Known Constraints

- **ONE PAYMENT PER DEALER PER USER PER 30 DAYS** (most critical)
- Must diversify dealer exposure in all vehicle lists
- Cannot pre-generate all 72K vehicle pages (too slow - use on-demand ISR)
- All dealer links must open in new tab
- Must use LotLinx image CDN URLs (don't re-host)
- Click-through URLs contain LotLinx tracking parameters (do not modify)

## Architecture Decisions

### Why Next.js 16?
- Turbopack: 2-5x faster builds
- React 19 support
- Stable and production-ready
- Excellent Vercel integration

### Why Cookies Not JWT?
- No user accounts = no authentication needed
- Cookies simpler and faster
- Industry standard for anonymous tracking
- Can add JWT later if we add user accounts

### Why Dealer Diversification?
- Critical for revenue (1 payment per dealer per user)
- Round-robin ensures max dealer variety
- Directly impacts profitability

### Why On-Demand ISR for VDPs?
- Can't pre-generate 72K pages (too slow)
- Generate on first access, cache for 6 hours
- Popular vehicles pre-generated (top 1000)
- Perfect balance of speed and scalability

## Next.js 16 Documentation

**⚠️ Important:** Next.js 16 is very new (released late 2024). Our local documentation may become outdated as Next.js evolves.

**Project-Specific Docs** (always check these first):
- **[Next.js 16 Overview](./docs/nextjs-16/README.md)** - Quick start and version info
- **[Core Concepts](./docs/nextjs-16/01-core-concepts.md)** - App Router, routing, Server Components
- **[Data Fetching](./docs/nextjs-16/02-data-fetching.md)** - SSR, SSG, ISR patterns
- **[API Routes](./docs/nextjs-16/03-api-routes.md)** - Route handlers, proxy.ts (middleware)
- **[Carzo Patterns](./docs/nextjs-16/06-carzo-patterns.md)** - How WE use Next.js 16

**Official Next.js Resources** (source of truth):
- [Next.js Official Docs](https://nextjs.org/docs) - Always check here for latest
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16) - What's new
- [App Router Guide](https://nextjs.org/docs/app) - Core routing concepts
- [Data Fetching Guide](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Caching in Next.js](https://nextjs.org/docs/app/building-your-application/caching)

**Key Differences in Next.js 16:**
- `middleware.ts` → `proxy.ts` (Node.js runtime by default)
- Dynamic route `params` are now async (must `await`)
- Suspense boundaries required for `useSearchParams()`
- `unstable_*` cache APIs now stable (prefix removed)
- Turbopack default for dev (2-5x faster)

## Related Documentation

- **Next.js 16**: See `docs/nextjs-16/` for comprehensive guides
- **LotLinx Integration**: See `../lotlinx/docs/` for LotLinx API docs
- **Feed Structure**: See `../lotlinx/docs/lotlinx-publisher-feed.md`
- **Database Schema**: See `supabase-schema.sql` in this project
- **Supabase CLI Workflow**: See `docs/supabase-migration-workflow.md` for complete guide
  - **IMPORTANT**: Use Supabase CLI for ALL database/SQL work (not manual dashboard SQL)
  - Creating and applying migrations via `supabase db push`
  - Running ad-hoc SQL queries via CLI
  - Migration troubleshooting (reserved words, type casting, etc.)
  - Local testing with `supabase start`
  - Schema syncing between local and remote
  - Best practices for all database operations

## Rate Limiting

### Architecture

Carzo implements **PostgreSQL-based rate limiting** to protect PostgREST RPC endpoints from DoS attacks and scraping without requiring external services like Redis.

**Why PostgreSQL over Redis:**
- No external dependencies (everything stays in Supabase)
- No additional API keys to manage
- Unlogged tables provide ~3x faster writes than regular tables
- Sufficient performance for our use case
- Zero additional cost

**Implementation:**
- Unlogged tables (skip Write-Ahead Log for performance)
- Advisory locks prevent race conditions
- Automatic cleanup of old records
- Rate limit checks run server-side in PostgreSQL functions

### Rate Limit Configuration

```typescript
// lib/rate-limit.ts
export const RATE_LIMITS = {
  SEARCH_VEHICLES: { limit: 100, windowSeconds: 60 },   // 100/min
  FILTER_OPTIONS: { limit: 50, windowSeconds: 60 },     // 50/min
  BURST: { limit: 10, windowSeconds: 1 },               // 10/sec
  SESSION: { limit: 500, windowSeconds: 3600 },         // 500/hour
};
```

### Database Schema

```sql
-- Unlogged table for rate limit counters (fast writes)
CREATE UNLOGGED TABLE rate_limits (
  id BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,           -- IP or user ID
  endpoint TEXT NOT NULL,              -- API endpoint
  window_start TIMESTAMPTZ NOT NULL,   -- Window start time
  request_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Function: Check and increment rate limit atomically
CREATE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
) RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  limit_value INTEGER,
  window_reset TIMESTAMPTZ
);
```

### API Proxy Pattern

All PostGIS RPC calls go through rate-limited Next.js API routes:

```
Client → /api/search-vehicles → Rate Limit Check → Supabase RPC → Return
       ↳ /api/filter-options → Rate Limit Check → Supabase RPC → Return
```

**Benefits:**
1. Centralized rate limiting enforcement
2. Rate limit headers in responses (`X-RateLimit-*`)
3. Clean separation of concerns
4. Easy to monitor and adjust limits

### Usage Example

```typescript
// app/api/search-vehicles/route.ts
import { getClientIdentifier, checkMultipleRateLimits, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);

  // Check both per-minute and burst limits
  const rateLimitResult = await checkMultipleRateLimits(identifier, [
    { endpoint: 'search_vehicles', ...RATE_LIMITS.SEARCH_VEHICLES },
    { endpoint: 'search_vehicles_burst', ...RATE_LIMITS.BURST },
  ]);

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Proceed with request...
}
```

### Maintenance

**Cleanup old records** (prevents table bloat):
```sql
-- Manually via SQL
SELECT cleanup_rate_limits();

-- Or add to Vercel cron (vercel.json)
{
  "crons": [{
    "path": "/api/cron/cleanup-rate-limits",
    "schedule": "0 * * * *"  // Every hour
  }]
}
```

### Monitoring

Check rate limit status via response headers:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: ISO 8601 timestamp when window resets

### Deployment Checklist

- ✅ Run migration: `20251112000005_create_rate_limiting_tables.sql`
- ✅ Test rate limits work (see Testing section below)
- ✅ Monitor for false positives (shared IPs, proxies)
- ✅ Set up cron job for cleanup

### Testing Rate Limits

```bash
# Test with Apache Bench (100 requests, 10 concurrent)
ab -n 100 -c 10 -H "Content-Type: application/json" \
   -p payload.json \
   https://your-site.com/api/search-vehicles

# Should see HTTP 429 responses after hitting limit
```

## Location-Based Search with PostGIS

### Architecture

Carzo uses **PostGIS spatial queries** for high-performance location-based vehicle search. This provides 100x faster queries than client-side distance calculations.

**Performance:**
- Old approach: 3-5 seconds (fetch 10K records, calc distances in JS)
- PostGIS approach: ~50-100ms (database-level spatial index)

### PostGIS Setup

**Database Schema:**
```sql
-- location column stores lat/lon as PostGIS GEOGRAPHY
ALTER TABLE vehicles ADD COLUMN location GEOGRAPHY(Point, 4326);

-- GIST spatial index for fast radius queries
CREATE INDEX idx_vehicles_location_gist ON vehicles USING GIST(location);

-- Trigger auto-updates location from lat/lon on INSERT/UPDATE
CREATE TRIGGER trg_update_vehicle_location
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON vehicles FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_location();
```

**Stored Functions:**
```sql
-- Search vehicles within targeting radius
SELECT * FROM search_vehicles_by_location(
  user_lat := 33.7490,
  user_lon := -84.3880,
  p_make := 'Toyota',
  p_limit := 100
);

-- Get filter options for vehicles within radius
SELECT * FROM get_filter_options_by_location(
  user_lat := 33.7490,
  user_lon := -84.3880
);
```

### IP Geolocation with MaxMind

**Service**: MaxMind GeoIP2 Web Service API
**Purpose**: Detect user location from IP for radius-based vehicle filtering

```typescript
// lib/geolocation.ts
import { WebServiceClient } from '@maxmind/geoip2-node';

export async function getLocationFromIP(ipAddress: string): Promise<UserLocation | null> {
  const client = new WebServiceClient(accountId, licenseKey);
  const response = await client.city(ipAddress);
  return {
    city: response.city.names.en,
    state: response.subdivisions?.[0]?.isoCode,
    latitude: response.location.latitude,
    longitude: response.location.longitude,
  };
}
```

**Environment Variables:**
```bash
MAXMIND_ACCOUNT_ID=your_account_id
MAXMIND_LICENSE_KEY=your_license_key
```

**Localhost Fallback**: Returns Atlanta, GA (33.749, -84.388) for local development

**API Endpoint**: `/api/detect-location`
- Detects user IP using Next.js `headers()`
- Returns city, state, latitude, longitude
- Cached in sessionStorage on client

### Zip Code Lookup

**Package**: `zipcodes` npm package (40K+ US zip codes)

**API Endpoint**: `/api/zipcode-lookup?zip=30303`
```json
{
  "success": true,
  "location": {
    "city": "Atlanta",
    "state": "GA",
    "latitude": 33.7525,
    "longitude": -84.3888,
    "zipCode": "30303"
  }
}
```

**Component**: `<ZipCodeInput />` - Used on homepage and search page

### Radius-Based Search Filtering

**Database Fields:**
- `latitude DECIMAL(10, 7)` - Vehicle dealer location
- `longitude DECIMAL(10, 7)` - Vehicle dealer location
- `targeting_radius INT DEFAULT 30` - Search radius in miles (from LotLinx feed)

**Search Logic:**
1. User location detected via IP or zip code
2. Calculate distance to each vehicle using Haversine formula
3. Filter vehicles within their targeting_radius (90%+ are 30 miles)
4. Sort by distance (nearest first)
5. Apply dealer diversification

**Migration Files:**
- `20251111000002_add_location_columns.sql`
- `20251111000003_add_radius_column.sql`

## Git Workflow & Best Practices

**⚠️ CRITICAL: Never work directly on `main` branch**

### Branch-Based Development

**ALWAYS work on feature/bug fix branches, never on main:**

1. **Before Starting Any Work:**
   ```bash
   # Check current branch
   git branch --show-current

   # If on main, STOP and create a feature branch
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Branch Naming Conventions:**
   - Features: `feature/description` (e.g., `feature/vdp-photo-gallery`)
   - Bug fixes: `fix/description` (e.g., `fix/search-filter-crash`)
   - Documentation: `docs/description` (e.g., `docs/update-readme`)
   - Refactoring: `refactor/description` (e.g., `refactor/dealer-diversity`)
   - Hotfixes: `hotfix/description` (e.g., `hotfix/critical-security-patch`)

3. **Daily Workflow:**
   ```bash
   # Start of day: Pull latest main
   git checkout main
   git pull origin main

   # Create new feature branch
   git checkout -b feature/new-feature

   # Do your work, commit frequently
   git add <file1> <file2>... # Or use 'git add -p' to review changes before staging
   git commit -m "Descriptive commit message"

   # Push branch to GitHub
   git push -u origin feature/new-feature
   ```

4. **Merging to Main:**
   - **NEVER** merge directly to main locally
   - **ALWAYS** create a Pull Request on GitHub
   - Get code review (even self-review is better than nothing)
   - Merge via GitHub UI
   - Delete branch after merge

### Commit Message Guidelines

**Format:**
```
<type>: <short description>

<optional detailed description>

<optional footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring (no functionality change)
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks (deps, config)

**Examples:**
```bash
git commit -m "feat: add photo gallery teaser to VDP"
git commit -m "fix: resolve dealer diversification algorithm edge case"
git commit -m "docs: update Next.js 16 patterns documentation"
git commit -m "refactor: extract dealer click tracking to separate module"
```

### Pre-Commit Checklist

Before committing, verify:
- ✅ You're on a feature/fix branch (NOT main)
- ✅ Code builds successfully (`npm run build`)
- ✅ No TypeScript errors (`npm run type-check` if available)
- ✅ No secrets in code (check CLAUDE.md, use SECRETS.md)
- ✅ Commit message is descriptive

### Pull Request Guidelines

**Before Creating PR:**
1. Review your own changes first
2. Update CLAUDE.md if needed (architecture changes, new features)
3. Test locally (`npm run build && npm start`)
4. Rebase on latest main if needed

**PR Template:**
```markdown
## Summary
Brief description of changes

## Changes
- Bullet list of specific changes

## Testing
- How to test these changes
- Any new test cases added

## Screenshots (if UI changes)
[Add screenshots]

## Checklist
- [ ] Code builds successfully
- [ ] No TypeScript errors
- [ ] CLAUDE.md updated (if needed)
- [ ] No secrets committed
```

### Protected Branches

**Main Branch Rules:**
- Direct commits: ❌ NEVER
- Force push: ❌ NEVER
- Merging: ✅ Only via approved PRs
- Deployment: ✅ Vercel auto-deploys from main

### Quick Reference

```bash
# Check which branch you're on (DO THIS FIRST!)
git branch --show-current

# Create and switch to new branch
git checkout -b feature/my-feature

# See all branches
git branch -a

# Switch branches
git checkout branch-name

# Delete local branch (after merge)
git branch -d feature/my-feature

# Delete remote branch (after merge)
git push origin --delete feature/my-feature

# Push branch to GitHub
git push -u origin feature/my-feature

# Update your branch with latest main
git checkout main
git pull origin main
git checkout feature/my-feature
git rebase main  # Recommended to keep history clean and linear
```

### Emergency Hotfix Process

For critical production bugs:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# Make fix, commit
git add .
git commit -m "hotfix: resolve critical issue description"

# Push and create PR immediately
git push -u origin hotfix/critical-issue
gh pr create --title "HOTFIX: Critical issue" --body "Description" # Requires GitHub CLI (gh)

# Merge ASAP after review
# Deploy will auto-trigger from main
```

### Common Mistakes to Avoid

❌ **DON'T:**
- Work on main branch
- Commit secrets (use SECRETS.md)
- Force push to main
- Merge without PR
- Use vague commit messages ("fix stuff", "updates")
- Leave branches unmerged for weeks

✅ **DO:**
- Always create a branch before starting work
- Write descriptive commit messages
- Create PRs for all changes
- Keep branches focused and short-lived
- Delete merged branches
- Pull main regularly to stay updated

## Current Status

**All Core Features Complete:**
- ✅ Next.js 16 project with Turbopack
- ✅ Supabase project configured
- ✅ Database schema with 72,051 vehicles loaded
- ✅ User tracking system (cookie-based)
- ✅ Dealer diversification algorithm
- ✅ VDP bridge page (conversion-optimized)
- ✅ Click tracking API with 30-day deduplication
- ✅ Search results page with filters and dealer diversification
- ✅ Homepage with Carzo branding and hero search
- ✅ Analytics dashboard with billable/non-billable breakdown
- ✅ Feed sync (LotLinx) with 4x daily cron schedule
- ✅ IP geolocation (MaxMind) with localhost fallback
- ✅ Zip code lookup for location search
- ✅ **PostGIS spatial queries (100x faster location-based search)**
- ✅ **GIST spatial index for fast radius queries**
- ✅ **Stored procedures for location filtering**
- ✅ **Auto-trigger updates location from lat/lon**
- ✅ Radius-based vehicle filtering (30-mile default)
- ✅ All components wrapped in Suspense boundaries (Next.js 16 requirement)
- ✅ TypeScript types for all untyped packages
- ✅ Production build passing with no errors
- ✅ Comprehensive SEO metadata (Open Graph, Twitter, robots)
- ✅ Schema.org/Vehicle structured data for Rich Snippets
- ✅ Error boundaries (global, search, VDP)
- ✅ Loading states with detailed skeletons
- ✅ Functional hero search with smart parsing
- ✅ Sorting controls (7 options: relevance, price, year, mileage)
- ✅ Filter debouncing (800ms) with loading indicators
- ✅ Accessibility (ARIA labels, skip links, semantic HTML)
- ✅ Empty states with clear calls-to-action
- ✅ Image fallback handling with placeholder SVG
- ✅ **Tailwind CSS v4 design system (Phase 1)**
- ✅ **UI Component Library (Phase 2)**
  - Button component with 6 variants (primary, brand, dealer, secondary, outline, ghost) + icon size
  - Input component with error states
  - Badge component with 7 variants
  - Card components (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
  - cn() utility for conditional class merging
  - All components fully typed with TypeScript
  - All existing components refactored to use new UI library
  - React.forwardRef pattern for all components
  - Radix UI Slot integration for asChild pattern
- ✅ **Mobile Optimization (Phase 3)**
  - Mobile-first responsive design (lg breakpoint at 1024px)
  - Filter drawer with slide-in animation (300ms ease-in-out)
  - Fixed bottom filter button with active count badge
  - Backdrop overlay with proper z-index layering (z-40/50/60)
- ✅ **Tailwind v4 Migration Complete (Phase 5)**
  - All components use focus-visible: for WCAG 2.1 accessibility compliance
  - All hard-coded colors converted to semantic tokens (bg-brand, text-error, etc.)
  - Removed inline styles (blur effects, transitions) → Tailwind utilities
  - Added .bg-primary-gradient custom utility class
  - Button component migration with asChild pattern for links
  - Template literals replaced with cn() utility
  - All error states use semantic error color
  - 13 files refactored, production build passing
  - Body scroll lock when drawer is open
  - Touch-friendly button sizes (40x40px minimum for WCAG Level AAA)
  - Responsive hero search (stacks on mobile, horizontal on desktop)
  - Bottom padding on search page for mobile filter button (pb-24 lg:pb-8)
  - All components tested at mobile/tablet/desktop breakpoints
- ✅ **Animations & Transitions (Phase 4)**
  - Custom keyframe animations (fadeIn, slideInLeft/Right, scaleIn, skeleton-pulse)
  - Smooth scroll behavior with accessibility support
  - Prefers-reduced-motion support (WCAG 2.1 compliance)
  - Enhanced loading states with skeleton-pulse animation
  - Transition utilities (transition-smooth, transition-smooth-slow)
  - Proper z-index hierarchy for overlays and drawers
  - All animations respect user motion preferences
- ✅ **A/B Test Flow Routing (Phases 1-7)**
  - Flow A (Direct): SERP → Dealer (skip VDP, `?flow=direct`)
  - Flow B (VDP-Only): Ad → VDP → Dealer (auto-redirect, `?flow=vdp-only`)
  - Flow C (Full Funnel): SERP → VDP → Dealer (traditional bridge page)
  - Flow detection utilities and parameter preservation
  - Conditional routing in VehicleCard component
  - VDP redirect logic with impression tracking
  - Flow preservation across filters, pagination, sorting
  - Database schema with flow columns (clicks, impressions)
  - `/api/track-impression` endpoint for Flow B tracking
  - Manual browser testing completed (all flows verified)
  - Database verification completed (all tracking working)
  - Analytics dashboard with flow performance widget (Phase 6)
  - Flow comparison: clicks, billable rate, revenue, CTR (Flow B only)
  - Performance summary: highest revenue, billable rate, traffic
- ✅ **Testing Infrastructure (Phase 1 Complete)**
  - Vitest v4 testing framework configured (2-5x faster than Jest)
  - @testing-library/react v16 for React 19 component testing
  - happy-dom environment (2x faster than jsdom)
  - @vitest/coverage-v8 for code coverage reporting
  - @vitest/ui for browser-based test debugging
  - Test setup with mocks for window, localStorage, sessionStorage, fetch
  - Supabase client mocking utilities (chainable query builders)
  - Test helper functions (renderWithProviders, mock router, etc.)
  - All tests passing with high overall coverage
  - **Revenue-critical unit tests (Phase 2 Complete)**:
    - lib/utils.ts - Tailwind cn() utility
    - lib/dealer-diversity.ts - Round-robin dealer algorithm
    - lib/flow-detection.ts - A/B testing flow routing
    - lib/user-tracking.ts - Cookie-based tracking
    - lib/rate-limit.ts - PostgreSQL rate limiting
    - lib/geolocation.ts - Distance calculations
  - TypeScript type checking passing with no errors
  - Production build passing (test files excluded from Next.js build)
  - Test scripts in package.json (test, test:watch, test:ui, test:coverage)
  - SSR-safe testing patterns for Next.js 16
  - Comprehensive test documentation in CLAUDE.md

**Ready for deployment to Vercel**

---

**Last Updated**: 2025-11-12
**Project Started**: 2025-11-11
- after considering and addressing feedback on PRs in github from gemini-code-assist, remember to add comment to PR and tag gemini-code-assist noting what you did or did not do and why