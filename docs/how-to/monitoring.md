# How to Monitor Carzo in Production

Guide for monitoring application health, performance, and revenue metrics.

## Vercel Logs

### Access Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select Carzo project
3. Click **Logs** tab

### Filter Logs

```
# By function
/api/cron/sync-feed

# By status code
status:500

# By time range
Last 1 hour, Last 24 hours, Last 7 days
```

### Common Log Patterns

**Successful cron:**
```
2025-11-12 03:00:01 - Feed sync started
2025-11-12 03:02:31 - Feed sync completed (72,051 vehicles)
```

**Error pattern:**
```
2025-11-12 10:15:23 - ERROR: Database connection failed
2025-11-12 10:15:23 - Stack trace: ...
```

---

## Database Monitoring

### Check Active Connections

```bash
psql $DATABASE_URL -c "
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE datname = current_database();
"
```

**Alert if > 80** (Supabase free tier limit: 100)

### Check Table Sizes

```bash
psql $DATABASE_URL -c "
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(table_name::regclass)) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_name::regclass) DESC;
"
```

### Check Slow Queries

```bash
psql $DATABASE_URL -c "
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- > 1 second
ORDER BY mean_exec_time DESC
LIMIT 10;
"
```

---

## Revenue Monitoring

### Daily Revenue Query

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE is_billable = true) as billable_clicks,
  COUNT(*) FILTER (WHERE is_billable = false) as wasted_clicks,
  (COUNT(*) FILTER (WHERE is_billable = true) * 0.80) as revenue
FROM clicks
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Dealer Diversity Score

```sql
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT dealer_id)::FLOAT / NULLIF(COUNT(*), 0) * 100 as diversity_percent
FROM clicks
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at);
```

**Target: > 80%**

### CTR by Flow

```sql
SELECT
  i.flow,
  COUNT(DISTINCT i.id) as impressions,
  COUNT(DISTINCT c.id) as clicks,
  (COUNT(DISTINCT c.id)::FLOAT / NULLIF(COUNT(DISTINCT i.id), 0) * 100) as ctr_percent
FROM impressions i
LEFT JOIN clicks c ON i.vehicle_id = c.vehicle_id AND i.flow = c.flow
WHERE i.created_at >= NOW() - INTERVAL '7 days'
GROUP BY i.flow;
```

**Target VDP CTR: > 40%**

---

## Cron Job Monitoring

### Check Last Sync Time

```sql
SELECT sync_timestamp, status, vehicles_added, vehicles_updated, total_vehicles
FROM feed_sync_logs
ORDER BY sync_timestamp DESC
LIMIT 5;
```

### Alert if No Sync in 8 Hours

```sql
SELECT
  NOW() - MAX(sync_timestamp) as hours_since_last_sync
FROM feed_sync_logs
WHERE status = 'success';
```

**Alert if > 8 hours**

---

## Error Tracking (Future)

### Sentry Integration

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

---

## Performance Monitoring

### Core Web Vitals

Check in Vercel Analytics:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### API Response Times

```bash
# Monitor /api/search-vehicles
curl -w "@curl-format.txt" -o /dev/null -s \
  -X POST https://carzo.net/api/search-vehicles \
  -H "Content-Type: application/json" \
  -d '{"make":"Toyota"}'
```

**curl-format.txt:**
```
time_total: %{time_total}s
time_starttransfer: %{time_starttransfer}s
```

**Target: < 500ms**

---

## Alerts (TODO)

### Slack Webhook Setup

```typescript
// lib/alerts.ts
export async function sendSlackAlert(message: string, severity: 'info' | 'warning' | 'error') {
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `[${severity.toUpperCase()}] ${message}`,
      channel: '#carzo-alerts',
    }),
  });
}
```

### Alert Conditions

- Feed sync fails 2x in a row
- Rate limit cleanup fails
- Database connections > 80
- Revenue drops > 20% day-over-day
- No clicks in last hour

---

## Daily Checklist

- [ ] Check Vercel logs for errors
- [ ] Verify cron jobs ran successfully
- [ ] Review revenue metrics (billable clicks, diversity score)
- [ ] Check database table sizes
- [ ] Monitor API response times
- [ ] Review A/B test flow performance

---

## Related Documentation

- [Vercel Configuration](../reference/vercel-config.md)
- [Database Schema](../reference/database-schema.md)
- [Troubleshooting](./troubleshooting.md)
