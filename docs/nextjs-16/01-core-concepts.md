# Next.js 16 Core Concepts

> **Official Docs:** [Next.js Routing](https://nextjs.org/docs/app/building-your-application/routing)

## App Router Architecture

Next.js 16 uses the **App Router** (introduced in v13, now stable and default). This replaces the legacy Pages Router.

### Key Principles

1. **File-system based routing** - Folder structure = URL structure
2. **Nested layouts** - Layouts persist across navigation without remounting
3. **Server Components by default** - React components render on server unless marked `'use client'`
4. **Streaming with Suspense** - Progressive rendering for faster perceived performance

## File Conventions

### Route Files

```
app/
├── layout.tsx          # Root layout (required, wraps entire app)
├── page.tsx            # Homepage (/)
├── loading.tsx         # Loading UI (Suspense fallback)
├── error.tsx           # Error boundary
├── not-found.tsx       # 404 page
├── search/
│   ├── page.tsx        # /search route
│   └── layout.tsx      # Layout for /search and children
└── vehicles/
    └── [vin]/
        ├── page.tsx    # /vehicles/:vin (dynamic route)
        └── error.tsx   # Error boundary for this segment
```

### Route Handlers (API Routes)

```typescript
// app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ message: 'Hello' });
}

export async function POST(request: Request) {
  const body = await request.json();
  // Handle POST
  return NextResponse.json({ success: true });
}
```

**URL:** `/api/hello`
**Methods:** GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD

## Dynamic Routes

### Basic Dynamic Route

```typescript
// app/vehicles/[vin]/page.tsx
interface PageProps {
  params: Promise<{ vin: string }>;  // ⚠️ Params are now async in Next 16!
}

export default async function VehiclePage({ params }: PageProps) {
  const { vin } = await params;  // Must await
  // Fetch vehicle data...
  return <div>Vehicle: {vin}</div>;
}
```

### Catch-All Routes

```typescript
// app/blog/[...slug]/page.tsx
// Matches: /blog/a, /blog/a/b, /blog/a/b/c, etc.

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;  // slug is array: ['a', 'b', 'c']
  return <div>Path: {slug.join('/')}</div>;
}
```

### Optional Catch-All

```typescript
// app/docs/[[...slug]]/page.tsx
// Matches: /docs, /docs/a, /docs/a/b, etc.
```

## Layouts

### Root Layout (Required)

```typescript
// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Carzo - Vehicle Marketplace',
  description: 'Find your perfect vehicle',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Requirements:**
- Must export default React component
- Must include `<html>` and `<body>` tags
- Cannot be a Client Component (no `'use client'`)

### Nested Layouts

```typescript
// app/admin/layout.tsx
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav>{/* Admin navigation */}</nav>
      <main>{children}</main>
    </div>
  );
}
```

**Layout Behavior:**
- Layouts **persist** across navigation (don't re-render)
- State is preserved in layouts during navigation
- Nested layouts wrap their children
- Only the page content changes on navigation

## Route Groups

Organize routes without affecting URL structure:

```
app/
├── (marketing)/
│   ├── about/page.tsx      # URL: /about (not /marketing/about)
│   └── contact/page.tsx    # URL: /contact
└── (shop)/
    ├── search/page.tsx     # URL: /search
    └── layout.tsx          # Layout for shop routes only
```

**Use cases:**
- Organize routes by feature
- Share layouts for specific route groups
- Create multiple root layouts (advanced)

## Private Folders

Prefix with `_` to exclude from routing:

```
app/
├── _lib/           # Not a route (helper code)
│   └── utils.ts
├── _components/    # Not a route (shared components)
│   └── Button.tsx
└── search/
    └── page.tsx    # Route: /search
```

## Server vs Client Components

### Server Components (Default)

```typescript
// No 'use client' directive = server component
export default async function ServerPage() {
  // Can directly query database
  const data = await db.query('SELECT * FROM vehicles');

  // Can use Node.js APIs
  const fs = require('fs');

  return <div>{/* Render data */}</div>;
}
```

**Advantages:**
- Zero client JavaScript
- Direct database access
- Secure (secrets stay on server)
- Better SEO (fully rendered HTML)

### Client Components

```typescript
'use client';  // ⚠️ Required at top of file

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

**Use when you need:**
- State (useState, useReducer)
- Effects (useEffect)
- Browser APIs (window, localStorage)
- Event handlers (onClick, onChange)
- Custom hooks that use client hooks

## Suspense Boundaries (Critical in Next 16)

**Required** for client components using Next.js hooks:

