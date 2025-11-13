# How to Add a New API Endpoint

This guide walks you through creating a new API endpoint in Carzo with rate limiting, authentication, and proper error handling.

## Prerequisites

- Next.js 16 App Router knowledge
- Understanding of [Rate Limiting Strategy](../explanation/rate-limiting-strategy.md)
- Supabase client setup

## Step 1: Create the Route File

Next.js 16 uses file-based routing in the `app/api/` directory.

```bash
# Create new endpoint directory and route file
mkdir -p app/api/my-endpoint
touch app/api/my-endpoint/route.ts
```

**File structure:**
```
app/api/
└── my-endpoint/
    └── route.ts
```

**URL:** `https://carzo.net/api/my-endpoint`

---

## Step 2: Basic Route Handler

Start with a basic route handler structure:

```typescript
// app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// For POST requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Your logic here
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Step 3: Add Rate Limiting

**All POST endpoints MUST have rate limiting.**

```typescript
// app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getClientIdentifier, checkMultipleRateLimits, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // 1. Get client identifier (IP or user ID)
  const identifier = getClientIdentifier(request);

  // 2. Check rate limits (per-minute + burst)
  const rateLimitResult = await checkMultipleRateLimits(identifier, [
    { endpoint: 'my_endpoint', ...RATE_LIMITS.SEARCH_VEHICLES },  // 100/min
    { endpoint: 'my_endpoint_burst', ...RATE_LIMITS.BURST },      // 10/sec
  ]);

  // 3. Return 429 if rate limit exceeded
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          'Retry-After': rateLimitResult.retryAfter.toString(),
        },
      }
    );
  }

  // 4. Add rate limit headers to success response
  try {
    const body = await request.json();

    // Your logic here
    const result = { success: true, data: body };

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Why rate limiting?**
- Prevents DoS attacks
- Stops scraping bots
- Protects Supabase quota
- Required for all POST endpoints

---

## Step 4: Add Input Validation

Validate request body with Zod:

```bash
# Install Zod (if not already installed)
npm install zod
```

```typescript
import { z } from 'zod';

// Define schema
const MyEndpointSchema = z.object({
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50).optional(),
  maxPrice: z.number().positive().optional(),
});

export async function POST(request: NextRequest) {
  // ... rate limiting code ...

  try {
    const body = await request.json();

    // Validate input
    const validationResult = MyEndpointSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { make, model, maxPrice } = validationResult.data;

    // Your logic here with validated data
    // ...
  } catch (error) {
    // ... error handling ...
  }
}
```

---

## Step 5: Add Database Query

Use Supabase client for database operations:

```typescript
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  // ... rate limiting + validation ...

  const supabase = createClient();

  try {
    const { make, model, maxPrice } = validationResult.data;

    // Query database
    let query = supabase
      .from('vehicles')
      .select('*')
      .eq('make', make)
      .eq('is_active', true);

    if (model) {
      query = query.eq('model', model);
    }

    if (maxPrice) {
      query = query.lte('price', maxPrice);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Step 6: Add TypeScript Types

Define request/response types for better DX:

```typescript
// types/api.ts (create if doesn't exist)
export interface MyEndpointRequest {
  make: string;
  model?: string;
  maxPrice?: number;
}

export interface MyEndpointResponse {
  success: boolean;
  data: Vehicle[];
  count: number;
}

export interface Vehicle {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  price: number;
  // ... other fields
}
```

**Use in route:**
```typescript
import type { MyEndpointRequest, MyEndpointResponse, Vehicle } from '@/types/api';

export async function POST(request: NextRequest): Promise<NextResponse<MyEndpointResponse>> {
  // ... implementation
}
```

---

## Step 7: Add Error Handling

Comprehensive error handling:

```typescript
export async function POST(request: NextRequest) {
  try {
    // ... rate limiting ...

    let body: MyEndpointRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // ... validation ...

    const supabase = createClient();

    try {
      const { data, error } = await supabase.from('vehicles').select('*');

      if (error) {
        // Log full error for debugging
        console.error('Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
        });

        // Return generic error to user
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Step 8: Test the Endpoint

### Local Testing

```bash
# Start dev server
npm run dev

# Test with curl
curl -X POST http://localhost:3000/api/my-endpoint \
  -H "Content-Type: application/json" \
  -d '{"make":"Toyota","model":"Camry","maxPrice":30000}'
```

### Test Rate Limiting

```bash
# Send 101 requests rapidly (should get 429 on 101st)
for i in {1..101}; do
  curl -X POST http://localhost:3000/api/my-endpoint \
    -H "Content-Type: application/json" \
    -d '{"make":"Toyota"}' &
done
```

---

## Step 9: Write Tests

Create test file:

```typescript
// app/api/my-endpoint/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [{ id: 1, make: 'Toyota' }],
          error: null,
        })),
      })),
    })),
  }),
}));

describe('POST /api/my-endpoint', () => {
  it('should return vehicles matching make', async () => {
    const request = new NextRequest('http://localhost:3000/api/my-endpoint', {
      method: 'POST',
      body: JSON.stringify({ make: 'Toyota' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
  });

  it('should return 400 for invalid input', async () => {
    const request = new NextRequest('http://localhost:3000/api/my-endpoint', {
      method: 'POST',
      body: JSON.stringify({ make: '' }), // Invalid: empty string
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

Run tests:
```bash
npm run test -- my-endpoint
```

---

## Step 10: Document the Endpoint

Create API reference documentation:

```bash
touch docs/reference/api/my-endpoint.md
```

**Template:**
```markdown
# API Reference: /api/my-endpoint

## Overview

Brief description of what this endpoint does.

**Endpoint:** `POST /api/my-endpoint`
**Authentication:** None (or specify if needed)
**Rate Limiting:** 100 requests/minute, 10 requests/second (burst)

## Request

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `make` | string | Yes | Vehicle manufacturer |
| `model` | string | No | Vehicle model |
| `maxPrice` | number | No | Maximum price filter |

### Example Request

\`\`\`bash
curl -X POST https://carzo.net/api/my-endpoint \
  -H "Content-Type: application/json" \
  -d '{"make":"Toyota","model":"Camry","maxPrice":30000}'
\`\`\`

## Response

### Success Response (200 OK)

\`\`\`json
{
  "success": true,
  "data": [...],
  "count": 10
}
\`\`\`

### Error Responses

- **400 Bad Request** - Invalid input
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error
```

---

## Complete Example

Here's a complete endpoint with all best practices:

```typescript
// app/api/vehicles-by-make/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase';
import {
  getClientIdentifier,
  checkMultipleRateLimits,
  RATE_LIMITS,
} from '@/lib/rate-limit';
import type { Vehicle } from '@/types/api';

// Input validation schema
const RequestSchema = z.object({
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50).optional(),
  maxPrice: z.number().positive().max(1000000).optional(),
  limit: z.number().int().positive().max(100).default(20),
});

interface VehiclesByMakeResponse {
  success: boolean;
  data?: Vehicle[];
  count?: number;
  error?: string;
  details?: any;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<VehiclesByMakeResponse>> {
  // 1. Rate limiting
  const identifier = getClientIdentifier(request);

  const rateLimitResult = await checkMultipleRateLimits(identifier, [
    { endpoint: 'vehicles_by_make', ...RATE_LIMITS.SEARCH_VEHICLES },
    { endpoint: 'vehicles_by_make_burst', ...RATE_LIMITS.BURST },
  ]);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded',
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          'Retry-After': rateLimitResult.retryAfter.toString(),
        },
      }
    );
  }

  try {
    // 2. Parse and validate input
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const validationResult = RequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { make, model, maxPrice, limit } = validationResult.data;

    // 3. Query database
    const supabase = createClient();

    let query = supabase
      .from('vehicles')
      .select('*')
      .eq('make', make)
      .eq('is_active', true);

    if (model) {
      query = query.eq('model', model);
    }

    if (maxPrice) {
      query = query.lte('price', maxPrice);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      console.error('Supabase error:', {
        code: error.code,
        message: error.message,
        endpoint: 'vehicles_by_make',
      });

      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    // 4. Return success response with rate limit headers
    return NextResponse.json(
      {
        success: true,
        data,
        count: data.length,
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in vehicles_by_make:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Checklist

Before deploying your endpoint:

- [ ] Rate limiting added (if POST endpoint)
- [ ] Input validation with Zod
- [ ] TypeScript types defined
- [ ] Error handling comprehensive
- [ ] Database queries optimized
- [ ] Tests written and passing
- [ ] API documentation created
- [ ] Manual testing completed
- [ ] Commit and push to branch
- [ ] Create PR for review

---

## Common Patterns

### Pagination

```typescript
const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
const limit = 20;
const offset = (page - 1) * limit;

const { data, error, count } = await supabase
  .from('vehicles')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1);

return NextResponse.json({
  data,
  pagination: {
    page,
    limit,
    total: count,
    pages: Math.ceil((count || 0) / limit),
  },
});
```

### Authentication (Future)

```typescript
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Use session.user.id for authenticated requests
}
```

---

## Related Documentation

- [Rate Limiting Strategy](../explanation/rate-limiting-strategy.md)
- [API Reference](../reference/api/)
- [Testing Guide](../reference/testing.md)
- [Database Schema](../reference/database-schema.md)
