# A/B Test Flow Implementation - COMPLETE

**Status**: ✅ Complete
**Branch**: `feature/ab-test-flow-routing` (merged)
**Started**: 2025-11-12
**Completed**: 2025-11-12
**Actual Duration**: ~8 hours (Phases 1-7 complete)

---

> **NOTE**: This document now serves as a **historical reference** for the A/B test flow implementation.
>
> **For current implementation details, see:**
> - `CLAUDE.md` - Current architecture and status
> - `docs/manual-test-results.md` - Browser testing results
> - `docs/analytics-dashboard-flow-widget.md` - Phase 6 analytics dashboard
> - `scripts/verify-tracking.ts` - Database verification tool

---

---

## Background & Context

### Business Model Reminder
- **Revenue**: $0.80 per UNIQUE dealer click per user per 30-day window
- **Payment Requirement**: User must engage on dealer site (not just click through)
- **Critical Constraint**: Multiple clicks to same dealer = only paid ONCE
- **Strategy**: Maximize unique dealer clicks per session

### Traffic Sources
- Facebook Ads (primary)
- YouTube Shorts
- Google Display Network
- Taboola
- Other display/social (NOT search - early funnel browsers)

### Budget
- Medium ($2K-10K/month)
- Cannot compete on volume alone
- Must optimize revenue per user (session depth strategy)

### Core Tension
**Must balance:**
1. **Legitimacy** - Look like real marketplace (not spam/arbitrage)
2. **Performance** - High CTR to dealers (40%+ target) for profitability

---

## Competitor Analysis Insights

### What We Learned
- Competitor has SAME feed (LotLinx) and SAME monetization ($0.80/unique dealer)
- They use direct-to-dealer flow (Ad → Landing → "REQUEST QUOTE" → Dealer)
- No VDP bridge page in their flow
- Very clean mobile UX with vertical stack of vehicles

### Our Strategic Bet
We're choosing **VDP bridge strategy** (different from competitor) because:

1. **Pre-Qualification**: VDP warms up user before dealer click
   - User commits mentally ("I want to see photos")
   - Arrives at dealer site engaged → higher payment rate

2. **Photo Gallery Tease**: Creates FOMO
   - Blurred thumbnails + "+15 More Photos"
   - Irresistible CTA: "See Full Photo Gallery"

3. **Multiple CTA Opportunities**: 3x chances to click
   - Primary: "See Photos"
   - Secondary: "Vehicle History"
   - Tertiary: "Payment Calculator"

4. **Trust Building**: Two-page funnel feels legitimate
   - Verified listing badges
   - Detailed vehicle specs
   - Professional design

5. **Session Depth**: Keeps user browsing
   - Related Vehicles section (different dealers)
   - Target: 3-5 dealer clicks per session
   - Maximizes revenue per user with limited ad budget

### Why Competitor Might Skip VDP
- Likely volume strategy (10x our ad spend)
- Optimize for single high-CTR click per user
- Scale through ad budget, not session depth
- Different traffic sources or testing data we don't have

### Why We're Testing Both
- Don't know which is better for OUR circumstances
- Need data to validate VDP bridge hypothesis
- A/B test will reveal winner based on revenue per impression

---

## The Three Flows

### Flow C (DEFAULT - No flow param): SERP → VDP → Dealer
**URL Example**: `/search?make=toyota&location=seattle`

**When to use**:
- All organic traffic
- Default for all paid ads (unless testing)
- Display/social ads (Facebook, YouTube, GDN)

**Strategy**:
- Full funnel with trust-building + photo gallery tease
- VDP acts as "confirmation bridge"
- Balance legitimacy with high CTR

**Goals**:
- 40%+ CTR to dealer from VDP
- 70%+ engagement rate (billable / total clicks)
- 3-5 unique dealer clicks per session

**User Journey**:
1. Clicks ad → Lands on SERP
2. Sees filtered vehicles (dealer-diversified)
3. Clicks vehicle card → VDP loads
4. Sees blurred photos + "See Full Photo Gallery" CTA
5. Clicks CTA → Opens dealer site (new tab)
6. Sees "Related Vehicles" → Clicks another (different dealer)
7. Repeat → Multiple dealer clicks per session

---

### Flow A (TEST): SERP → Dealer (skip VDP)
**URL Example**: `/search?make=toyota&flow=direct`

**When to use**:
- Test variant for comparison
- Potentially high-volume, low-budget scenarios
- Bottom-funnel traffic (if we add search ads later)

**Strategy**:
- Minimize friction
- Direct dealer links from vehicle cards
- Optimize for raw CTR over engagement

**Goals**:
- 50%+ raw CTR (less friction)
- BUT potentially lower engagement rate (~50%?)
- Test if speed > trust for certain traffic

**User Journey**:
1. Clicks ad → Lands on SERP
2. Sees filtered vehicles
3. Clicks vehicle card → Opens dealer site (new tab)
4. May click back → Clicks another vehicle → Another dealer

