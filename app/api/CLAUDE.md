# API Route Guidelines (Claude Code)

## Rate Limiting (REQUIRED FOR ALL POST ENDPOINTS)

**Every POST endpoint must implement rate limiting:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getClientIdentifier, checkMultipleRateLimits, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // 1. Get client identifier (IP or user ID)
  const identifier = getClientIdentifier(request);

  // 2. Check rate limits (per-minute + burst)
  const rateLimitResult = await checkMultipleRateLimits(identifier, [
    { endpoint: 'endpoint_name', ...RATE_LIMITS.SEARCH_VEHICLES },
    { endpoint: 'endpoint_name_burst', ...RATE_LIMITS.BURST },
  ]);

  // 3. Return 429 if exceeded
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString(),
        },
      }
    );
  }

  // 4. Proceed with request...
}
```

**Rate Limit Configuration:**
```typescript
// lib/rate-limit.ts
export const RATE_LIMITS = {
  SEARCH_VEHICLES: { limit: 100, windowSeconds: 60 },   // 100/min
  FILTER_OPTIONS: { limit: 50, windowSeconds: 60 },     // 50/min
  BURST: { limit: 10, windowSeconds: 1 },               // 10/sec
  SESSION: { limit: 500, windowSeconds: 3600 },         // 500/hour
};
```

## Dealer Click Tracking (CRITICAL)

**All dealer clicks must be tracked for revenue:**

```typescript
// app/api/track-click/route.ts

export async function POST(request: NextRequest) {
  const { vehicleId, dealerId, userId, sessionId, ctaClicked, flow } = await request.json();

  // 1. Check if user clicked this dealer in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { data: history, error: historyError } = await supabase
    .from('dealer_click_history')
    .select('*')
    .eq('user_id', userId)
    .eq('dealer_id', dealerId)
    .gte('first_click_at', thirtyDaysAgo.toISOString());

  // 2. Mark as billable if first click to this dealer
  const isBillable = !history || history.length === 0;

  // 3. Log click with billable flag
  const { error: clickError } = await supabase.from('clicks').insert({
    vehicle_id: vehicleId,
    dealer_id: dealerId,
    user_id: userId,
    session_id: sessionId,
    is_billable: isBillable,
    cta_clicked: ctaClicked || 'primary',
    flow: flow || 'full',
    created_at: new Date().toISOString(),
  });

  // 4. Update dealer click history
  if (history && history.length > 0) {
    // Increment existing record
    await supabase
      .from('dealer_click_history')
      .update({
        last_click_at: new Date().toISOString(),
        click_count: history[0].click_count + 1,
      })
      .eq('id', history[0].id);
  } else {
    // Create new record
    await supabase.from('dealer_click_history').insert({
      user_id: userId,
      dealer_id: dealerId,
      first_click_at: new Date().toISOString(),
      last_click_at: new Date().toISOString(),
      click_count: 1,
    });
  }

  // 5. Return billable status
  return NextResponse.json({ billable: isBillable });
}
```

**Critical fields:**
- `dealer_id` - **MOST IMPORTANT** for deduplication
- `user_id` - Cookie-based UUID (1 year expiration)
- `is_billable` - First click = true, subsequent = false
- `flow` - A/B test variant ('direct', 'vdp-only', 'full')

## PostGIS Spatial Queries

**Use stored procedures for location-based search:**

```typescript
// app/api/search-vehicles/route.ts

export async function POST(request: NextRequest) {
  const { latitude, longitude, make, model, limit } = await request.json();

  // Call PostGIS stored procedure (100x faster than client-side)
  const { data, error } = await supabase.rpc('search_vehicles_by_location', {
    user_lat: latitude,
    user_lon: longitude,
    p_make: make || null,
    p_model: model || null,
    p_limit: limit || 100,
  });

  if (error) {
    console.error('PostGIS query error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  // Apply dealer diversification (revenue optimization)
  const diversified = diversifyByDealer(data, limit || 100);

  return NextResponse.json({ vehicles: diversified });
}
```

**Why use stored procedures:**
- GIST spatial index (100x faster)
- Server-side filtering (less data transferred)
- Automatic distance calculation
- Handles targeting_radius per vehicle

## Error Handling

**Always handle errors gracefully:**

```typescript
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    if (!body.requiredField) {
      return NextResponse.json(
        { error: 'Missing required field: requiredField' },
        { status: 400 }
      );
    }

    // Process request...
    const { data, error } = await supabase.from('table').select('*');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## CORS Headers (If Needed)

**For cross-origin requests:**

```typescript
export async function POST(request: NextRequest) {
  // Process request...

  return NextResponse.json({ data }, {
    headers: {
      'Access-Control-Allow-Origin': '*',  // Or specific origin
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

## Testing API Routes (REQUIRED)

**⚠️ ALL API routes MUST have tests before committing**

### Test File Location

```
app/api/[endpoint]/
├── route.ts           # API route handler
└── __tests__/
    └── route.test.ts  # Tests colocated with route
```

### Required Test Coverage

**Every API route must test:**
1. ✅ Rate limiting (exhaust limits, check 429)
2. ✅ Success path (valid request)
3. ✅ Validation errors (invalid/missing fields)
4. ✅ Error scenarios (401, 404, 500)
5. ✅ Response format (correct JSON structure)
6. ✅ Response headers (Content-Type, rate limit headers)

### 1. Rate Limiting Testing

```typescript
// app/api/[endpoint]/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

describe('POST /api/[endpoint] - Rate Limiting', () => {
  it('should enforce rate limits', async () => {
    const mockRequest = new NextRequest('http://localhost/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* valid body */ }),
    });

    // First request should succeed
    const response1 = await POST(mockRequest);
    expect(response1.status).not.toBe(429);

    // Exhaust rate limit (depends on endpoint limit)
    for (let i = 0; i < 100; i++) {
      await POST(mockRequest);
    }

    // Should now be rate limited
    const response2 = await POST(mockRequest);
    expect(response2.status).toBe(429);
    const data = await response2.json();
    expect(data.error).toContain('Rate limit exceeded');
  });

  it('should include rate limit headers', async () => {
    const mockRequest = new NextRequest('http://localhost/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ /* valid body */ }),
    });

    const response = await POST(mockRequest);
    expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
  });
});
```

### 2. Supabase Client Mocking

```typescript
import { vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client at top of test file
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: '123', make: 'Toyota' },
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({
        data: { id: '456' },
        error: null,
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({
      data: [{ id: '1', make: 'Toyota' }],
      error: null,
    })),
  })),
}));

