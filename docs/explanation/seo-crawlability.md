# SEO & Crawlability Strategy

**Understanding how Carzo manages search engine crawlers and sitemap generation**

## Overview

Carzo uses Next.js 16's native `MetadataRoute` types to dynamically generate `robots.txt` and `sitemap.xml`. This approach ensures proper search engine indexing while protecting revenue-critical API endpoints and preventing duplicate content issues.

## Why Dynamic Generation?

### Traditional Approach (Static Files)
```
public/
  robots.txt       # Manual updates required
  sitemap.xml      # Goes stale, hard to maintain
```

**Problems:**
- ❌ Sitemap goes stale when vehicle inventory changes
- ❌ Manual updates required for new vehicles
- ❌ Can't reference environment variables (localhost vs production)
- ❌ No TypeScript type safety

### Next.js 16 Approach (Dynamic)
```typescript
app/
  robots.ts        # Dynamic generation with env vars
  sitemap.ts       # Queries Supabase for real-time data
```

**Benefits:**
- ✅ Sitemap always up-to-date (queries Supabase on-demand)
- ✅ Automatic environment handling (localhost vs production URLs)
- ✅ Type-safe with `MetadataRoute.Robots` and `MetadataRoute.Sitemap`
- ✅ Zero maintenance - just works

## Robots.txt Strategy

### What We Block and Why

#### 1. Admin Routes (`/admin/*`)
```
Disallow: /admin/
```

**Why:** Private analytics dashboard showing revenue data, click metrics, and A/B test performance. No SEO value, security risk if indexed.

#### 2. API Routes (`/api/*`)
```
Disallow: /api/
```

**Why:**
- **Revenue protection**: `/api/track-click` is revenue-critical (deduplication logic)
- **Security**: Rate limiting, click tracking, location detection endpoints
- **No SEO value**: API endpoints return JSON, not HTML content

#### 3. Search Query Parameters (`/search?*`)
```
Disallow: /search?*
```

**Why:** Prevents **crawl bloat**

Example of what we're blocking:
```
/search?make=Toyota
/search?make=Toyota&model=Camry
/search?make=Toyota&model=Camry&minPrice=20000
/search?make=Toyota&model=Camry&minPrice=20000&maxPrice=40000
... (thousands of combinations)
```

With filters (make, model, price, year, body style, location, pagination), there are **millions** of possible URLs. We let Google crawl `/search` (the landing page), but block filtered variants.

#### 4. A/B Test Flow Parameters (`/*?flow=*`)
```
Disallow: /*?flow=*
```

**Why:** Prevents **duplicate content**

Carzo has 3 A/B test flows:
- `?flow=direct` - Direct dealer link on VDP
- `?flow=vdp-only` - Full VDP, no related vehicles
- `?flow=full` - Full funnel with related vehicles

Without this rule, Google would see:
```
/vehicles/ABC123           # Original
/vehicles/ABC123?flow=direct
/vehicles/ABC123?flow=vdp-only
/vehicles/ABC123?flow=full
```

All 4 URLs show the **same vehicle**, just with different UI. This would be flagged as duplicate content and hurt SEO rankings.

**Solution:** Only index `/vehicles/ABC123` (canonical version).

### What We Allow

```
Allow: /
Allow: /search$
Allow: /vehicles/
```

- **Homepage** (`/`) - Main entry point, featured vehicles
- **Search landing** (`/search`) - No query params, just the search form
- **Vehicle detail pages** (`/vehicles/[vin]`) - ~1,000 individual vehicle pages

## Sitemap.xml Strategy

### Current Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages (2 URLs) -->
  <url>
    <loc>https://carzo.com</loc>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>https://carzo.com/search</loc>
    <priority>0.8</priority>
    <changefreq>daily</changefreq>
  </url>

  <!-- Dynamic Vehicle Pages (~1,000 URLs) -->
  <url>
    <loc>https://carzo.com/vehicles/ABC123</loc>
    <priority>0.7</priority>
    <changefreq>weekly</changefreq>
    <lastmod>2025-11-12T06:46:17Z</lastmod>
  </url>
  <!-- ... thousands more vehicles ... -->