**Risks**:
- User not "warmed up" (may bounce on dealer site)
- Lower engagement = no payment despite click
- Less legitimate (feels like spam)
- Only one CTA opportunity per vehicle

---

### Flow B (TEST): Ad → VDP → Dealer (skip SERP)
**URL Example**: `/vehicles/ABC123?flow=vdp-only&utm_source=fb-ad`

**When to use**:
- Vehicle-specific ads (Facebook DPA, retargeting)
- Lookalike audiences
- Specific vehicle promos

**Strategy**:
- Skip SERP entirely
- Land directly on VDP
- Auto-redirect to dealer after 1.5s tracking delay

**Goals**:
- 60%+ CTR (highly targeted users)
- 80%+ engagement rate (very committed)
- Single high-quality click per user

**User Journey**:
1. Clicks vehicle-specific ad → Lands on VDP
2. Sees "Redirecting to 2019 Toyota Camry..." message
3. 1.5s delay (tracking impression + click)
4. Auto-redirects to dealer site (new tab)

**Implementation**:
```tsx
if (flow === 'vdp-only') {
  useEffect(() => {
    // Track impression + click
    trackImpression({ vehicleId, flow: 'vdp-only' });
    trackClick({ vehicleId, dealerId, ctaClicked: 'vdp_redirect', flow: 'vdp-only' });

    // Redirect after delay
    const timer = setTimeout(() => {
      window.open(vehicle.dealer_vdp_url, '_blank');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1>Redirecting to {vehicle.year} {vehicle.make} {vehicle.model}...</h1>
        <p>Taking you to the dealer site</p>
        <Spinner />
      </div>
    </div>
  );
}
```

---

## URL Parameter Schema

### Primary Parameter: `flow`
- Values: `direct`, `vdp-only`, or no param (default to Flow C)
- Semantic meaning: describes user's journey through the funnel
- Easy to understand in analytics

### Flow + Filter Combinations
All existing filters work with any flow:

```
/search?
  location=seattle          ← Filter
  &make=toyota              ← Filter
  &model=camry              ← Filter
  &minPrice=20000           ← Filter
  &maxPrice=40000           ← Filter
  &condition=used           ← Filter
  &bodyStyle=sedan          ← Filter
  &flow=direct              ← Flow variant
  &utm_source=facebook      ← UTM tracking
```

**Key Point**: `flow` parameter is independent from search filters. It only affects routing behavior, not search results.

### Flow Preservation
Flow parameter persists through all navigation:
- Applying filters: ✅ Flow preserved
- Pagination: ✅ Flow preserved
- Clicking vehicle cards: ✅ Flow preserved
- Sorting: ✅ Flow preserved

**Implementation**: Use `URLSearchParams` to automatically preserve all params when modifying URL.

---

## Database Schema Changes

### Migration: Add `flow` Column to `clicks`

```sql
-- 20251112000000_add_flow_to_clicks.sql
ALTER TABLE clicks ADD COLUMN flow VARCHAR(20) DEFAULT 'full';
CREATE INDEX idx_clicks_flow ON clicks(flow);

COMMENT ON COLUMN clicks.flow IS 'A/B test flow variant: direct, vdp-only, full (default)';
```

### Migration: Add `flow` Column to `impressions`

```sql
-- 20251112000001_add_flow_to_impressions.sql
ALTER TABLE impressions ADD COLUMN flow VARCHAR(20) DEFAULT 'full';
CREATE INDEX idx_impressions_flow ON impressions(flow);

COMMENT ON COLUMN impressions.flow IS 'A/B test flow variant: direct, vdp-only, full (default)';
```

### Updated CTA Types

Extend `cta_clicked` enum to include:
- `primary` - Main VDP CTA (existing)
- `history` - Vehicle history CTA (existing)
- `payment` - Payment calculator CTA (existing)
- `photos` - Photo gallery tease CTA (existing)
- `serp_direct` - **NEW**: SERP card clicked in Flow A
- `vdp_redirect` - **NEW**: VDP auto-redirect in Flow B

---

## Implementation Phases

> **All phases completed successfully on 2025-11-12**
>
> - ✅ Phase 1: Database schema with flow columns
> - ✅ Phase 2: Flow detection utilities
> - ✅ Phase 3: VehicleCard conditional routing
> - ✅ Phase 4: VDP redirect logic
> - ✅ Phase 5: Flow preservation across navigation
> - ✅ Phase 6: Analytics dashboard with flow performance widget
> - ✅ Phase 7: Manual browser testing & database verification
> - ⏭️ Phase 8: Documentation (updated CLAUDE.md, created new docs)

---

### Phase 1: Database Schema ✅ COMPLETE
**Files**:
- `supabase/migrations/20251112000000_add_flow_to_clicks.sql`
- `supabase/migrations/20251112000001_add_flow_to_impressions.sql`

