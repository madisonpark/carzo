# Data Fetching in Next.js 16

> **Official Docs:** [Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)

## Overview: Rendering Strategies

Next.js 16 supports four main rendering patterns:

| Strategy | When | How | Cache |
|----------|------|-----|-------|
| **SSG** (Static) | Build time | Pre-render at build | Forever (until rebuild) |
| **ISR** (Incremental) | Build + revalidate | Pre-render + periodic refresh | Time-based |
| **SSR** (Dynamic) | Every request | Render on each request | No cache |
| **CSR** (Client) | After hydration | Fetch on client | Client-side cache |

## Server Components (Async Data Fetching)

### Basic Server-Side Data Fetch

```typescript
// app/vehicles/page.tsx (Server Component)
import { supabase } from '@/lib/supabase';

export default async function VehiclesPage() {
  // Direct database access on server
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .limit(20);

  return (
    <div>
      {vehicles?.map(v => (
        <VehicleCard key={v.id} vehicle={v} />
      ))}
    </div>
  );
}
```

**Benefits:**
- ✅ No API route needed
- ✅ Zero client JavaScript for data fetching
- ✅ Secure (credentials stay on server)
- ✅ Better SEO (fully rendered HTML)

## Static Site Generation (SSG)

### Default: Static by Default

```typescript
// app/blog/[slug]/page.tsx
// This page is STATIC by default (generated at build time)

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  return <article>{post.content}</article>;
}

// Tell Next which paths to pre-generate
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map(post => ({
    slug: post.slug,
  }));
}
```

**When to use:**
- Content changes infrequently
- Build-time data is acceptable
- Maximum performance needed

## Incremental Static Regeneration (ISR)

### Time-based Revalidation

```typescript
// app/vehicles/[vin]/page.tsx
export const revalidate = 3600;  // Revalidate every 1 hour

export default async function VehiclePage({ params }: PageProps) {
  const { vin } = await params;
  const vehicle = await getVehicle(vin);
  return <VehicleDetails vehicle={vehicle} />;
}
```

**How it works:**
1. First request: Generate page, cache for 1 hour
2. Requests within 1 hour: Serve cached version (instant)
3. Request after 1 hour: Serve stale cache, regenerate in background
4. Next request: Serve fresh version

### On-Demand Revalidation

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const { path, tag } = await request.json();

  if (path) {
    revalidatePath(path);  // Revalidate specific path
  }

  if (tag) {
    revalidateTag(tag);    // Revalidate all with this tag
  }

  return Response.json({ revalidated: true });
}
```

**Trigger revalidation:**
```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"path":"/vehicles/ABC123"}'
```

## Server-Side Rendering (SSR)

### Force Dynamic Rendering

```typescript
// app/dashboard/page.tsx
export const dynamic = 'force-dynamic';  // Always SSR

export default async function Dashboard() {
  // This runs on EVERY request
  const session = await getServerSession();
  const userData = await getUserData(session.id);

  return <div>Welcome, {userData.name}</div>;
}
```

### Using Cookies/Headers (Automatically Dynamic)

```typescript
import { cookies, headers } from 'next/headers';

export default async function ProfilePage() {
  // Using cookies() makes this page dynamic automatically
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token');

  // Or use headers
  const headersList = headers();
  const userAgent = headersList.get('user-agent');

  return <div>Your profile</div>;
}
```

### Fetch with no-store (Dynamic)

```typescript
export default async function RealTimePage() {
  // Force dynamic by not caching fetch
  const res = await fetch('https://api.example.com/live-data', {
    cache: 'no-store'  // Never cache = always SSR
  });
  const data = await res.json();

  return <div>{data.value}</div>;
}
```

## Client-Side Rendering (CSR)

### Using useEffect (Traditional CSR)

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function ClientFetch() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{data}</div>;
}
```

### Using SWR (Recommended for CSR)

```typescript
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function VehicleSearch() {
  const { data, error, isLoading } = useSWR('/api/vehicles', fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map(vehicle => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
```

**SWR features:**
- Automatic revalidation
- Focus revalidation
- Interval polling
- Built-in cache
- Optimistic UI

## Parallel Data Fetching

### Sequential (Slow)

```typescript
// ❌ BAD: Waterfall - second fetch waits for first
export default async function Page() {
  const user = await getUser();
  const posts = await getPosts(user.id);  // Waits for user
  return <div>...</div>;
}
```

### Parallel (Fast)

```typescript
// ✅ GOOD: Both fetch simultaneously
export default async function Page() {
  const [user, posts] = await Promise.all([
    getUser(),
    getPosts(),
  ]);
  return <div>...</div>;
}
```

## Streaming with Suspense

### Streaming Heavy Components

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import RecentActivity from './RecentActivity';  // Slow component

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Fast content renders immediately */}
      <QuickStats />

      {/* Slow content streams in when ready */}
      <Suspense fallback={<div>Loading activity...</div>}>
        <RecentActivity />  {/* Async server component */}
      </Suspense>
    </div>
  );
}
```

```typescript
// app/dashboard/RecentActivity.tsx (Server Component)
export default async function RecentActivity() {
  // Slow query - but doesn't block page
  const activity = await db.query(`
    SELECT * FROM activity
    ORDER BY created_at DESC
    LIMIT 10
  `);

  return <div>{/* render activity */}</div>;
}
```

**Result:**
1. Page shell renders instantly
2. QuickStats shows immediately
3. "Loading activity..." displays
4. When query finishes, RecentActivity streams in

## Data Caching

### Fetch Cache Options

```typescript
// Default: cache until revalidate
fetch('https://api.example.com/data')

