# Carzo-Specific Next.js 16 Patterns

This document outlines how we specifically use Next.js 16 features in the Carzo project.

## Project Overview

- **Next.js Version:** 16.0.1
- **Router:** App Router (app/ directory)
- **Rendering:** Mix of SSG, ISR, and SSR
- **TypeScript:** Strict mode enabled
- **Bundler:** Turbopack (dev), Webpack (production)

## Routing Architecture

```
app/
├── layout.tsx                    # Root layout (Carzo branding)
├── page.tsx                      # Homepage (SSG with ISR)
├── search/
│   └── page.tsx                  # Search results (SSR - user location varies)
├── vehicles/
│   └── [vin]/
│       └── page.tsx              # VDP pages (ISR, 1 hour revalidate)
├── admin/
│   ├── page.tsx                  # Admin dashboard (SSR)
│   └── login/page.tsx            # Admin login (SSG)
└── api/
    ├── detect-location/route.ts  # MaxMind IP geolocation
    ├── zipcode-lookup/route.ts   # Zip to coordinates
    ├── track-click/route.ts      # Click tracking with deduplication
    └── cron/sync-feed/route.ts   # LotLinx feed sync (4x daily)
```

## Rendering Strategies by Page

### Homepage (SSG + ISR)

```typescript
// app/page.tsx
export const revalidate = 3600;  // Regenerate every hour

export default async function HomePage() {
  // Pre-rendered at build, refreshed hourly
  const featuredVehicles = await getFeaturedVehicles();
  const popularMakes = await getPopularMakes();

  return (
    <div>
      <Suspense fallback={<div className="h-20" />}>
        <HeroSearch />  {/* Client component with useSearchParams */}
      </Suspense>
      {/* Featured vehicles */}
    </div>
  );
}
```

**Why ISR?**
- Homepage content changes as inventory updates
- Don't want build-time data only (would be stale)
- Don't need real-time (SSR overhead unnecessary)
- 1-hour cache is perfect balance

### Search Results (SSR)

```typescript
// app/search/page.tsx
export const dynamic = 'force-dynamic';  // Always SSR

interface SearchParams {
  searchParams: Promise<{
    make?: string;
    lat?: string;
    lon?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchParams) {
  const params = await searchParams;

  // User location is unique per request
  const vehicles = await searchVehicles({
    make: params.make,
    lat: parseFloat(params.lat || '0'),
    lon: parseFloat(params.lon || '0'),
  });

  return (
    <div>
      <Suspense fallback={<div>Loading location...</div>}>
        <LocationDetector />  {/* Auto-detects IP location */}
      </Suspense>

      <Suspense fallback={<div>Loading filters...</div>}>
        <FilterSidebar />  {/* Uses useSearchParams */}
      </Suspense>

      <Suspense fallback={<div>Loading results...</div>}>
        <SearchResults vehicles={vehicles} />
      </Suspense>
    </div>
  );
}
```

**Why SSR?**
- User location varies per request (IP geolocation)
- Search results personalized by proximity
- Can't pre-render all combinations
- Want fresh results for each search

### Vehicle Detail Pages (ISR)

```typescript
// app/vehicles/[vin]/page.tsx
export const revalidate = 3600;  // 1 hour

export async function generateStaticParams() {
  // Pre-render top 1000 vehicles at build time
  const { data } = await supabase
    .from('vehicles')
    .select('vin')
    .limit(1000);

  return data?.map(v => ({ vin: v.vin })) || [];
}

export default async function VehiclePage({ params }: PageProps) {
  const { vin } = await params;

  const vehicle = await getVehicle(vin);
  if (!vehicle) notFound();

  return <VehicleDetails vehicle={vehicle} />;
}
```

