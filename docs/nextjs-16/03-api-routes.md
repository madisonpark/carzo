# API Routes & Middleware in Next.js 16

> **Official Docs:** [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) | [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

## Route Handlers (API Routes)

Route handlers replace the old `pages/api/*` pattern in the App Router.

### Basic Route Handler

```typescript
// app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({
    message: 'Hello from Next.js 16!'
  });
}
```

**URL:** `http://localhost:3000/api/hello`

### All HTTP Methods

```typescript
// app/api/vehicles/route.ts
export async function GET(request: Request) {
  // Handle GET
}

export async function POST(request: Request) {
  // Handle POST
}

export async function PUT(request: Request) {
  // Handle PUT
}

export async function DELETE(request: Request) {
  // Handle DELETE
}

export async function PATCH(request: Request) {
  // Handle PATCH
}
```

### Reading Request Data

```typescript
export async function POST(request: Request) {
  // 1. JSON body
  const body = await request.json();

  // 2. Form data
  const formData = await request.formData();
  const name = formData.get('name');

  // 3. URL search params
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // 4. Headers
  const authHeader = request.headers.get('authorization');

  // 5. Cookies
  const { cookies } = await import('next/headers');
  const token = cookies().get('auth_token');

  return NextResponse.json({ success: true });
}
```

### Dynamic Route Handlers

```typescript
// app/api/vehicles/[vin]/route.ts
interface RouteContext {
  params: Promise<{ vin: string }>;  // ⚠️ Async in Next 16!
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  const { vin } = await context.params;  // Must await

  const vehicle = await getVehicle(vin);

  if (!vehicle) {
    return NextResponse.json(
      { error: 'Vehicle not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(vehicle);
}
```

**URL:** `/api/vehicles/ABC123`

### Response Types

```typescript
// 1. JSON Response
export async function GET() {
  return NextResponse.json({ data: 'value' });
}

// 2. Text Response
export async function GET() {
  return new NextResponse('Plain text response');
}

// 3. HTML Response
export async function GET() {
  return new NextResponse('<html><body>Hello</body></html>', {
    headers: { 'Content-Type': 'text/html' }
  });
}

// 4. Redirect
export async function GET() {
  return NextResponse.redirect(new URL('/new-path', request.url));
}

// 5. Stream Response
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue('chunk 1\n');
      controller.enqueue('chunk 2\n');
      controller.close();
    }
  });

  return new NextResponse(stream);
}
```

### Setting Headers & Cookies

```typescript
export async function GET() {
  const response = NextResponse.json({ success: true });

  // Set headers
  response.headers.set('X-Custom-Header', 'value');
  response.headers.set('Cache-Control', 'public, max-age=3600');

  // Set cookies
  response.cookies.set('session', 'token123', {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });

  return response;
}
```

### Error Handling

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validation
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    // Process...
    const result = await processData(body);

    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### CORS Configuration

```typescript
export async function GET(request: Request) {
  const response = NextResponse.json({ data: 'value' });

  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

## Middleware → proxy.ts (New in Next 16)

**⚠️ BREAKING CHANGE:** `middleware.ts` is deprecated in Next.js 16. Use `proxy.ts` instead.

### Migration: middleware.ts → proxy.ts

```typescript
// ❌ OLD: middleware.ts (deprecated)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // ...
}

// ✅ NEW: proxy.ts (Next 16)
import { NextResponse } from 'next/server';

export function proxy(request: Request) {
  // Same logic, different name
}
```

### Basic Proxy Example

```typescript
// proxy.ts (at project root)
import { NextResponse } from 'next/server';

