# API Reference: /api/cron/sync-feed

## Overview

Synchronize vehicle inventory from LotLinx publisher feed (72K+ vehicles, 4x daily).

**Endpoint:** `GET /api/cron/sync-feed`

**Authentication:** Bearer token (`CRON_SECRET`)

**Rate Limiting:** None (cron-only endpoint)

**Schedule:** 4x daily at 03:00, 09:00, 15:00, 21:00 UTC

## Request

### Headers

```http
Authorization: Bearer <CRON_SECRET>
```

### Example Request

```bash
curl "https://carzo.net/api/cron/sync-feed" \
  -H "Authorization: Bearer your_cron_secret_here"
```

## Response

### Success Response

**Status Code:** `200 OK`

**Body:**

```json
{
  "success": true,
  "timestamp": "2025-11-12T09:00:05.234Z",
  "stats": {
    "downloaded": 72051,
    "added": 234,
    "updated": 71500,
    "removed": 317,
    "errors": 0,
    "duration": 45.2
  },
  "message": "Feed sync completed successfully"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether sync completed successfully |
| `timestamp` | string | ISO 8601 timestamp of sync completion |
| `stats.downloaded` | number | Total vehicles in feed |
| `stats.added` | number | New vehicles added to database |
| `stats.updated` | number | Existing vehicles updated |
| `stats.removed` | number | Vehicles marked inactive (no longer in feed) |
| `stats.errors` | number | Number of parsing/insertion errors |
| `stats.duration` | number | Sync duration in seconds |
| `message` | string | Human-readable status message |

### Error Responses

#### 401 Unauthorized

**Missing or Invalid Token:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing CRON_SECRET"
}
```

#### 500 Internal Server Error

**Feed Download Failed:**
```json
{
  "success": false,
  "error": "Failed to download feed from LotLinx",
  "message": "Network timeout after 30 seconds"
}
```

**Database Error:**
```json
{
  "success": false,
  "error": "Database error",
  "message": "Failed to upsert vehicles: connection timeout",
  "stats": {
    "downloaded": 72051,
    "added": 0,
    "updated": 0,
    "removed": 0,
    "errors": 72051
  }
}
```

## Implementation Details

### LotLinx Feed Structure

**Feed URL:** `https://feed.lotlinx.com/`

**Format:** ZIP file containing TSV (Tab-Separated Values)

**Fields (34 total):**
```
vin, year, make, model, trim, body_style, condition,
exterior_color, interior_color, fuel_type, transmission,
drivetrain, engine, price, miles, dealer_id, dealer_name,
dealer_city, dealer_state, dealer_zip, dealer_vdp_url,
primary_image_url, photo_urls, total_photos, latitude,
longitude, targeting_radius, is_active, created_at, updated_at
```

### Sync Process

```typescript
// app/api/cron/sync-feed/route.ts
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // 1. Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Download ZIP from LotLinx
  const feedUrl = 'https://feed.lotlinx.com/';
  const response = await fetch(feedUrl, {
    headers: {
      'Authorization': `Basic ${Buffer.from(
        `${process.env.LOTLINX_FEED_USERNAME}:${process.env.LOTLINX_FEED_PASSWORD}`
      ).toString('base64')}`,
    },
  });

  const zipBuffer = await response.arrayBuffer();

  // 3. Extract TSV file from ZIP
  const zip = new AdmZip(Buffer.from(zipBuffer));
  const tsvEntry = zip.getEntries().find(e => e.entryName.endsWith('.tsv'));
  const tsvContent = tsvEntry.getData().toString('utf8');

  // 4. Parse TSV into vehicle objects
  const lines = tsvContent.split('\n');
  const vehicles = lines.slice(1).map(line => {
    const fields = line.split('\t');
    return {
      vin: fields[0],
      year: parseInt(fields[1]),
      make: fields[2],
      model: fields[3],
      // ... parse all 34 fields
      is_active: true,
    };
  });

  // 5. Upsert vehicles in batches (1000 at a time)
  let added = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < vehicles.length; i += 1000) {
    const batch = vehicles.slice(i, i + 1000);

    const { error } = await supabase
      .from('vehicles')
      .upsert(batch, { onConflict: 'vin' });

    if (error) {
      errors += batch.length;
    } else {
      // Count as added if new, updated if existing
      updated += batch.length;
    }
  }

  // 6. Mark removed vehicles as inactive
  const vinsInFeed = vehicles.map(v => v.vin);
  const { data: removedVehicles } = await supabase
    .from('vehicles')
    .update({ is_active: false })
    .not('vin', 'in', `(${vinsInFeed.join(',')})`)
    .eq('is_active', true)
    .select('vin');

  const removed = removedVehicles?.length || 0;

  // 7. Return stats
  const duration = (Date.now() - startTime) / 1000;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    stats: {
      downloaded: vehicles.length,
      added,
      updated,
      removed,
      errors,
      duration,
    },
    message: 'Feed sync completed successfully',
  });
}
```

