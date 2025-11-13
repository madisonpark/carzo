# API Reference: /api/zipcode-lookup

## Overview

Convert US zip code to geographic coordinates (latitude/longitude).

**Endpoint:** `GET /api/zipcode-lookup`

**Authentication:** None (public endpoint)

**Rate Limiting:**
- Per-minute: 50 requests/minute
- Burst: 10 requests/second
- Session: 200 requests/hour

## Request

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `zip` | string | Yes | 5-digit US zip code |

### Example Request

```bash
curl "https://carzo.net/api/zipcode-lookup?zip=30303"
```

## Response

### Success Response

**Status Code:** `200 OK`

**Body:**

```json
{
  "success": true,
  "location": {
    "city": "Atlanta",
    "state": "GA",
    "latitude": 33.7525,
    "longitude": -84.3888,
    "zipCode": "30303"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always true for successful lookups |
| `location.city` | string | City name |
| `location.state` | string | State code (2 letters) |
| `location.latitude` | number | Latitude in decimal degrees |
| `location.longitude` | number | Longitude in decimal degrees |
| `location.zipCode` | string | Input zip code (for reference) |

### Error Responses

#### 400 Bad Request

**Missing Zip Code:**
```json
{
  "error": "Zip code is required"
}
```

**Invalid Format:**
```json
{
  "error": "Invalid zip code format. Must be 5 digits."
}
```

**Zip Code Not Found:**
```json
{
  "success": false,
  "error": "Zip code not found: 00000"
}
```

#### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": 60
}
```

## Implementation Details

### Zip Code Database

Uses `zipcodes` npm package (40K+ US zip codes, no external API required):

```typescript
// lib/geolocation.ts
import zipcodes from 'zipcodes';

export function lookupZipCode(zip: string): ZipCodeLocation | null {
  // Validate format
  if (!/^\d{5}$/.test(zip)) {
    return null;
  }

  // Lookup in database
  const result = zipcodes.lookup(zip);

  if (!result) {
    return null;
  }

  return {
    city: result.city,
    state: result.state,
    latitude: result.latitude,
    longitude: result.longitude,
    zipCode: zip,
  };
}
```

### API Route

```typescript
// app/api/zipcode-lookup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { lookupZipCode } from '@/lib/geolocation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get('zip');

  if (!zip) {
    return NextResponse.json(
      { error: 'Zip code is required' },
      { status: 400 }
    );
  }

  const location = lookupZipCode(zip);

  if (!location) {
    return NextResponse.json(
      {
        success: false,
        error: `Zip code not found: ${zip}`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    location,
  });
}
```

## Client-Side Usage

### React Component

```typescript
// components/Location/ZipCodeInput.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';

export default function ZipCodeInput({ onLocationChange }) {
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/zipcode-lookup?zip=${zip}`);
      const data = await response.json();

      if (data.success) {
        onLocationChange(data.location);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to lookup zip code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="Enter zip code"
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        maxLength={5}
        pattern="\d{5}"
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Looking up...' : 'Search'}
      </Button>
      {error && <p className="text-error text-sm">{error}</p>}
    </form>
  );
}
```

### Homepage Hero

```typescript
// components/Home/HeroSearch.tsx
'use client';

import ZipCodeInput from '@/components/Location/ZipCodeInput';

