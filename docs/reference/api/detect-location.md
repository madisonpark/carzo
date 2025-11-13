# API Reference: /api/detect-location

## Overview

Detect user's location from IP address using MaxMind GeoIP2 Web Service API.

**Endpoint:** `POST /api/detect-location`

**Authentication:** None (public endpoint)

**Rate Limiting:**
- Per-minute: 30 requests/minute
- Burst: 5 requests/second
- Session: 100 requests/hour

## Request

### Headers

```http
Content-Type: application/json
```

### Body Parameters

None - IP address extracted from request headers automatically.

### Example Request

```bash
curl -X POST https://carzo.net/api/detect-location \
  -H "Content-Type: application/json"
```

## Response

### Success Response

**Status Code:** `200 OK`

**Body:**

```json
{
  "city": "Atlanta",
  "state": "GA",
  "latitude": 33.7490,
  "longitude": -84.3880,
  "zipCode": "30303",
  "country": "US"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `city` | string | City name |
| `state` | string | State code (2 letters) |
| `latitude` | number | Latitude in decimal degrees |
| `longitude` | number | Longitude in decimal degrees |
| `zipCode` | string | Postal code (if available) |
| `country` | string | Country code (2 letters) |

### Localhost Response

**Special Case:** Returns Atlanta, GA for localhost/127.0.0.1

```json
{
  "city": "Atlanta",
  "state": "GA",
  "latitude": 33.7490,
  "longitude": -84.3880,
  "zipCode": "30303",
  "country": "US"
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "error": "Unable to detect location from IP address"
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

#### 500 Internal Server Error

```json
{
  "error": "MaxMind API error",
  "message": "Failed to query GeoIP service"
}
```

## Implementation Details

### MaxMind GeoIP2 Integration

```typescript
// lib/geolocation.ts
import { WebServiceClient } from '@maxmind/geoip2-node';

const client = new WebServiceClient(
  process.env.MAXMIND_ACCOUNT_ID!,
  process.env.MAXMIND_LICENSE_KEY!
);

export async function getLocationFromIP(ipAddress: string): Promise<UserLocation | null> {
  try {
    // Special case: localhost
    if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress === 'localhost') {
      return {
        city: 'Atlanta',
        state: 'GA',
        latitude: 33.7490,
        longitude: -84.3880,
        zipCode: '30303',
        country: 'US',
      };
    }

    // Query MaxMind API
    const response = await client.city(ipAddress);

    return {
      city: response.city?.names?.en || 'Unknown',
      state: response.subdivisions?.[0]?.isoCode || '',
      latitude: response.location?.latitude || 0,
      longitude: response.location?.longitude || 0,
      zipCode: response.postal?.code || '',
      country: response.country?.isoCode || 'US',
    };
  } catch (error) {
    console.error('MaxMind GeoIP error:', error);
    return null;
  }
}
```

### IP Address Extraction

```typescript
// app/api/detect-location/route.ts
export async function POST(request: NextRequest) {
  // Extract IP from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  const ipAddress = forwardedFor?.split(',')[0] || realIP || request.ip || '127.0.0.1';

  const location = await getLocationFromIP(ipAddress);

  if (!location) {
    return NextResponse.json(
      { error: 'Unable to detect location from IP address' },
      { status: 400 }
    );
  }

  return NextResponse.json(location);
}
```

### Environment Variables

```bash
# MaxMind GeoIP2 Web Service API
MAXMIND_ACCOUNT_ID=your_account_id
MAXMIND_LICENSE_KEY=your_license_key
```

**Setup:**
1. Sign up at https://www.maxmind.com/en/geoip2-precision-services
2. Generate account ID and license key
3. Add to Vercel environment variables

## Client-Side Usage

### React Hook

```typescript
// hooks/useLocationDetection.ts
import { useState, useEffect } from 'react';

export function useLocationDetection() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function detectLocation() {
      // Check cache first (5 min expiry)
      const cached = sessionStorage.getItem('user_location');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setLocation(data);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      const response = await fetch('/api/detect-location', {
        method: 'POST',
      });

      const data = await response.json();
      setLocation(data);
      setLoading(false);

      // Cache for 5 minutes
      sessionStorage.setItem('user_location', JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    }

    detectLocation();
  }, []);

  return { location, loading };
}
```

### Search Page Integration

```typescript
// app/search/page.tsx
'use client';

import { useLocationDetection } from '@/hooks/useLocationDetection';
import { useEffect, useState } from 'react';

export default function SearchPage() {
  const { location, loading } = useLocationDetection();
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    if (location) {
      // Use detected location for search
      fetchVehicles(location.latitude, location.longitude);
    }
  }, [location]);

  if (loading) {
    return <div>Detecting your location...</div>;
  }

  return (
    <div>
      <p>Showing vehicles near {location.city}, {location.state}</p>
      {/* Vehicle results */}
    </div>
  );
}
```

## Performance Optimization

### Caching Strategy

**Client-Side Cache:**
- Location cached in sessionStorage for 5 minutes
- Reduces API calls (30/min rate limit)
- Acceptable staleness (users don't move that often)

**Server-Side Cache (Future):**
```typescript
// Cache IP → location for 24 hours (Redis or memory)
const cachedLocation = await redis.get(`location:${ipAddress}`);
if (cachedLocation) {
  return JSON.parse(cachedLocation);
}

const location = await getLocationFromIP(ipAddress);
await redis.setex(`location:${ipAddress}`, 86400, JSON.stringify(location));
```

### MaxMind API Performance

**Typical Response Time:**
- API call: ~50-150ms
- With cache: < 1ms

**Cost:**
- $0.01 per query (pay-as-you-go)
- 1,000 queries = $10
- Cache aggressively to reduce cost

## Accuracy Considerations

### IP Geolocation Accuracy

**City-Level Accuracy:**
- ~75-90% accurate for city
- ~95-99% accurate for country
- ~85-95% accurate for state

**Known Issues:**
- VPNs: Shows VPN server location (not user's actual location)
- Corporate networks: Shows office location (not home)
- Mobile carriers: May show carrier hub location

**Fallback Strategy:**
```typescript
// Allow user to override detected location
const [userLocation, setUserLocation] = useState(detectedLocation);

function handleLocationOverride(zipCode: string) {
  const coords = lookupZipCode(zipCode);
  setUserLocation(coords);
  sessionStorage.setItem('user_location_override', JSON.stringify(coords));
}
```

### Localhost Fallback

**Why Atlanta, GA?**
- Carzo originally focused on Atlanta market
- Reasonable default for US-based development
- Has good vehicle inventory for testing

**Production Behavior:**
- Real IP addresses always use MaxMind
- Only localhost gets Atlanta fallback

## Error Handling

### MaxMind API Errors

```typescript
try {
  const response = await client.city(ipAddress);
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    // MaxMind account out of credits
    console.error('MaxMind API: Insufficient funds');
    return null;
  }

  if (error.code === 'IP_ADDRESS_NOT_FOUND') {
    // IP not in database (rare)
    console.error('IP not found in MaxMind database');
    return null;
  }

  throw error;
}
```

### Client-Side Fallback

```typescript
// If API fails, prompt user for zip code
const { location, loading, error } = useLocationDetection();

if (error) {
  return (
    <div>
      <p>Unable to detect your location automatically.</p>
      <ZipCodeInput onSubmit={handleZipCodeSubmit} />
    </div>
  );
}
```

## Privacy Considerations

### GDPR Compliance

**IP Address Handling:**
- IP address not stored in database
- Used only for location lookup
- Not linked to user ID
- MaxMind compliant with GDPR

**User Rights:**
- User can override detected location
- No PII (Personally Identifiable Information) collected
- Location stored in sessionStorage only (client-side)

### Privacy Policy

**Required Disclosure:**
> "We use your IP address to detect your approximate location (city/state)
> to show you nearby vehicles. Your IP address is not stored and is only
> used for this purpose."

## Testing

### Unit Test

```typescript
// lib/__tests__/geolocation.test.ts
describe('getLocationFromIP', () => {
  it('should return Atlanta for localhost', async () => {
    const location = await getLocationFromIP('127.0.0.1');

    expect(location.city).toBe('Atlanta');
    expect(location.state).toBe('GA');
    expect(location.latitude).toBe(33.7490);
  });

  it('should query MaxMind for real IPs', async () => {
    const location = await getLocationFromIP('8.8.8.8'); // Google DNS

    expect(location).toBeDefined();
    expect(location.country).toBe('US');
  });
});
```

### Integration Test

```bash
# Test from production
curl -X POST https://carzo.net/api/detect-location

# Should return real IP location (not localhost fallback)
```

## Alternative: Browser Geolocation API

### Pros and Cons

**MaxMind (Current):**
- ✅ No user permission required
- ✅ Works immediately on page load
- ❌ Less accurate (~city-level)
- ❌ Costs $0.01 per query

**Browser Geolocation API:**
- ✅ More accurate (~street-level)
- ✅ Free
- ❌ Requires user permission
- ❌ Many users decline permission
- ❌ Slower (waits for GPS/WiFi triangulation)

**Current Strategy:** Use MaxMind for auto-detection, allow manual override

## Related Endpoints

- [POST /api/zipcode-lookup](./zipcode-lookup.md) - Convert zip code to coordinates
- [POST /api/search-vehicles](./search-vehicles.md) - Search with location
- [POST /api/filter-options](./filter-options.md) - Filter by location

## Related Documentation

- [PostGIS Spatial Queries](../../explanation/postgis-spatial-queries.md) - Location-based search
- [Cookie Tracking](../../explanation/cookie-tracking.md) - Privacy considerations
