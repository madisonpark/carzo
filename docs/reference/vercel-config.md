# Vercel Configuration Reference

## Overview

Carzo uses **Vercel** for serverless deployment with two main configuration files:
- `vercel.json` - Vercel-specific settings (cron jobs, redirects, headers)
- `next.config.ts` - Next.js configuration (build settings, image optimization)

## vercel.json

**Location:** `/vercel.json` (project root)

**Purpose:** Configure Vercel-specific features like cron jobs, redirects, and headers.

### Complete Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-feed",
      "schedule": "0 3,9,15,21 * * *"
    },
    {
      "path": "/api/cron/cleanup-rate-limits",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## Cron Jobs

### Feed Synchronization

**Endpoint:** `/api/cron/sync-feed`

**Schedule:** `"0 3,9,15,21 * * *"`

**Frequency:** 4 times per day at:
- 03:00 UTC (10:00 PM PST, 11:00 PM PDT)
- 09:00 UTC (04:00 AM PST, 05:00 AM PDT)
- 15:00 UTC (10:00 AM PST, 11:00 AM PDT)
- 21:00 UTC (04:00 PM PST, 05:00 PM PDT)

**Purpose:**
- Download latest vehicle inventory from LotLinx Publisher Feed
- Upsert ~72,000 vehicles to database
- Mark removed vehicles as inactive
- Log sync metrics to `feed_sync_logs` table

**Cron Expression Breakdown:**
```
0 3,9,15,21 * * *
│ │         │ │ │
│ │         │ │ └─ Day of week (0-6, 0=Sunday) [*=any]
│ │         │ └─── Month (1-12) [*=any]
│ │         └───── Day of month (1-31) [*=any]
│ └─────────────── Hour (0-23) [3,9,15,21]
└───────────────── Minute (0-59) [0]
```

**Authentication:**

Vercel automatically adds `Authorization: Bearer <CRON_SECRET>` header to cron requests. The endpoint validates this token:

```typescript
// app/api/cron/sync-feed/route.ts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Proceed with feed sync...
}
```

**Implementation:** See [Feed Sync API Reference](./api/sync-feed.md)

---

### Rate Limit Cleanup

**Endpoint:** `/api/cron/cleanup-rate-limits`

**Schedule:** `"0 * * * *"`

**Frequency:** Every hour (hourly cleanup)

**Purpose:**
- Delete rate limit records older than 24 hours
- Prevent `rate_limits` table bloat
- Keep table size constant (~1-2 GB)

**Cron Expression Breakdown:**
```
0 * * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-6, 0=Sunday) [*=any]
│ │ │ └─── Month (1-12) [*=any]
│ │ └───── Day of month (1-31) [*=any]
│ └─────── Hour (0-23) [*=every hour]
└───────── Minute (0-59) [0=start of hour]
```

**Expected Behavior:**
- Runs at :00 minutes (10:00, 11:00, 12:00, etc.)
- Deletes ~10,000-20,000 records per run
- Execution time: ~500ms-1s
- No impact on live queries (unlogged table, no contention)

**Implementation:** See [Cleanup Rate Limits API Reference](./api/cleanup-rate-limits.md)

---

## Cron Job Monitoring

### Vercel Dashboard

**View Logs:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project
3. Go to **Logs** tab
4. Filter by function name: `api/cron/sync-feed` or `api/cron/cleanup-rate-limits`

**Expected Output:**

```
[sync-feed] 2025-11-12 03:00:01 - Feed sync started
[sync-feed] 2025-11-12 03:00:45 - Downloaded feed.zip (125 MB)
[sync-feed] 2025-11-12 03:01:20 - Parsed 72,051 vehicles
[sync-feed] 2025-11-12 03:02:30 - Upserted 72,051 vehicles
[sync-feed] 2025-11-12 03:02:31 - Feed sync completed successfully
```

### Manual Trigger (Testing)

```bash
# Test feed sync locally
curl "http://localhost:3000/api/cron/sync-feed" \
  -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)"

# Test in production (use production CRON_SECRET)
curl "https://carzo.net/api/cron/sync-feed" \
  -H "Authorization: Bearer your_production_cron_secret"
```

### Alerting (Future)

**TODO:** Add Slack/Discord webhook notifications for cron failures:

```typescript
// lib/alerts.ts
export async function sendCronFailureAlert(jobName: string, error: Error) {
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `❌ Cron job failed: ${jobName}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Cron Job Failed*\n*Job:* ${jobName}\n*Error:* ${error.message}`,
          },
        },
      ],
    }),
  });
}
```

---

## Cron Job Timeouts

**Default Timeout:** 10 seconds (Hobby plan)
**Pro Plan Timeout:** 60 seconds
**Enterprise Timeout:** 900 seconds (15 minutes)

**Timeout Configuration:**

If cron jobs exceed default timeout, upgrade plan or split into smaller batches:

```typescript
// Option 1: Batch processing (for Hobby plan)
export async function GET() {
  const BATCH_SIZE = 1000;
  const TIMEOUT_MS = 9000; // 9 seconds (leave 1s buffer)

  const startTime = Date.now();

  while (Date.now() - startTime < TIMEOUT_MS) {
    const batch = await getNextBatch(BATCH_SIZE);
    await processBatch(batch);

    if (batch.length < BATCH_SIZE) break; // All done
  }

  return NextResponse.json({ status: 'partial', message: 'Timeout reached, will continue next run' });
}

// Option 2: Upgrade to Pro plan for 60s timeout
// Sufficient for full feed sync (~45 seconds)
```

---

## next.config.ts

**Location:** `/next.config.ts` (project root)

**Purpose:** Configure Next.js build settings, image optimization, redirects, and more.

### Current Configuration

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix workspace root warning - specify the correct project root
  outputFileTracingRoot: '/Users/steven/dev/carzo',
};