export function proxy(request: Request) {
  const url = new URL(request.url);

  // Log all requests
  console.log(`${request.method} ${url.pathname}`);

  // Continue with request
  return NextResponse.next();
}
```

### Redirect Example

```typescript
export function proxy(request: Request) {
  const url = new URL(request.url);

  // Redirect /old-path to /new-path
  if (url.pathname === '/old-path') {
    return NextResponse.redirect(new URL('/new-path', request.url));
  }

  return NextResponse.next();
}
```

### Authentication Check

```typescript
export async function proxy(request: Request) {
  const url = new URL(request.url);

  // Protect /admin routes
  if (url.pathname.startsWith('/admin')) {
    const token = request.headers.get('cookie')?.includes('auth_token');

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}
```

### Rewrite (Internal Redirect)

```typescript
export function proxy(request: Request) {
  const url = new URL(request.url);

  // Rewrite /blog/* to /content/blog/*
  if (url.pathname.startsWith('/blog')) {
    url.pathname = url.pathname.replace('/blog', '/content/blog');
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
```

### Conditional Execution (Matcher)

```typescript
// proxy.ts
export function proxy(request: Request) {
  // Run for all requests by default
  // Or use config to limit
}

export const config = {
  matcher: [
    '/admin/:path*',      // Only admin routes
    '/api/:path*',        // Only API routes
    '/((?!_next/static|_next/image|favicon.ico).*)',  // Exclude static files
  ]
};
```

### Modifying Response Headers

```typescript
export function proxy(request: Request) {
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  return response;
}
```

## Runtime: Node vs Edge

### Node.js Runtime (Default)

```typescript
// app/api/db-query/route.ts
// Runs in Node.js (can use Node APIs)
import { db } from '@/lib/database';
import fs from 'fs';

export async function GET() {
  // Can use Node.js APIs
  const data = await db.query('SELECT * FROM vehicles');
  const file = fs.readFileSync('./data.txt', 'utf-8');

  return NextResponse.json({ data });
}
```

### Edge Runtime

```typescript
// app/api/fast/route.ts
export const runtime = 'edge';  // Run on Edge

export async function GET() {
  // ⚠️ Cannot use Node.js APIs here
  // ✅ Can use Web APIs (fetch, Response, etc.)

  const data = await fetch('https://api.example.com/data');
  return Response.json(await data.json());
}
```

**Edge Runtime Limitations:**
- ❌ No Node.js APIs (fs, path, crypto.randomBytes, etc.)
- ❌ No native Node modules
- ❌ Limited package support
- ✅ Lower latency (runs globally)
- ✅ Faster cold starts

**When to use Edge:**
- Middleware/proxy (geolocation, auth checks)
- Simple API routes with no DB access
- Real-time data aggregation
- A/B testing, feature flags

## Carzo-Specific Examples

### Click Tracking API

```typescript
// app/api/track-click/route.ts
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vehicleId, dealerId, userId } = body;

    // Validation
    if (!vehicleId || !dealerId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check 30-day deduplication
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: history } = await supabaseAdmin
      .from('dealer_click_history')
      .select('*')
      .eq('user_id', userId)
      .eq('dealer_id', dealerId)
      .gte('first_click_at', thirtyDaysAgo.toISOString())
      .single();

    const isBillable = !history;

    // Log click
    await supabaseAdmin.from('clicks').insert({
      vehicle_id: vehicleId,
      dealer_id: dealerId,
      user_id: userId,
      is_billable: isBillable,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      billable: isBillable,
    });

  } catch (error) {
    console.error('Click tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Zip Code Lookup API

```typescript
// app/api/zipcode-lookup/route.ts
import zipcodes from 'zipcodes';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get('zip');

  if (!zip) {
    return NextResponse.json(
      { error: 'Zip code required' },
      { status: 400 }
    );
  }

  const zipData = zipcodes.lookup(zip);

  if (!zipData) {
    return NextResponse.json(
      { error: 'Zip code not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    location: {
      city: zipData.city,
      state: zipData.state,
      latitude: zipData.latitude,
      longitude: zipData.longitude,
      zipCode: zip,
    },
  });
}
```

### Admin Authentication Proxy

```typescript
// proxy.ts
export async function proxy(request: Request) {
  const url = new URL(request.url);

  // Protect admin routes
  if (url.pathname.startsWith('/admin')) {
    const { cookies } = await import('next/headers');
    const adminToken = cookies().get('admin_token');

    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

## Best Practices

### 1. Use Appropriate Status Codes

```typescript
// 200 - Success
return NextResponse.json({ success: true });

// 201 - Created
return NextResponse.json({ id: newId }, { status: 201 });

// 400 - Bad Request (validation error)
return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

// 401 - Unauthorized
return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

// 403 - Forbidden
return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

// 404 - Not Found
return NextResponse.json({ error: 'Resource not found' }, { status: 404 });

// 500 - Server Error
return NextResponse.json({ error: 'Internal error' }, { status: 500 });
```

### 2. Validate Input

```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
});

export async function POST(request: Request) {
  const body = await request.json();

  const result = schema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: result.error.issues },
      { status: 400 }
    );
  }

  // Process validated data
  const { email, age } = result.data;
}
```

### 3. Set Cache Headers

```typescript
export async function GET() {
  const data = await fetchData();

  return NextResponse.json(data, {
    headers: {
      // Cache for 1 hour, stale-while-revalidate for 1 day
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
```

### 4. Use TypeScript

```typescript
interface CreateVehicleRequest {
  vin: string;
  make: string;
  model: string;
  year: number;
}

interface CreateVehicleResponse {
  success: boolean;
  vehicleId?: string;
  error?: string;
}

export async function POST(
  request: Request
): Promise<NextResponse<CreateVehicleResponse>> {
  const body: CreateVehicleRequest = await request.json();
  // Fully typed!
}
```

## References

- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Middleware (proxy.ts)](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [NextResponse API](https://nextjs.org/docs/app/api-reference/functions/next-response)
- [Edge Runtime](https://nextjs.org/docs/app/api-reference/edge)

---

**Next:** [Performance & Caching →](./04-performance.md)
