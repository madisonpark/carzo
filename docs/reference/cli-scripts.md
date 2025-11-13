# CLI Scripts Reference

## Overview

Carzo includes TypeScript and Bash scripts in `/scripts` for development, testing, and maintenance tasks. All TypeScript scripts use `tsx` for direct execution without compilation.

**Prerequisites:**
```bash
# Install tsx globally (recommended)
npm install -g tsx

# Or use via npx
npx tsx scripts/script-name.ts
```

---

## Feed Synchronization Scripts

### sync-feed.ts

**Purpose:** Manually sync vehicle inventory from LotLinx Publisher Feed (bypasses cron schedule)

**Usage:**
```bash
# Full feed sync (~72K vehicles)
npx tsx scripts/sync-feed.ts
```

**What It Does:**
1. Downloads latest feed ZIP from LotLinx (`https://feed.lotlinx.com/`)
2. Extracts TSV file
3. Parses 72,000+ vehicle records
4. Batch upserts to Supabase (1000 at a time)
5. Marks removed vehicles as `is_active = false`
6. Logs sync metrics to `feed_sync_logs` table

**Output:**
```
🚀 Carzo Feed Sync
==================
Publisher ID: 12345
Supabase: https://xxx.supabase.co

⬇️  Downloading feed...
✅ Downloaded 125 MB in 12.5s
📦 Extracted vehicles.tsv (250 MB)
📝 Parsed 72,051 vehicles

🔄 Syncing to database...
  ✅ Batch 1/73: 1000 vehicles
  ✅ Batch 2/73: 1000 vehicles
  ...
  ✅ Batch 73/73: 51 vehicles

✅ Feed sync complete!
==================
Added: 523 vehicles
Updated: 71,245 vehicles
Removed: 283 vehicles
Total active: 72,051 vehicles
Duration: 45.2 seconds
```

**When to Use:**
- Testing feed sync locally
- Manual inventory update (outside cron schedule)
- Debugging feed parsing issues
- Initial database population

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOTLINX_FEED_USERNAME`
- `LOTLINX_FEED_PASSWORD`
- `LOTLINX_PUBLISHER_ID`

**Implementation:**
```typescript
// scripts/sync-feed.ts
import { FeedSyncService } from '../lib/feed-sync';

const syncService = new FeedSyncService(
  supabaseUrl,
  supabaseKey,
  feedUsername,
  feedPassword,
  publisherId
);

const result = await syncService.syncFeed();
```

---

### test-cron.sh

**Purpose:** Test cron endpoints locally with proper authentication

**Usage:**
```bash
# Make executable
chmod +x scripts/test-cron.sh

# Run test
./scripts/test-cron.sh
```

**What It Does:**
1. Loads `CRON_SECRET` from `.env.local`
2. Calls `/api/cron/sync-feed` with Bearer token
3. Displays full HTTP response (headers + body)

**Output:**
```
🧪 Testing cron endpoint...
📍 URL: http://localhost:3000/api/cron/sync-feed

> GET /api/cron/sync-feed HTTP/1.1
> Host: localhost:3000
> Authorization: Bearer cron_secret_xxx
>
< HTTP/1.1 200 OK
< Content-Type: application/json
<
{
  "success": true,
  "vehiclesAdded": 523,
  "vehiclesUpdated": 71245,
  "vehiclesRemoved": 283,
  "totalActive": 72051,
  "durationSeconds": 45
}

✅ Test complete
```

**When to Use:**
- Verify cron authentication works
- Test cron endpoint before deployment
- Debug cron failures locally

**Script:**
```bash
#!/bin/bash

# Load CRON_SECRET from .env.local
export $(cat .env.local | grep CRON_SECRET | xargs)

curl -v http://localhost:3000/api/cron/sync-feed \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Database & Migration Scripts

### run-migration.ts

**Purpose:** Apply a specific Supabase migration manually

