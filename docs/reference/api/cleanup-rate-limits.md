# API Reference: /api/cron/cleanup-rate-limits

## Overview

Clean up old rate limit records (hourly maintenance task).

**Endpoint:** `GET /api/cron/cleanup-rate-limits`

**Authentication:** Bearer token (`CRON_SECRET`)

**Rate Limiting:** None (cron-only endpoint)

**Schedule:** Every hour at :00 minutes

## Request

### Headers

```http
Authorization: Bearer <CRON_SECRET>
```

### Example Request

```bash
curl "https://carzo.net/api/cron/cleanup-rate-limits" \
  -H "Authorization: Bearer your_cron_secret_here"
```

## Response

### Success Response

**Status Code:** `200 OK`

**Body:**

```json
{
  "success": true,
  "deletedRecords": 12543,
  "timestamp": "2025-11-12T10:00:05.123Z",
  "message": "Rate limit cleanup completed successfully"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether cleanup completed successfully |
| `deletedRecords` | number | Number of old rate limit records deleted |
| `timestamp` | string | ISO 8601 timestamp of cleanup completion |
| `message` | string | Human-readable status message |

### Error Responses

#### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing CRON_SECRET"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Database error",
  "message": "Failed to delete rate limit records"
}
```

## Implementation Details

### Database Function

```sql
-- Function: Delete rate limit records older than 1 hour
CREATE FUNCTION cleanup_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete records older than 1 hour
  DELETE FROM rate_limits
  WHERE created_at < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

### API Route

```typescript
// app/api/cron/cleanup-rate-limits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing CRON_SECRET' },
      { status: 401 }
    );
  }

  try {
    // Call cleanup function
    const { data, error } = await supabaseAdmin.rpc('cleanup_rate_limits');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      deletedRecords: data || 0,
      timestamp: new Date().toISOString(),
      message: 'Rate limit cleanup completed successfully',
    });
  } catch (error) {
    console.error('Rate limit cleanup error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Database error',
        message: 'Failed to delete rate limit records',
      },
      { status: 500 }
    );
  }
}
```

## Why Clean Up Rate Limits?

### Problem: Table Bloat

**Without Cleanup:**
- Rate limit table grows indefinitely
- Slower queries (larger table to scan)
- Higher storage costs
- No value in old records (rate limits already expired)

**With Cleanup:**
- Table size remains constant (~1-2 GB)
- Fast queries (smaller table)
- Lower storage costs
- Only recent data retained (last 1 hour)

### Retention Policy

**1-Hour Window:**
- Rate limits reset in 1 hour max (longest window)
- Keeps table size minimal for maximum performance
- Sufficient for enforcing limits

**Alternative Retention Periods:**
- 24 hours: Good for debugging but increased storage
- 7 days: Too long (unnecessary storage)
- 1 hour: Optimal for performance

## Vercel Cron Configuration

### vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-rate-limits",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0` - At minute 0 (start of hour)
- `*` - Every hour
- `* * *` - Every day, every month, every day of week

**Frequency:** Every hour (e.g., 10:00, 11:00, 12:00, etc.)

## Performance Considerations

### Delete Performance

**Typical Deletion:**
- Records to delete: ~10,000-20,000 per hour
- Delete time: ~500ms-1s
- Index updates: Automatic

**Optimization:**
```sql
-- Add index on created_at for fast filtering
CREATE INDEX idx_rate_limits_created
  ON rate_limits(created_at);

-- Query plan uses index
EXPLAIN DELETE FROM rate_limits
WHERE created_at < NOW() - INTERVAL '1 hour';

-- Index Scan using idx_rate_limits_created (fast)
```

### Impact on Live Queries

**Unlogged Table:**
- Deletes don't block inserts/updates
- No WAL (Write-Ahead Log) overhead
- Minimal impact on rate limit checks

**Advisory Locks:**
- Rate limit checks use advisory locks
- Not affected by DELETE operations
- No contention between cleanup and checks

## Monitoring

### Vercel Logs

**View Logs:**
1. Vercel Dashboard → Project → Logs
2. Filter by `/api/cron/cleanup-rate-limits`
3. Review deletion counts

**Expected Output:**
```
2025-11-12 10:00:01 - Rate limit cleanup started
2025-11-12 10:00:02 - Deleted 12,543 records
2025-11-12 10:00:02 - Cleanup completed successfully
```

### Alerting (Future)

