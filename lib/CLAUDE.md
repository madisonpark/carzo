# Business Logic Guidelines (Claude Code)

## Revenue-Critical Functions (DO NOT MODIFY WITHOUT APPROVAL)

### dealer-diversity.ts
**Round-robin dealer algorithm - THE MONEY ALGORITHM**

```typescript
export function diversifyByDealer<T extends { dealer_id: string }>(
  vehicles: T[],
  limit: number
): T[]
```

**Why it's critical:**
- We only get paid $0.80 per UNIQUE dealer per user per 30 days
- This algorithm maximizes unique dealer exposure
- Directly impacts profitability
- Has 97.61% test coverage (35 tests)

**DO NOT:**
- Modify algorithm without explicit approval
- Change round-robin logic
- Remove dealer_id checks

**If you need to modify:**
1. Ask user for approval first
2. Write comprehensive tests first
3. Verify revenue impact before deploying

### user-tracking.ts
**Cookie-based user tracking**

```typescript
export function getUserId(): string
export function getSessionId(): string
```

**Why it's critical:**
- Tracks dealer click history (30-day window)
- Required for click deduplication
- Must persist for 1 year (cookie expiration)
- Has 100% test coverage (48 tests)

**Cookie:** `carzo_user_id` (1 year)
**Session Storage:** `carzo_session_id` (per-tab)

### flow-detection.ts
**A/B test flow routing**

```typescript
export function getFlowFromUrl(): UserFlow  // 'direct' | 'vdp-only' | 'full'
export function preserveFlowInUrl(url: string, currentParams: URLSearchParams): string
```

**Why it's critical:**
- Routes traffic for A/B testing (3 variants)
- Preserves flow parameter across navigation
- Has 100% test coverage (61 tests)

## Performance-Critical Functions

### geolocation.ts
**MaxMind GeoIP + Haversine distance calculations**

```typescript
export async function getLocationFromIP(ipAddress: string): Promise<UserLocation | null>
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number
```

**Localhost fallback:** Returns Atlanta, GA (33.749, -84.388)

**Use PostGIS instead when possible:**
- PostGIS is 100x faster (50-100ms vs 3-5s)
- Use Haversine only for client-side calculations
- Server-side queries should use `ST_DWithin` (PostGIS)

### rate-limit.ts
**PostgreSQL-based rate limiting**

```typescript
export async function checkMultipleRateLimits(
  identifier: string,
  limits: RateLimitConfig[]
): Promise<RateLimitResult>
```

**Why PostgreSQL over Redis:**
- No external dependencies
- Unlogged tables = 3x faster writes
- Advisory locks prevent race conditions
- Zero additional cost

**All POST endpoints must use this**

## Testing Requirements

**All lib/ functions require tests:**
- Unit tests in `lib/__tests__/[function].test.ts`
- Revenue-critical files: 95%+ coverage
- All other files: 80%+ coverage
- Use `vi.useFakeTimers()` for time-sensitive logic
- Mock external dependencies (Supabase, fetch, window)

## Utility Functions

### utils.ts
**Tailwind class merging utility**

```typescript
import { cn } from '@/lib/utils';

// Merges classes, later classes override earlier
cn('px-4 py-2 bg-red-500', 'bg-blue-500')  // → 'px-4 py-2 bg-blue-500'
```

**Used everywhere for conditional styling**

## Common Patterns

### Cookie/Storage Access (SSR-Safe)
```typescript
// ALWAYS check for window first
if (typeof window === 'undefined') {
  return defaultValue;  // Server-side
}

// Browser-side
const value = document.cookie;
const sessionData = sessionStorage.getItem('key');
```

### Supabase Queries
```typescript
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// Always check for errors
const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('make', 'Toyota');

if (error) {
  console.error('Supabase error:', error);
  return null;
}

return data;
```

### Distance Calculations (Haversine)
```typescript
import { calculateDistance } from '@/lib/geolocation';

// Returns distance in miles
const miles = calculateDistance(
  userLat, userLon,
  vehicleLat, vehicleLon
);

// Filter by radius
const nearby = vehicles.filter(v =>
  calculateDistance(userLat, userLon, v.latitude, v.longitude) <= v.targeting_radius
);
```

## Quick Reference

**Revenue-critical files (DO NOT MODIFY without approval):**
- `dealer-diversity.ts` - Round-robin algorithm
- `user-tracking.ts` - Cookie tracking
- `flow-detection.ts` - A/B test routing

**Performance-critical files:**
- `geolocation.ts` - IP location, Haversine
- `rate-limit.ts` - PostgreSQL rate limiting

**Utilities:**
- `utils.ts` - cn() class merging
- `supabase.ts` - Supabase client

**See:** `/docs/explanation/` for architecture details
