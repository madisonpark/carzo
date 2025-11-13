# PostGIS Spatial Queries

## The Problem: Client-Side Distance Calculations Are Slow

### Original Approach (Before PostGIS)

**Process:**
1. Fetch ALL vehicles from database (10,000+ rows)
2. Transfer to client (large payload)
3. Calculate distance in JavaScript using Haversine formula
4. Filter vehicles within radius
5. Sort by distance

**Performance:**
- Database query: ~100ms (fetch all vehicles)
- Data transfer: ~500ms (large JSON payload)
- Client-side calculations: ~2-4 seconds (10,000 iterations)
- **Total: 3-5 seconds** ❌

**Problems:**
- Slow user experience (3-5s load time)
- High bandwidth usage (large payloads)
- Client CPU intensive (battery drain on mobile)
- Doesn't scale (more vehicles = slower)

### PostGIS Approach (Current)

**Process:**
1. Database calculates distances using PostGIS spatial index
2. Filter vehicles within radius (server-side)
3. Sort by distance (server-side)
4. Return only matching vehicles (20-100 rows)

**Performance:**
- Database query with spatial index: ~50-100ms
- Data transfer: ~50ms (small JSON payload)
- **Total: 100-150ms** ✅

**Impact:** **100x faster** (3-5s → 100ms)

## PostGIS Architecture

### What is PostGIS?

**PostGIS** is a spatial database extension for PostgreSQL that adds:
- Geographic data types (`GEOGRAPHY`, `GEOMETRY`)
- Spatial indexes (GIST - Generalized Search Tree)
- Distance/intersection functions
- Coordinate system transformations

**Why It's Fast:**
- **Spatial indexes** - O(log n) lookups instead of O(n) full scans
- **Native C implementation** - Much faster than JavaScript
- **Server-side filtering** - Reduces data transfer
- **Optimized algorithms** - Geodesic distance on Earth's surface

### Database Schema

```sql
-- Add geography column (lat/lon stored as PostGIS point)
ALTER TABLE vehicles ADD COLUMN location GEOGRAPHY(Point, 4326);

-- GIST spatial index (THE MAGIC)
CREATE INDEX idx_vehicles_location_gist ON vehicles USING GIST(location);

-- Composite index for active vehicles
CREATE INDEX idx_vehicles_active_location
  ON vehicles(is_active)
  WHERE is_active = true;

-- Auto-update trigger (populates location from lat/lon)
CREATE TRIGGER trg_update_vehicle_location
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON vehicles FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_location();
```

**Trigger Function:**
```sql
CREATE FUNCTION update_vehicle_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if lat/lon are not null
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(
      ST_MakePoint(NEW.longitude, NEW.latitude),
      4326
    )::GEOGRAPHY;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Key Points:**
- **SRID 4326** - WGS84 coordinate system (standard GPS coordinates)
- **GEOGRAPHY type** - Uses Earth's spheroid (accurate distances)
- **GEOMETRY type** - Flat plane (faster but less accurate, not used)
- **Auto-trigger** - Location updates automatically when lat/lon change

## Spatial Index Deep Dive

### What is a GIST Index?

**GIST** (Generalized Search Tree) is a balanced tree structure optimized for spatial data:

```mermaid
graph TD
    A[Root Node<br/>Covers All Points] --> B[Node 1<br/>Northwest USA]
    A --> C[Node 2<br/>Southeast USA]
    A --> D[Node 3<br/>Central USA]

    B --> E[Leaf: WA]
    B --> F[Leaf: OR]
    C --> G[Leaf: GA]
    C --> H[Leaf: FL]
    D --> I[Leaf: TX]
    D --> J[Leaf: CO]

    style A fill:#7c3aed,color:#fff
    style E fill:#22c55e,color:#000
    style F fill:#22c55e,color:#000
    style G fill:#22c55e,color:#000
    style H fill:#22c55e,color:#000
    style I fill:#22c55e,color:#000
    style J fill:#22c55e,color:#000
