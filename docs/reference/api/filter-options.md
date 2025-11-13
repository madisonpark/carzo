# API Reference: /api/filter-options

## Overview

Get dynamic filter options based on available vehicles within user's location radius.

**Endpoint:** `POST /api/filter-options`

**Authentication:** None (public endpoint)

**Rate Limiting:**
- Per-minute: 50 requests/minute
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
| `userLon` | number | Yes | User's longitude (decimal degrees) |
| `make` | string | No | Filter models by make |

### Example Request

```bash
curl -X POST https://carzo.net/api/filter-options \
  -H "Content-Type: application/json" \
  -d '{
    "userLat": 33.7490,
    "userLon": -84.3880,
    "make": "Toyota"
  }'
```

## Response

### Success Response

**Status Code:** `200 OK`

**Headers:**
```http
Content-Type: application/json
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 48
X-RateLimit-Reset: 2025-11-12T10:45:00Z
```

**Body:**

```json
{
  "makes": [
    { "make": "Toyota", "count": 1247 },
    { "make": "Honda", "count": 892 },
    { "make": "Ford", "count": 734 },
    { "make": "Chevrolet", "count": 651 },
    { "make": "Nissan", "count": 543 }
  ],
  "models": [
    { "model": "Camry", "count": 234 },
    { "model": "RAV4", "count": 189 },
    { "model": "Corolla", "count": 176 },
    { "model": "Highlander", "count": 142 },
    { "model": "Tacoma", "count": 128 }
  ],
  "bodyStyles": [
    { "bodyStyle": "sedan", "count": 456 },
    { "bodyStyle": "suv", "count": 398 },
    { "bodyStyle": "truck", "count": 245 },
    { "bodyStyle": "coupe", "count": 87 },
    { "bodyStyle": "hatchback", "count": 61 }
  ],
  "conditions": [
    { "condition": "used", "count": 1089 },
    { "condition": "new", "count": 123 },
    { "condition": "certified", "count": 35 }
  ],
  "priceRange": {
    "min": 5995,
    "max": 89950
  },
  "yearRange": {
    "min": 2015,
    "max": 2025
  },
  "mileageRange": {
    "min": 0,
    "max": 125000
  },
  "totalCount": 1247
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `makes` | array | Available makes with vehicle counts (sorted by count DESC) |
| `models` | array | Available models with vehicle counts (filtered by make if provided) |
| `bodyStyles` | array | Available body styles with counts |
| `conditions` | array | Available conditions with counts |
| `priceRange` | object | Min/max price in dollars |
| `yearRange` | object | Min/max year |
| `mileageRange` | object | Min/max mileage |
| `totalCount` | number | Total vehicles matching filters |

### Error Responses

#### 400 Bad Request

**Missing Required Fields:**
```json
{
  "error": "Missing required fields: userLat, userLon"
}
```

#### 429 Too Many Requests

**Rate Limit Exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": 60
}
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

### PostGIS Spatial Filtering

Filter options only include vehicles within user's location radius:

```sql
SELECT
  JSON_AGG(JSON_BUILD_OBJECT('make', make, 'count', count)) as makes
FROM (
  SELECT v.make, COUNT(*) as count
  FROM vehicles v
  WHERE v.is_active = true
    AND ST_DWithin(
      v.location,
      ST_SetSRID(ST_MakePoint(-84.3880, 33.7490), 4326)::GEOGRAPHY,
      v.targeting_radius * 1609.34
    )
  GROUP BY v.make
  ORDER BY count DESC
  LIMIT 50
) make_counts;
```

**Why This Matters:**
- User never sees makes/models unavailable in their area
- Prevents "0 results" searches
- Dynamic filtering based on inventory

### Conditional Model Filtering

If `make` parameter provided, models are filtered to that make:

```sql
SELECT v.model, COUNT(*) as count
FROM vehicles v
WHERE v.is_active = true
  AND ST_DWithin(v.location, '...', v.targeting_radius * 1609.34)
  AND v.make = 'Toyota'  -- Only if make filter provided
GROUP BY v.model
ORDER BY count DESC
LIMIT 100;
```

### Database Function

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
  min_miles INT,
  max_miles INT,
  total_count BIGINT
);
```

**Performance:** ~100-200ms (multiple aggregations)

## Client-Side Usage

### React Hook

```typescript
// hooks/useFilterOptions.ts
import { useState, useEffect } from 'react';

export function useFilterOptions(
  latitude: number,
  longitude: number,
  make?: string
) {
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchOptions() {
      setLoading(true);

      const response = await fetch('/api/filter-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userLat: latitude,
          userLon: longitude,
          make,
        }),
      });

      const data = await response.json();
      setOptions(data);
      setLoading(false);
    }

    fetchOptions();
  }, [latitude, longitude, make]);

  return { options, loading };
}
```

### Usage in Component

