# Troubleshooting Guide

Common issues and solutions for Carzo development and production.

## Build & Deployment

### "Module not found" Error

**Symptom:**
```
Error: Cannot find module '@/lib/utils'
```

**Solutions:**
```bash
# 1. Check tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  }
}

# 2. Clear Next.js cache
rm -rf .next

# 3. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

### Vercel Build Timeout

**Symptom:** Build exceeds 45 minute limit (free tier)

**Solution:**
```typescript
// next.config.ts - disable type checking during build
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // Only for emergency deploys
  },
};
```

**Better solution:** Fix TypeScript errors locally first

---

## Database Issues

### "PGRST116: Schema cache not loaded"

**Symptom:** Supabase RPC calls fail with cache error

**Solution:**
```bash
# Reload schema cache
curl -X POST "https://your-project.supabase.co/rest/v1/rpc/reload_schema_cache" \
  -H "apikey: your_service_role_key"
```

---

### "Row Level Security Policy Violation"

**Symptom:** Cannot insert/update records via anon key

**Solution:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'clicks';

-- Add missing policy
CREATE POLICY "Anyone can insert clicks"
  ON clicks FOR INSERT
  WITH CHECK (true);
```

---

### Migration Conflicts

**Symptom:** `supabase db push` fails with "already exists"

**Solution:**
```bash
# Check remote migrations
supabase migration list

# Repair migration history
supabase migration repair --status applied YYYYMMDDHHMMSS
```

---

## API Issues

### Rate Limit 429 on First Request

**Symptom:** Getting rate limited immediately

**Debug:**
```sql
-- Check for stuck rate limits
SELECT * FROM rate_limits WHERE identifier = 'your-ip';

-- Delete stuck records
DELETE FROM rate_limits WHERE identifier = 'your-ip';
```

---

### CORS Errors

**Symptom:** `Access-Control-Allow-Origin` header missing

**Solution:**
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
        ],
      },
    ];
  },
};
```

---

## Feed Sync Issues

### "Invalid TSV Format"

**Symptom:** Feed parsing fails

**Debug:**
```bash
# Download and inspect feed
curl -u "$LOTLINX_FEED_USERNAME:$LOTLINX_FEED_PASSWORD" \
  "https://feed.lotlinx.com/download?publisher_id=$LOTLINX_PUBLISHER_ID" \
  -o feed.zip

unzip feed.zip
file vehicles.tsv  # Check encoding
head -n 5 vehicles.tsv  # Check format
```

**Solution:**
```typescript
// Check for BOM (Byte Order Mark)
const content = fs.readFileSync('vehicles.tsv', 'utf8');
const cleanContent = content.replace(/^\uFEFF/, '');  // Remove BOM
```

---

### Feed Sync Takes > 10 Minutes

**Symptom:** Cron timeout (Hobby plan = 10 sec limit)

**Solution:**
1. Upgrade to Vercel Pro (60 sec timeout)
2. Or batch sync:
```typescript
// Process in chunks
const CHUNK_SIZE = 5000;
for (let i = 0; i < vehicles.length; i += CHUNK_SIZE) {
  const chunk = vehicles.slice(i, i + CHUNK_SIZE);
  await batchUpsert(chunk);
}
```

---

## Frontend Issues

### "window is not defined" (SSR)

**Symptom:** Server-side rendering fails with window access

**Solution:**
```typescript
// Always check for window
if (typeof window === 'undefined') {
  return null;  // Or return server-side fallback
}

// Use dynamic import with ssr: false
import dynamic from 'next/dynamic';

const ClientOnlyComponent = dynamic(
  () => import('./ClientOnlyComponent'),
  { ssr: false }
);
```

---

### Images Not Loading

**Symptom:** Next.js Image component shows broken image

**Solution:**
```typescript
// Add remote pattern to next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.lotlinx.com',
      },
    ],
  },
};
```

---

### Suspense Boundary Error

**Symptom:** `useSearchParams()` requires Suspense boundary

**Solution:**
```tsx
// Wrap component in Suspense
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentUsingSearchParams />
    </Suspense>
  );
}
```

---

## Click Tracking Issues

### Clicks Not Recording

**Debug:**
```bash
# Check API endpoint
curl -X POST http://localhost:3000/api/track-click \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "123",
    "dealerId": "dealer-1",
    "userId": "user-1",
    "ctaClicked": "primary"
  }'

# Check database
psql $DATABASE_URL -c "SELECT * FROM clicks ORDER BY created_at DESC LIMIT 5;"
```

**Common Issues:**
- Missing `userId` (check cookie)
- Wrong `dealerId` format
- RLS policy blocking insert

---

### Billable Flag Always False

**Symptom:** All clicks marked as non-billable

**Debug:**
```sql
-- Check dealer_click_history
SELECT * FROM dealer_click_history WHERE user_id = 'user-1';

-- Delete test history
DELETE FROM dealer_click_history WHERE user_id LIKE 'test-%';
```

---

## Performance Issues

### Slow Database Queries

**Symptom:** API responses take > 2 seconds

**Debug:**
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC;

-- Check missing indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public';
```

**Solution:**
```sql
-- Add missing index
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);

-- Vacuum and analyze
VACUUM ANALYZE vehicles;
```

---

### High Memory Usage (Local Dev)

**Symptom:** Next.js dev server crashes with OOM

**Solution:**
```bash
# Increase Node.js memory
NODE_OPTIONS='--max-old-space-size=4096' npm run dev
```

---

## Getting Help

### Check Logs First

```bash
# Vercel logs
vercel logs carzo.net --follow

# Local logs
npm run dev  # Check terminal output

# Database logs
psql $DATABASE_URL -c "SELECT * FROM feed_sync_logs ORDER BY sync_timestamp DESC LIMIT 1;"
```

### Gather Debug Info

When asking for help, include:
1. Error message (full stack trace)
2. Steps to reproduce
3. Environment (local/production)
4. Recent changes (git log)
5. Relevant logs

### Create GitHub Issue

```markdown
**Issue:** Brief description

**Environment:**
- Local or Production
- Next.js version: 16.0.0
- Node version: 20.x

**Steps to Reproduce:**
1. Run `npm run dev`
2. Navigate to /search?make=Toyota
3. Click "See Photos"

**Expected:** Page loads
**Actual:** 500 error

**Error Message:**
\`\`\`
Error: Cannot read property 'vin' of undefined
  at VehiclePage (app/vehicles/[vin]/page.tsx:42:15)
\`\`\`

**Logs:**
\`\`\`
[Additional logs here]
\`\`\`
```

---

## Quick Fixes Checklist

When something breaks:

- [ ] Check Vercel logs for errors
- [ ] Clear Next.js cache (rm -rf .next)
- [ ] Check environment variables set
- [ ] Verify database connection
- [ ] Check rate limits not exceeded
- [ ] Restart dev server
- [ ] Clear browser cache
- [ ] Check recent commits (git log)
- [ ] Test in incognito mode
- [ ] Check Supabase dashboard (no downtime)

---

## Related Documentation

- [Monitoring](./monitoring.md)
- [Debug Rate Limiting](./debug-rate-limiting.md)
- [Database Schema](../reference/database-schema.md)
- [Testing Guide](../reference/testing.md)
