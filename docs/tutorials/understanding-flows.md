# Tutorial: Understanding A/B Test Flows

Learn how Carzo's A/B testing system works by testing all three flow variants.

## What You'll Learn

- The 3 flow variants (direct, vdp-only, full)
- How flow detection works
- How flow is preserved in URLs
- How to test different flows
- How to analyze flow performance

## Prerequisites

- Completed [Getting Started](./getting-started.md) tutorial
- Basic understanding of A/B testing
- Browser DevTools knowledge

---

## Background: Why A/B Test Flows?

Carzo tests different user journeys to maximize revenue:

- **Flow A (Direct):** SERP → Dealer (skip VDP bridge)
- **Flow B (VDP-Only):** Ad → VDP → Auto-redirect
- **Flow C (Full Funnel):** SERP → VDP → Manual CTA → Dealer

We want to find which flow generates the most billable clicks.

---

## Flow A: Direct to Dealer

### What It Does

Users click vehicle card on search page and go directly to dealer site (no VDP).

### Test Flow A

1. Go to http://localhost:3000/search?flow=direct
2. Notice "View at Dealer" button on vehicle cards
3. Click any vehicle card
4. Opens dealer site in new tab (skips VDP)

### How It Works

```typescript
// components/Search/VehicleCard.tsx
const flow = getFlowFromUrl();  // Returns 'direct'

if (flow === 'direct' && vehicle.dealer_vdp_url) {
  // Direct link to dealer
  return (
    <a
      href={vehicle.dealer_vdp_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackClick('serp_direct')}
    >
      <Button variant="primary">
        <ExternalLink className="mr-2 h-4 w-4" />
        View at Dealer
      </Button>
    </a>
  );
}
```

### Test Click Tracking

Open DevTools → Network tab:
1. Click "View at Dealer"
2. See POST to `/api/track-click`
3. Check response: `flow: 'direct'`, `ctaClicked: 'serp_direct'`

---

## Flow B: VDP-Only with Auto-Redirect

### What It Does

User lands directly on VDP (from ad), sees loading state, then auto-redirects to dealer site.

### Test Flow B

1. Go to http://localhost:3000/vehicles/{vin}?flow=vdp-only
2. See loading spinner for 1.5 seconds
3. Dealer site opens automatically in new tab
4. Original tab shows "Redirecting..." message

### How It Works

```typescript
// app/vehicles/[vin]/page.tsx
const flow = getFlowFromUrl();

if (flow === 'vdp-only') {
  return <VDPRedirect vehicle={vehicle} />;
}

// components/VDP/VDPRedirect.tsx
useEffect(() => {
  // Track impression immediately
  trackImpression(vehicle.id, 'vdp-only');

  // Wait 1.5 seconds, then open dealer site
  setTimeout(() => {
    window.open(vehicle.dealer_vdp_url, '_blank');
    setRedirected(true);
  }, 1500);
}, []);
```

### Test Tracking

DevTools → Network tab:
1. Page loads
2. POST to `/api/track-impression` (flow: 'vdp-only')
3. POST to `/api/track-click` (flow: 'vdp-only')
4. Dealer site opens

---

## Flow C: Full Funnel (Default)

### What It Does

Traditional flow: Search → VDP → Manual CTA → Dealer

### Test Flow C

1. Go to http://localhost:3000/search (no flow parameter)
2. Click any vehicle card
3. VDP page loads with photo gallery tease
4. Click "See Full Photo Gallery"
5. Dealer site opens in new tab

### How It Works

```typescript
// Default behavior (no flow parameter or flow=full)
const flow = getFlowFromUrl();  // Returns 'full' (default)

// VehicleCard links to VDP
<Link href={`/vehicles/${vehicle.vin}`}>
  <Button variant="primary">
    <Camera className="mr-2 h-4 w-4" />
    See Full Photo Gallery
  </Button>
</Link>

// VDP shows full bridge page
return <VehicleBridgePage vehicle={vehicle} />;
```

---

## Flow Preservation

### How It Works

Flow parameter is preserved across all navigation:

```typescript
// lib/flow-detection.ts
export function preserveFlowInUrl(
  url: string,
  currentParams: URLSearchParams
): string {
  const flow = getFlowFromUrl();

  if (flow !== 'full') {
    const newParams = new URLSearchParams(url.split('?')[1]);
    newParams.set('flow', flow);
    return `${url.split('?')[0]}?${newParams.toString()}`;
  }

  return url;
}
```

### Test Flow Preservation

**Flow A:**
1. Start at `/search?flow=direct&make=Toyota`
2. Change filter to `model=Camry`
3. URL becomes `/search?flow=direct&make=Toyota&model=Camry`
4. ✅ Flow preserved!

**Flow B:**
1. Start at `/vehicles/ABC123?flow=vdp-only`
2. Auto-redirects to dealer
3. Click tracked with `flow: 'vdp-only'`
4. ✅ Flow tracked!

---

## Analyze Flow Performance

### Check Database

```sql
-- Clicks by flow
SELECT
  flow,
  COUNT(*) as total_clicks,
  COUNT(*) FILTER (WHERE is_billable = true) as billable_clicks,
  (COUNT(*) FILTER (WHERE is_billable = true)::FLOAT / COUNT(*) * 100) as billable_rate
FROM clicks
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY flow;
```