### Budget Management

**Vehicles in feed = vehicles with active advertiser budgets**

When advertiser's budget depletes:
1. Vehicle removed from LotLinx feed
2. Next sync marks vehicle as `is_active = false`
3. Vehicle no longer shown in search results

**No separate budget tracking needed** - LotLinx handles it.

## Vercel Cron Configuration

### vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-feed",
      "schedule": "0 3,9,15,21 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0` - At minute 0 (start of hour)
- `3,9,15,21` - At hours 3, 9, 15, and 21 UTC
- `* * *` - Every day, every month, every day of week

**UTC Times:**
- 03:00 UTC = 10:00 PM EST (previous day) / 11:00 PM EDT
- 09:00 UTC = 04:00 AM EST / 05:00 AM EDT
- 15:00 UTC = 10:00 AM EST / 11:00 AM EDT
- 21:00 UTC = 04:00 PM EST / 05:00 PM EDT

### Environment Variables

```bash
# LotLinx Feed Credentials
LOTLINX_FEED_USERNAME=your_username
LOTLINX_FEED_PASSWORD=your_password
LOTLINX_PUBLISHER_ID=your_publisher_id

# Cron Secret (generated by Vercel)
CRON_SECRET=your_cron_secret
```

**Setup:**
1. Add variables in Vercel dashboard → Settings → Environment Variables
2. Vercel automatically adds `Authorization` header with `CRON_SECRET`
3. No manual token management required

## Manual Testing

### Local Testing

```bash
# Run sync script directly
npx tsx scripts/sync-feed.ts

# Or test cron endpoint
./scripts/test-cron.sh
```

### Test Script

```bash
# scripts/test-cron.sh
#!/bin/bash

# Load environment variables
source .env.local

# Call cron endpoint
curl "http://localhost:3000/api/cron/sync-feed" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Production Testing

```bash
# Trigger sync manually (use Vercel dashboard CRON_SECRET)
curl "https://carzo.net/api/cron/sync-feed" \
  -H "Authorization: Bearer production_cron_secret"
```

## Monitoring

### Vercel Logs

**View Logs:**
1. Vercel Dashboard → Project → Logs
2. Filter by `/api/cron/sync-feed`
3. Review sync stats and errors

**Log Output:**
```
2025-11-12 09:00:01 - Feed sync started
2025-11-12 09:00:15 - Downloaded 72,051 vehicles
2025-11-12 09:00:30 - Upserted batch 1/73 (1000 vehicles)
2025-11-12 09:00:45 - Sync completed: added=234, updated=71500, removed=317
```

### Alerting (Future)

```typescript
// Send alert if errors > threshold
if (errors > 100) {
  await sendSlackAlert({
    channel: '#carzo-alerts',
    message: `Feed sync errors: ${errors} vehicles failed to sync`,
    severity: 'warning',
  });
}

