# Next.js 16.0.1 Documentation for Carzo

**Important:** This documentation is based on Next.js 16.0.1 as of November 2025. Next.js evolves rapidly, and features/APIs may change in future versions. Always consult the [official Next.js documentation](https://nextjs.org/docs) for the most current information.

## Quick Links

- [Official Next.js 16 Documentation](https://nextjs.org/docs)
- [Next.js GitHub Repository](https://github.com/vercel/next.js)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [Vercel Deployment Docs](https://vercel.com/docs)

## Documentation Structure

This documentation is organized into focused topics:

1. **[Core Concepts](./01-core-concepts.md)** - Architecture, routing, and fundamentals
2. **[Data Fetching](./02-data-fetching.md)** - SSR, SSG, ISR, and React Server Components
3. **[API Routes & Middleware](./03-api-routes.md)** - Route handlers, proxy.ts (formerly middleware)
4. **[Performance & Caching](./04-performance.md)** - Optimization strategies and new caching APIs
5. **[Migration Guide](./05-migration-guide.md)** - Upgrading from Next 13/14/15 to 16
6. **[Carzo-Specific Patterns](./06-carzo-patterns.md)** - How we use Next.js 16 in this project

## Version Information

- **Next.js Version:** 16.0.1
- **React Version:** 19.2+ (required)
- **Node.js Version:** 16.8+ (18.17+ recommended)
- **Default Bundler:** Turbopack (dev), Webpack (production)

## Key Changes in Next.js 16

### Major Features
- **Turbopack as default dev bundler** - 2-5x faster builds and hot refresh
- **New Caching System** - Cache Components replace Partial Prerendering (PPR)
- **proxy.ts replaces middleware.ts** - Node.js runtime instead of Edge by default
- **React 19 support** - View Transitions, useEffectEvent, and more
- **Async route params** - Dynamic route parameters are now Promises

### Breaking Changes
- `middleware.ts` → `proxy.ts` (with deprecation warning)
- `next/legacy/image` removed (use `next/image`)
- `images.domains` removed (use `images.remotePatterns`)
- Async `params` in dynamic routes (must `await`)
- `unstable_*` cache APIs now stable (prefix removed)

### Performance Improvements
- Faster dev server startup
- Improved prefetching with deduplication
- Better streaming and Suspense support
- Optimized image caching (4-hour default vs 60s)

## Quick Start (Carzo Context)

Our project uses:
- ✅ **App Router** (default in Next 16)
- ✅ **TypeScript** with strict mode
- ✅ **Server Components** by default
- ✅ **Turbopack** for dev builds
- ✅ **ISR (Incremental Static Regeneration)** for vehicle pages
- ✅ **Route Handlers** for API endpoints
- ✅ **Suspense boundaries** for streaming

```bash
# Development
npm run dev          # Uses Turbopack by default

# Production build
npm run build        # Uses Webpack (or Turbopack with flag)
npm start            # Starts production server

# Type checking
npx next typegen     # Generate route types
```

## File Conventions

### App Router (app/ directory)
- `page.tsx` - Page component (publicly accessible route)
- `layout.tsx` - Layout wrapper (persists across navigation)
- `loading.tsx` - Loading UI (Suspense fallback)
- `error.tsx` - Error boundary
- `not-found.tsx` - 404 page
- `route.ts` - API route handler (GET, POST, etc.)
- `default.tsx` - Parallel routes fallback

### Special Files (root level)
- `proxy.ts` - Request interception (formerly middleware.ts)
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `.env.local` - Environment variables (secrets)

## Important Notes for This Project

### 1. We Use App Router (Not Pages Router)
All routes are in `app/` directory. We don't use the legacy `pages/` directory.

### 2. Server Components by Default
Components are server components unless marked with `'use client'`. This reduces client bundle size significantly.

### 3. Suspense Boundaries Required
In Next.js 16, any client component using `useSearchParams()`, `usePathname()`, or `useRouter()` must be wrapped in a `<Suspense>` boundary to avoid build errors.

### 4. ISR for Vehicle Pages
We use `export const revalidate = 3600` (1 hour) for vehicle detail pages to balance freshness with performance.

### 5. MaxMind Integration
Our IP geolocation uses MaxMind GeoIP2, which only works server-side (in API routes or server components).

## Resources

- **Learning:** [Next.js Learn Course](https://nextjs.org/learn)
- **Examples:** [Next.js Examples Repository](https://github.com/vercel/next.js/tree/canary/examples)
- **Community:** [Next.js Discussions](https://github.com/vercel/next.js/discussions)
- **Deployment:** [Vercel Documentation](https://vercel.com/docs)

## Documentation Maintenance

**Last Updated:** 2025-11-11
**Next.js Version at Time of Writing:** 16.0.1
**Maintained By:** Carzo development team

⚠️ **Warning:** This documentation reflects Next.js 16.0.1 as of November 2025. APIs and best practices may change in future releases. Always verify against official docs when upgrading.

---

**Next:** [Core Concepts →](./01-core-concepts.md)