**Tasks**:
1. Create migration files
2. Test locally: `supabase db push`
3. Verify columns created with correct types
4. Verify indexes created
5. Deploy to production (when ready)

---

### Phase 2: Flow Detection Utilities (2 hours)
**Files**:
- `lib/flow-detection.ts` (new)
- `app/api/track-click/route.ts` (update)
- `hooks/useClickTracking.ts` (update - if exists)

**Tasks**:

#### 2.1 Create Flow Detection Utility
```typescript
// lib/flow-detection.ts
export type UserFlow = 'direct' | 'vdp-only' | 'full';

export function getFlowFromUrl(): UserFlow {
  if (typeof window === 'undefined') return 'full';

  const params = new URLSearchParams(window.location.search);
  const flow = params.get('flow');

  if (flow === 'direct' || flow === 'vdp-only') {
    return flow;
  }

  return 'full'; // Default
}

export function preserveFlowParam(targetPath: string): string {
  if (typeof window === 'undefined') return targetPath;

  const params = new URLSearchParams(window.location.search);
  const flow = params.get('flow');

  if (!flow) return targetPath;

  const url = new URL(targetPath, window.location.origin);
  url.searchParams.set('flow', flow);
  return url.pathname + url.search;
}

export function addFlowParam(url: string, flow: UserFlow): string {
  const urlObj = new URL(url, window.location.origin);
  urlObj.searchParams.set('flow', flow);
  return urlObj.toString();
}
```

#### 2.2 Update Click Tracking API
```typescript
// app/api/track-click/route.ts
const { vehicleId, dealerId, userId, sessionId, ctaClicked, flow } = body;

// Validate flow
const validFlows = ['direct', 'vdp-only', 'full'];
const normalizedFlow = validFlows.includes(flow) ? flow : 'full';

await supabaseAdmin.from('clicks').insert({
  vehicle_id: vehicleId,
  dealer_id: dealerId,
  user_id: userId,
  session_id: sessionId,
  is_billable: isBillable,
  cta_clicked: ctaClicked || 'primary',
  flow: normalizedFlow, // NEW
  created_at: new Date().toISOString(),
});
```

---

### Phase 3: VehicleCard Component (2 hours)
**Files**:
- `components/Search/VehicleCard.tsx` (update)

**Tasks**:

#### 3.1 Add Flow Detection
```typescript
'use client';

import { useEffect, useState } from 'react';
import { getFlowFromUrl } from '@/lib/flow-detection';

interface VehicleCardProps {
  vehicle: Vehicle & { distance_miles?: number };
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const [flow, setFlow] = useState<UserFlow>('full');

  useEffect(() => {
    setFlow(getFlowFromUrl());
  }, []);

  // ... rest of component
}
```

#### 3.2 Conditional Link Destination
```typescript
// Determine link destination based on flow
const isDirectFlow = flow === 'direct';
const linkHref = isDirectFlow
  ? vehicle.dealer_vdp_url  // Flow A: Direct to dealer
  : `/vehicles/${vehicle.vin}${flow !== 'full' ? `?flow=${flow}` : ''}`; // Flow C: To VDP

const linkTarget = isDirectFlow ? '_blank' : '_self';
const linkRel = isDirectFlow ? 'noopener noreferrer' : undefined;
```

#### 3.3 Click Tracking for Flow A
```typescript
// Track click for Flow A (direct to dealer)
const handleClick = () => {
  if (isDirectFlow) {
    // Use fetch with keepalive for reliable tracking
    fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: vehicle.id,
        dealerId: vehicle.dealer_id,
        userId: getUserId(),
        sessionId: getSessionId(),
        ctaClicked: 'serp_direct',
        flow: 'direct',
      }),
      keepalive: true, // Ensures request completes even if tab closes
    });
  }
};

return (
  <Link
    href={linkHref}
    target={linkTarget}
    rel={linkRel}
    onClick={handleClick}
    className="group bg-white rounded-lg border..."
  >
    {/* Card content */}
  </Link>
);
```

---

### Phase 4: VDP Page (2 hours)
**Files**:
- `app/vehicles/[vin]/page.tsx` (update)
- `components/VDP/VehicleBridgePage.tsx` (update)

**Tasks**:

#### 4.1 Detect Flow in VDP Page
```typescript
// app/vehicles/[vin]/page.tsx
export default async function VehicleDetailPage({ params, searchParams }: PageProps) {
  const { vin } = await params;
  const sp = await searchParams;
  const flow = sp?.flow || 'full';

  const vehicle = await getVehicle(vin);

  if (!vehicle) {
    notFound();
  }

  return (
    <>
      {/* Schema.org structured data */}
      <script type="application/ld+json" {...} />

      {/* Pass flow to component */}
      <VehicleBridgePage vehicle={vehicle} flow={flow} />
    </>
  );
}
```