**Example results:**
```
flow      | total_clicks | billable_clicks | billable_rate
----------+--------------+-----------------+---------------
direct    | 523          | 412             | 78.8%
vdp-only  | 234          | 189             | 80.8%
full      | 1,245        | 987             | 79.3%
```

### Calculate Revenue by Flow

```sql
SELECT
  flow,
  COUNT(*) FILTER (WHERE is_billable = true) as billable_clicks,
  (COUNT(*) FILTER (WHERE is_billable = true) * 0.80) as revenue
FROM clicks
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY flow
ORDER BY revenue DESC;
```

### Calculate CTR (Flow B Only)

```sql
SELECT
  COUNT(DISTINCT i.id) as impressions,
  COUNT(DISTINCT c.id) as clicks,
  (COUNT(DISTINCT c.id)::FLOAT / COUNT(DISTINCT i.id) * 100) as ctr_percent
FROM impressions i
LEFT JOIN clicks c ON i.vehicle_id = c.vehicle_id AND i.flow = c.flow
WHERE i.flow = 'vdp-only'
  AND i.created_at >= NOW() - INTERVAL '7 days';
```

---

## Test All Flows

### Scenario 1: Facebook Ad Campaign

Simulate user clicking Facebook ad for specific vehicle:

```
Ad → https://carzo.net/vehicles/ABC123?flow=vdp-only&utm_source=facebook&utm_campaign=toyota_spring
```

**Expected:**
1. VDP loads
2. Loading spinner 1.5s
3. Dealer site opens
4. Impression + click tracked with `flow: 'vdp-only'`

### Scenario 2: Google Display Ad

Simulate user clicking Google ad to search page:

```
Ad → https://carzo.net/search?make=Toyota&flow=direct&utm_source=google&utm_medium=display
```

**Expected:**
1. Search results load
2. Vehicles have "View at Dealer" buttons
3. Click goes directly to dealer site
4. Click tracked with `flow: 'direct'`, `ctaClicked: 'serp_direct'`

### Scenario 3: Organic Traffic

Simulate user finding site via Google search:

```
Google → https://carzo.net/search?make=Toyota
```

**Expected:**
1. Search results load (no flow parameter = `flow: 'full'`)
2. Vehicles have "See Full Photo Gallery" buttons
3. Click goes to VDP bridge page
4. User clicks "See Full Photo Gallery" to dealer site
5. Click tracked with `flow: 'full'`

---

## Edge Cases

### Missing dealer_vdp_url

If vehicle has no dealer URL:

```typescript
// Flow A falls back to VDP
if (flow === 'direct' && !vehicle.dealer_vdp_url) {
  // Fallback to VDP bridge
  return <Link href={`/vehicles/${vehicle.vin}`}>...</Link>;
}

// Flow B shows error
if (flow === 'vdp-only' && !vehicle.dealer_vdp_url) {
  return (
    <div>
      <p>Vehicle no longer available</p>
      <Link href="/search">Return to Search</Link>
    </div>
  );
}
```

### Invalid Flow Value

```typescript
// ?flow=invalid → defaults to 'full'
export function getFlowFromUrl(): UserFlow {
  const params = new URLSearchParams(window.location.search);
  const flow = params.get('flow');

  if (flow === 'direct' || flow === 'vdp-only') {
    return flow;
  }

  return 'full';  // Default
}
```

---

## Experiment: Compare Flows

### Step 1: Generate Test Traffic

```bash
# Generate 100 clicks for each flow
for flow in direct vdp-only full; do
  for i in {1..100}; do
    curl -X POST http://localhost:3000/api/track-click \
      -H "Content-Type: application/json" \
      -d "{
        \"vehicleId\": \"test-vehicle-id\",
        \"dealerId\": \"dealer-$i\",
        \"userId\": \"test-user-$i\",
        \"flow\": \"$flow\"
      }"
  done
done
```

### Step 2: Query Results

```sql
SELECT
  flow,
  COUNT(*) as clicks,
  (COUNT(*) * 0.80) as revenue
FROM clicks
WHERE user_id LIKE 'test-user-%'
GROUP BY flow;
```

### Step 3: Analyze

Which flow has:
- Highest billable rate?
- Highest total revenue?
- Best dealer diversity?

---

## What You Learned

✅ Understand all 3 A/B test flows
✅ Test each flow variant manually
✅ Verify flow tracking in database
✅ Analyze flow performance with SQL
✅ Understand flow preservation in URLs
✅ Handle edge cases gracefully

---

## Next Steps

- Read [A/B Testing Flows](../explanation/ab-testing-flows.md) explanation
- Check [Analytics Dashboard](http://localhost:3000/admin) for flow metrics
- Experiment with different flow variants

---

## Flow Decision Tree

```
User arrives at Carzo
    │
    ├─ Has ?flow=direct
    │   └─ SERP: Click vehicle → Dealer site (skip VDP)
    │
    ├─ Has ?flow=vdp-only
    │   └─ VDP: Auto-redirect to dealer (1.5s delay)
    │
    └─ No flow or ?flow=full (default)
        └─ SERP: Click vehicle → VDP → Manual CTA → Dealer site
```

---

**Congratulations!** 🎉 You now understand Carzo's A/B testing system.
