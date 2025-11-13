# API Reference: /api/search-vehicles

## Overview

Search for vehicles using PostGIS spatial queries with optional filters.

**Endpoint:** `POST /api/search-vehicles`

**Authentication:** None (public endpoint)

**Rate Limiting:**
- Per-minute: 100 requests/minute
- Burst: 10 requests/second
- Session: 500 requests/hour

## Request

### Headers

```http
Content-Type: application/json
```

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userLat` | number | Yes | User's latitude (decimal degrees) |
| `userLon` | number | User's longitude (decimal degrees) |
| `make` | string | No | Vehicle make (e.g., "Toyota") |
| `model` | string | No | Vehicle model (e.g., "Camry") |
| `minPrice` | number | No | Minimum price in dollars |
| `maxPrice` | number | No | Maximum price in dollars |
| `condition` | string | No | "new", "used", or "certified" |
| `minYear` | number | No | Minimum year (e.g., 2020) |
| `maxYear` | number | No | Maximum year (e.g., 2024) |
| `minMiles` | number | No | Minimum mileage |
| `maxMiles` | number | No | Maximum mileage |
| `bodyStyle` | string | No | Body style (e.g., "sedan", "suv") |
| `limit` | number | No | Results per page (default: 20, max: 100) |
| `offset` | number | No | Pagination offset (default: 0) |

### Example Request

```bash
curl -X POST https://carzo.net/api/search-vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "userLat": 33.7490,
    "userLon": -84.3880,
    "make": "Toyota",
    "minPrice": 20000,
    "maxPrice": 40000,
    "condition": "used",
    "limit": 20,
    "offset": 0
  }'
```

## Response

### Success Response

**Status Code:** `200 OK`

**Headers:**
```http
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-11-12T10:45:00Z
```

**Body:**

```json
{
  "vehicles": [
    {
      "id": "550e8400-e29b-41d4-a916-446655440000",
      "vin": "1HGBH41JXMN109186",
      "year": 2023,
      "make": "Toyota",
      "model": "Camry",
      "trim": "SE",
      "price": 28500,
      "miles": 12500,
      "condition": "used",
      "bodyStyle": "sedan",
      "exteriorColor": "Silver",
      "interiorColor": "Black",
      "fuelType": "gasoline",
      "transmission": "automatic",
      "drivetrain": "fwd",
      "engine": "2.5L I4",
      "dealer_id": "dealer123",
      "dealer_name": "Atlanta Toyota",
      "dealer_city": "Atlanta",
      "dealer_state": "GA",
      "dealer_zip": "30303",
      "dealer_vdp_url": "https://dealer.com/vdp/VIN123?clickId=...",
      "primary_image_url": "https://lotlinx-photos.s3.amazonaws.com/...",
      "total_photos": 15,
      "distance_miles": 5.2
    }
  ],
  "total": 142,
  "page": 1,
  "perPage": 20,
  "totalPages": 8
}
```

### Error Responses

#### 400 Bad Request

**Missing Required Fields:**
```json
{
  "error": "Missing required fields: userLat, userLon"
}
```

**Invalid Parameters:**
```json
{
  "error": "Invalid latitude: must be between -90 and 90"
}
```

#### 429 Too Many Requests

**Rate Limit Exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": 45
}
```

**Headers:**
```http
Retry-After: 45
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-11-12T10:45:00Z
```

#### 500 Internal Server Error

**Database Error:**
```json
{
  "error": "Database query failed",
  "message": "An unexpected error occurred. Please try again."
}
```

## Implementation Details

### PostGIS Spatial Query

Uses `ST_DWithin()` with GIST spatial index for fast radius searches:

```sql
SELECT
  v.*,
  (ST_Distance(
    v.location,
    ST_SetSRID(ST_MakePoint(-84.3880, 33.7490), 4326)::GEOGRAPHY
  ) / 1609.34)::DECIMAL(8,2) AS distance_miles
FROM vehicles v
WHERE v.is_active = true
  AND ST_DWithin(
    v.location,
    ST_SetSRID(ST_MakePoint(-84.3880, 33.7490), 4326)::GEOGRAPHY,
    v.targeting_radius * 1609.34
  )
  AND (v.make = 'Toyota')
ORDER BY distance_miles ASC
LIMIT 20;
```