#### 4.2 Implement Flow B Redirect Logic
```typescript
// components/VDP/VehicleBridgePage.tsx
interface VehicleBridgePageProps {
  vehicle: Vehicle;
  flow?: 'direct' | 'vdp-only' | 'full';
}

export default function VehicleBridgePage({ vehicle, flow = 'full' }: VehicleBridgePageProps) {
  // Flow B: Auto-redirect after tracking
  if (flow === 'vdp-only') {
    return <VDPRedirect vehicle={vehicle} />;
  }

  // Flow C (default): Full VDP bridge
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Existing VDP content */}
    </div>
  );
}

function VDPRedirect({ vehicle }: { vehicle: Vehicle }) {
  useEffect(() => {
    // Track impression
    fetch('/api/track-impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: vehicle.id,
        pageType: 'vdp',
        flow: 'vdp-only',
      }),
      keepalive: true,
    });

    // Track click
    fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: vehicle.id,
        dealerId: vehicle.dealer_id,
        userId: getUserId(),
        sessionId: getSessionId(),
        ctaClicked: 'vdp_redirect',
        flow: 'vdp-only',
      }),
      keepalive: true,
    });

    // Redirect after delay
    const timer = setTimeout(() => {
      window.open(vehicle.dealer_vdp_url, '_blank');
    }, 1500);

    return () => clearTimeout(timer);
  }, [vehicle]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <h1 className="text-2xl font-bold">
          Redirecting to {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <p className="text-muted-foreground">
          Taking you to the dealer site...
        </p>
      </div>
    </div>
  );
}
```

---

### Phase 5: Flow Preservation (2 hours)
**Files**:
- `components/Search/FilterSidebar.tsx` (update)
- `components/Search/SearchResults.tsx` (update - pagination)
- Any other components with internal links

**Tasks**:

#### 5.1 Update FilterSidebar
```typescript
// components/Search/FilterSidebar.tsx
const applyFilter = (filterName: string, value: string) => {
  const params = new URLSearchParams(window.location.search);

  if (value) {
    params.set(filterName, value);
  } else {
    params.delete(filterName);
  }

  // Flow param automatically preserved (already in params)
  router.push(`/search?${params.toString()}`);
};
```

#### 5.2 Update Pagination
```typescript
// components/Search/SearchResults.tsx
const buildPageUrl = (pageNum: number) => {
  const params = new URLSearchParams(window.location.search);
  params.set('page', pageNum.toString());
  // Flow param automatically preserved
  return `/search?${params.toString()}`;
};

// In render:
<Link href={buildPageUrl(page + 1)}>Next</Link>
```

#### 5.3 Update Hero Search
```typescript
// components/Home/HeroSearch.tsx
const handleSearch = () => {
  const params = new URLSearchParams({
    location: location,
    make: selectedMake,
  });

  // Preserve flow if present (for testing)
  const currentFlow = new URLSearchParams(window.location.search).get('flow');
  if (currentFlow) {
    params.set('flow', currentFlow);
  }

  router.push(`/search?${params.toString()}`);
};
```

---

### Phase 6: Analytics Dashboard (4 hours)
**Files**:
- `app/admin/page.tsx` (update)
- `components/Admin/FlowPerformance.tsx` (new)
- `lib/analytics-queries.ts` (new or update)

**Tasks**:

#### 6.1 Create Flow Performance Queries
```typescript
// lib/analytics-queries.ts
export async function getFlowPerformance(startDate: Date, endDate: Date) {
  const { data, error } = await supabase.rpc('get_flow_performance', {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  });

  return data;
}

// SQL function in migration:
CREATE OR REPLACE FUNCTION get_flow_performance(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  flow VARCHAR(20),
  impressions BIGINT,
  total_clicks BIGINT,
  billable_clicks BIGINT,
  revenue DECIMAL(10,2),
  ctr DECIMAL(5,2),
  engagement_rate DECIMAL(5,2),
  revenue_per_impression DECIMAL(10,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(c.flow, 'full') as flow,
    COUNT(DISTINCT i.id) as impressions,
    COUNT(c.id) as total_clicks,
    COUNT(c.id) FILTER (WHERE c.is_billable = true) as billable_clicks,
    (COUNT(c.id) FILTER (WHERE c.is_billable = true) * 0.80)::DECIMAL(10,2) as revenue,
    (COUNT(c.id)::FLOAT / NULLIF(COUNT(DISTINCT i.id), 0) * 100)::DECIMAL(5,2) as ctr,
    (COUNT(c.id) FILTER (WHERE c.is_billable = true)::FLOAT / NULLIF(COUNT(c.id), 0) * 100)::DECIMAL(5,2) as engagement_rate,
    ((COUNT(c.id) FILTER (WHERE c.is_billable = true) * 0.80)::FLOAT / NULLIF(COUNT(DISTINCT i.id), 0))::DECIMAL(10,4) as revenue_per_impression
  FROM impressions i
  LEFT JOIN clicks c ON i.flow = c.flow
  WHERE i.created_at BETWEEN start_date AND end_date
  GROUP BY COALESCE(c.flow, 'full');
END;
$$ LANGUAGE plpgsql;
```

