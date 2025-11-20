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
1. Downloads latest feed ZIP from LotLinx (`https://feed.lotlinx.com/`) using POST authentication
2. Extracts TSV file using `adm-zip` (no system dependencies)
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

🚀 Starting feed sync...
📥 Downloading feed...
Downloading from https://feed.lotlinx.com/ as user ...
✅ Downloaded: .../temp/feed-123.zip
📦 Extracting TSV...
Found TSV entry: master.tsv
✅ Extracted: .../temp/feed-123.tsv
🔍 Parsing vehicles...
✅ Parsed 72,051 vehicles
💾 Syncing to database...
   Synced 1000/72051
   Synced 2000/72051
   ...
✨ Feed sync complete!
   Added: 523
   Updated: 71,245
   Removed: 283
   Duration: 45.2s

✅ Sync completed successfully!
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

**Purpose:** Test the cron endpoint locally (simulating Vercel Cron)

**Usage:**
```bash
./scripts/test-cron.sh
```

---

### Other Scripts

- `check-rate-limit.ts`: Test rate limiting logic
- `import-zip-codes.ts`: Import geography data
- `run-migration.ts`: Apply migrations