**Why ISR?**
- 72K+ vehicles (can't pre-render all at build)
- Top 1000 pre-rendered for instant load
- Others generated on-demand, then cached
- Hourly refresh keeps data current
- Perfect for e-commerce use case

## Server vs Client Components

### Server Components (Default)

We use server components for:
- Data fetching from Supabase
- Rendering vehicle listings
- Search results display
- Static marketing content

```typescript
// components/Search/VehicleCard.tsx (Server Component)
import { Vehicle } from '@/lib/supabase';
import Link from 'next/link';

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  // No useState, useEffect - pure rendering
  return (
    <Link href={`/vehicles/${vehicle.vin}`}>
      <div>
        <img src={vehicle.primary_image_url} alt="" />
        <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
        <p>${vehicle.price.toLocaleString()}</p>
      </div>
    </Link>
  );
}
```

### Client Components (Selective)

We use client components for:
- Interactive filters (SearchFilters)
- Location detection (LocationDetector)
- Zip code input (ZipCodeInput)
- Click tracking handlers

```typescript
// components/Search/FilterSidebar.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function FilterSidebar({ makes, bodyStyles }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div>
      {/* Interactive filter controls */}
    </div>
  );
}
```

**Pattern:** Server-fetch, client-interact
```typescript
// Server component fetches data
const vehicles = await getVehicles();

// Pass to client component for interactivity
<ClientFilters vehicles={vehicles} />
```

## Suspense Boundaries

All client components using Next.js hooks MUST be wrapped in Suspense:

```typescript
// app/search/page.tsx
<Suspense fallback={<div>Loading location...</div>}>
  <LocationDetector />  {/* Uses useSearchParams */}
</Suspense>

<Suspense fallback={<div>Loading filters...</div>}>
  <FilterSidebar />  {/* Uses useSearchParams */}
</Suspense>

<Suspense fallback={<div>Loading...</div>}>
  <SearchResults />  {/* Uses useSearchParams for pagination */}
</Suspense>
```

**Why?**
- Next.js 16 requires Suspense for `useSearchParams()`, `usePathname()`, etc.
- Prevents hydration errors
- Enables streaming (faster perceived performance)
- Allows progressive rendering

## Location-Based Features

### IP Geolocation (MaxMind)

```typescript
// app/api/detect-location/route.ts
import { headers } from 'next/headers';
import { getLocationFromIP } from '@/lib/geolocation';

export async function GET() {
  const headersList = headers();
  const forwarded = headersList.get('x-forwarded-for');
  const ipAddress = forwarded?.split(',')[0] || 'unknown';

  // Localhost fallback for development
  if (ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress === 'unknown') {
    return NextResponse.json({
      success: true,
      location: {
        city: 'Atlanta',
        state: 'GA',
        latitude: 33.7490,
        longitude: -84.3880,
      },
    });
  }

  // Production: Use MaxMind
  const location = await getLocationFromIP(ipAddress);
  return NextResponse.json({ success: true, location });
}
```

### Zip Code Lookup

```typescript
// app/api/zipcode-lookup/route.ts
import zipcodes from 'zipcodes';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get('zip');

  const zipData = zipcodes.lookup(zip);
  // Returns: { city, state, latitude, longitude }
}
```

### Radius-Based Search

```typescript
// lib/geolocation.ts
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  // Haversine formula
  const R = 3959; // Earth radius in miles
  // ... calculation
  return Math.round(distance);
}

// app/search/page.tsx
const vehiclesWithDistance = allVehicles
  .map(v => ({
    ...v,
    distance: calculateDistance(userLat, userLon, v.latitude, v.longitude),
  }))
  .filter(v => v.distance <= (v.targeting_radius || 30))
  .sort((a, b) => a.distance - b.distance);
```

## Click Tracking with Deduplication

```typescript
// app/api/track-click/route.ts
export async function POST(request: Request) {
  const { vehicleId, dealerId, userId } = await request.json();

  // Check 30-day history
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: clickHistory } = await supabaseAdmin
    .from('dealer_click_history')
    .select('*')
    .eq('user_id', userId)
    .eq('dealer_id', dealerId)
    .gte('first_click_at', thirtyDaysAgo.toISOString())
    .single();

  // First click to this dealer = billable
  const isBillable = !clickHistory;

  // Log click
  await supabaseAdmin.from('clicks').insert({
    vehicle_id: vehicleId,
    dealer_id: dealerId,
    user_id: userId,
    is_billable: isBillable,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, billable: isBillable });
}
```

## Dealer Diversification

```typescript
// lib/dealer-diversity.ts
export function diversifyByDealer<T extends { dealer_id: string }>(
  vehicles: T[],
  limit: number
): T[] {
  const result: T[] = [];
  const dealerCounts = new Map<string, number>();

  // Round-robin: max 1-2 vehicles per dealer
  for (const vehicle of vehicles) {
    const count = dealerCounts.get(vehicle.dealer_id) || 0;

    if (count < 2) {
      result.push(vehicle);
      dealerCounts.set(vehicle.dealer_id, count + 1);
    }

    if (result.length >= limit) break;
  }

  return result;
}

// Usage in search
const diversified = diversifyByDealer(vehicles, 24);
```

## Feed Synchronization

```typescript
// app/api/cron/sync-feed/route.ts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Verify Vercel Cron authentication
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const syncService = new FeedSyncService(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    process.env.LOTLINX_FEED_USERNAME!,
    process.env.LOTLINX_FEED_PASSWORD!,
    process.env.LOTLINX_PUBLISHER_ID!
  );

  const result = await syncService.syncFeed();

  return NextResponse.json({ success: true, result });
}

export const maxDuration = 300; // 5 minutes for large feed
```

**Vercel Cron Configuration:**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-feed",
      "schedule": "0 3,9,15,21 * * *"
    }
  ]
}
```

## TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules", "reference_vdp"]
}
```