#### 6.2 Create Flow Performance Widget
```typescript
// components/Admin/FlowPerformance.tsx
export default function FlowPerformance({ data }: { data: FlowPerformanceData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Flow Performance Comparison</CardTitle>
        <CardDescription>A/B test results by flow variant</CardDescription>
      </CardHeader>
      <CardContent>
        <table className="w-full">
          <thead>
            <tr>
              <th>Flow</th>
              <th>Impressions</th>
              <th>Clicks</th>
              <th>Billable</th>
              <th>CTR</th>
              <th>Engagement</th>
              <th>Revenue</th>
              <th>Rev/Impression</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.flow}>
                <td>{getFlowLabel(row.flow)}</td>
                <td>{row.impressions.toLocaleString()}</td>
                <td>{row.total_clicks.toLocaleString()}</td>
                <td>{row.billable_clicks.toLocaleString()}</td>
                <td>{row.ctr}%</td>
                <td>{row.engagement_rate}%</td>
                <td>${row.revenue}</td>
                <td className="font-bold">${row.revenue_per_impression}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function getFlowLabel(flow: string) {
  const labels = {
    full: 'Flow C: SERP → VDP → Dealer (Default)',
    direct: 'Flow A: SERP → Dealer (Direct)',
    'vdp-only': 'Flow B: VDP → Dealer (VDP-Only)',
  };
  return labels[flow] || flow;
}
```

#### 6.3 Add to Admin Dashboard
```typescript
// app/admin/page.tsx
const flowPerformance = await getFlowPerformance(
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
  new Date()
);

return (
  <div className="space-y-8">
    <h1>Analytics Dashboard</h1>

    {/* Existing widgets */}
    <DashboardStats {...} />

    {/* NEW: Flow comparison */}
    <FlowPerformance data={flowPerformance} />

    {/* Other widgets */}
  </div>
);
```

---

### Phase 7: Testing & Validation (4 hours)
**Testing Checklist**:

#### 7.1 Flow A (Direct) Testing
- [ ] Navigate to `/search?make=toyota&flow=direct`
- [ ] Verify vehicle cards show all filters working
- [ ] Click vehicle card → Opens dealer site in new tab
- [ ] Check Network tab: `/api/track-click` called with `flow: 'direct'`
- [ ] Verify click recorded in database with `cta_clicked: 'serp_direct'`
- [ ] Apply filter (price) → Verify `flow=direct` preserved in URL
- [ ] Paginate → Verify `flow=direct` preserved
- [ ] Check dealer deduplication works (click same dealer twice in 30 days)

#### 7.2 Flow B (VDP-Only) Testing
- [ ] Navigate to `/vehicles/ABC123?flow=vdp-only`
- [ ] Verify "Redirecting..." message appears
- [ ] Wait 1.5s → Verify dealer site opens in new tab
- [ ] Check Network tab: Both `/api/track-impression` and `/api/track-click` called
- [ ] Verify impression + click recorded with `flow: 'vdp-only'`
- [ ] Test with invalid VIN → Verify 404 handling

#### 7.3 Flow C (Default) Testing
- [ ] Navigate to `/search?make=toyota` (no flow param)
- [ ] Verify vehicle cards link to VDP (not dealer)
- [ ] Click vehicle card → Loads VDP (same tab)
- [ ] Verify VDP shows full bridge page content
- [ ] Click "See Full Photo Gallery" → Opens dealer site in new tab
- [ ] Verify click recorded with `flow: 'full'`
- [ ] Click "Vehicle History" → Opens dealer site in new tab
- [ ] Verify click recorded with `cta_clicked: 'history'`
- [ ] Apply filters on SERP → Verify flow preserved through navigation
- [ ] Paginate → Verify default flow behavior maintained

#### 7.4 Mobile Testing
- [ ] Test all three flows on mobile viewport (375px)
- [ ] Verify buttons are touch-friendly (40x40px minimum)
- [ ] Verify filter drawer works with flow preservation
- [ ] Test sticky CTA on VDP mobile view
- [ ] Check page load speeds (<2s LCP target)

#### 7.5 Flow Preservation Testing
- [ ] Start with `?flow=direct`
- [ ] Apply make filter → Verify `flow=direct` in URL
- [ ] Apply price filter → Verify `flow=direct` in URL
- [ ] Paginate → Verify `flow=direct` in URL
- [ ] Sort results → Verify `flow=direct` in URL
- [ ] Clear filters → Verify `flow=direct` still in URL

#### 7.6 Analytics Testing
- [ ] Generate test data (20+ clicks per flow)
- [ ] Navigate to `/admin`
- [ ] Verify Flow Performance widget displays
- [ ] Check metrics calculate correctly:
  - CTR = clicks / impressions
  - Engagement Rate = billable / total clicks
  - Revenue = billable clicks × $0.80
  - Revenue per Impression = revenue / impressions
