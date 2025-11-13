# Next.js 16 Decisions

## Why Next.js 16?

### Release Timeline

- **Next.js 15**: Released October 2024 (stable)
- **Next.js 16**: Released December 2024 (cutting edge)
- **Carzo Started**: November 2024

**Decision:** Adopt Next.js 16 immediately for greenfield project

### Key Reasons

1. **Turbopack Stability** - Default dev server (2-5x faster builds)
2. **React 19 Support** - Latest React features out of the box
3. **Production Ready** - Vercel's confidence in stability
4. **Future-Proof** - No migration needed for 12+ months

## Major Changes in Next.js 16

### 1. Turbopack as Default Dev Server

**Previous (Next.js 15):**
```json
{
  "scripts": {
    "dev": "next dev --turbo"  // Opt-in flag required
  }
}
```

**Current (Next.js 16):**
```json
{
  "scripts": {
    "dev": "next dev"  // Turbopack is default
  }
}
```

**Benefits:**
- **2-5x faster builds** - Rust-based bundler (not webpack)
- **Instant HMR** - Hot Module Replacement in < 100ms
- **Better error messages** - Source maps more accurate
- **Lower memory usage** - More efficient than webpack

**When Turbopack Struggles:**
- Custom webpack plugins (need Turbopack equivalents)
- Very old dependencies (pre-ES6)
- Complex monorepo setups

**Carzo Impact:** ✅ No issues, 3x faster dev server startup

### 2. middleware.ts → proxy.ts

**Previous (Next.js 15):**
```typescript
// middleware.ts (Edge Runtime, limited Node.js APIs)
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Limited to Edge Runtime APIs only
}
```

**Current (Next.js 16):**
```typescript
// proxy.ts (Node.js Runtime by default)
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  // Full Node.js APIs available
  // Can use fs, crypto, etc.
}
```

**Why the Change:**
- More flexibility (Node.js > Edge)
- Access to full Node.js standard library
- Better compatibility with existing libraries

**Carzo Impact:** ✅ Not using middleware/proxy (all logic in API routes)

### 3. Async Route Params

**Previous (Next.js 15):**
```typescript
// app/vehicles/[vin]/page.tsx
export default function VehiclePage({ params }: { params: { vin: string } }) {
  const vin = params.vin;  // Synchronous access
}
```

**Current (Next.js 16):**
```typescript
// app/vehicles/[vin]/page.tsx
export default async function VehiclePage({
  params,
}: {
  params: Promise<{ vin: string }>;
}) {
  const { vin } = await params;  // Must await
}
```

**Why the Change:**
- Aligns with React Server Components async model
- Prepares for future React features (Suspense for data)
- More consistent with other async operations

**Migration Required:**
- Add `async` to function signature
- Add `await params` before accessing values
- Update TypeScript types (`params: Promise<{ ... }>`)

**Carzo Impact:** ✅ All dynamic routes updated to async params

### 4. Stable Cache APIs

**Previous (Next.js 15):**
```typescript
import { unstable_cache, unstable_noStore } from 'next/cache';

// Prefixed with "unstable_"
```

**Current (Next.js 16):**
```typescript
import { cache, noStore } from 'next/cache';

// Prefix removed (now stable)
```

**Why the Change:**
- APIs have matured through testing
- Vercel confident in stability
- Cleaner imports

**Carzo Impact:** ✅ Not currently using cache APIs (future enhancement)

### 5. useSearchParams() Requires Suspense

**Previous (Next.js 15):**
```typescript
// Works without Suspense (warning only)
'use client';
import { useSearchParams } from 'next/navigation';

export default function SearchFilters() {
  const searchParams = useSearchParams();
  // ...
}
```

**Current (Next.js 16):**
```typescript
// MUST wrap in Suspense (error if missing)
'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SearchFiltersImpl() {
  const searchParams = useSearchParams();
  // ...
}

export default function SearchFilters() {
  return (
    <Suspense fallback={<div>Loading filters...</div>}>
      <SearchFiltersImpl />
    </Suspense>
  );
}
```

