# How to Update Feed Sync Logic

Guide for modifying LotLinx feed synchronization when feed format changes or new fields are added.

## Prerequisites

- Understanding of [Feed Sync API](../reference/api/sync-feed.md)
- Access to LotLinx feed documentation

## Step 1: Test Feed Locally

Download and inspect current feed:

```bash
# Download feed manually
curl -u "$LOTLINX_FEED_USERNAME:$LOTLINX_FEED_PASSWORD" \
  "https://feed.lotlinx.com/download?publisher_id=$LOTLINX_PUBLISHER_ID" \
  -o feed.zip

# Extract and view
unzip feed.zip
head -n 20 vehicles.tsv
```

## Step 2: Update Field Mapping

Edit `lib/feed-sync.ts`:

```typescript
// lib/feed-sync.ts

// Old mapping
const vehicle = {
  vin: row[0],
  year: parseInt(row[1]),
  make: row[2],
  // ...
};

// New mapping (if LotLinx adds field at index 34)
const vehicle = {
  vin: row[0],
  year: parseInt(row[1]),
  make: row[2],
  // ... existing fields ...
  new_field: row[34],  // Add new field
};
```

## Step 3: Update Database Schema

If new field requires database column:

```bash
# Create migration
supabase migration new add_new_field_to_vehicles

# Edit migration file
```

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_new_field_to_vehicles.sql
ALTER TABLE vehicles ADD COLUMN new_field VARCHAR(100);
CREATE INDEX idx_vehicles_new_field ON vehicles(new_field);
```

```bash
# Apply migration
supabase db push
```

## Step 4: Test Sync Locally

```bash
# Test with small sample
npx tsx scripts/test-feed-sync.ts --limit 100

# Check results
psql $DATABASE_URL -c "SELECT vin, new_field FROM vehicles LIMIT 10;"
```

## Step 5: Update TypeScript Types

```typescript
// types/api.ts
export interface Vehicle {
  // ... existing fields
  new_field?: string;  // Add new field
}
```

## Step 6: Deploy

```bash
# Commit changes
git add lib/feed-sync.ts supabase/migrations/
git commit -m "feat: add new_field to feed sync"

# Push and deploy
git push origin main
```

## Step 7: Verify Production

```bash
# Trigger manual sync
curl "https://carzo.net/api/cron/sync-feed" \
  -H "Authorization: Bearer $CRON_SECRET"

# Check logs in Vercel dashboard
```

## Troubleshooting

### Feed Format Changed

If TSV column order changes:

```typescript
// Add logging to identify correct indexes
console.log('First row:', rows[0]);
console.log('VIN (should be 17 chars):', row[0]);
```

### Missing Fields

Handle optional fields:

```typescript
const vehicle = {
  new_field: row[34] || null,  // Default to null if missing
};
```

## Related Documentation

- [Feed Sync API](../reference/api/sync-feed.md)
- [Create Migration](./create-migration.md)
- [CLI Scripts](../reference/cli-scripts.md)