**Usage:**
```bash
# Apply migration by filename
npx tsx scripts/run-migration.ts 20251112000007_add_flow_to_clicks.sql
```

**What It Does:**
1. Reads migration file from `supabase/migrations/`
2. Executes SQL against Supabase database
3. Logs success/failure

**When to Use:**
- Apply migration outside of Supabase CLI
- Test migration before committing
- Rollback via manual SQL execution

**⚠️ Caution:**
- Bypasses Supabase migration tracking
- Can cause schema drift
- Prefer `supabase db push` for production

**Better Approach:**
```bash
# Use Supabase CLI instead (recommended)
supabase db push
```

---

### fix-column-sizes.ts

**Purpose:** Fix column size mismatches between schema and actual database

**Usage:**
```bash
npx tsx scripts/fix-column-sizes.ts
```

**What It Does:**
1. Identifies columns with size mismatches (VARCHAR(50) vs VARCHAR(100))
2. Generates ALTER TABLE statements
3. Executes alterations
4. Verifies changes

**Output:**
```
🔍 Checking column sizes...

Found 5 mismatches:
  - vehicles.make: VARCHAR(50) → VARCHAR(100)
  - vehicles.model: VARCHAR(50) → VARCHAR(100)
  - clicks.dealer_id: VARCHAR(50) → VARCHAR(100)

🔧 Applying fixes...
  ✅ Fixed vehicles.make
  ✅ Fixed vehicles.model
  ✅ Fixed clicks.dealer_id

✅ All column sizes fixed
```

**When to Use:**
- After schema changes
- When feed data exceeds column limits
- Debugging "value too long" errors

---

### alter-columns.ts

**Purpose:** Bulk alter column types/constraints

**Usage:**
```bash
npx tsx scripts/alter-columns.ts
```

**What It Does:**
- Applies predefined column alterations
- Used for one-time schema fixes
- Safer than manual SQL (validates first)

---

### apply-flow-migrations.ts

**Purpose:** Apply A/B test flow migrations (adds `flow` column to clicks/impressions)

**Usage:**
```bash
npx tsx scripts/apply-flow-migrations.ts
```

**What It Does:**
1. Adds `flow VARCHAR(20)` column to `clicks` table
2. Adds `flow VARCHAR(20)` column to `impressions` table
3. Creates indexes on `flow` columns
4. Backfills existing records with `flow = 'full'` (default)

**Output:**
```
🔄 Applying flow migrations...

✅ Added flow column to clicks table
✅ Added flow column to impressions table
✅ Created indexes
✅ Backfilled 12,543 clicks with flow='full'
✅ Backfilled 45,123 impressions with flow='full'

✅ Flow migrations complete
```

---

## Testing & Debugging Scripts

### test-click-tracking.ts

**Purpose:** Test click tracking API with simulated user/vehicle data

**Usage:**
```bash
npx tsx scripts/test-click-tracking.ts
```

**What It Does:**
1. Creates test user ID (UUID)
2. Fetches random active vehicle
3. Calls `/api/track-click` with test data
4. Verifies response (billable flag, dealer history update)

**Output:**
```
🧪 Testing Click Tracking
========================

Test User: 550e8400-e29b-41d4-a916-446655440000
Test Vehicle: 1HGBH41JXMN109186 (2024 Toyota Camry)
Dealer ID: dealer_12345

📍 First Click
  ✅ Billable: true
  💰 Revenue: $0.80

📍 Second Click (same dealer)
  ✅ Billable: false (duplicate)
  💰 Revenue: $0.00

📍 Third Click (different dealer)
  ✅ Billable: true
  💰 Revenue: $0.80

✅ All tests passed
Total Revenue: $1.60 (2 billable clicks)
```

**When to Use:**
- Verify click deduplication works
- Test revenue calculation logic
- Debug dealer_click_history updates

---

### verify-tracking.ts

**Purpose:** Verify all tracking tables have correct data

**Usage:**
```bash
npx tsx scripts/verify-tracking.ts
```