- [ ] Verify flow labels display correctly

#### 7.7 Edge Cases
- [ ] Navigate to VDP without flow param → Should default to Flow C
- [ ] Navigate to SERP with invalid flow param → Should default to Flow C
- [ ] Test with special characters in filters + flow param
- [ ] Test with very long URLs (all filters + flow)
- [ ] Test back button behavior for each flow
- [ ] Test browser refresh preserves flow

---

### Phase 8: Documentation (1 hour)
**Files**:
- `CLAUDE.md` (update)
- `docs/marketing-url-guide.md` (new)
- `docs/ab-test-methodology.md` (new)

**Tasks**:

#### 8.1 Update CLAUDE.md
Add section on A/B testing:
```markdown
## A/B Test Flow Architecture

### Three Flow Variants

**Flow C (Default - No param)**: SERP → VDP → Dealer
- Full funnel with photo gallery tease
- Target: 40%+ CTR, 70%+ engagement
- Best for: Display/social ads

**Flow A (Test)**: SERP → Dealer
- URL: `?flow=direct`
- Direct dealer links from SERP
- Test for: Speed vs trust

**Flow B (Test)**: Ad → VDP → Dealer
- URL: `?flow=vdp-only`
- Vehicle-specific landing pages
- Best for: Retargeting, DPA

### Implementation Files
- Flow detection: `lib/flow-detection.ts`
- Click tracking: `app/api/track-click/route.ts`
- VehicleCard: `components/Search/VehicleCard.tsx`
- VDP page: `app/vehicles/[vin]/page.tsx`
- Analytics: `components/Admin/FlowPerformance.tsx`

### Database Schema
- `clicks.flow` - VARCHAR(20), default 'full'
- `impressions.flow` - VARCHAR(20), default 'full'
```

#### 8.2 Create Marketing URL Guide
```markdown
# Marketing URL Guide - A/B Testing

## Flow Variant URLs

### Flow C (Default): Full Funnel
```
https://carzo.net/search?location=seattle&make=toyota&utm_source=facebook
```
- No `flow` parameter = default behavior
- SERP → VDP → Dealer
- Recommended for most campaigns

### Flow A (Test): Direct to Dealer
```
https://carzo.net/search?location=seattle&make=toyota&flow=direct&utm_source=facebook
```
- Add `&flow=direct` to any SERP URL
- SERP → Dealer (skip VDP)
- Test variant for speed optimization

### Flow B (Test): VDP Landing Page
```
https://carzo.net/vehicles/ABC123VIN456?flow=vdp-only&utm_source=facebook
```
- Requires specific VIN in URL
- VDP → Dealer (skip SERP)
- Best for vehicle-specific ads

## Available Filters

All filters work with any flow:
- `location` - City name (e.g., seattle, atlanta)
- `make` - Vehicle make (e.g., toyota, ford)
- `model` - Vehicle model (e.g., camry, f-150)
- `minPrice` / `maxPrice` - Price range (e.g., 15000, 30000)
- `condition` - new, used, certified
- `bodyStyle` - sedan, suv, truck, coupe, etc.
- `minYear` / `maxYear` - Year range (e.g., 2018, 2024)
- `minMiles` / `maxMiles` - Mileage range

## Testing Strategy

Recommended traffic split:
- 34% - Flow C (default, no param)
- 33% - Flow A (`&flow=direct`)
- 33% - Flow B (vehicle-specific URLs with `&flow=vdp-only`)

Test duration: 7-14 days minimum
Required volume: 1000+ impressions per flow
```

#### 8.3 Create Testing Methodology Doc
```markdown
# A/B Test Methodology

## Success Metrics

### Primary Metric: Revenue per Impression
```
Revenue per Impression = (Billable Clicks × $0.80) / Total Impressions
```
**Winner = Highest revenue per impression**

### Secondary Metrics
- CTR to Dealer (clicks / impressions)
- Engagement Rate (billable / total clicks)
- Dealer Diversity Score (unique dealers / total clicks)
- Session Duration
- Bounce Rate

## Statistical Significance

Requirements:
- Minimum 1000 impressions per flow
- 7-14 day test period
- 95% confidence interval
- p-value < 0.05

## Data Collection

Access analytics dashboard:
```
https://carzo.net/admin
```

Query flow performance:
```sql
SELECT * FROM get_flow_performance(
  '2025-01-01'::TIMESTAMPTZ,
  '2025-01-14'::TIMESTAMPTZ
);
```

## Decision Criteria

If Flow X has:
- 20%+ higher revenue per impression than others
- Statistical significance (p < 0.05)
- Sustained over 7+ days

→ Roll out Flow X to 100% traffic
```

---

## Success Metrics

### Primary Metric: Revenue per Impression
```
Revenue per Impression = (Billable Clicks × $0.80) / Total Impressions
```
**This is the ultimate decider**

### Secondary Metrics