export default function HeroSearch() {
  const [location, setLocation] = useState(null);

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);

    // Navigate to search with location
    router.push(
      `/search?lat=${newLocation.latitude}&lon=${newLocation.longitude}`
    );
  };

  return (
    <div className="hero">
      <h1>Find Your Perfect Car</h1>
      <ZipCodeInput onLocationChange={handleLocationChange} />
    </div>
  );
}
```

## Performance Considerations

### Local Database Lookup

**Performance:**
- No external API calls (instant lookup)
- In-memory database (< 5 MB)
- Query time: < 1ms

**Trade-offs:**
- ✅ Fast (no network overhead)
- ✅ Free (no per-query cost)
- ✅ Reliable (no API downtime)
- ❌ US zip codes only
- ❌ Database may be slightly outdated

### Caching

**Client-Side Cache:**
```typescript
// Cache zip code lookups in sessionStorage
const cacheKey = `zipcode:${zip}`;
const cached = sessionStorage.getItem(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const location = await lookupZipCode(zip);
sessionStorage.setItem(cacheKey, JSON.stringify(location));
```

**Server-Side:** No caching needed (lookup is already instant)

## Validation

### Zip Code Format

**Valid Formats:**
- `30303` - 5 digits (standard)
- `30303-1234` - ZIP+4 (strip to 5 digits)

**Invalid Formats:**
- `3030` - Too short
- `303030` - Too long
- `30303A` - Contains letters
- `00000` - Not a real zip code

### Client-Side Validation

```typescript
function validateZipCode(zip: string): boolean {
  // Must be exactly 5 digits
  if (!/^\d{5}$/.test(zip)) {
    return false;
  }

  // Must not be all zeros
  if (zip === '00000') {
    return false;
  }

  return true;
}
```

### Server-Side Validation

```typescript
// Additional check: zip code exists in database
const location = lookupZipCode(zip);
if (!location) {
  return NextResponse.json(
    { success: false, error: 'Zip code not found' },
    { status: 404 }
  );
}
```

## Use Cases

### Use Case 1: Homepage Hero Search

User enters zip code → Search vehicles near that location

```typescript
// User flow:
// 1. Enter "30303" in homepage search
// 2. Lookup coordinates (33.7525, -84.3888)
// 3. Navigate to /search?lat=33.7525&lon=-84.3888
// 4. Show vehicles within radius
```

### Use Case 2: Location Override

User's IP detection wrong → Allow manual zip code entry

```typescript
const detectedLocation = await detectLocation();

// Show option to override
<div>
  <p>Showing vehicles near {detectedLocation.city}</p>
  <button onClick={() => setShowOverride(true)}>Wrong location?</button>
</div>

{showOverride && (
  <ZipCodeInput onLocationChange={handleOverride} />
)}
```

### Use Case 3: Filter by Zip Code

User filters search results by specific zip code

```typescript
// Search page filter
<FilterSidebar>
  <ZipCodeInput onLocationChange={(loc) => {
    // Update search with new location
    setFilters({ ...filters, location: loc });
  }} />
</FilterSidebar>
```

## Error Handling

### Invalid Zip Codes

```typescript
const invalidZips = [
  '00000', // All zeros
  '99999', // Likely not real
  'ABCDE', // Non-numeric
  '123',   // Too short
];

// Always validate before lookup
if (!validateZipCode(zip)) {
  return { error: 'Invalid zip code format' };
}
```

### Not Found Handling

```typescript
// Some valid-format zip codes don't exist
const location = lookupZipCode('99999');

if (!location) {
  // Show user-friendly message
  return (
    <div className="text-error">
      Zip code not found. Please check and try again.
    </div>
  );
}
```

## Testing

### Unit Test

```typescript
// lib/__tests__/geolocation.test.ts
describe('lookupZipCode', () => {
  it('should return location for valid zip', () => {
    const location = lookupZipCode('30303');

    expect(location).toEqual({
      city: 'Atlanta',
      state: 'GA',
      latitude: expect.any(Number),
      longitude: expect.any(Number),
      zipCode: '30303',
    });
  });

  it('should return null for invalid zip', () => {
    expect(lookupZipCode('00000')).toBeNull();
    expect(lookupZipCode('ABCDE')).toBeNull();
    expect(lookupZipCode('123')).toBeNull();
  });

  it('should handle ZIP+4 format', () => {
    // Strip to 5 digits
    const location = lookupZipCode('30303-1234');
    expect(location?.zipCode).toBe('30303');
  });
});
```

### Integration Test

```bash
# Valid zip code
curl "https://carzo.net/api/zipcode-lookup?zip=30303"
# Should return Atlanta location

# Invalid zip code
curl "https://carzo.net/api/zipcode-lookup?zip=00000"
# Should return 404

# Missing parameter
curl "https://carzo.net/api/zipcode-lookup"
# Should return 400
```

## Database Updates

### Updating Zip Code Database

The `zipcodes` package is maintained by the npm community. To update:

```bash
# Check for updates
npm outdated zipcodes

# Update to latest version
npm update zipcodes

# Test after update
npm test
```

**Update Frequency:** Annually (zip codes don't change often)

## Alternative: ZIP+4

### Current: 5-Digit ZIP Only

```typescript
lookupZipCode('30303'); // Works
lookupZipCode('30303-1234'); // Strips to 30303
```

### Future: Support ZIP+4 for More Precision

```typescript
// More precise location (street-level)
const location = lookupZipCodePlus4('30303-1234');

// Returns coordinates for specific street block
```

**Trade-off:**
- More accurate location (block-level)
- Larger database (~200 MB vs 5 MB)
- Slower lookups (~10-20ms vs < 1ms)

## Related Endpoints

- [POST /api/detect-location](./detect-location.md) - IP-based location detection
- [POST /api/search-vehicles](./search-vehicles.md) - Search with coordinates
- [POST /api/filter-options](./filter-options.md) - Filter by location

## Related Documentation

- [PostGIS Spatial Queries](../../explanation/postgis-spatial-queries.md) - Location-based search
- [Location Detection](../../how-to/location-detection.md) - Implementation guide
