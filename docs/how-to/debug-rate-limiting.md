# How to Debug Rate Limiting

Quick guide to troubleshooting rate limiting issues in Carzo.

## Common Issues

### Issue 1: Rate Limit Triggered Too Easily

**Symptom:** Users getting 429 errors after just a few requests

**Debug:**
```bash
# Check current rate limit records
psql $DATABASE_URL -c "
SELECT identifier, endpoint, window_start, request_count
FROM rate_limits
WHERE identifier = 'user-ip-or-id'
ORDER BY window_start DESC
LIMIT 10;
"
```

**Fix:**
```typescript
// Increase limits in lib/rate-limit.ts
export const RATE_LIMITS = {
  SEARCH_VEHICLES: { limit: 200, windowSeconds: 60 },  // Was 100
};
```

---

### Issue 2: Rate Limits Not Resetting

**Symptom:** Rate limit persists even after window expires

**Debug:**
```bash
# Check for stuck records
psql $DATABASE_URL -c "
SELECT identifier, endpoint, window_start,
       NOW() - window_start AS age
FROM rate_limits
WHERE NOW() - window_start > INTERVAL '1 hour'
ORDER BY window_start;
"
```

**Fix:**
```bash
# Manual cleanup
psql $DATABASE_URL -c "DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '24 hours';"

# Or trigger cleanup cron
curl "https://carzo.net/api/cron/cleanup-rate-limits" \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

### Issue 3: Rate Limit Headers Missing

**Symptom:** `X-RateLimit-*` headers not in API response

**Debug:**
Check endpoint returns headers:
```typescript
return NextResponse.json(data, {
  headers: {
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
  },
});
```

---

### Issue 4: Shared IP Rate Limiting

**Symptom:** Multiple users on same network hit rate limit together

**Debug:**
```bash
# Check how many users share an IP
psql $DATABASE_URL -c "
SELECT identifier, COUNT(DISTINCT user_id) as user_count
FROM clicks
GROUP BY identifier
HAVING COUNT(DISTINCT user_id) > 5;
"
```

**Fix:** Use user ID instead of IP for authenticated users:
```typescript
const identifier = userId || getClientIP(request);
```

---

## Testing Rate Limits

### Test Single Endpoint

```bash
# Send 101 requests (should get 429 on 101st)
for i in {1..101}; do
  curl -w "%{http_code}\n" -o /dev/null -s \
    -X POST http://localhost:3000/api/search-vehicles \
    -H "Content-Type: application/json" \
    -d '{"make":"Toyota"}'
done
```

### Test Burst Protection

```bash
# Send 11 requests in 1 second (should get 429 on 11th)
for i in {1..11}; do
  curl -w "%{http_code}\n" -o /dev/null -s \
    -X POST http://localhost:3000/api/search-vehicles \
    -H "Content-Type: application/json" \
    -d '{"make":"Toyota"}' &
done
wait
```

---

## Monitoring

### Check Rate Limit Table Size

```bash
psql $DATABASE_URL -c "
SELECT pg_size_pretty(pg_total_relation_size('rate_limits')) AS table_size;
"
```

**Expected:** < 100 MB (with hourly cleanup)

### Check Active Rate Limits

```bash
psql $DATABASE_URL -c "
SELECT endpoint, COUNT(*) as active_limits
FROM rate_limits
WHERE window_start > NOW() - INTERVAL '1 hour'
GROUP BY endpoint;
"
```

---

## Related Documentation

- [Rate Limiting Strategy](../explanation/rate-limiting-strategy.md)
- [Add API Endpoint](./add-api-endpoint.md)
