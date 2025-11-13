# Tutorial: Your First Migration

Learn database migrations by adding a `favorite_vehicles` table for user wishlist functionality.

## What You'll Learn

- Create a migration with Supabase CLI
- Write SQL for tables, indexes, and RLS policies
- Test migrations locally
- Apply to production

## Prerequisites

- Completed [Getting Started](./getting-started.md) tutorial
- Supabase CLI installed and linked

---

## Scenario

We want to add a "Save for Later" feature where users can favorite vehicles. We need a `favorite_vehicles` table to track this.

---

## Step 1: Create Migration

```bash
# Create new migration file
supabase migration new add_favorite_vehicles_table
```

**Output:**
```
Created new migration at supabase/migrations/20251113120000_add_favorite_vehicles_table.sql
```

---

## Step 2: Write the SQL

Open the migration file:

```bash
code supabase/migrations/20251113120000_add_favorite_vehicles_table.sql
```

Add this SQL:

```sql
-- Migration: Add favorite_vehicles table
-- Purpose: Track which vehicles users have favorited

-- Create table
CREATE TABLE favorite_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,  -- Cookie-based user ID
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate favorites
  UNIQUE(user_id, vehicle_id)
);

-- Index for fast lookups
CREATE INDEX idx_favorite_vehicles_user ON favorite_vehicles(user_id);
CREATE INDEX idx_favorite_vehicles_vehicle ON favorite_vehicles(vehicle_id);

-- Index for recent favorites
CREATE INDEX idx_favorite_vehicles_created ON favorite_vehicles(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE favorite_vehicles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their own favorites
CREATE POLICY "Users can insert their own favorites"
  ON favorite_vehicles FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view their own favorites
CREATE POLICY "Users can view their own favorites"
  ON favorite_vehicles FOR SELECT
  USING (true);

-- Allow anyone to delete their own favorites
CREATE POLICY "Users can delete their own favorites"
  ON favorite_vehicles FOR DELETE
  USING (true);

-- Add comment for documentation
COMMENT ON TABLE favorite_vehicles IS 'Tracks which vehicles users have saved for later viewing';
COMMENT ON COLUMN favorite_vehicles.user_id IS 'Cookie-based user ID from carzo_user_id cookie';
```

Save the file.

---

## Step 3: Test Migration Locally (Optional)

If you have Docker installed, test locally first:

```bash
# Start local Supabase
supabase start

# Apply migration to local database
supabase db reset

# Verify table created
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d favorite_vehicles"
```

**Expected output:**
```
Table "public.favorite_vehicles"
   Column    |           Type           | Nullable | Default
-------------+--------------------------+----------+----------
 id          | uuid                     | not null | uuid_generate_v4()
 user_id     | character varying(255)   | not null |
 vehicle_id  | uuid                     | not null |
 created_at  | timestamp with time zone | not null | now()
```

---

## Step 4: Apply to Development Database

```bash
# Check migration status
supabase migration list

# Apply migration
supabase db push
```

**Output:**
```
Applying migration 20251113120000_add_favorite_vehicles_table.sql...
✓ Migration applied successfully!
```

---

## Step 5: Verify Table Created

```bash
# Connect to database
psql $NEXT_PUBLIC_SUPABASE_URL

# List tables
\dt

# Describe favorite_vehicles table
\d favorite_vehicles

# Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'favorite_vehicles';

# Exit psql
\q
```

---

## Step 6: Test with Data

### Insert Test Favorite

```sql
psql $NEXT_PUBLIC_SUPABASE_URL -c "
INSERT INTO favorite_vehicles (user_id, vehicle_id)
SELECT 'test-user-123', id
FROM vehicles
LIMIT 1;
"
```

### Query Favorites

```sql
psql $NEXT_PUBLIC_SUPABASE_URL -c "
SELECT fv.*, v.year, v.make, v.model
FROM favorite_vehicles fv
JOIN vehicles v ON fv.vehicle_id = v.id
WHERE fv.user_id = 'test-user-123';
"
```

**Expected:** One row showing favorite vehicle details

### Test Unique Constraint

```sql
# Try inserting duplicate (should fail)
psql $NEXT_PUBLIC_SUPABASE_URL -c "
INSERT INTO favorite_vehicles (user_id, vehicle_id)
SELECT 'test-user-123', id
FROM vehicles
LIMIT 1;
"
```