describe('POST /api/search-vehicles', () => {
  it('should call Supabase RPC with correct params', async () => {
    const mockRequest = new NextRequest('http://localhost/api/search-vehicles', {
      method: 'POST',
      body: JSON.stringify({
        userLat: 33.7490,
        userLon: -84.3880,
        make: 'Toyota',
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(createClient).toHaveBeenCalled();
    expect(data.vehicles).toBeDefined();
  });
});
```

### 3. Validation Testing (Zod Schemas)

```typescript
describe('POST /api/[endpoint] - Validation', () => {
  it('should reject invalid request body', async () => {
    const mockRequest = new NextRequest('http://localhost/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'field' }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Validation failed');
  });

  it('should accept valid request body', async () => {
    const mockRequest = new NextRequest('http://localhost/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({
        vehicleId: '123e4567-e89b-12d3-a456-426614174000',
        dealerId: 'dealer123',
        userId: 'user456',
      }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
  });

  it('should reject missing required fields', async () => {
    const mockRequest = new NextRequest('http://localhost/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ vehicleId: '123' }), // Missing dealerId, userId
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
  });
});
```

### 4. Error Scenario Testing

```typescript
describe('POST /api/[endpoint] - Error Handling', () => {
  it('should return 401 for missing authorization', async () => {
    const mockRequest = new NextRequest('http://localhost/api/cron/endpoint', {
      method: 'GET',
      // Missing Authorization header
    });

    const response = await GET(mockRequest);
    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent resource', async () => {
    // Mock Supabase to return no data
    vi.mocked(createClient).mockReturnValueOnce({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            })),
          })),
        })),
      })),
    } as any);

    const mockRequest = new NextRequest('http://localhost/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ id: 'non-existent' }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(404);
  });

  it('should return 500 for database errors', async () => {
    // Mock Supabase to return error
    vi.mocked(createClient).mockReturnValueOnce({
      from: vi.fn(() => ({
        insert: vi.fn(() => Promise.resolve({
          data: null,
          error: { message: 'Database connection failed' },
        })),
      })),
    } as any);

    const mockRequest = new NextRequest('http://localhost/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ /* valid body */ }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Internal server error');
  });
});
```

### 5. Revenue-Critical Testing Example

```typescript
// app/api/track-click/__tests__/route.test.ts
describe('/api/track-click - Revenue Logic', () => {
  it('should mark first click as billable', async () => {
    const request = new NextRequest('http://localhost:3000/api/track-click', {
      method: 'POST',
      body: JSON.stringify({
        vehicleId: 'vehicle-1',
        dealerId: 'dealer-1',
        userId: 'user-1',
        sessionId: 'session-1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.billable).toBe(true);
  });

  it('should mark duplicate dealer click as not billable', async () => {
    const request = new NextRequest('http://localhost:3000/api/track-click', {
      method: 'POST',
      body: JSON.stringify({
        vehicleId: 'vehicle-2',
        dealerId: 'dealer-1', // Same dealer as previous test
        userId: 'user-1',     // Same user
        sessionId: 'session-1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.billable).toBe(false); // NOT billable (duplicate dealer)
  });
});
```

### Don't Forget

1. **Rate limiting**: Test exhausting limits
2. **Supabase mocking**: Mock all database calls
3. **Validation**: Test invalid/missing fields
4. **Error scenarios**: 400, 401, 404, 429, 500
5. **Response format**: Verify JSON structure
6. **Headers**: Check Content-Type, rate limit headers
7. **Revenue logic**: Double-check billable calculations (track-click)

**See also:**
- `/docs/reference/testing.md` - Complete testing guide
- `/docs/how-to/add-api-endpoint.md` - API endpoint pattern with testing
- `/CLAUDE.md` - Testing requirements and phases

## Cron Endpoints (Vercel)

**Protected by CRON_SECRET:**

```typescript
// app/api/cron/sync-feed/route.ts

export async function GET(request: NextRequest) {
  // 1. Verify cron secret
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Run cron job
  try {
    const result = await syncFeedFromLotLinx();

    return NextResponse.json({
      success: true,
      added: result.added,
      updated: result.updated,
      removed: result.removed,
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
```

**Vercel automatically adds auth header**

## Quick Reference

**Existing API endpoints:**
1. `/api/search-vehicles` - PostGIS spatial queries
2. `/api/filter-options` - Dynamic filter generation
3. `/api/track-click` - Click deduplication (revenue-critical)
4. `/api/track-impression` - A/B test impression tracking
5. `/api/detect-location` - MaxMind GeoIP
6. `/api/zipcode-lookup` - Zip to coordinates
7. `/api/cron/sync-feed` - LotLinx feed sync (4x daily)
8. `/api/cron/cleanup-rate-limits` - Rate limit cleanup

**See:** `/docs/how-to/add-api-endpoint.md` for complete pattern
**See:** `/docs/reference/api/` (future) for API reference