**Performance:** ~50-100ms (with spatial index)

### Dealer Diversification

Results are automatically diversified using round-robin algorithm:

```typescript
import { diversifyByDealer } from '@/lib/dealer-diversity';

const diversifiedVehicles = diversifyByDealer(vehicles, limit);
```

**Goal:** 80%+ dealer diversity (16+ unique dealers per 20 vehicles)

### Rate Limiting

Three rate limit checks:
1. Per-minute: 100 requests
2. Burst: 10 requests/second
3. Session: 500 requests/hour

Uses PostgreSQL-based rate limiting (no Redis required).

## Client-Side Usage

### React Hook

```typescript
// hooks/useVehicleSearch.ts
import { useState, useEffect } from 'react';

export function useVehicleSearch(filters: SearchFilters) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVehicles() {
      setLoading(true);

      try {
        const response = await fetch('/api/search-vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userLat: filters.latitude,
            userLon: filters.longitude,
            make: filters.make,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            limit: 20,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setVehicles(data.vehicles);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVehicles();
  }, [filters]);

  return { vehicles, loading, error };
}
```

### Direct Fetch

```typescript
const response = await fetch('/api/search-vehicles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userLat: 33.7490,
    userLon: -84.3880,
    make: 'Toyota',
    limit: 20,
  }),
});

const { vehicles, total } = await response.json();
```

## Validation Rules

### Location Parameters

- `userLat`: -90 to 90 (decimal degrees)
- `userLon`: -180 to 180 (decimal degrees)

### Filter Parameters

- `make`: String, case-insensitive
- `model`: String, case-insensitive
- `minPrice`/`maxPrice`: Positive integers
- `minYear`/`maxYear`: 1990-2030
- `minMiles`/`maxMiles`: Non-negative integers
- `condition`: "new", "used", or "certified"
- `bodyStyle`: Valid body style from enum

### Pagination Parameters

- `limit`: 1-100 (default: 20)
- `offset`: Non-negative integer (default: 0)

## Performance Optimization

### Caching Strategy

**Not cached** - Always fresh results (inventory changes 4x daily)

### Database Indexes

- `idx_vehicles_location_gist` - GIST spatial index
- `idx_vehicles_active_location` - Active vehicles only
- `idx_make` - Make filter
- `idx_search_combo` - Composite index (make, model, body_style)

### Query Optimization

1. Filter by `is_active = true` first (excludes inactive vehicles)
2. Apply spatial filter with `ST_DWithin()` (uses GIST index)
3. Apply additional filters (make, model, price, etc.)
4. Sort by distance (calculated in SELECT)
5. Apply limit/offset for pagination

**Query Plan:**
```
QUERY PLAN
-----------------------------------------------------------
Limit  (cost=1234.56..1234.61 rows=20 width=1024)
  ->  Sort  (cost=1234.56..1235.89 rows=534 width=1024)
        Sort Key: ((st_distance(location, '...') / 1609.34))
        ->  Bitmap Heap Scan on vehicles  (cost=45.23..1223.45 rows=534 width=1024)
              Recheck Cond: (location && '...')
              Filter: (is_active AND st_dwithin(...))
              ->  Bitmap Index Scan on idx_vehicles_location_gist
Planning Time: 0.8 ms
Execution Time: 52.3 ms
```

## Related Endpoints

- [GET /api/filter-options](./filter-options.md) - Get available filter options
- [POST /api/track-impression](./track-impression.md) - Track vehicle impression
- [POST /api/track-click](./track-click.md) - Track dealer click

## Related Documentation

- [PostGIS Spatial Queries](../../explanation/postgis-spatial-queries.md) - Performance deep dive
- [Dealer Diversification](../../explanation/dealer-diversification.md) - Algorithm explanation
- [Rate Limiting Strategy](../../explanation/rate-limiting-strategy.md) - PostgreSQL rate limiting