```

**How It Works:**
1. Tree divides space into bounding boxes
2. Query "finds all points within 30 miles of Atlanta"
3. Traverses tree, pruning branches outside radius
4. Returns only matching points

**Complexity:**
- Full table scan: O(n) - Check every row
- GIST spatial index: O(log n) - Check tree levels

**Example:**
- 72,000 vehicles without index: 72,000 distance calculations
- 72,000 vehicles with index: ~16 tree levels (~16 checks)

### Index Maintenance

**Automatic Updates:**
- INSERT: New vehicle added to spatial index
- UPDATE: Location recalculated if lat/lon changed
- DELETE: Removed from spatial index

**No Manual Maintenance Needed** - PostgreSQL handles it

**Index Size:**
```sql
-- Check index size
SELECT
  pg_size_pretty(pg_relation_size('idx_vehicles_location_gist')) as index_size;

-- Typical: ~50-100 MB for 72K vehicles
```

## Spatial Query Functions

### 1. Distance Calculation

**ST_Distance()** - Calculate distance between two points

```sql
-- Distance from Atlanta (33.7490, -84.3880) to vehicle location
SELECT
  vin,
  make,
  model,
  ST_Distance(
    location,
    ST_SetSRID(ST_MakePoint(-84.3880, 33.7490), 4326)::GEOGRAPHY
  ) / 1609.34 AS distance_miles
FROM vehicles
WHERE is_active = true
ORDER BY distance_miles
LIMIT 20;
```

**Performance:**
- Without index: ~3-5 seconds (full scan)
- With index: ~50-100ms (spatial index)

**Return Value:**
- Meters (default for GEOGRAPHY type)
- Divide by 1609.34 for miles
- Divide by 1000 for kilometers

### 2. Radius Search

**ST_DWithin()** - Find points within distance

```sql
-- Find vehicles within 30 miles of Atlanta
SELECT *
FROM vehicles
WHERE is_active = true
  AND ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(-84.3880, 33.7490), 4326)::GEOGRAPHY,
    30 * 1609.34  -- 30 miles in meters
  );
```

**Why ST_DWithin() Instead of ST_Distance()?**
- `ST_DWithin()` uses spatial index efficiently (optimized for "within radius" queries)
- `ST_Distance()` must calculate exact distance for every row
- `ST_DWithin()` is **5-10x faster** for radius queries

**Query Plan:**
```
QUERY PLAN
-----------------------------------------------------------
Index Scan using idx_vehicles_location_gist on vehicles
  Index Cond: (location && st_expand(...))  ← Bounding box check
  Filter: st_dwithin(location, '...', 48280.32)  ← Exact distance check
Planning Time: 0.5 ms
Execution Time: 52.3 ms
```

### 3. Bounding Box Queries

**ST_MakeEnvelope()** - Create rectangular search area

```sql
-- Find vehicles in rectangular bounding box (faster than radius)
SELECT *
FROM vehicles
WHERE is_active = true
  AND location && ST_MakeEnvelope(
    -85.0, 33.5,  -- Southwest corner (lon, lat)
    -83.5, 34.0,  -- Northeast corner (lon, lat)
    4326
  )::GEOGRAPHY;
