# API Reference: /api/track-click

## Overview

Track dealer clicks with 30-day deduplication to determine billable status.

**Endpoint:** `POST /api/track-click`

**Authentication:** None (public endpoint)

**Rate Limiting:**
- Per-minute: 50 requests/minute
- Burst: 10 requests/second
- Session: 500 requests/hour

## Request

### Headers

```http
Content-Type: application/json
```

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | string (UUID) | Yes | Vehicle ID |
| `dealerId` | string | Yes | Dealer ID |
| `userId` | string (UUID) | Yes | User ID from cookie |
| `sessionId` | string (UUID) | Yes | Session ID from sessionStorage |
| `ctaClicked` | string | Yes | CTA type: "primary", "history", "payment", "serp_direct", "vdp_auto_redirect" |
| `flow` | string | No | A/B test flow: "direct", "vdp-only", "full" (default) |
| `utmSource` | string | No | Traffic source (e.g., "facebook", "google") |
| `utmMedium` | string | No | Traffic medium (e.g., "cpc", "display") |
| `utmCampaign` | string | No | Campaign identifier |

### Example Request

```bash
curl -X POST https://carzo.net/api/track-click \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "550e8400-e29b-41d4-a916-446655440000",
    "dealerId": "dealer123",
    "userId": "user-uuid-here",
    "sessionId": "session-uuid-here",
    "ctaClicked": "primary",
    "flow": "full",
    "utmSource": "facebook",
    "utmMedium": "cpc",
    "utmCampaign": "atlanta-toyota"
  }'
```

## Response

### Success Response

**Status Code:** `200 OK`

**Body:**

```json
{
  "billable": true,
  "clickId": "click-uuid-here",
  "message": "Click tracked successfully"
}
```

**Response when not billable:**

