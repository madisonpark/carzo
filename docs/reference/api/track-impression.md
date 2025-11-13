# API Reference: /api/track-impression

## Overview

Track vehicle impressions for CTR (click-through rate) calculation and A/B test flow analytics.

**Endpoint:** `POST /api/track-impression`

**Authentication:** None (public endpoint)

**Rate Limiting:**
- Per-minute: 100 requests/minute
- Burst: 20 requests/second
- Session: 1000 requests/hour

## Request

### Headers

```http
Content-Type: application/json
```

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | string (UUID) | Yes | Vehicle ID |
| `userId` | string (UUID) | Yes | User ID from cookie |
| `sessionId` | string (UUID) | Yes | Session ID from sessionStorage |
| `pageType` | string | Yes | "search", "homepage", or "direct" |
| `flow` | string | No | A/B test flow: "direct", "vdp-only", "full" (default) |

### Example Request

```bash
curl -X POST https://carzo.net/api/track-impression \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "550e8400-e29b-41d4-a916-446655440000",
    "userId": "user-uuid-here",
    "sessionId": "session-uuid-here",
    "pageType": "search",
    "flow": "full"
  }'
```

## Response

### Success Response

**Status Code:** `200 OK`

**Body:**

```json
{
  "success": true,
  "impressionId": "impression-uuid-here"
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "error": "Missing required fields: vehicleId, userId, sessionId, pageType"
}
```

#### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": 60
}
```

## Implementation Details

### Database Schema

```sql
CREATE TABLE impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  user_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  page_type VARCHAR(20) NOT NULL,
  flow VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_impressions_vehicle ON impressions(vehicle_id);
CREATE INDEX idx_impressions_user ON impressions(user_id);
CREATE INDEX idx_impressions_session ON impressions(session_id);
CREATE INDEX idx_impressions_flow ON impressions(flow);
CREATE INDEX idx_impressions_created ON impressions(created_at);
```

### Page Types

| Page Type | Description | Use Case |
|-----------|-------------|----------|
| `search` | Search results page | Track vehicles shown in search |
| `homepage` | Homepage featured vehicles | Track featured vehicle impressions |
| `direct` | VDP-only flow (auto-redirect) | Track impressions before redirect |

## Client-Side Usage

### React Hook

```typescript
// hooks/useTrackImpression.ts
import { useEffect } from 'react';
import { getUserId, getSessionId } from '@/lib/user-tracking';

export function useTrackImpression(
  vehicleId: string,
  pageType: string,
  flow: string = 'full'
) {
  useEffect(() => {
    const trackImpression = async () => {
      await fetch('/api/track-impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          userId: getUserId(),
          sessionId: getSessionId(),
          pageType,
          flow,
        }),
      });
    };

    trackImpression();
  }, [vehicleId, pageType, flow]);
}
```

### VehicleCard Component

```typescript
// components/Search/VehicleCard.tsx
'use client';

import { useTrackImpression } from '@/hooks/useTrackImpression';

export default function VehicleCard({ vehicle }) {
  // Track impression when card renders
  useTrackImpression(vehicle.id, 'search', 'full');

  return (
    <div className="border rounded-lg p-4">
      <img src={vehicle.primary_image_url} alt={vehicle.make} />
      <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
      <p>${vehicle.price.toLocaleString()}</p>
    </div>
  );
}
```

### VDP Auto-Redirect (Flow B)

```typescript
// app/vehicles/[vin]/page.tsx
useEffect(() => {
  if (flow === 'vdp-only') {
    // Track impression before auto-redirect
    fetch('/api/track-impression', {
      method: 'POST',
      body: JSON.stringify({
        vehicleId: vehicle.id,
        userId: getUserId(),
        sessionId: getSessionId(),
        pageType: 'direct',
        flow: 'vdp-only',
      }),
    });

    // Wait 1.5s then redirect
    setTimeout(() => {
      window.open(vehicle.dealer_vdp_url, '_blank');
    }, 1500);
  }
}, [flow]);
```

## CTR Calculation

### Analytics Query

```sql
-- Calculate CTR by flow
WITH impression_counts AS (
  SELECT
    flow,
    COUNT(*) as impressions
  FROM impressions
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY flow
),
click_counts AS (
  SELECT
    flow,
    COUNT(*) as clicks
  FROM clicks
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY flow
)
SELECT
  i.flow,
  i.impressions,
  COALESCE(c.clicks, 0) as clicks,
  CASE
    WHEN i.impressions > 0
    THEN (COALESCE(c.clicks, 0)::FLOAT / i.impressions * 100)
    ELSE 0
  END as ctr