</urlset>
```

**Total:** 2 static pages + vehicle inventory (up to Google's 50K per-sitemap limit)

### Priority Levels Explained

| Page Type | Priority | Change Freq | Reasoning |
|-----------|----------|-------------|-----------|
| Homepage (`/`) | 1.0 | Daily | Main entry point, featured vehicles rotate |
| Search (`/search`) | 0.8 | Daily | High-value landing page, popular makes/models change |
| Vehicle pages (`/vehicles/[vin]`) | 0.7 | Weekly | Individual vehicles, price/status may update |

**Note:** These are **hints** to Google, not guarantees. Google decides final crawl frequency based on:
- Site authority
- Crawl budget
- Actual content change rate (detected over time)

### Why Query Supabase?

```typescript
// app/sitemap.ts
const { data: vehicles } = await supabase
  .from('vehicles')
  .select('vin, last_sync')
  .eq('is_active', true)  // Only active vehicles
  .order('last_sync', { ascending: false })
```

**Benefits:**
1. **Always current**: Vehicles sold/removed are automatically excluded
2. **Accurate lastmod**: Uses `last_sync` timestamp from database
3. **No stale data**: Feed sync (4x daily) updates database, sitemap reflects changes
4. **Scalable**: Automatically paginates through entire inventory

**Current implementation:**
- Fetches vehicles in parallel using `Promise.all()` for performance
- Paginates through up to 50 batches of 1,000 vehicles each
- Slices result to exactly 49,998 vehicles + 2 static pages = 50,000 total URLs (Google's limit)

### Future: Sitemap Index (For Additional Scale)

If we need to include more than Google's 50K per-sitemap limit, we'll split into multiple sitemaps:

```xml
<!-- sitemap_index.xml -->
<sitemapindex>
  <sitemap>
    <loc>https://carzo.com/sitemap-static.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://carzo.com/sitemap-vehicles-1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://carzo.com/sitemap-vehicles-2.xml</loc>
  </sitemap>