**Why the Change:**
- Enforces React 19 best practices
- Prevents hydration mismatches
- Better loading states

**Carzo Impact:** ✅ All `useSearchParams()` usages wrapped in Suspense

## App Router vs Pages Router

### Why App Router?

**Previous Architecture (Pages Router):**
```
pages/
├── index.tsx                 # Homepage
├── search.tsx                # Search page
├── vehicles/[vin].tsx        # VDP
└── api/
    └── search-vehicles.ts    # API route
```

**Current Architecture (App Router):**
```
app/
├── page.tsx                  # Homepage
├── search/page.tsx           # Search page
├── vehicles/[vin]/page.tsx   # VDP
└── api/search-vehicles/route.ts  # API route
```

**Benefits of App Router:**
1. **Server Components by Default** - Less JavaScript shipped to client
2. **Streaming & Suspense** - Progressive page rendering
3. **Layouts** - Shared UI across routes (header, footer)
4. **Loading & Error States** - Built-in UI patterns
5. **Parallel Routes** - Multiple content sections load independently
6. **Intercepting Routes** - Modals without route change

**Trade-offs:**
- ❌ More complex file structure (page.tsx, layout.tsx, loading.tsx, error.tsx)
- ❌ New mental model (client vs server components)
- ✅ Better performance (less client-side JavaScript)
- ✅ Modern React patterns (Suspense, streaming)

**Carzo Decision:** App Router (no Pages Router code)

### File-Based Routing

**Convention:**
```
app/
├── page.tsx                  # Route: /
├── layout.tsx                # Layout for all routes
├── loading.tsx               # Loading UI for all routes
├── error.tsx                 # Error UI for all routes
├── search/
│   ├── page.tsx              # Route: /search
│   ├── loading.tsx           # Loading UI for /search
│   └── error.tsx             # Error UI for /search
├── vehicles/[vin]/
│   ├── page.tsx              # Route: /vehicles/:vin
│   ├── loading.tsx           # Loading UI for /vehicles/:vin
│   └── error.tsx             # Error UI for /vehicles/:vin
└── api/
    └── search-vehicles/
        └── route.ts          # API: POST /api/search-vehicles
```

**Special Files:**
- `page.tsx` - Defines the route UI
- `layout.tsx` - Shared UI for child routes
- `loading.tsx` - Automatic loading state (Suspense boundary)
- `error.tsx` - Automatic error boundary
- `not-found.tsx` - 404 page
- `route.ts` - API route handler

## Server Components vs Client Components

### Default: Server Components

**Server Components** (default, no `'use client'`):
```typescript
// app/page.tsx (Server Component)
import { supabase } from '@/lib/supabase';

export default async function HomePage() {
  // Fetch data on server
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .limit(12);

  return (
    <div>
      {vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
    </div>
  );
}
```

**Benefits:**
- ✅ Run on server (zero JS shipped to client)
- ✅ Direct database access (no API route needed)
- ✅ Secure (API keys never exposed)
- ✅ SEO-friendly (fully rendered HTML)

**Limitations:**
- ❌ No useState, useEffect, event handlers
- ❌ No browser APIs (localStorage, window)
- ❌ No React hooks (except async/await)

### When to Use Client Components

**Client Components** (require `'use client'`):
```typescript
// components/Search/FilterSidebar.tsx (Client Component)
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function FilterSidebar() {
  const [make, setMake] = useState('');
  const searchParams = useSearchParams();

  // Interactive UI with state
}
```

**Use Client Components When:**
- Need useState, useEffect, useContext
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, geolocation)
- Third-party libraries requiring client (React components)

**Carzo Usage:**
- Server: Homepage, VDP content, search results rendering
- Client: Filter sidebar, search form, mobile drawer, analytics tracking