FROM impression_counts i
LEFT JOIN click_counts c ON i.flow = c.flow
ORDER BY ctr DESC;
```

**Sample Output:**
```
flow      | impressions | clicks | ctr
----------|-------------|--------|-------
vdp-only  | 2100        | 850    | 40.5%
direct    | 3200        | 600    | 18.8%
full      | 8500        | 1200   | 14.1%
```

### Dashboard Component

```typescript
// app/admin/components/CTRWidget.tsx
export default async function CTRWidget() {
  const { data: stats } = await supabase.rpc('get_ctr_by_flow');

  return (
    <Card>
      <CardHeader>
        <CardTitle>CTR by Flow</CardTitle>
      </CardHeader>
      <CardContent>
        {stats.map(stat => (
          <div key={stat.flow}>
            <span>{stat.flow}</span>
            <span>{stat.ctr.toFixed(1)}%</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

## Performance Considerations

### Batch Tracking (Future Optimization)

```typescript
// Batch multiple impressions in single request
const impressions = vehicles.map(v => ({
  vehicleId: v.id,
  userId: getUserId(),
  sessionId: getSessionId(),
  pageType: 'search',
  flow: 'full',
}));

await fetch('/api/track-impressions-batch', {
  method: 'POST',
  body: JSON.stringify({ impressions }),
});
```

**Benefits:**
- Reduces HTTP overhead (1 request vs 20)
- Faster page load (less network congestion)
- Lower rate limit usage

### Debouncing

```typescript
// Debounce rapid scrolling
const debouncedTrackImpression = debounce(
  (vehicleId) => trackImpression(vehicleId, 'search'),
  500 // Wait 500ms after last scroll
);
```

## Deduplication Strategy

### Current: No Deduplication

Impressions tracked every time vehicle shown:
- User scrolls past same vehicle 3 times = 3 impressions
- Accurate representation of exposure
- Matches industry standard (Google Ads, Facebook Ads)

### Alternative: Session-Based Deduplication

```typescript
// Track only first impression per session
const impressedVehicles = new Set(
  sessionStorage.getItem('impressed_vehicles')?.split(',') || []
);

if (!impressedVehicles.has(vehicleId)) {
  await trackImpression(vehicleId, 'search');
  impressedVehicles.add(vehicleId);
  sessionStorage.setItem('impressed_vehicles', Array.from(impressedVehicles).join(','));
}
```

**Trade-off:**
- More accurate CTR (unique impressions)
- Doesn't reflect repeated exposure
- Not currently implemented

## Error Handling

### Graceful Degradation

```typescript
try {
  await trackImpression(vehicle.id, 'search');
} catch (error) {
  // Fail silently - don't break user experience
  console.error('Impression tracking failed:', error);
}
```

### Retry Logic

```typescript
async function trackImpressionWithRetry(
  vehicleId: string,
  pageType: string,
  retries = 2
) {
  for (let i = 0; i < retries; i++) {
    try {
      await fetch('/api/track-impression', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId,
          userId: getUserId(),
          sessionId: getSessionId(),
          pageType,
        }),
      });
      return;
    } catch (error) {
      if (i === retries - 1) {
        console.error('Failed after retries:', error);
      }
    }
  }
}
```

## Analytics Use Cases

### 1. Vehicle Performance

```sql
-- Top vehicles by impressions (last 30 days)
SELECT
  v.year,
  v.make,
  v.model,
  COUNT(i.id) as impressions,
  COUNT(c.id) as clicks,
  CASE
    WHEN COUNT(i.id) > 0
    THEN (COUNT(c.id)::FLOAT / COUNT(i.id) * 100)
    ELSE 0
  END as ctr
FROM vehicles v
LEFT JOIN impressions i ON v.id = i.vehicle_id
  AND i.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN clicks c ON v.id = c.vehicle_id
  AND c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY v.id, v.year, v.make, v.model
ORDER BY impressions DESC
LIMIT 20;
```

### 2. Flow Comparison

```sql
-- Flow performance comparison
SELECT
  flow,
  COUNT(DISTINCT session_id) as sessions,
  COUNT(*) as impressions,
  AVG(impressions_per_session) as avg_impressions
FROM (
  SELECT
    flow,
    session_id,
    COUNT(*) as impressions_per_session
  FROM impressions
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY flow, session_id
) subquery
GROUP BY flow;
```

### 3. Time Series Analysis

```sql
-- Impressions by hour (last 7 days)
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as impressions
FROM impressions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;
```

## Related Endpoints

- [POST /api/track-click](./track-click.md) - Track dealer clicks
- [POST /api/search-vehicles](./search-vehicles.md) - Search vehicles
- [POST /api/filter-options](./filter-options.md) - Get filter options

## Related Documentation

- [A/B Testing Flows](../../explanation/ab-testing-flows.md) - Flow variants
- [Cookie Tracking](../../explanation/cookie-tracking.md) - User identification
- [Business Model](../../explanation/business-model.md) - CTR metrics