export default nextConfig;
```

---

### Configuration Options

#### outputFileTracingRoot

**Purpose:** Specify project root for file tracing (fixes workspace warnings)

**Example:**
```typescript
// Absolute path to project root
outputFileTracingRoot: '/Users/steven/dev/carzo',

// Or use __dirname for relative path
outputFileTracingRoot: path.join(__dirname),
```

**When Needed:**
- Monorepo setups
- Workspaces with nested projects
- File tracing warnings during build

---

#### images (Image Optimization)

**Purpose:** Configure Next.js Image component (remote image sources, sizes, formats)

**Example:**
```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.lotlinx.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
    ],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
};
```

**Why Add This:**
- Currently using LotLinx CDN URLs directly (no optimization)
- Next.js Image component requires `remotePatterns` for external images
- Provides automatic WebP conversion, lazy loading, blur placeholders

**TODO:** Add LotLinx CDN to remotePatterns when implementing Next.js Image component

---

#### redirects (URL Redirects)

**Purpose:** Configure URL redirects (old → new URLs)

**Example:**
```typescript
const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/vehicles/:vin/photos',
        destination: '/vehicles/:vin',
        permanent: true, // 301 redirect
      },
      {
        source: '/search/:make',
        destination: '/search?make=:make',
        permanent: false, // 302 redirect
      },
    ];
  },
};
```

---

#### headers (Custom HTTP Headers)

**Purpose:** Add custom HTTP headers (security, caching)

**Example:**
```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

---

#### rewrites (URL Rewrites)

**Purpose:** Rewrite URLs internally without changing browser URL

**Example:**
```typescript
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};
```

---

#### experimental (Experimental Features)

**Purpose:** Enable experimental Next.js features

**Example:**
```typescript
const nextConfig: NextConfig = {
  experimental: {
    // Server Actions (enabled by default in Next.js 16)
    serverActions: {
      bodySizeLimit: '2mb',
    },

    // Turbopack (dev bundler)
    turbo: {
      resolveAlias: {
        '@': './src',
      },
    },
  },
};
```

**Current Status:**
- Turbopack enabled via `--turbopack` flag in `package.json`
- No experimental config needed for Carzo

---

### Full Example (Future Configuration)

```typescript
import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // Project root
  outputFileTracingRoot: path.join(__dirname),

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.lotlinx.com',
        pathname: '/images/**',
      },
    ],
    formats: ['image/webp'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },

  // Redirects (if needed)
  async redirects() {
    return [
      {
        source: '/old-search',
        destination: '/search',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
```

---

## Deployment Settings (Vercel Dashboard)

### Build & Development Settings

**Framework Preset:** Next.js
**Build Command:** `npm run build`
**Output Directory:** `.next` (auto-detected)
**Install Command:** `npm install`
**Development Command:** `npm run dev`