```typescript
// Alert if deletion count is abnormally high
if (deletedRecords > 100000) {
  await sendSlackAlert({
    channel: '#carzo-alerts',
    message: `Abnormally high rate limit deletions: ${deletedRecords}`,
    severity: 'warning',
  });
}

// Alert if deletion fails
if (!success) {
  await sendSlackAlert({
    channel: '#carzo-alerts',
    message: 'Rate limit cleanup failed',
    severity: 'error',
  });
}
```

## Analytics Before Deletion

### Save Aggregated Stats (Future)

```sql
-- Before deleting, save hourly aggregates
INSERT INTO rate_limit_stats (hour, endpoint, total_requests, unique_identifiers)
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  endpoint,
  COUNT(*) as total_requests,
  COUNT(DISTINCT identifier) as unique_identifiers
FROM rate_limits
WHERE created_at < NOW() - INTERVAL '24 hours'
GROUP BY hour, endpoint;

-- Then delete raw records
DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 hour';
```

**Benefits:**
- Long-term trend analysis
- Traffic pattern insights
- Historical rate limit violations

## Manual Testing

### Local Testing

```bash
# Test cleanup function directly
psql $DATABASE_URL -c "SELECT cleanup_rate_limits();"

# Should return number of deleted records
```

### Test Script

```bash
# scripts/test-cleanup.sh
#!/bin/bash

source .env.local

curl "http://localhost:3000/api/cron/cleanup-rate-limits" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Production Testing

```bash
# Trigger cleanup manually
curl "https://carzo.net/api/cron/cleanup-rate-limits" \
  -H "Authorization: Bearer production_cron_secret"
```

## Error Handling

### Database Connection Errors

```typescript
try {
  const { data, error } = await supabase.rpc('cleanup_rate_limits');
} catch (error) {
  if (error.code === 'PGRST301') {
    // Function not found (deployment issue)
    console.error('cleanup_rate_limits function not found');
  } else if (error.code === 'PGRST202') {
    // Connection timeout
    console.error('Database connection timeout');
  }

  // Still return success (don't fail cron)
  return NextResponse.json({
    success: false,
    deletedRecords: 0,
    message: error.message,
  });
}
```

### Partial Failures

```typescript
// If deletion fails midway, retry once
try {
  await supabase.rpc('cleanup_rate_limits');
} catch (error) {
  console.error('First attempt failed, retrying...');
  await supabase.rpc('cleanup_rate_limits');
}
```

## Alternative: Automatic PostgreSQL Cleanup

### VACUUM ANALYZE (Weekly)

```sql
-- Automatic maintenance (run weekly)
VACUUM ANALYZE rate_limits;

-- Reclaims space from deleted rows
-- Updates table statistics for query planner
```

**Vercel Cron:**
```json
{
  "crons": [
    {
      "path": "/api/cron/vacuum-rate-limits",
      "schedule": "0 2 * * 0"  // Every Sunday at 2:00 AM
    }
  ]
}
```

### TTL (Time-To-Live) Extension (Future)

```sql
-- PostgreSQL 14+ TTL extension
CREATE EXTENSION pg_cron;

-- Schedule automatic deletion
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *',  -- Every hour
  $$DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '24 hours'$$
);
```

**Benefits:**
- No cron endpoint needed
- Database handles cleanup automatically
- One less API route to maintain

## Testing

### Unit Test

```typescript
// app/api/cron/cleanup-rate-limits/__tests__/route.test.ts
describe('GET /api/cron/cleanup-rate-limits', () => {
  it('should require valid cron secret', async () => {
    const request = new Request('http://localhost/api/cron/cleanup-rate-limits');

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should delete old rate limit records', async () => {
    // Insert old records
    await supabase.from('rate_limits').insert([
      { identifier: 'test', endpoint: 'test', created_at: '2025-01-01' },
    ]);

    // Call cleanup
    const response = await GET(requestWithValidToken);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.deletedRecords).toBeGreaterThan(0);
  });
});
```

### Integration Test

```bash
# Verify old records are deleted
psql $DATABASE_URL -c "SELECT COUNT(*) FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 hour';"
# Should return 0 after cleanup
```

## Related Endpoints

- [POST /api/search-vehicles](./search-vehicles.md) - Uses rate limiting
- [POST /api/filter-options](./filter-options.md) - Uses rate limiting
- [POST /api/track-click](./track-click.md) - Uses rate limiting

## Related Documentation

- [Rate Limiting Strategy](../../explanation/rate-limiting-strategy.md) - PostgreSQL rate limiting
- [Architecture Overview](../../explanation/architecture-overview.md) - Cron jobs in system design
- [Deployment](../../how-to/deploy-to-vercel.md) - Vercel cron setup