```typescript
// app/search/page.tsx (Server Component)
import { Suspense } from 'react';
import SearchFilters from './SearchFilters';  // Uses useSearchParams

export default function SearchPage() {
  return (
    <div>
      <h1>Search Results</h1>

      {/* ⚠️ REQUIRED: Wrap client component using useSearchParams */}
      <Suspense fallback={<div>Loading filters...</div>}>
        <SearchFilters />
      </Suspense>
    </div>
  );
}
```

### Which Components Need Suspense?

Wrap any client component using:
- `useSearchParams()`
- `usePathname()` (sometimes)
- `useRouter()` (if accessing params)

**Error if missing:**
```
Error: useSearchParams() should be wrapped in a suspense boundary at page "/"
```

## Navigation

### Link Component

```typescript
import Link from 'next/link';

export default function Nav() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/search">Search</Link>
      <Link href="/vehicles/ABC123">Vehicle</Link>

      {/* Prefetch disabled */}
      <Link href="/slow-page" prefetch={false}>
        No Prefetch
      </Link>

      {/* External link */}
      <Link
        href="https://example.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        External
      </Link>
    </nav>
  );
}
```

**Features:**
- Client-side navigation (no page reload)
- Automatic prefetching (in viewport or on hover)
- Shared layout preservation
- Scroll position management

### Programmatic Navigation

```typescript
'use client';

import { useRouter } from 'next/navigation';

export default function MyButton() {
  const router = useRouter();

  return (
    <button onClick={() => router.push('/search')}>
      Go to Search
    </button>
  );
}
```

**Router methods:**
- `router.push(url)` - Navigate to URL
- `router.replace(url)` - Replace current URL (no history entry)
- `router.back()` - Go back in history
- `router.forward()` - Go forward
- `router.refresh()` - Refresh current route

## Metadata

### Static Metadata

```typescript
// app/page.tsx
export const metadata = {
  title: 'Carzo - Vehicle Marketplace',
  description: 'Find your perfect vehicle',
  openGraph: {
    title: 'Carzo',
    description: 'Vehicle Marketplace',
    images: ['/og-image.png'],
  },
};

export default function Page() {
  return <div>Home</div>;
}
```

### Dynamic Metadata

```typescript
// app/vehicles/[vin]/page.tsx
export async function generateMetadata({ params }: PageProps) {
  const { vin } = await params;
  const vehicle = await getVehicle(vin);

  return {
    title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    description: vehicle.description,
    openGraph: {
      images: [vehicle.primary_image_url],
    },
  };
}
```

## Important Differences from Pages Router

| Feature | Pages Router | App Router |
|---------|-------------|------------|
| Directory | `pages/` | `app/` |
| Routing | File-based | Folder-based |
| Layouts | `_app.js` (global) | `layout.tsx` (nested) |
| Data Fetching | `getStaticProps`, etc. | Direct in components |
| API Routes | `pages/api/` | `app/api/*/route.ts` |
| Loading States | Manual | `loading.tsx` + Suspense |
| Error Handling | `_error.js` | `error.tsx` (per segment) |
| Metadata | `<Head>` component | `metadata` export |

## Best Practices for Carzo

### 1. Server Components by Default
```typescript
// ✅ Good - Server component (default)
export default async function VehicleList() {
  const vehicles = await supabase.from('vehicles').select('*');
  return <div>{/* render */}</div>;
}

// ❌ Bad - Unnecessary client component
'use client';
export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  useEffect(() => {
    fetch('/api/vehicles').then(/* ... */);
  }, []);
  return <div>{/* render */}</div>;
}
```

### 2. Colocate Client Components
```typescript
// app/search/page.tsx (Server)
import SearchFilters from '@/components/Search/SearchFilters';  // Client

export default function SearchPage() {
  // Fetch data on server
  const vehicles = await getVehicles();

  return (
    <div>
      <Suspense>
        <SearchFilters />  {/* Client component for interactivity */}
      </Suspense>
      <VehicleList vehicles={vehicles} />  {/* Server component */}
    </div>
  );
}
```

### 3. Use TypeScript Route Types
```bash
# Generate types for route params
npx next typegen
```

```typescript
// app/vehicles/[vin]/page.tsx
import type { PageProps } from '@/types/routes';

export default async function VehiclePage({
  params
}: PageProps<'/vehicles/[vin]'>) {
  const { vin } = await params;  // Fully typed!
  // ...
}
```

## References

- [App Router Official Docs](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Routing Fundamentals](https://nextjs.org/docs/app/building-your-application/routing)
- [Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)

---

**Next:** [Data Fetching →](./02-data-fetching.md)