// Force cache (SSG)
fetch(url, { cache: 'force-cache' })

// Never cache (SSR)
fetch(url, { cache: 'no-store' })

// Revalidate after time
fetch(url, { next: { revalidate: 3600 } })

// Tag for on-demand revalidation
fetch(url, { next: { tags: ['vehicles'] } })
```

### React cache() for Database Queries

```typescript
import { cache } from 'react';
import { db } from '@/lib/db';

// Memoize database calls within a request
export const getVehicle = cache(async (vin: string) => {
  return db.vehicles.findUnique({ where: { vin } });
});

// Multiple calls in same request = only one DB query
export default async function Page() {
  const v1 = await getVehicle('ABC123');
  const v2 = await getVehicle('ABC123');  // Uses cached result
  const v3 = await getVehicle('ABC123');  // Uses cached result
  // Only 1 database query executed!
}
```

## New Cache APIs in Next.js 16

### cacheTag and revalidateTag

```typescript
// Mark data with cache tags
import { unstable_cacheTag as cacheTag } from 'next/cache';

export async function getVehicles() {
  const vehicles = await db.vehicles.findMany();

  // Tag this data
  cacheTag('vehicles');

  return vehicles;
}

// Later, revalidate all data with this tag
import { revalidateTag } from 'next/cache';

// In API route or server action
await revalidateTag('vehicles', 'max');  // Revalidate all 'vehicles' data
```

### cacheLife Profiles

```typescript
export const revalidate = 3600;  // Default revalidate time

// Or use named profiles
export const cacheLife = 'hours';  // Predefined profile

// Available profiles:
// - 'seconds' (10s)
// - 'minutes' (5min)
// - 'hours' (1hr)
// - 'days' (1 day)
// - 'weeks' (1 week)
// - 'max' (infinite)
```

## Carzo-Specific Patterns

### Vehicle Detail Pages (ISR)

```typescript
// app/vehicles/[vin]/page.tsx
export const revalidate = 3600;  // 1 hour

export async function generateStaticParams() {
  // Pre-generate top 1000 vehicles at build time
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('vin')
    .eq('is_active', true)
    .limit(1000);

  return vehicles?.map(v => ({ vin: v.vin })) || [];
}

export default async function VehiclePage({ params }: PageProps) {
  const { vin } = await params;

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('vin', vin)
    .single();

  if (!vehicle) notFound();

  return <VehicleDetails vehicle={vehicle} />;
}
```

**Benefits:**
- Top 1000 vehicles pre-rendered at build (instant load)
- Other vehicles generated on first visit (then cached)
- All pages refresh every hour to stay current

### Search Results (SSR with Location)

```typescript
// app/search/page.tsx
export const dynamic = 'force-dynamic';  // Always SSR (user location varies)

interface SearchParams {
  searchParams: Promise<{
    make?: string;
    lat?: string;
    lon?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  const { make, lat, lon } = params;

  // Fetch based on user location (different for each user)
  const vehicles = await searchVehicles({ make, lat, lon });

  return <SearchResults vehicles={vehicles} />;
}
```

### API Routes with Caching

```typescript
// app/api/vehicles/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const { data } = await supabase
    .from('vehicles')
    .select('*')
    .limit(100);

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
```

## Best Practices

### 1. Choose the Right Strategy

```typescript
// ✅ Static (SSG) - Marketing pages, docs
export const dynamic = 'force-static';

// ✅ ISR - Content that changes periodically
export const revalidate = 3600;

// ✅ Dynamic (SSR) - User-specific data
export const dynamic = 'force-dynamic';

// ✅ Client (CSR) - Real-time updates, user interactions
'use client' + useEffect/SWR
```

### 2. Parallel Fetching

```typescript
// ✅ GOOD
const [vehicles, dealers, stats] = await Promise.all([
  getVehicles(),
  getDealers(),
  getStats(),
]);

// ❌ BAD
const vehicles = await getVehicles();
const dealers = await getDealers();
const stats = await getStats();
```

### 3. Use Suspense for Heavy Content

```typescript
<Suspense fallback={<Skeleton />}>
  <HeavyComponent />  {/* Doesn't block rest of page */}
</Suspense>
```

### 4. Tag Your Caches

```typescript
// Tag related data for easy invalidation
const vehicles = await fetch('/api/vehicles', {
  next: { tags: ['vehicles', 'inventory'] }
});

// Later, invalidate all inventory
revalidateTag('inventory');
```

## References

- [Data Fetching Guide](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Caching in Next.js](https://nextjs.org/docs/app/building-your-application/caching)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [SWR Documentation](https://swr.vercel.app/)

---

**Next:** [API Routes & Middleware →](./03-api-routes.md)