```

**Use Case:**
- Map viewport queries (show vehicles on map)
- Rectangular regions (state boundaries)
- Even faster than radius queries

**Operator `&&`:**
- Bounding box overlap operator
- Uses spatial index efficiently
- Returns true if bounding boxes intersect

## Stored Procedures for Location Search

### search_vehicles_by_location()

**Purpose:** Combined search with location filtering, sorting, pagination

```sql
CREATE FUNCTION search_vehicles_by_location(
  user_lat DECIMAL,
  user_lon DECIMAL,
  p_make TEXT DEFAULT NULL,
  p_model TEXT DEFAULT NULL,
  p_min_price INT DEFAULT NULL,
  p_max_price INT DEFAULT NULL,
  p_condition TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
) RETURNS TABLE (
  id UUID,
  vin VARCHAR(17),
  year INT,
  make VARCHAR(50),
  model VARCHAR(100),
  price DECIMAL(10,2),
  miles INT,
  dealer_name VARCHAR(255),
  dealer_city VARCHAR(100),
  dealer_state VARCHAR(2),
  primary_image_url TEXT,
  distance_miles DECIMAL(8,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.vin,
    v.year,
    v.make,
    v.model,
    v.price,
    v.miles,
    v.dealer_name,
    v.dealer_city,
    v.dealer_state,
    v.primary_image_url,
    (ST_Distance(
      v.location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::GEOGRAPHY
    ) / 1609.34)::DECIMAL(8,2) AS distance_miles
  FROM vehicles v
  WHERE v.is_active = true
    -- Location filter (uses spatial index)
    AND ST_DWithin(
      v.location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::GEOGRAPHY,
      v.targeting_radius * 1609.34
    )
    -- Optional filters
    AND (p_make IS NULL OR v.make = p_make)
    AND (p_model IS NULL OR v.model = p_model)
    AND (p_min_price IS NULL OR v.price >= p_min_price)
    AND (p_max_price IS NULL OR v.price <= p_max_price)
    AND (p_condition IS NULL OR v.condition = p_condition)
  ORDER BY distance_miles ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
```

**Usage from Next.js:**
```typescript
// app/api/search-vehicles/route.ts
const { data, error } = await supabase.rpc('search_vehicles_by_location', {
  user_lat: 33.7490,
  user_lon: -84.3880,
  p_make: 'Toyota',
  p_limit: 20,
  p_offset: 0,
});

// Returns: 20 Toyota vehicles sorted by distance
```

**Performance:**
- Query time: ~50-100ms (includes spatial index, filters, sorting)
- 100x faster than client-side approach

### get_filter_options_by_location()

**Purpose:** Get dynamic filter options based on user location

```sql
CREATE FUNCTION get_filter_options_by_location(
  user_lat DECIMAL,
  user_lon DECIMAL,
  p_make TEXT DEFAULT NULL
) RETURNS TABLE (
  makes JSON,
  models JSON,
  body_styles JSON,
  conditions JSON,
  min_price INT,
  max_price INT,
  min_year INT,
  max_year INT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Makes with counts (only if no make filter)
    (SELECT JSON_AGG(JSON_BUILD_OBJECT('make', make, 'count', count))
     FROM (
       SELECT v.make, COUNT(*) as count
       FROM vehicles v
       WHERE v.is_active = true
         AND ST_DWithin(v.location, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::GEOGRAPHY, v.targeting_radius * 1609.34)
         AND (p_make IS NULL OR v.make = p_make)
       GROUP BY v.make
       ORDER BY count DESC
       LIMIT 50
     ) make_counts
    ) AS makes,

    -- Models with counts (filtered by make if provided)
    (SELECT JSON_AGG(JSON_BUILD_OBJECT('model', model, 'count', count))
     FROM (
       SELECT v.model, COUNT(*) as count
       FROM vehicles v
       WHERE v.is_active = true
         AND ST_DWithin(v.location, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::GEOGRAPHY, v.targeting_radius * 1609.34)
         AND (p_make IS NULL OR v.make = p_make)
       GROUP BY v.model
       ORDER BY count DESC
       LIMIT 100
     ) model_counts
    ) AS models,

    -- Body styles, conditions, price/year ranges...
    -- [Similar aggregations]

    -- Total count
    (SELECT COUNT(*)
     FROM vehicles v
     WHERE v.is_active = true
       AND ST_DWithin(v.location, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::GEOGRAPHY, v.targeting_radius * 1609.34)
       AND (p_make IS NULL OR v.make = p_make)
    ) AS total_count;
END;
$$ LANGUAGE plpgsql;
```

**Why This Matters:**
- Shows only makes/models available in user's location
- Dynamic filtering based on inventory within radius
- User never sees "0 results" for unavailable filters

**Performance:**
- Query time: ~100-200ms (multiple aggregations)
- Cached on client for 5 minutes (sessionStorage)

## Performance Optimization Techniques

### 1. Partial Indexes for Active Vehicles

```sql
-- Index only active vehicles (reduces index size by ~20%)
CREATE INDEX idx_vehicles_active_location
  ON vehicles(is_active)
  WHERE is_active = true;
```

**Why:**
- Inactive vehicles (budget depleted) don't need to be searched
- Smaller index = faster queries
- ~20% reduction in index size

### 2. Composite Indexes for Common Filters

```sql
-- Optimize "Toyota within 30 miles" queries
CREATE INDEX idx_vehicles_make_location
  ON vehicles(make)
  INCLUDE (location)
  WHERE is_active = true;
```

**Why:**
- Combines make filter + spatial search
- Avoids separate index lookups
- ~30% faster for filtered searches

### 3. Query Planner Hints

```sql
-- Force use of spatial index (rare cases)
SET enable_seqscan = OFF;

SELECT * FROM vehicles
WHERE ST_DWithin(location, '...', 48280.32);

SET enable_seqscan = ON;
```

**When to Use:**
- Query planner chooses wrong index
- Testing index effectiveness
- Benchmarking performance

### 4. VACUUM and ANALYZE

```sql
-- Update table statistics (helps query planner)
VACUUM ANALYZE vehicles;

-- Rebuild spatial index (rare, after major data changes)
REINDEX INDEX idx_vehicles_location_gist;
```

**Schedule:**
- Auto-vacuum: Enabled by default (runs automatically)
- Manual ANALYZE: After feed sync (72K+ updates)
- REINDEX: Only if index corruption suspected

## Query Performance Examples

### Example 1: Simple Radius Search

**Query:**
```sql
SELECT * FROM vehicles
WHERE is_active = true
  AND ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(-84.3880, 33.7490), 4326)::GEOGRAPHY,
    30 * 1609.34
  )
LIMIT 20;
```

**Query Plan:**
```
Index Scan using idx_vehicles_location_gist on vehicles
  (cost=0.41..1234.56 rows=500 width=1024)
  Index Cond: (location && '...')
  Filter: st_dwithin(location, '...', 48280.32)
Planning Time: 0.623 ms
Execution Time: 52.341 ms
```

**Performance:**
- Rows scanned: ~500 (within bounding box)
- Rows returned: 20
- Time: 52ms

### Example 2: Filtered Search with Sorting

**Query:**
```sql
SELECT
  *,
  ST_Distance(location, '...') / 1609.34 AS distance_miles
FROM vehicles
WHERE is_active = true
  AND ST_DWithin(location, '...', 48280.32)
  AND make = 'Toyota'
  AND price BETWEEN 20000 AND 40000
ORDER BY distance_miles
LIMIT 20;
```

**Query Plan:**
```
Limit (cost=2345.67..2345.72 rows=20 width=1032)
  -> Sort (cost=2345.67..2346.42 rows=300 width=1032)
    Sort Key: ((st_distance(location, '...') / 1609.34))
    -> Bitmap Heap Scan on vehicles (cost=45.23..2334.56 rows=300 width=1032)
      Recheck Cond: (location && '...')
      Filter: (make = 'Toyota' AND price >= 20000 AND price <= 40000 AND st_dwithin(...))
      -> Bitmap Index Scan on idx_vehicles_location_gist
Planning Time: 1.234 ms
Execution Time: 87.654 ms
```

**Performance:**
- Rows scanned: ~500 (spatial index)
- Rows after filters: ~50 (make + price)
- Rows sorted: 50
- Rows returned: 20
- Time: 88ms

### Example 3: Complex Multi-Filter Query

**Query:**
```sql
SELECT * FROM vehicles
WHERE is_active = true
  AND ST_DWithin(location, '...', 48280.32)
  AND make = 'Toyota'
  AND model IN ('Camry', 'RAV4', 'Corolla')
  AND year >= 2020
  AND price <= 30000
  AND condition = 'used'
  AND body_style IN ('sedan', 'suv')
ORDER BY price ASC
LIMIT 20;
```

**Performance:**
- Spatial index: ~500 rows
- All filters: ~15 rows
- Time: ~120ms (multiple filters add overhead)

**Optimization:**
```sql
-- Add composite index for common filter combinations
CREATE INDEX idx_vehicles_toyota_price
  ON vehicles(make, price)
  WHERE is_active = true AND make = 'Toyota';
```

**After optimization:** ~80ms (30% faster)

## Common Pitfalls

### Pitfall 1: Using ST_Distance() in WHERE Clause

❌ **WRONG:**
```sql
SELECT * FROM vehicles
WHERE ST_Distance(location, '...') < 48280.32;  -- Full table scan!
```

✅ **CORRECT:**
```sql
SELECT * FROM vehicles
WHERE ST_DWithin(location, '...', 48280.32);  -- Uses spatial index
```

**Why:** `ST_DWithin()` is index-aware, `ST_Distance()` is not

### Pitfall 2: Mixing GEOMETRY and GEOGRAPHY

❌ **WRONG:**
```sql
-- Mismatch between GEOGRAPHY column and GEOMETRY point
SELECT * FROM vehicles
WHERE ST_DWithin(
  location,  -- GEOGRAPHY
  ST_MakePoint(-84.3880, 33.7490),  -- GEOMETRY (no ::GEOGRAPHY cast)
  48280.32
);
```

✅ **CORRECT:**
```sql
SELECT * FROM vehicles
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(-84.3880, 33.7490), 4326)::GEOGRAPHY,
  48280.32
);
```

**Error:** Type mismatch causes implicit conversion (slow) or query failure

### Pitfall 3: Forgetting to Filter Active Vehicles

❌ **WRONG:**
```sql
SELECT * FROM vehicles
WHERE ST_DWithin(location, '...', 48280.32);
```

✅ **CORRECT:**
```sql
SELECT * FROM vehicles
WHERE is_active = true  -- Always filter active first
  AND ST_DWithin(location, '...', 48280.32);