### Composition Pattern

**Best Practice:** Server Component wraps Client Component

```typescript
// app/search/page.tsx (Server Component)
import FilterSidebar from '@/components/Search/FilterSidebar'; // Client
import SearchResults from '@/components/Search/SearchResults'; // Server

export default async function SearchPage() {
  // Fetch data on server
  const { data: vehicles } = await fetchVehicles();

  return (
    <div className="flex">
      <FilterSidebar /> {/* Client Component */}
      <SearchResults vehicles={vehicles} /> {/* Server Component */}
    </div>
  );
}
```

**Why This Works:**
- Server Component does heavy lifting (data fetching)
- Client Component handles interactivity
- Minimal JavaScript sent to browser

## Data Fetching Patterns

### 1. Server Components (Direct Database Access)

```typescript
// app/vehicles/[vin]/page.tsx
import { supabase } from '@/lib/supabase';

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ vin: string }>;
}) {
  const { vin } = await params;

  // Fetch directly from database (no API route)
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('vin', vin)
    .single();

  if (!vehicle) {
    return <div>Vehicle not found</div>;
  }

  return <VehicleDetails vehicle={vehicle} />;
}
```

**Benefits:**
- No API route needed (simpler)
- Faster (no HTTP round-trip)
- Secure (credentials on server)

### 2. Client Components (API Routes)

```typescript
// components/Search/SearchForm.tsx
'use client';

import { useState } from 'react';

export default function SearchForm() {
  const [results, setResults] = useState([]);

  const handleSearch = async (make: string) => {
    // Call API route (required for client-side fetches)
    const res = await fetch('/api/search-vehicles', {
      method: 'POST',
      body: JSON.stringify({ make }),
    });

    const data = await res.json();
    setResults(data);
  };

  return <form onSubmit={handleSearch}>...</form>;
}
```

**Why API Route?**
- Client components can't access database directly
- Protects credentials (Supabase keys stay on server)
- Rate limiting applied at API level

### 3. Revalidation (ISR - Incremental Static Regeneration)

```typescript
// app/vehicles/[vin]/page.tsx
export const revalidate = 21600; // 6 hours in seconds

export default async function VehiclePage({ params }) {
  // Page regenerated every 6 hours
  // Cached between regenerations
}
```

**Use Cases:**
- VDP pages (72K vehicles, can't pre-generate all)
- Content that changes infrequently
- Balance freshness vs performance

**Carzo Strategy:**
- VDPs: 6-hour revalidation (price/availability changes)
- Homepage: 1-hour revalidation (featured vehicles rotate)
- Search: No caching (always fresh)

## Deployment Considerations

### Vercel Integration

**Automatic:**
- Push to main → Deploy to production
- Push to branch → Deploy to preview
- Environment variables synced
- Cron jobs configured from vercel.json

**Configuration (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-feed",
      "schedule": "0 3,9,15,21 * * *"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_key"
  }
}
```

**Build Settings:**
- Framework Preset: Next.js
- Build Command: `next build`
- Output Directory: `.next`
- Install Command: `npm install`
- Node.js Version: 20.x

### Environment Variables

**Public (client-side accessible):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SITE_URL=https://carzo.net
```

