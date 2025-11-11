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
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Images**: Sharp (blur generation for photo tease)
- **User Tracking**: Cookie-based (no JWT - anonymous tracking only)
- **Feed Source**: LotLinx Publisher Feed (72K+ vehicles, 4x daily updates)

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
```

## File Structure

```
carzo/
├── app/
│   ├── page.tsx                        # Homepage with hero search
│   ├── layout.tsx                      # Root layout (Carzo branding)
│   ├── search/page.tsx                 # Search results with location filtering
│   ├── vehicles/[vin]/page.tsx         # VDP bridge page (THE MONEY PAGE)
│   ├── admin/
│   │   ├── page.tsx                    # Analytics dashboard
│   │   └── login/page.tsx              # Admin login
│   └── api/
│       ├── track-click/route.ts        # Click tracking with deduplication
│       ├── detect-location/route.ts    # IP geolocation (MaxMind)
│       ├── zipcode-lookup/route.ts     # Zip code to coordinates
│       └── cron/sync-feed/route.ts     # Feed sync (4x daily)
├── components/
│   ├── Search/
│   │   ├── SearchResults.tsx           # Results grid with pagination
│   │   ├── FilterSidebar.tsx           # Filter controls
│   │   ├── VehicleCard.tsx             # Vehicle card component
│   │   └── LocationDetector.tsx        # IP-based location detection
│   ├── Location/
│   │   └── ZipCodeInput.tsx            # Zip code search input
│   ├── Home/
│   │   └── HeroSearch.tsx              # Homepage hero with search
│   └── Admin/
│       └── DashboardStats.tsx          # Analytics widgets
├── lib/
│   ├── supabase.ts                     # Supabase client + types
│   ├── user-tracking.ts                # Cookie-based user tracking
│   ├── dealer-diversity.ts             # Revenue optimization algorithm
│   ├── feed-sync.ts                    # LotLinx feed integration
│   ├── geolocation.ts                  # MaxMind GeoIP + Haversine
│   └── revenue.ts                      # Revenue calculation
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

## Location-Based Search

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

// Calculate distance using Haversine formula (returns miles)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number
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
- ✅ Radius-based vehicle filtering (30-mile default)
- ✅ All components wrapped in Suspense boundaries (Next.js 16 requirement)
- ✅ TypeScript types for all untyped packages
- ✅ Production build passing with no errors

**Ready for deployment to Vercel**

---

**Last Updated**: 2025-11-11
**Project Started**: 2025-11-11