1. **CTR to Dealer**
   - Flow A target: 50%+ (minimal friction)
   - Flow B target: 60%+ (highly targeted)
   - Flow C target: 40%+ (full funnel)

2. **Engagement Rate**
   - Formula: Billable Clicks / Total Clicks
   - Flow A target: 50%? (no pre-qualification)
   - Flow B target: 80%+ (very committed users)
   - Flow C target: 70%+ (VDP pre-qualifies)

3. **Revenue per User**
   - Formula: Unique Dealers Clicked × $0.80
   - Flow A: ~$0.80 (single click likely)
   - Flow B: ~$0.80 (single targeted click)
   - Flow C: ~$2.40-$4.00 (3-5 dealers per session)

4. **Dealer Diversity Score**
   - Formula: Unique Dealers / Total Clicks
   - Target: >80% across all flows

5. **Session Duration**
   - Flow A: Likely lowest (direct out)
   - Flow B: Very low (auto-redirect)
   - Flow C: Highest (two-page funnel)

### Statistical Significance Requirements
- **Minimum volume**: 1000+ impressions per flow
- **Test duration**: 7-14 days (account for day-of-week variance)
- **Confidence level**: 95%
- **p-value**: < 0.05

---

## Testing Strategy

### Traffic Split
Marketing team controls split via ad URLs:
- **34%** - Flow C (default, no flow param) - **CONTROL**
- **33%** - Flow A (`&flow=direct`)
- **33%** - Flow B (vehicle-specific with `&flow=vdp-only`)

### Test Duration
- **Week 1-2**: Run A/B test with 33/33/34 split
- **Week 3**: Analyze results, check statistical significance
- **Week 4**: If clear winner, roll out to 80% (keep 20% on other flows)
- **Week 5+**: If winner sustained, roll out to 100%

### Decision Criteria

**Winner if:**
- Highest revenue per impression
- 20%+ improvement over other flows
- Statistical significance (p < 0.05)
- Sustained over 7+ days

**Example**:
```
Flow A: $0.040/impression
Flow B: $0.064/impression ← WINNER
Flow C: $0.032/impression

Flow B wins: 60% better than A, 100% better than C
```

---

## Key Performance Indicators (KPIs)

### Campaign-Level
- **ROAS** (Return on Ad Spend): Revenue / Ad Spend
- **CAC** (Customer Acquisition Cost): Ad Spend / Billable Clicks
- **Revenue per Ad Dollar**: Billable Clicks × $0.80 / Ad Spend

### Flow-Level
- **Revenue per Impression**: (Billable × $0.80) / Impressions
- **CTR**: Clicks / Impressions
- **Engagement Rate**: Billable / Total Clicks
- **Dealer Diversity**: Unique Dealers / Total Clicks

### User-Level
- **Revenue per User**: Unique Dealers × $0.80
- **Session Depth**: Unique Dealers per Session
- **Time on Site**: Total session duration
- **Pages per Session**: SERP + VDP views

---

## Risk Mitigation

### Risk 1: Flow A Low Engagement
**Risk**: Users click through but bounce on dealer site (no payment)
**Mitigation**:
- Monitor engagement rate closely
- If < 50%, consider ending Flow A test early
- Focus on Flow C (pre-qualification) or Flow B (targeted)

### Risk 2: Flow B Poor UX
**Risk**: 1.5s redirect delay feels slow/spammy
**Mitigation**:
- Use engaging loading animation (spinner + message)
- Test 0s vs 1s vs 1.5s delays
- Monitor bounce rate during redirect

### Risk 3: Flow Parameter Contamination
**Risk**: Users manually edit URLs, mixing flows
**Mitigation**:
- Track "entry flow" separately from "current flow"
- Analytics filter: "consistent flow sessions only"
- Accept as natural behavior, focus on aggregate metrics

### Risk 4: Insufficient Sample Size
**Risk**: Not enough traffic to reach statistical significance
**Mitigation**:
- Extend test duration (14+ days)
- Lower significance threshold (90% instead of 95%)
- Focus on directional insights vs statistical proof

### Risk 5: Day-of-Week Variance
**Risk**: Tuesday traffic behaves differently than Saturday
**Mitigation**:
- Run test for full 7-day weeks (not 5 days)
- Segment analysis by day of week
- Look for consistent patterns across days

---

## Next Steps After Testing

### If Flow C Wins (VDP Bridge)
1. Double down on VDP optimizations:
   - A/B test photo tease variations
   - Test CTA copy ("See Photos" vs "View Listing")
   - Add urgency elements (view counts, scarcity)
   - Optimize mobile VDP experience
2. Add "Related Vehicles" section (different dealers)
3. Increase ad spend (proven funnel)