```typescript
// components/Search/FilterSidebar.tsx
'use client';

import { useFilterOptions } from '@/hooks/useFilterOptions';

export default function FilterSidebar({ latitude, longitude }) {
  const { options, loading } = useFilterOptions(latitude, longitude);

  if (loading) return <div>Loading filters...</div>;

  return (
    <div>
      <select>
        <option value="">All Makes</option>
        {options?.makes.map(({ make, count }) => (
          <option key={make} value={make}>
            {make} ({count})
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Caching Strategy

**Client-Side Cache:** 5 minutes in sessionStorage

```typescript
const cacheKey = `filter-options:${latitude},${longitude}:${make || 'all'}`;
const cached = sessionStorage.getItem(cacheKey);

if (cached) {
  const { data, timestamp } = JSON.parse(cached);
  const age = Date.now() - timestamp;

  // Use cache if < 5 minutes old
  if (age < 5 * 60 * 1000) {
    return data;
  }
}

// Fetch fresh data
const data = await fetchFilterOptions();

// Cache for 5 minutes
sessionStorage.setItem(cacheKey, JSON.stringify({
  data,
  timestamp: Date.now(),
}));
```

**Why 5 Minutes?**
- Inventory changes 4x daily (every 6 hours)
- Filter options stable between feed syncs
- Reduces server load (50 req/min limit)

## Use Cases

### Use Case 1: Initial Page Load

User lands on search page → Fetch all filter options without make filter

```typescript
// Show all available makes, models, body styles in user's area
const options = await fetchFilterOptions(userLat, userLon);
```

### Use Case 2: Make Filter Selected

User selects "Toyota" → Fetch filter options WITH make filter

```typescript
// Show only Toyota models available in user's area
const options = await fetchFilterOptions(userLat, userLon, 'Toyota');
```

**Result:**
- `makes` unchanged (still shows all makes for switching)
- `models` filtered to Toyota models only
- `bodyStyles`, `conditions`, `priceRange`, etc. filtered to Toyota vehicles

### Use Case 3: Location Change

User changes zip code → Fetch new filter options for new location

```typescript
// User enters new zip code
const { latitude, longitude } = await lookupZipCode('30303');

// Fetch filter options for new location
const options = await fetchFilterOptions(latitude, longitude);
```

## Performance Considerations

### Query Optimization

**Indexes Used:**
- `idx_vehicles_location_gist` - Spatial filtering
- `idx_vehicles_active_location` - Active vehicles only
- `idx_make` - Make grouping
- `idx_search_combo` - Composite filtering

**Query Time:**
- Without make filter: ~150-200ms (7 aggregations)
- With make filter: ~100-150ms (fewer vehicles to aggregate)

### Throttling Strategy

**Debounce on Client:**
```typescript
import { debounce } from 'lodash';

const debouncedFetch = debounce(
  (lat, lon, make) => fetchFilterOptions(lat, lon, make),
  800 // Wait 800ms after last change
);
```

**Why Debounce?**
- User typing in zip code input
- Multiple filter changes in quick succession
- Prevents excessive API calls

## Response Size

**Typical Response:** ~5-10 KB

**Breakdown:**
- Makes: ~1-2 KB (50 makes max)
- Models: ~2-3 KB (100 models max)
- Body styles: ~200 bytes (5-10 styles)
- Conditions: ~100 bytes (3 conditions)
- Ranges: ~100 bytes
- Total count: ~10 bytes

**Optimization:** Already minimal, no compression needed

## Error Handling

### Client-Side Retry Logic

```typescript
async function fetchFilterOptionsWithRetry(
  latitude: number,
  longitude: number,
  retries = 3
) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch('/api/filter-options', {
        method: 'POST',
        body: JSON.stringify({ userLat: latitude, userLon: longitude }),
      });

      if (response.status === 429) {
        // Rate limited, wait and retry
        const retryAfter = response.headers.get('Retry-After');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Fallback UI

```typescript
// Show minimal filters if API fails
const fallbackFilters = {
  makes: [
    { make: 'Toyota', count: null },
    { make: 'Honda', count: null },
    { make: 'Ford', count: null },
    // ... top 10 makes
  ],
  models: [],
  bodyStyles: [
    { bodyStyle: 'sedan', count: null },
    { bodyStyle: 'suv', count: null },
    { bodyStyle: 'truck', count: null },
  ],
  // ... minimal defaults
};
```

## Related Endpoints

- [POST /api/search-vehicles](./search-vehicles.md) - Search with filters
- [POST /api/detect-location](./detect-location.md) - Get user location from IP
- [POST /api/zipcode-lookup](./zipcode-lookup.md) - Convert zip to coordinates

## Related Documentation

- [PostGIS Spatial Queries](../../explanation/postgis-spatial-queries.md) - Location filtering
- [Rate Limiting Strategy](../../explanation/rate-limiting-strategy.md) - PostgreSQL rate limiting