**What It Does:**
1. Checks `clicks` table for is_billable correctness
2. Verifies `dealer_click_history` consistency
3. Validates `impressions` table integrity
4. Reports any data inconsistencies

**Output:**
```
🔍 Verifying Tracking Data
==========================

✅ clicks table: 12,543 records
  - Billable: 9,876 (78.7%)
  - Non-billable: 2,667 (21.3%)

✅ dealer_click_history table: 1,234 records
  - All records valid
  - No orphaned dealers

✅ impressions table: 45,123 records
  - All vehicle_ids valid

⚠️  Found 3 clicks with missing dealer_id
  - Click IDs: abc-123, def-456, ghi-789

✅ Tracking integrity: 99.98%
```

**When to Use:**
- After major data migration
- Debugging revenue discrepancies
- Monthly data audit

---

### test-feed-sync.ts

**Purpose:** Test feed sync with a small sample (faster than full sync)

**Usage:**
```bash
# Sync first 100 vehicles only
npx tsx scripts/test-feed-sync.ts --limit 100
```

**What It Does:**
1. Downloads feed (same as full sync)
2. Parses only first N vehicles (default 100)
3. Batch upserts to database
4. Skips inactive vehicle cleanup

**Output:**
```
🧪 Test Feed Sync (Limited)
===========================

⬇️  Downloading feed...
✅ Downloaded 125 MB
📝 Parsing first 100 vehicles...

🔄 Syncing to database...
  ✅ Batch 1/1: 100 vehicles

✅ Test sync complete!
==================
Added: 5 vehicles
Updated: 95 vehicles
Duration: 3.2 seconds
```

**When to Use:**
- Quick feed sync test (3s vs 45s)
- Verify feed format hasn't changed
- Test feed parsing logic

---

### get-sample-vin.ts

**Purpose:** Get a random VIN for testing VDP pages

**Usage:**
```bash
npx tsx scripts/get-sample-vin.ts

# Filter by make
npx tsx scripts/get-sample-vin.ts --make Toyota

# Get multiple VINs
npx tsx scripts/get-sample-vin.ts --count 5
```

**Output:**
```
🔍 Random Vehicle VINs
======================

VIN: 1HGBH41JXMN109186
Vehicle: 2024 Toyota Camry SE
Price: $28,500
URL: http://localhost:3000/vehicles/1HGBH41JXMN109186
```

**When to Use:**
- Manual VDP testing
- Generating test URLs
- Load testing specific vehicles

---

## package.json Scripts

Scripts defined in `package.json` for common tasks:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### dev

**Purpose:** Start Next.js development server with Turbopack

**Usage:**
```bash
npm run dev
```

**Output:**
```
▲ Next.js 16.0.0 (turbo)
- Local:   http://localhost:3000
- Network: http://192.168.1.100:3000

✓ Ready in 1.2s
```

**Turbopack Benefits:**
- 2-5x faster than Webpack
- Incremental compilation
- Faster HMR (Hot Module Replacement)

---

### build

**Purpose:** Build production-optimized Next.js app

**Usage:**
```bash
npm run build
```

**Output:**
```
▲ Next.js 16.0.0

✓ Creating an optimized production build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (10/10)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         95.3 kB
├ ○ /search                              8.1 kB         98.2 kB
├ ƒ /vehicles/[vin]                      12.3 kB        102.4 kB
└ ○ /admin                               6.5 kB         96.6 kB

○  (Static)  prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

✓ Build completed in 45s
```

**When to Use:**
- Before deployment
- Testing production build locally
- Verifying bundle sizes

---

### start

**Purpose:** Start production server (after build)

**Usage:**
```bash
npm run build && npm run start
```

**Output:**
```
▲ Next.js 16.0.0
- Local:   http://localhost:3000

✓ Ready in 500ms
```

**When to Use:**
- Test production build locally
- Verify SSR/ISR works correctly
- Performance testing

---

### lint