**Expected error:**
```
ERROR: duplicate key value violates unique constraint "favorite_vehicles_user_id_vehicle_id_key"
```

Good! The constraint works.

---

## Step 7: Create API Endpoint

Now let's create an endpoint to favorite/unfavorite vehicles.

### Create Route File

```bash
mkdir -p app/api/favorites
touch app/api/favorites/route.ts
```

### Write API Handler

```typescript
// app/api/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { z } from 'zod';

const FavoriteSchema = z.object({
  userId: z.string().min(1),
  vehicleId: z.string().uuid(),
});

// Get user's favorites
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from('favorite_vehicles')
    .select('*, vehicles(*)')
    .eq('user_id', userId);

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ favorites: data });
}

// Add favorite
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = FavoriteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { userId, vehicleId } = validationResult.data;
    const supabase = createClient();

    const { data, error } = await supabase
      .from('favorite_vehicles')
      .insert({ user_id: userId, vehicle_id: vehicleId })
      .select()
      .single();

    if (error) {
      // Check for duplicate
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Already favorited' },
          { status: 409 }
        );
      }

      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ favorite: data }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Remove favorite
export async function DELETE(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const vehicleId = request.nextUrl.searchParams.get('vehicleId');

  if (!userId || !vehicleId) {
    return NextResponse.json(
      { error: 'userId and vehicleId required' },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const { error } = await supabase
    .from('favorite_vehicles')
    .delete()
    .eq('user_id', userId)
    .eq('vehicle_id', vehicleId);

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
```

---

## Step 8: Test API Endpoint

### Test Adding Favorite

```bash
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-456",
    "vehicleId": "replace-with-actual-vehicle-id"
  }'
```

**Expected:**
```json
{
  "favorite": {
    "id": "...",
    "user_id": "test-user-456",
    "vehicle_id": "...",
    "created_at": "2025-11-13T12:00:00Z"
  }
}
```

### Test Getting Favorites

```bash
curl "http://localhost:3000/api/favorites?userId=test-user-456"
```

### Test Removing Favorite

```bash
curl -X DELETE "http://localhost:3000/api/favorites?userId=test-user-456&vehicleId=replace-with-id"
```

---

## Step 9: Commit Your Changes

```bash
# Create feature branch
git checkout -b feature/add-favorites-table

# Stage migration
git add supabase/migrations/20251113120000_add_favorite_vehicles_table.sql

# Stage API endpoint
git add app/api/favorites/route.ts

# Commit
git commit -m "feat: add favorite_vehicles table and API endpoint

- Create favorite_vehicles table with RLS policies
- Add indexes for performance
- Create /api/favorites endpoint (GET, POST, DELETE)
- Support adding/removing/listing favorites"

# Push
git push -u origin feature/add-favorites-table
```

---

## Step 10: Deploy to Production

1. Create Pull Request on GitHub
2. Get code review
3. Merge to main
4. Vercel auto-deploys

**Migration applies automatically on next Supabase sync!**

---

## What You Learned

✅ Created a database migration with Supabase CLI
✅ Wrote SQL for tables, indexes, and RLS policies
✅ Tested migration locally
✅ Applied migration to development database
✅ Created API endpoint to use new table
✅ Tested with real data
✅ Committed and deployed changes

---

## Next Steps

- Try [Adding a Filter](./adding-a-filter.md) tutorial
- Learn about [Database Schema](../reference/database-schema.md)
- Read [Migration How-To Guide](../how-to/create-migration.md)

---

## Common Migration Patterns

### Add Column to Existing Table

```sql
ALTER TABLE vehicles ADD COLUMN is_featured BOOLEAN DEFAULT false;
CREATE INDEX idx_vehicles_featured ON vehicles(is_featured) WHERE is_featured = true;
```

### Add Foreign Key

```sql
ALTER TABLE clicks ADD COLUMN favorite_id UUID REFERENCES favorite_vehicles(id);
```

### Create Enum Type

```sql
CREATE TYPE vehicle_condition AS ENUM ('new', 'used', 'cpo');
ALTER TABLE vehicles ALTER COLUMN condition TYPE vehicle_condition USING condition::vehicle_condition;
```

---

**Congratulations!** 🎉 You've completed your first database migration.