### If Flow A Wins (Direct)
1. Simplify SERP further (reduce cognitive load)
2. Improve vehicle card CTAs (bigger buttons, better copy)
3. Focus on dealer site quality (can't control, but monitor)
4. Scale ad volume (volume strategy validated)

### If Flow B Wins (VDP-Only)
1. Build vehicle-specific ad campaigns (DPA)
2. Optimize redirect timing (test 0s, 1s, 1.5s)
3. Create landing page variants (different vehicles styles)
4. Focus retargeting budget here

### If All Flows Perform Similarly
1. Segment by traffic source (Facebook vs YouTube vs GDN)
2. Different flows may work better for different sources
3. Implement hybrid approach (route by source)
4. Continue testing with longer duration

---

## Appendix: Example URLs

### Flow C (Default - Full Funnel)
```
Basic search:
https://carzo.net/search?location=seattle&make=toyota

With filters:
https://carzo.net/search?location=atlanta&make=ford&bodyStyle=truck&condition=used&minPrice=20000&maxPrice=50000

With UTM:
https://carzo.net/search?location=dallas&make=chevrolet&utm_source=facebook&utm_campaign=chevy-trucks-q4&utm_content=image-ad
```

### Flow A (Direct to Dealer)
```
Basic:
https://carzo.net/search?location=seattle&make=toyota&flow=direct

With filters:
https://carzo.net/search?location=miami&make=bmw&bodyStyle=sedan&condition=certified&minPrice=30000&flow=direct&utm_source=youtube

With UTM:
https://carzo.net/search?location=phoenix&make=tesla&flow=direct&utm_source=google-display&utm_campaign=tesla-awareness
```

### Flow B (VDP-Only)
```
Specific vehicle:
https://carzo.net/vehicles/5YJSA1E14HF123456?flow=vdp-only&utm_source=facebook&utm_campaign=tesla-model3-promo

Retargeting:
https://carzo.net/vehicles/1FTFW1E54KFA12345?flow=vdp-only&utm_source=facebook&utm_campaign=retargeting&utm_content=ford-truck-viewed

DPA campaign:
https://carzo.net/vehicles/1G1YY22G965123456?flow=vdp-only&utm_source=facebook&utm_campaign=dpa-auto&utm_content=corvette-red
```

---

## Technical Notes

### Flow Parameter in Next.js
Flow parameter is read from `searchParams` in both Page components and client components:

```typescript
// Server component (page.tsx)
const searchParams = await props.searchParams;
const flow = searchParams.flow || 'full';

// Client component
const params = new URLSearchParams(window.location.search);
const flow = params.get('flow') || 'full';
```

### Click Tracking with keepalive
For reliable tracking when opening new tabs (Flow A, Flow B):
```typescript
fetch('/api/track-click', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... }),
  keepalive: true, // CRITICAL: Ensures fetch completes even if tab closes
});
```

### Beacon API Alternative
For instant redirects (Flow B optimization):
```typescript
navigator.sendBeacon('/api/track-click', JSON.stringify({ ... }));
window.location.href = dealerUrl; // No delay needed
```

---

## Questions for Future Consideration

1. **Should we add Flow D (Homepage → Dealer)?**
   - Skip SERP entirely, go straight from featured vehicles to dealer
   - Test for very top-of-funnel, impulse-driven traffic

2. **Should we personalize flows based on device?**
   - Mobile → Flow A (minimize friction on small screens)
   - Desktop → Flow C (more real estate for VDP)

3. **Should we personalize flows based on traffic source?**
   - Facebook → Flow C (browsers, need temptation)
   - Retargeting → Flow B (committed, go direct)
   - Cold traffic → Flow C (need trust-building)

4. **Should we test CTA copy variations per flow?**
   - Flow A: "See Details" vs "View Listing"
   - Flow B: Auto-redirect vs manual button
   - Flow C: "See Photos" vs "View Complete Listing"

5. **Should we add urgency/scarcity elements?**
   - "X people viewing this vehicle"
   - "Price may change soon"
   - "Only Y left in stock"
   - Test impact on CTR vs trust

---

## Conclusion

This implementation provides:
1. ✅ Clean URL-based flow control (easy to test)
2. ✅ Comprehensive tracking (every click, impression, flow tracked)
3. ✅ Backward compatibility (no flow param = current behavior)
4. ✅ Analytics-ready (flow dimension on all metrics)
5. ✅ Flexible testing (can run A/B/C or sequential)

**Success depends on:**
- Accurate click tracking (with engagement requirement)
- Sufficient sample size (1000+ per flow)
- Data-driven decision making (revenue per impression wins)
- Willingness to pivot (if data shows competitor was right)

**The bet we're making:**
VDP bridge (Flow C) will win because it pre-qualifies users, creates FOMO with photo tease, and enables session depth (multiple dealer clicks). But we're testing to validate this hypothesis.

**Timeline:**
- Week 1: Implementation (18 hours)
- Week 2-3: Run A/B test
- Week 4: Analyze and decide
- Week 5+: Roll out winner, optimize further

---

**Document Status**: Living document, update as implementation progresses.
**Last Updated**: 2025-11-12
**Owner**: Development Team
**Related Docs**: CLAUDE.md, README.md, docs/marketing-url-guide.md
