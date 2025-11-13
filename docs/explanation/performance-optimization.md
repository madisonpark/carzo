# Performance Optimization

**Status:** 📋 Coming in Phase 3

This document will explain Carzo's performance optimization strategies and Core Web Vitals targets.

## Planned Content

- Core Web Vitals targets and monitoring
- Next.js 16 performance features (Turbopack, Server Components)
- Image optimization strategy
- Code splitting and lazy loading
- Database query optimization
- Caching strategies
- Bundle size optimization
- Performance testing methodology

## For Now

See these related documents:
- [Architecture Overview](./architecture-overview.md) - System performance overview
- [PostGIS Spatial Queries](./postgis-spatial-queries.md) - Database performance (100x improvement)
- [Next.js 16 Decisions](./nextjs-16-decisions.md) - Framework performance choices
- [Monitoring](../how-to/monitoring.md) - Performance monitoring setup

## Core Web Vitals Targets (Quick Reference)

Carzo targets the following performance metrics:

**Largest Contentful Paint (LCP):**
- Homepage: < 1.5s ✅
- Search page: < 2.0s ✅
- VDP page: < 2.0s ✅

**First Input Delay (FID):**
- All pages: < 100ms ✅

**Cumulative Layout Shift (CLS):**
- All pages: < 0.1 ✅

**Time to First Byte (TTFB):**
- All API endpoints: < 200ms ✅

**Database Query Performance:**
- PostGIS spatial queries: ~50-100ms (p95)
- Simple SELECT queries: < 50ms (p95)
- Complex JOIN queries: < 100ms (p95)

## Key Performance Features

**Next.js 16 Optimizations:**
- Turbopack: 2-5x faster dev builds
- Server Components: Reduced client bundle
- Static rendering: Pre-rendered pages
- Image optimization: next/image with WebP

**Database Optimizations:**
- PostGIS GIST indexes: 100x faster spatial queries
- Unlogged rate limit tables: 3x faster writes
- Connection pooling: Supabase Pooler
- Stored procedures: Reduced round trips

**Code Splitting:**
```tsx
// Lazy load heavy components
const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  loading: () => <Spinner />,
});
```

**Image Optimization:**
```tsx
import Image from 'next/image';

<Image
  src={vehicle.photo_url}
  alt={vehicle.title}
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, 400px"
  placeholder="blur"
  blurDataURL={vehicle.photo_blur}
/>
```

---

**Last Updated**: 2025-11-13