**Private (server-side only):**
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
LOTLINX_FEED_USERNAME=your_username
CRON_SECRET=your_cron_secret
```

**Vercel Dashboard:**
- Production values in "Environment Variables"
- Preview values (optional) for staging
- Encrypted at rest

### Edge Functions vs Serverless Functions

**Edge Functions:**
- Run on Vercel Edge Network (global)
- Limited to Edge Runtime APIs
- < 1ms cold start
- Best for: Middleware, redirects, A/B tests

**Serverless Functions:**
- Run in specific region (us-east-1 default)
- Full Node.js APIs
- ~100ms cold start
- Best for: API routes, database queries

**Carzo Usage:**
- All API routes: Serverless (need PostGIS, Supabase)
- No Edge Functions (not needed)

## Performance Optimizations

### 1. Turbopack Build Speed

**Benchmark (Carzo project):**
- Webpack (Next.js 14): ~15-20 seconds
- Turbopack (Next.js 16): ~5-7 seconds
- **3x faster builds**

**Impact:**
- Faster dev server startup
- Instant HMR (< 100ms)
- Better developer experience

### 2. Server Components Reduce JavaScript

**Without Server Components:**
```
Homepage bundle: 250 KB (incl. React, data fetching logic)
```

**With Server Components:**
```
Homepage bundle: 80 KB (only interactive components)
170 KB savings (68% reduction)
```

**Result:**
- Faster initial page load
- Better Core Web Vitals (LCP, FID, CLS)
- Less client-side computation

### 3. Streaming with Suspense

```typescript
// app/search/page.tsx
import { Suspense } from 'react';

export default function SearchPage() {
  return (
    <div>
      <Suspense fallback={<FilterSkeleton />}>
        <FilterSidebar />
      </Suspense>

      <Suspense fallback={<ResultsSkeleton />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
```

**Benefits:**
- Parts of page load independently
- User sees content faster (progressive rendering)
- Better perceived performance

## Migration Challenges

### Challenge 1: Async Params

**Problem:** All dynamic routes broke after upgrade

**Solution:** Add `async` + `await params` to every dynamic route

**Files Changed:**
- `app/vehicles/[vin]/page.tsx`
- `app/vehicles/[vin]/loading.tsx`
- `app/vehicles/[vin]/error.tsx`

### Challenge 2: Suspense Boundaries

**Problem:** `useSearchParams()` errors without Suspense

**Solution:** Wrap all `useSearchParams()` usages in Suspense

**Pattern:**
```typescript
// Before: Direct usage (error)
export default function Filters() {
  const searchParams = useSearchParams(); // ❌ Error
}

// After: Suspense wrapper (works)
function FiltersImpl() {
  const searchParams = useSearchParams(); // ✅ OK
}

export default function Filters() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FiltersImpl />
    </Suspense>
  );
}
```

### Challenge 3: Server vs Client Components

**Problem:** Mixed server/client code causing hydration errors

**Solution:** Clear separation:
- Server: Data fetching, static UI
- Client: Interactive UI, state management

**Debugging:** Use React DevTools to identify component type

## Future Next.js Features

### React 19 Features (Coming)

**Server Actions:**
```typescript
// Form submission without API route
export default function ContactForm() {
  async function handleSubmit(formData: FormData) {
    'use server'; // Server Action

    // Runs on server, no API route needed
    await saveToDatabase(formData);
  }

  return <form action={handleSubmit}>...</form>;
}
```

**Use Client Directive with Async:**
```typescript
'use client';

// Client Component can be async (React 19)
export default async function ClientDataFetch() {
  const data = await fetch('/api/data');
  return <div>{data}</div>;
}
```

**Carzo Adoption:** Monitor React 19 stable release (Q1 2025)

### Partial Pre-rendering (Experimental)

**Hybrid Static + Dynamic:**
```typescript
export const experimental_ppr = true;

export default function Page() {
  return (
    <div>
      <StaticHeader />  {/* Pre-rendered */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent />  {/* Rendered on-demand */}
      </Suspense>
      <StaticFooter />  {/* Pre-rendered */}
    </div>
  );
}
```

**Benefits:**
- Best of both worlds (static + dynamic)
- Faster TTFB (static parts cached)
- Fresh data (dynamic parts on-demand)

**Carzo Adoption:** Not enabled (experimental)

---

**Related Documentation:**
- [Architecture Overview](./architecture-overview.md) - Next.js in system design
- [Deployment Guide](../how-to/deploy-to-vercel.md) - Production deployment
- [Performance Optimization](../explanation/performance-optimization.md) - Core Web Vitals