**Custom types:**
```typescript
// types/zipcodes.d.ts
declare module 'zipcodes' {
  interface ZipCodeData {
    zip: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
  }

  function lookup(zip: string): ZipCodeData | undefined;
  export = { lookup };
}
```

## Performance Optimizations

### 1. Minimize Client JavaScript

```typescript
// ✅ Good - Server component (no JS sent)
export default async function VehicleList() {
  const vehicles = await getVehicles();
  return <div>{/* render */}</div>;
}

// ❌ Bad - Unnecessary client component
'use client';
export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  useEffect(() => { /* fetch */ }, []);
  return <div>{/* render */}</div>;
}
```

### 2. Parallel Data Fetching

```typescript
const [featuredVehicles, popularMakes, bodyStyles] = await Promise.all([
  getFeaturedVehicles(),
  getPopularMakes(),
  getBodyStyles(),
]);
```

### 3. Image Optimization

```typescript
import Image from 'next/image';

<Image
  src={vehicle.primary_image_url}
  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
  width={400}
  height={300}
  priority  // For above-fold images
/>
```

### 4. Cache Headers

```typescript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
  }
});
```

## Common Patterns

### Protected Routes (Admin)

```typescript
// proxy.ts
export async function proxy(request: Request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/admin')) {
    const { cookies } = await import('next/headers');
    const token = cookies().get('admin_token');

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}
```

### Error Handling

```typescript
// app/vehicles/[vin]/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Not Found

```typescript
// app/vehicles/[vin]/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Vehicle Not Found</h2>
      <Link href="/search">Browse vehicles</Link>
    </div>
  );
}
```

## Development Workflow

```bash
# Development (uses Turbopack)
npm run dev

# Type generation
npx next typegen

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Key Takeaways

1. **Use Server Components by default** - Only add `'use client'` when truly needed
2. **Wrap all `useSearchParams()` in Suspense** - Required in Next.js 16
3. **Choose the right rendering strategy** - SSG for static, ISR for periodic updates, SSR for dynamic
4. **Parallel fetch data** - Use `Promise.all()` to avoid waterfalls
5. **Await params in dynamic routes** - Params are now async in Next 16
6. **Use proxy.ts not middleware.ts** - Migration path from previous versions

---

This documentation reflects our actual implementation as of November 2025 with Next.js 16.0.1.