**Root Directory:** `.` (project root)

### Environment Variables

Set in **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
LOTLINX_FEED_USERNAME=...
LOTLINX_FEED_PASSWORD=...
LOTLINX_PUBLISHER_ID=...
CRON_SECRET=...
NEXT_PUBLIC_SITE_URL=https://carzo.net
ADMIN_PASSWORD=...
MAXMIND_ACCOUNT_ID=...
MAXMIND_LICENSE_KEY=...
```

**Environments:**
- ✅ **Production** (main branch)
- ✅ **Preview** (all other branches)
- ✅ **Development** (local `vercel dev`)

### Domains

**Production Domain:** `carzo.net`
**Vercel Domain:** `carzo.vercel.app` (auto-generated)

**Custom Domain Setup:**
1. Go to **Settings** → **Domains**
2. Add `carzo.net`
3. Add DNS records (A/CNAME) at domain registrar
4. Vercel auto-issues SSL certificate (Let's Encrypt)

**DNS Records:**
```
A     @       76.76.21.21
CNAME www     cname.vercel-dns.com
```

### Git Integration

**Repository:** GitHub (auto-deploy on push)
**Production Branch:** `main`
**Deploy Hooks:** None (auto-deploy enabled)

**Preview Deployments:**
- Every PR gets unique preview URL
- Comment posted in PR with preview link
- Auto-deleted after PR merge

---

## Performance Settings

### Edge Functions (Experimental)

**Status:** Not used (standard serverless functions)

**When to Use:**
- Ultra-low latency requirements (< 50ms)
- Global edge deployment
- Limited runtime (no Node.js APIs)

**Current Approach:**
- Standard serverless functions (Node.js 20.x)
- Sufficient for our use case

---

### Incremental Static Regeneration (ISR)

**Status:** Used for VDP pages

**Configuration:**
```typescript
// app/vehicles/[vin]/page.tsx
export const revalidate = 21600; // 6 hours

export async function generateStaticParams() {
  // Pre-generate top 1000 vehicles
  const topVehicles = await supabase
    .from('vehicles')
    .select('vin')
    .order('created_at', { ascending: false })
    .limit(1000);

  return topVehicles.data?.map((v) => ({ vin: v.vin })) || [];
}
```

**How It Works:**
1. Build time: Generate top 1000 VDPs
2. Runtime: Generate other VDPs on-demand
3. Cache: Revalidate every 6 hours

---

## Logs & Monitoring

### Vercel Logs

**Access:**
1. Vercel Dashboard → Project → **Logs**
2. Filter by function, time range, log level

**Log Types:**
- **Static** - Page requests
- **Lambda** - API routes, SSR
- **Edge** - Edge functions (if used)
- **Cron** - Cron job executions

### Log Retention

**Hobby Plan:** 1 day
**Pro Plan:** 7 days
**Enterprise:** 30+ days

**Export Logs:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Stream logs
vercel logs carzo.net --follow

# Filter by function
vercel logs carzo.net --follow --filter="api/cron/sync-feed"
```

---

## Troubleshooting

### "Cron job not running"

**Check:**
1. Vercel Dashboard → **Deployments** → Latest deployment → **Functions** tab
2. Verify cron jobs are listed
3. Check **Logs** for execution

**Fix:**
```bash
# Redeploy to re-register cron jobs
git commit --allow-empty -m "Redeploy to fix cron"
git push
```

### "Function timeout"

**Cause:** Exceeded 10s timeout (Hobby) or 60s (Pro)

**Fix:**
1. Optimize function (batch processing, caching)
2. Or upgrade to Pro plan

### "Module not found" Build Error

**Cause:** Missing dependency or incorrect import path

**Fix:**
```bash
# 1. Check package.json
cat package.json | grep "missing-package"

# 2. Install if missing
npm install missing-package

# 3. Commit and push
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push
```

---

## Related Documentation

- [Environment Variables](./environment-variables.md) - Complete env var reference
- [Deployment Guide](../how-to/deploy-to-vercel.md) - Step-by-step deployment
- [Feed Sync API](./api/sync-feed.md) - Cron job implementation
- [Rate Limit Cleanup](./api/cleanup-rate-limits.md) - Hourly cleanup job
- [Next.js Config](https://nextjs.org/docs/app/api-reference/next-config-js) - Official Next.js docs
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) - Official Vercel docs