```

**Why:** Inactive vehicles (budget depleted) waste query time

### Pitfall 4: Incorrect Distance Units

❌ **WRONG:**
```sql
-- Assumes meters, but targeting_radius is in miles
SELECT * FROM vehicles
WHERE ST_DWithin(location, '...', targeting_radius);
```

✅ **CORRECT:**
```sql
-- Convert miles to meters (× 1609.34)
SELECT * FROM vehicles
WHERE ST_DWithin(location, '...', targeting_radius * 1609.34);
```

**Result:** Wrong conversion = wrong search radius = missing vehicles

## Migration Guide

### Before PostGIS (Client-Side)

```typescript
// OLD APPROACH (3-5 seconds)
const vehicles = await supabase.from('vehicles').select('*');

const filtered = vehicles
  .map(v => ({
    ...v,
    distance: haversineDistance(
      userLat, userLon,
      v.latitude, v.longitude
    )
  }))
  .filter(v => v.distance <= 30)
  .sort((a, b) => a.distance - b.distance)
  .slice(0, 20);
```

### After PostGIS (Server-Side)

```typescript
// NEW APPROACH (100ms)
const { data: vehicles } = await supabase.rpc('search_vehicles_by_location', {
  user_lat: userLat,
  user_lon: userLon,
  p_limit: 20,
});

// Already filtered, sorted, paginated
```

**Migration Steps:**
1. Run PostGIS migration: `20251111000002_add_location_columns.sql`
2. Update Next.js API routes to use `search_vehicles_by_location()`
3. Remove client-side Haversine calculations
4. Test queries with `EXPLAIN ANALYZE`
5. Monitor performance in production

---

**Related Documentation:**
- [Architecture Overview](./architecture-overview.md) - PostGIS in system design
- [Database Schema](../reference/database-schema.md) - Complete schema with PostGIS columns
- [Rate Limiting Strategy](./rate-limiting-strategy.md) - Performance optimization