**Purpose:** Run ESLint on codebase

**Usage:**
```bash
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

**Output:**
```
✓ No ESLint warnings or errors
```

---

### type-check

**Purpose:** Run TypeScript compiler without emitting files (type checking only)

**Usage:**
```bash
npm run type-check
```

**Output:**
```
✓ No TypeScript errors found
```

**When to Use:**
- Before committing
- CI/CD pipeline
- Verify no type errors

---

### test

**Purpose:** Run Vitest test suite

**Usage:**
```bash
# Run all tests
npm run test

# Watch mode (re-run on file changes)
npm run test -- --watch

# Run specific test file
npm run test -- user-tracking.test.ts
```

**Output:**
```
✓ lib/__tests__/user-tracking.test.ts (4)
  ✓ getUserId() should create new ID if not exists
  ✓ getUserId() should return existing ID
  ✓ getSessionId() should create new session ID
  ✓ getSessionId() should persist in sessionStorage

Test Files  1 passed (1)
     Tests  4 passed (4)
  Start at  10:30:00
  Duration  250ms
```

---

### test:ui

**Purpose:** Run Vitest with interactive UI

**Usage:**
```bash
npm run test:ui
```

**Opens:** http://localhost:51204/__vitest__/

**Features:**
- Visual test runner
- Click to run specific tests
- See test coverage
- Debug test failures

---

### test:coverage

**Purpose:** Run tests and generate coverage report

**Usage:**
```bash
npm run test:coverage
```

**Output:**
```
✓ lib/__tests__/user-tracking.test.ts (4 passed)

 % Coverage report from v8
---------------------------
File                     | % Stmts | % Branch | % Funcs | % Lines
lib/user-tracking.ts     |   95.2  |   88.9   |  100.0  |   95.2
lib/dealer-diversity.ts  |   87.5  |   75.0   |  100.0  |   87.5
lib/revenue.ts           |   92.3  |   80.0   |  100.0  |   92.3
---------------------------
All files                |   91.7  |   81.3   |  100.0  |   91.7
```

**Coverage Report:** `coverage/index.html` (open in browser)

---

## Script Development Guidelines

### Creating New Scripts

**Template:**
```typescript
#!/usr/bin/env tsx
/**
 * Script Name
 * Purpose: Brief description
 * Usage: npx tsx scripts/script-name.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  // Validate required env vars
  const requiredVars = ['VAR1', 'VAR2'];
  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`  - ${v}`));
    process.exit(1);
  }

  // Script logic here
  console.log('🚀 Starting script...');

  try {
    // Do work...
    console.log('✅ Script complete');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run script
main();
```

---

### Best Practices

1. **Always validate env vars** at script start
2. **Use emojis** for visual feedback (🚀 ✅ ❌ ⚠️)
3. **Exit with code 1** on failure (for CI/CD)
4. **Log progress** for long-running scripts
5. **Use tsx shebang** for direct execution: `#!/usr/bin/env tsx`
6. **Document usage** in script comments

---

## Troubleshooting

### "tsx: command not found"

**Cause:** tsx not installed globally

**Fix:**
```bash
# Install globally
npm install -g tsx

# Or use npx (no install needed)
npx tsx scripts/script-name.ts
```

---

### "Missing environment variables"

**Cause:** `.env.local` not found or incomplete

**Fix:**
```bash
# 1. Check .env.local exists
ls -la .env.local

# 2. Copy from template if missing
cp .env.example .env.local

# 3. Fill in actual values
nano .env.local
```

---

### "Cannot find module '@/lib/...'"

**Cause:** TypeScript path alias not resolved

**Fix:**
Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## Related Documentation

- [Environment Variables](./environment-variables.md) - Required env vars for scripts
- [Database Schema](./database-schema.md) - Tables modified by scripts
- [Testing](./testing.md) - Test scripts and Vitest setup
- [Deployment](../how-to/deploy-to-vercel.md) - Production build & deploy
