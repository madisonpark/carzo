# How to Update Feed Sync Logic

Guide for modifying LotLinx feed synchronization when feed format changes or new fields are added.

## Prerequisites

- Understanding of [Feed Sync API](../reference/api/sync-feed.md)
- Access to LotLinx feed documentation
- `adm-zip` package for handling zip files (replaces system unzip)

## Step 1: Test Feed Locally

Download and inspect current feed using the provided test script or manual cURL (requires POST with auth):

```bash
# Download feed manually (using cURL)
curl -X POST https://feed.lotlinx.com/ \
  -d "username=$LOTLINX_FEED_USERNAME" \
  -d "password=$LOTLINX_FEED_PASSWORD" \
  -o feed.zip

# Extract and view (if you have unzip installed)
unzip feed.zip
# The filename may vary, but is often 'master.tsv' or similar
head -n 20 master.tsv
```

Alternatively, use the script:
```bash
npx tsx scripts/sync-feed.ts
```

## Step 2: Update Field Mapping

Edit `lib/feed-sync.ts`:

```typescript
// lib/feed-sync.ts

interface LotLinxVehicle {
  // ... existing fields
  NewField: string; // Add new field from feed (capitalized in TSV)
}

// Map to DB
private mapVehicleToDb(vehicle: LotLinxVehicle): DbVehicle {
  return {
    // ...
    new_field: vehicle.NewField || null,
  };
}
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
# Run full sync (updates local DB)
npx tsx scripts/sync-feed.ts

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
git push origin feature/your-branch
```

## Step 7: Verify Production

```bash
# Trigger manual sync via cron endpoint
curl "https://carzo.net/api/cron/sync-feed" \
  -H "Authorization: Bearer $CRON_SECRET"

# Check logs in Vercel dashboard
```

## Troubleshooting

### Feed Format Changed

If TSV column order changes (should not affect csv-parse with headers, but check mapping):

```typescript
// Add logging to inspect raw row
console.log('First vehicle:', vehicles[0]);
```

### Zip Extraction Failed

The system now uses `adm-zip` instead of system commands. If extraction fails:
1. Check `temp/` directory permissions
2. Verify downloaded file is a valid ZIP (starts with PK header)
3. Ensure `adm-zip` is installed: `npm install adm-zip`

## Related Documentation

- [Feed Sync API](../reference/api/sync-feed.md)
- [Create Migration](./create-migration.md)
- [CLI Scripts](../reference/cli-scripts.md)