// Send alert if removed > threshold
if (removed > 1000) {
  await sendSlackAlert({
    channel: '#carzo-alerts',
    message: `High removal count: ${removed} vehicles marked inactive`,
    severity: 'warning',
  });
}
```

## Performance Optimization

### Batch Processing

**Current:** 1000 vehicles per batch

**Why 1000?**
- Supabase row limit per query: ~1000
- Balance between speed and memory
- Prevents timeout on large batches

**Alternative Sizes:**
- 500: Slower (more HTTP requests)
- 2000: Risk of timeout
- 1000: Sweet spot

### Parallel Processing (Future)

```typescript
// Process batches in parallel (4 workers)
const workers = 4;
const batchSize = 1000;

await Promise.all(
  Array.from({ length: workers }, (_, i) => {
    const start = i * (vehicles.length / workers);
    const end = start + (vehicles.length / workers);
    return processBatch(vehicles.slice(start, end));
  })
);
```

**Expected Speedup:** 2-3x faster (45s → 15-20s)

### Incremental Sync (Future)

```typescript
// Only sync changes since last sync
const lastSync = await getLastSyncTimestamp();
const changedVehicles = await fetchChangedSince(lastSync);

// Reduces download size (72K → ~500-1000 vehicles)
```

## Error Handling

### Network Errors

```typescript
try {
  const response = await fetch(feedUrl, { timeout: 30000 });
} catch (error) {
  if (error.code === 'ETIMEDOUT') {
    // Retry once
    const response = await fetch(feedUrl, { timeout: 60000 });
  }
  throw error;
}
```

### Parsing Errors

```typescript
// Track which vehicles failed to parse
const parseErrors = [];

for (const line of lines) {
  try {
    const vehicle = parseVehicleLine(line);
    vehicles.push(vehicle);
  } catch (error) {
    parseErrors.push({ line, error: error.message });
  }
}

// Log errors but continue sync
if (parseErrors.length > 0) {
  console.error(`Parse errors: ${parseErrors.length}`, parseErrors);
}
```

### Database Errors

```typescript
// Retry failed batches
const failedBatches = [];

for (const batch of batches) {
  try {
    await supabase.from('vehicles').upsert(batch);
  } catch (error) {
    // Retry once
    try {
      await supabase.from('vehicles').upsert(batch);
    } catch (retryError) {
      failedBatches.push(batch);
    }
  }
}

// Report failed batches
if (failedBatches.length > 0) {
  console.error(`Failed batches: ${failedBatches.length}`);
}
```

## Testing

### Unit Test

```typescript
// lib/__tests__/feed-sync.test.ts
describe('Feed Sync', () => {
  it('should parse TSV line correctly', () => {
    const line = 'VIN123\t2023\tToyota\tCamry\t...';
    const vehicle = parseVehicleLine(line);

    expect(vehicle.vin).toBe('VIN123');
    expect(vehicle.year).toBe(2023);
    expect(vehicle.make).toBe('Toyota');
  });

  it('should handle missing fields gracefully', () => {
    const line = 'VIN123\t2023\tToyota\t\t'; // Missing trim
    const vehicle = parseVehicleLine(line);

    expect(vehicle.trim).toBe('');
  });
});
```

### Integration Test

```bash
# Download and verify feed structure
curl "https://feed.lotlinx.com/" \
  -u "$LOTLINX_FEED_USERNAME:$LOTLINX_FEED_PASSWORD" \
  -o feed.zip

unzip feed.zip
wc -l *.tsv  # Count vehicles
```

## Related Endpoints

- [POST /api/search-vehicles](./search-vehicles.md) - Uses synced vehicle data
- [POST /api/filter-options](./filter-options.md) - Dynamic filters from synced data

## Related Documentation

- [Business Model](../../explanation/business-model.md) - Budget management
- [Architecture Overview](../../explanation/architecture-overview.md) - Feed sync in system design
- [Deployment](../../how-to/deploy-to-vercel.md) - Vercel cron setup