</sitemapindex>
```

**Why?**
- Google recommends max **50,000 URLs per sitemap**
- Max **50MB uncompressed** per sitemap file
- Sitemap index allows unlimited total URLs

**Current status:** Single sitemap handles our inventory within Google's limits. Will implement sitemap index if inventory grows beyond 50K active vehicles.

## Implementation Details

### File: `app/robots.ts`

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carzo.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/search$', '/vehicles/'],
        disallow: ['/admin/', '/api/', '/search?*', '/*?flow=*', '/*.json$'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/search$', '/vehicles/'],
        disallow: ['/admin/', '/api/', '/search?*', '/*?flow=*'],
        crawlDelay: 0,  // No delay for Google
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

**Key points:**
- Uses `NEXT_PUBLIC_SITE_URL` env var (set in Vercel)
- Separate Googlebot rules (no crawl delay)
- References sitemap location

### File: `app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carzo.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  // Fetch all active vehicles
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('vin, last_sync')
    .eq('is_active', true)
    .order('last_sync', { ascending: false })

  if (error) {
    console.error('Error fetching vehicles for sitemap:', error)
    return staticPages // Return at least static pages
  }

  // Generate vehicle detail pages
  const vehiclePages: MetadataRoute.Sitemap = (vehicles || []).map((vehicle) => ({
    url: `${baseUrl}/vehicles/${vehicle.vin}`,
    lastModified: vehicle.last_sync ? new Date(vehicle.last_sync) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...vehiclePages]
}
```

**Key points:**
- Graceful fallback (returns static pages if Supabase query fails)
- Uses `last_sync` for accurate `lastModified` timestamps
- Filters by `is_active = true` (sold vehicles excluded)

## Impact on Revenue

### Protecting Revenue-Critical Endpoints

**Problem:** Bots crawling `/api/track-click` could:
- Pollute click data with fake clicks
- Trigger rate limits (blocking real users)
- Inflate dealer click counts (billing impact)

**Solution:** Block `/api/*` in robots.txt

```
Disallow: /api/
```

This prevents well-behaved bots (Google, Bing) from accessing these endpoints. Malicious bots ignore robots.txt, but we handle those with:
- Rate limiting (PostgreSQL-based)
- User-Agent filtering
- IP blocking (if needed)

### Maximizing Organic Traffic

**Goal:** Rank for long-tail vehicle searches

Examples:
- "2023 Toyota Camry Atlanta"
- "Used Honda Civic near me"
- "CPO BMW 3 Series under $30k"

**Strategy:**
1. **Index all VDPs** (`/vehicles/[vin]`) - ~1,000 pages
2. **Rich metadata** - Each VDP has:
   - Dynamic title: "2023 Toyota Camry LE - $24,995 | Carzo"
   - Description with key specs
   - OpenGraph image (vehicle photo)
   - Schema.org JSON-LD (Car type, price, condition)
3. **Sitemap priority** - VDPs at 0.7 (high priority)
4. **Block duplicates** - A/B test variants excluded

**Expected outcome:** Long-tail organic traffic to VDPs → dealer clicks → revenue

## Testing & Validation

### Local Testing

```bash
# Test robots.txt
curl http://localhost:3000/robots.txt

# Test sitemap.xml
curl http://localhost:3000/sitemap.xml

# Validate sitemap XML
curl -s http://localhost:3000/sitemap.xml | xmllint --format -

# Count URLs in sitemap
curl -s http://localhost:3000/sitemap.xml | grep -c '<url>'
```

### Production Testing

```bash
# Check robots.txt
curl https://carzo.com/robots.txt

# Check sitemap.xml
curl https://carzo.com/sitemap.xml
```

### Google Search Console

After deployment:

1. **Submit sitemap**
   - Go to Search Console → Sitemaps
   - Add URL: `https://carzo.com/sitemap.xml`
   - Click "Submit"

2. **Monitor crawl stats**
   - Check "Coverage" report (indexed vs excluded pages)
   - Verify no errors/warnings
   - Confirm VDPs are being indexed

3. **Check for issues**
   - Duplicate content warnings (should be none)
   - Crawl budget issues (unlikely at 1,000 URLs)
   - Blocked resources (CSS, JS, images)

## Common Questions

### Q: Why not just use a static sitemap?

**A:** Vehicle inventory changes 4x daily (feed sync). Static sitemaps go stale within hours, requiring manual regeneration. Dynamic sitemaps query Supabase on-demand, always reflecting current inventory.

### Q: Will this hurt crawl budget?

**A:** No. Dynamic generation is on-demand (when crawler requests `/sitemap.xml`). Google caches sitemaps and only re-fetches when HTTP headers indicate changes (Next.js handles this automatically).

### Q: What if Supabase query fails?

**A:** Graceful fallback - returns static pages (homepage, search). Better to have a partial sitemap than a 500 error.

```typescript
if (error) {
  console.error('Error fetching vehicles for sitemap:', error)
  return staticPages // Return at least static pages
}
```

### Q: Why block `/search?*` but allow `/search$`?

**A:**
- `/search$` - Landing page with empty form (valuable)
- `/search?make=Toyota` - Filtered results (duplicate of VDPs, causes crawl bloat)

We want Google to find vehicles through:
1. Homepage → Featured vehicles
2. Search landing → Popular makes/models
3. Direct VDP links (from sitemap)

Not through every possible filter combination.

### Q: What about XML sitemap validation?

**A:** Next.js 16 automatically validates `MetadataRoute.Sitemap` types against XML Sitemap Protocol 0.9 spec. If you return invalid data, TypeScript will catch it at build time.

## Future Enhancements

### 1. Image Sitemap (Phase 2)

Add vehicle images to sitemap for Google Images indexing:

```xml
<url>
  <loc>https://carzo.com/vehicles/ABC123</loc>
  <image:image>
    <image:loc>https://images.carzo.com/ABC123.jpg</image:loc>
    <image:caption>2023 Toyota Camry LE</image:caption>
  </image:image>
</url>
```

**Impact:** Better visibility in Google Images (additional traffic source).

### 2. Video Sitemap (Future)

If we add vehicle walkaround videos:

```xml
<url>
  <loc>https://carzo.com/vehicles/ABC123</loc>
  <video:video>
    <video:thumbnail_loc>https://videos.carzo.com/ABC123-thumb.jpg</video:thumbnail_loc>
    <video:title>2023 Toyota Camry Walkaround</video:title>
    <video:description>Detailed video tour</video:description>
  </video:video>
</url>
```

**Impact:** Video rich snippets in search results (higher CTR).

### 3. Hreflang Tags (Multi-Market)

If we expand to Canada, Mexico:

```xml
<url>
  <loc>https://carzo.com/vehicles/ABC123</loc>
  <xhtml:link rel="alternate" hreflang="en-us" href="https://carzo.com/vehicles/ABC123" />
  <xhtml:link rel="alternate" hreflang="en-ca" href="https://carzo.ca/vehicles/ABC123" />
  <xhtml:link rel="alternate" hreflang="es-mx" href="https://carzo.mx/vehicles/ABC123" />
</url>
```

**Impact:** Proper geo-targeting (avoid duplicate content across countries).

## Related Documentation

- `/docs/explanation/business-model.md` - Revenue model and dealer tracking
- `/docs/reference/vercel-config.md` - Environment variables in production
- `/docs/how-to/deploy-to-vercel.md` - Deployment workflow

## See Also

- [Google Search Central - Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Google Search Central - robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Next.js 16 - Metadata Files](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