```json
{
  "billable": false,
  "clickId": "click-uuid-here",
  "message": "Dealer already clicked in last 30 days",
  "firstClickDate": "2025-10-15T14:30:00Z",
  "clickCount": 3
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `billable` | boolean | True if first click to this dealer in 30 days |
| `clickId` | string | UUID of click record |
| `message` | string | Human-readable status message |
| `firstClickDate` | string | ISO 8601 timestamp of first click (if not billable) |
| `clickCount` | number | Total clicks to this dealer (if not billable) |

### Error Responses

#### 400 Bad Request

**Missing Required Fields:**
```json
{
  "error": "Missing required fields: vehicleId, dealerId, userId, sessionId, ctaClicked"
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

#### 500 Internal Server Error

```json
{
  "error": "Failed to track click",
  "message": "An unexpected error occurred. Please try again."
}
```

## Implementation Details

### 30-Day Deduplication Logic

```typescript
// Check dealer_click_history table
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

const { data: history } = await supabase
  .from('dealer_click_history')
  .select('*')
  .eq('user_id', userId)
  .eq('dealer_id', dealerId)
  .gte('first_click_at', thirtyDaysAgo.toISOString());

// Mark as billable if no history found
const isBillable = !history || history.length === 0;
```

**Why 30 Days?**
- Revenue model: $0.80 per unique dealer per user per 30 days
- Duplicate clicks to same dealer = $0.00
- Maximizes revenue by tracking dealer diversity

### Database Operations

**1. Insert Click Record:**

```sql
INSERT INTO clicks (
  vehicle_id,
  dealer_id,
  user_id,
  session_id,
  is_billable,
  cta_clicked,
  flow,
  utm_source,
  utm_medium,
  utm_campaign,
  created_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW());
```

**2. Update Dealer Click History:**

```sql
-- If billable (first click)
INSERT INTO dealer_click_history (
  user_id,
  dealer_id,
  first_click_at,
  last_click_at,
  click_count
) VALUES ($1, $2, NOW(), NOW(), 1);

-- If not billable (duplicate)
UPDATE dealer_click_history
SET
  last_click_at = NOW(),
  click_count = click_count + 1
WHERE user_id = $1 AND dealer_id = $2;
```

### CTA Types

| CTA Type | Description | Flow |
|----------|-------------|------|
| `primary` | "See Full Photo Gallery" button on VDP | Full Funnel |
| `history` | "View FREE Vehicle History" button on VDP | Full Funnel |
| `payment` | "Estimate Monthly Payments" button on VDP | Full Funnel |
| `serp_direct` | Direct dealer link from search results | Direct (Flow A) |
| `vdp_auto_redirect` | Auto-redirect from VDP | VDP-Only (Flow B) |

## Client-Side Usage

### React Hook

```typescript
// hooks/useTrackClick.ts
import { getUserId, getSessionId } from '@/lib/user-tracking';

export function useTrackClick() {
  const trackClick = async (
    vehicleId: string,
    dealerId: string,
    ctaClicked: string,
    flow: string = 'full'
  ) => {
    const userId = getUserId();
    const sessionId = getSessionId();

    const response = await fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId,
        dealerId,
        userId,
        sessionId,
        ctaClicked,
        flow,
      }),
    });

    const data = await response.json();
    return data.billable;
  };

  return { trackClick };
}
```

### VDP CTA Example

```typescript
// components/VDP/VehicleBridgePage.tsx
'use client';

import { useTrackClick } from '@/hooks/useTrackClick';

export default function VehicleBridgePage({ vehicle }) {
  const { trackClick } = useTrackClick();

  const handleCTAClick = async (ctaType: string) => {
    // Track click before opening dealer site
    const isBillable = await trackClick(
      vehicle.id,
      vehicle.dealer_id,
      ctaType,
      'full'
    );

    // Optional: Show UI feedback
    if (!isBillable) {
      console.log('Already viewed this dealer in last 30 days');
    }

    // Open dealer site in new tab
    window.open(vehicle.dealer_vdp_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button onClick={() => handleCTAClick('primary')}>
      See Full Photo Gallery
    </button>
  );
}
```

## Revenue Calculation

### Billable vs Non-Billable

```typescript
// Calculate revenue from clicks
const billableClicks = clicks.filter(c => c.is_billable).length;
const revenue = billableClicks * 0.80;

// NOT from total clicks (includes duplicates)
const totalClicks = clicks.length; // ❌ WRONG
```

### Analytics Query

```sql
-- Revenue by flow variant (last 30 days)
SELECT
  flow,
  COUNT(*) as total_clicks,
  COUNT(*) FILTER (WHERE is_billable) as billable_clicks,
  (COUNT(*) FILTER (WHERE is_billable) * 0.80) as revenue,
  (COUNT(*) FILTER (WHERE is_billable)::FLOAT / COUNT(*) * 100) as billable_rate
FROM clicks
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY flow
ORDER BY revenue DESC;
```

**Sample Output:**
```
flow      | total | billable | revenue  | rate
----------|-------|----------|----------|------
full      | 1200  | 950      | $760.00  | 79.2%
vdp-only  | 850   | 720      | $576.00  | 84.7%
direct    | 600   | 420      | $336.00  | 70.0%
```

## Security Considerations

### User ID Validation

```typescript
// Verify user ID format (UUID v4)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!uuidRegex.test(userId)) {
  return NextResponse.json(
    { error: 'Invalid user ID format' },
    { status: 400 }
  );
}
```

### Rate Limiting

Prevents click fraud and bot traffic:

```typescript
const rateLimitResult = await checkMultipleRateLimits(userId, [
  { endpoint: 'track_click', ...RATE_LIMITS.TRACK_CLICK },
  { endpoint: 'track_click_burst', ...RATE_LIMITS.BURST },
]);

if (!rateLimitResult.allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  );
}
```

### Dealer ID Validation

```typescript
// Verify dealer exists in database
const { data: dealer } = await supabase
  .from('vehicles')
  .select('dealer_id')
  .eq('dealer_id', dealerId)
  .limit(1);

if (!dealer) {
  return NextResponse.json(
    { error: 'Invalid dealer ID' },
    { status: 400 }
  );
}
```

## Performance Optimization

### Database Indexes

```sql
-- Fast lookup by user + dealer
CREATE INDEX idx_dealer_click_history_lookup
  ON dealer_click_history(user_id, dealer_id);

-- Fast filtering by date
CREATE INDEX idx_dealer_click_history_date
  ON dealer_click_history(first_click_at);

-- Fast click analytics
CREATE INDEX idx_clicks_created_at ON clicks(created_at);
CREATE INDEX idx_clicks_flow ON clicks(flow);
CREATE INDEX idx_clicks_billable ON clicks(is_billable);
```

### Query Performance

**Typical Query Time:**
- Deduplication check: ~5-10ms (indexed lookup)
- Insert click: ~5ms
- Upsert history: ~5ms
- **Total: ~15-20ms**

### Caching Strategy

**Not cached** - Every click must be tracked immediately

## Error Handling

### Retry Logic (Client-Side)

```typescript
async function trackClickWithRetry(
  vehicleId: string,
  dealerId: string,
  ctaClicked: string,
  retries = 3
) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch('/api/track-click', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId,
          dealerId,
          userId: getUserId(),
          sessionId: getSessionId(),
          ctaClicked,
        }),
      });

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 429) {
        // Rate limited, wait and retry
        const retryAfter = response.headers.get('Retry-After');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === retries - 1) {
        console.error('Failed to track click after retries:', error);
        return { billable: null }; // Graceful degradation
      }
    }
  }
}
```

### Graceful Degradation

```typescript
// Allow dealer site to open even if tracking fails
try {
  await trackClick(vehicle.id, vehicle.dealer_id, 'primary');
} catch (error) {
  console.error('Click tracking failed:', error);
  // Still open dealer site (revenue loss better than broken UX)
}

window.open(vehicle.dealer_vdp_url, '_blank');
```

## Testing

### Unit Test Example

```typescript
// app/api/track-click/__tests__/route.test.ts
import { POST } from '../route';

describe('POST /api/track-click', () => {
  it('should mark first click as billable', async () => {
    const request = new Request('http://localhost/api/track-click', {
      method: 'POST',
      body: JSON.stringify({
        vehicleId: 'vehicle-uuid',
        dealerId: 'dealer123',
        userId: 'user-uuid',
        sessionId: 'session-uuid',
        ctaClicked: 'primary',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.billable).toBe(true);
    expect(data.clickId).toBeDefined();
  });

  it('should mark duplicate click as non-billable', async () => {
    // First click
    await POST(firstRequest);

    // Second click (same user, same dealer)
    const response = await POST(secondRequest);
    const data = await response.json();

    expect(data.billable).toBe(false);
    expect(data.firstClickDate).toBeDefined();
  });
});
```

## Related Endpoints

- [POST /api/track-impression](./track-impression.md) - Track vehicle impression
- [POST /api/search-vehicles](./search-vehicles.md) - Search for vehicles
- [GET /api/filter-options](./filter-options.md) - Get filter options

## Related Documentation

- [Business Model](../../explanation/business-model.md) - Revenue calculation
- [Cookie Tracking](../../explanation/cookie-tracking.md) - User identification
- [A/B Testing Flows](../../explanation/ab-testing-flows.md) - Flow variants
