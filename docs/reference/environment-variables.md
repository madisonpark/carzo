# Environment Variables Reference

## Overview

Carzo uses environment variables for configuration and secrets. All variables are loaded from `.env.local` (gitignored) and `.env.example` provides a template.

**File Locations:**
- `.env.example` - Template (checked into git)
- `.env.local` - Actual secrets (NEVER commit)
- `SECRETS.md` - Secure storage for team secrets (NEVER commit)

## Quick Setup

```bash
# Copy template
cp .env.example .env.local

# Edit with your values
nano .env.local

# Verify variables are loaded
npm run dev
# Check: http://localhost:3000/api/health (or similar test endpoint)
```

## Variable Categories

### Supabase (Database)

Required for all database operations.

#### NEXT_PUBLIC_SUPABASE_URL

**Purpose:** Supabase project URL (public, client-side)

**Example:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

**Where to Find:**
1. Open [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings** → **API**
4. Copy **Project URL**

**Usage:**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Why NEXT_PUBLIC_?**
- Next.js exposes variables prefixed with `NEXT_PUBLIC_` to the browser
- Required for client-side Supabase calls
- Not a secret (visible in browser network tab)

---

#### NEXT_PUBLIC_SUPABASE_ANON_KEY

**Purpose:** Supabase anonymous (public) API key (client-side)

**Example:**
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to Find:**
1. Supabase Dashboard → **Settings** → **API**
2. Copy **anon public** key

**Security:**
- Public key (safe to expose)
- Row-Level Security (RLS) policies enforce access control
- Cannot bypass RLS policies
- Read-only access to `vehicles` table (via RLS)
- Insert-only access to `clicks`, `impressions` tables

**Usage:**
- Client-side Supabase queries
- Browser-based API calls
- RLS policies protect data

---

#### SUPABASE_SERVICE_ROLE_KEY

**Purpose:** Supabase service role key (server-side only, bypasses RLS)

**Example:**
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to Find:**
1. Supabase Dashboard → **Settings** → **API**
2. Copy **service_role secret** key
3. ⚠️ **NEVER commit this key**

**Security:**
- ⚠️ **CRITICAL:** Server-side only (NEVER expose to client)
- Bypasses all RLS policies
- Full database access (read, write, delete)
- Used for feed sync, admin operations

**Usage:**
```typescript
// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

// Server-side only
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export { supabaseAdmin };
```

**When to Use:**
- Feed synchronization (`/api/cron/sync-feed`)
- Admin dashboard queries
- Rate limit cleanup
- Bulk operations
- Database migrations (via Supabase CLI)

---

### LotLinx Feed Integration

Required for vehicle inventory synchronization (4x daily).

#### LOTLINX_FEED_USERNAME

**Purpose:** LotLinx Publisher Feed authentication username

**Example:**
```bash
LOTLINX_FEED_USERNAME=carzo_publisher
```

**Where to Find:**
- Provided by LotLinx account manager
- Check `SECRETS.md` if set up by team member

**Usage:**
```typescript
// lib/feed-sync.ts
import axios from 'axios';

const response = await axios.get('https://feed.lotlinx.com/download', {
  auth: {
    username: process.env.LOTLINX_FEED_USERNAME!,
    password: process.env.LOTLINX_FEED_PASSWORD!,
  },
  params: {
    publisher_id: process.env.LOTLINX_PUBLISHER_ID,
  },
});
```

---

#### LOTLINX_FEED_PASSWORD

**Purpose:** LotLinx Publisher Feed authentication password

**Example:**
```bash
LOTLINX_FEED_PASSWORD=your_secure_password_here
```

**Where to Find:**
- Provided by LotLinx account manager
- Check `SECRETS.md`

**Security:**
- ⚠️ **NEVER commit**
- Server-side only
- Rotate if compromised

---

#### LOTLINX_PUBLISHER_ID

**Purpose:** Your LotLinx publisher ID for feed filtering

**Example:**
```bash
LOTLINX_PUBLISHER_ID=12345
```

**Where to Find:**
- Provided by LotLinx during onboarding
- Shown in LotLinx Publisher Dashboard

**Usage:**
- Appended to feed download URL
- Filters feed to only your advertiser vehicles
- Required parameter for feed sync

---

### Vercel Cron Jobs

Required for scheduled tasks (feed sync, rate limit cleanup).

#### CRON_SECRET

**Purpose:** Bearer token for authenticating cron job requests

**Example:**
```bash
CRON_SECRET=cron_secret_abc123xyz456
```

**How to Generate:**
```bash
# Random 32-character string
openssl rand -base64 32
# Or use a password manager
```

**Usage:**
```typescript
// app/api/cron/sync-feed/route.ts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Proceed with cron job...
}
```

**Vercel Configuration:**

In Vercel Dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add `CRON_SECRET` with your secret value
3. Vercel automatically adds `Authorization: Bearer <CRON_SECRET>` header to cron requests

**Security:**
- Prevents unauthorized cron endpoint access
- Required for all `/api/cron/*` routes
- Change if compromised

**Cron Schedule** (vercel.json):
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

### Application Configuration

#### NEXT_PUBLIC_SITE_URL

**Purpose:** Canonical site URL for SEO metadata and absolute URLs

**Example:**
```bash
# Production
NEXT_PUBLIC_SITE_URL=https://carzo.net

# Local development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Usage:**
```typescript
// app/layout.tsx (SEO metadata)
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  openGraph: {
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
};

// Canonical URLs
const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/vehicles/${vin}`;
```

**Why Needed:**
- Open Graph URLs (Facebook/Twitter previews)
- Canonical URLs for SEO
- Sitemap generation
- Email links (if implemented)

---

### Admin Dashboard

#### ADMIN_PASSWORD

**Purpose:** Password for accessing `/admin` analytics dashboard

**Example:**
```bash
ADMIN_PASSWORD=your_secure_admin_password
```

**How to Generate:**
```bash
# Strong random password
openssl rand -base64 24
```

**Usage:**
```typescript
// app/admin/login/page.tsx
const handleLogin = async (password: string) => {
  if (password === process.env.ADMIN_PASSWORD) {
    // Set cookie, redirect to dashboard
    document.cookie = 'admin_authenticated=true; path=/admin; max-age=86400';
    router.push('/admin');
  }
};
```

**Security Notes:**
- ⚠️ **Temporary auth** (Phase 1)
- TODO: Replace with proper auth (NextAuth.js, Clerk, etc.)
- Change default password immediately
- Use HTTPS in production (Vercel provides this)

**Future Enhancement:**
```typescript
// TODO: Replace with proper authentication
// import { getServerSession } from 'next-auth';
// const session = await getServerSession(authOptions);
```

---

### MaxMind GeoIP2 (IP Geolocation)

Required for detecting user location from IP address.

#### MAXMIND_ACCOUNT_ID

**Purpose:** MaxMind account ID for GeoIP2 Web Service API

**Example:**
```bash
MAXMIND_ACCOUNT_ID=123456
```

**Where to Find:**
1. Sign up at [MaxMind](https://www.maxmind.com/en/geoip2-precision-web-services)
2. Go to **Account** → **Manage License Keys**
3. Copy **Account ID**

**Pricing:**
- Free tier: 1,000 requests/month
- Paid: $0.005 per request (beyond free tier)

---

#### MAXMIND_LICENSE_KEY

**Purpose:** MaxMind license key for API authentication

**Example:**
```bash
MAXMIND_LICENSE_KEY=abcdefghijklmnopqrstuvwxyz123456
```

**Where to Find:**
1. MaxMind Account → **Manage License Keys**
2. Click **Generate New License Key**
3. Copy key (shown only once)

**Security:**
- ⚠️ **NEVER commit**
- Server-side only
- Rotate if compromised

**Usage:**
```typescript
// lib/geolocation.ts
import { WebServiceClient } from '@maxmind/geoip2-node';

export async function getLocationFromIP(ipAddress: string): Promise<UserLocation | null> {
  const client = new WebServiceClient(
    process.env.MAXMIND_ACCOUNT_ID!,
    process.env.MAXMIND_LICENSE_KEY!
  );

  const response = await client.city(ipAddress);

  return {
    city: response.city.names.en,
    state: response.subdivisions?.[0]?.isoCode,
    latitude: response.location.latitude,
    longitude: response.location.longitude,
  };
}
```

**Localhost Fallback:**

When `ipAddress` is `::1` or `127.0.0.1` (localhost), API returns Atlanta, GA coordinates:

```typescript
if (ipAddress === '::1' || ipAddress === '127.0.0.1') {
  return {
    city: 'Atlanta',
    state: 'GA',
    latitude: 33.749,
    longitude: -84.388,
    zipCode: '30303',
  };
}
```

---

## Environment-Specific Values

### Development (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# LotLinx (same as prod - shared feed)
LOTLINX_FEED_USERNAME=carzo_publisher
LOTLINX_FEED_PASSWORD=xxx
LOTLINX_PUBLISHER_ID=12345

# Cron (dev-specific secret)
CRON_SECRET=dev_cron_secret_123

# Domain (localhost)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Admin (dev password)
ADMIN_PASSWORD=dev_admin_123

# MaxMind (same as prod - shared account)
MAXMIND_ACCOUNT_ID=123456
MAXMIND_LICENSE_KEY=xxx
```

### Production (Vercel)

Set in **Vercel Dashboard** → **Settings** → **Environment Variables**:

```bash
# Supabase (production project)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# LotLinx (production credentials)
LOTLINX_FEED_USERNAME=carzo_publisher
LOTLINX_FEED_PASSWORD=xxx
LOTLINX_PUBLISHER_ID=12345

# Cron (strong production secret)
CRON_SECRET=prod_cron_secret_abc123xyz456

# Domain (production URL)
NEXT_PUBLIC_SITE_URL=https://carzo.net

# Admin (strong production password)
ADMIN_PASSWORD=strong_production_password_here

# MaxMind (production account)
MAXMIND_ACCOUNT_ID=123456
MAXMIND_LICENSE_KEY=xxx
```

---

## Vercel Environment Variables

### How to Set

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with value
5. Select environments: **Production**, **Preview**, **Development**

### Preview Deployments

Use separate values for preview branches (optional):

```bash
# Preview-specific Supabase project
NEXT_PUBLIC_SUPABASE_URL=https://preview-project.supabase.co

# Preview-specific admin password
ADMIN_PASSWORD=preview_password_123
```

### Automatic Injection

Vercel automatically injects environment variables into:
- Build process (`npm run build`)
- Runtime (API routes, Server Components)
- Client-side (NEXT_PUBLIC_* variables)

---

## Security Best Practices

### Never Commit Secrets

**Gitignore:**
```gitignore
# .gitignore
.env.local
.env*.local
SECRETS.md
```

**Check Before Committing:**
```bash
# Search for potential secrets in staged files
git diff --cached | grep -i "password\|secret\|key"

# If found, abort commit and remove from staging
git reset HEAD .env.local
```

### Rotate Compromised Secrets

If a secret is accidentally committed:

1. **Immediately rotate** in source system (Supabase, MaxMind, etc.)
2. **Update `.env.local`** and Vercel with new values
3. **Force push** to remove from git history (if recent)
4. **Notify team** if shared secret

### Use SECRETS.md for Team

**SECRETS.md** (gitignored, shared via 1Password/LastPass):

```markdown
# Carzo Secrets

## Supabase Production
- URL: https://xxx.supabase.co
- Anon Key: eyJ...
- Service Role Key: eyJ...

## LotLinx Feed
- Username: carzo_publisher
- Password: xxx
- Publisher ID: 12345

## MaxMind GeoIP2
- Account ID: 123456
- License Key: xxx

## Vercel
- CRON_SECRET: xxx
- ADMIN_PASSWORD: xxx
```

---

## Validation Script

Create `scripts/validate-env.ts` to check required variables:

```typescript
#!/usr/bin/env tsx

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'LOTLINX_FEED_USERNAME',
  'LOTLINX_FEED_PASSWORD',
  'LOTLINX_PUBLISHER_ID',
  'CRON_SECRET',
  'NEXT_PUBLIC_SITE_URL',
  'ADMIN_PASSWORD',
  'MAXMIND_ACCOUNT_ID',
  'MAXMIND_LICENSE_KEY',
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach((key) => console.error(`  - ${key}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

**Usage:**
```bash
# Validate before starting dev server
npx tsx scripts/validate-env.ts && npm run dev

# Add to package.json
{
  "scripts": {
    "validate": "tsx scripts/validate-env.ts",
    "dev": "npm run validate && next dev --turbopack"
  }
}
```

---

## Troubleshooting

### "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Cause:** Environment variable not loaded or typo

**Fix:**
```bash
# 1. Check .env.local exists
ls -la .env.local

# 2. Check variable name (no typos)
cat .env.local | grep SUPABASE_URL

# 3. Restart dev server (env changes require restart)
npm run dev
```

### "Unauthorized" on Cron Endpoint

**Cause:** Missing or incorrect CRON_SECRET

**Fix:**
```bash
# 1. Check Vercel env var is set
vercel env ls

# 2. Check .env.local matches
cat .env.local | grep CRON_SECRET

# 3. Test locally with correct header
curl http://localhost:3000/api/cron/sync-feed \
  -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)"
```

### MaxMind "Insufficient funds"

**Cause:** Free tier exhausted (1,000 requests/month)

**Fix:**
1. Check usage: MaxMind Account → Usage
2. Add payment method for overage
3. Or implement caching:

```typescript
// Cache location for 1 hour
const locationCache = new Map<string, { location: UserLocation, timestamp: number }>();

export async function getLocationFromIP(ip: string): Promise<UserLocation | null> {
  const cached = locationCache.get(ip);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.location;
  }

  const location = await fetchFromMaxMind(ip);
  locationCache.set(ip, { location, timestamp: Date.now() });
  return location;
}
```

---

## Related Documentation

- [Deployment Guide](../how-to/deploy-to-vercel.md) - Setting up Vercel environment variables
- [Feed Sync](./api/sync-feed.md) - LotLinx feed integration
- [MaxMind Geolocation](./api/detect-location.md) - IP-based location detection
- [Admin Dashboard](../how-to/monitoring.md) - Accessing analytics
