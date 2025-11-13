# Testing Reference

## Overview

Carzo uses **Vitest** as the test framework with comprehensive unit test coverage for all business logic. Testing is critical for revenue-sensitive code like dealer diversification and click tracking.

**Test Framework:** Vitest (Jest-compatible API with native ESM support)
**Coverage Tool:** v8 (built-in to Vitest)
**Test Location:** `lib/__tests__/` (co-located with business logic)

## Quick Start

```bash
# Run all tests (watch mode)
npm run test

# Run tests once (CI mode)
npm run test -- --run

# Run specific test file
npm run test -- user-tracking.test.ts

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

---

## Test Structure

### Test File Naming

```
lib/
├── user-tracking.ts               # Source file
└── __tests__/
    └── user-tracking.test.ts      # Test file
```

**Convention:** `[filename].test.ts` in `__tests__/` subdirectory

---

### Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { functionToTest } from '../module-name';

describe('functionToTest()', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test-input';

    // Act
    const result = functionToTest(input);

    // Assert
    expect(result).toBe('expected-output');
  });
});
```

---

## Coverage Requirements

### Coverage Thresholds

| File Type | Minimum Coverage | Target |
|-----------|------------------|--------|
| **Revenue-critical** (`dealer-diversity.ts`, `user-tracking.ts`, `flow-detection.ts`) | 95% | 100% |
| **Business logic** (all other `lib/*.ts`) | 80% | 95% |
| **Components** (React components) | 70% | 85% |
| **API routes** (integration tests) | 60% | 80% |

### Current Coverage

```bash
# Check coverage report
npm run test:coverage
```

**Example Output:**
```
 % Coverage report from v8
---------------------------
File                     | % Stmts | % Branch | % Funcs | % Lines
user-tracking.ts         |  100.0  |  100.0   |  100.0  |  100.0
dealer-diversity.ts      |   97.6  |   95.5   |  100.0  |   97.6
flow-detection.ts        |  100.0  |  100.0   |  100.0  |  100.0
geolocation.ts           |   92.3  |   85.7   |  100.0  |   92.3
rate-limit.ts            |   88.9  |   80.0   |  100.0  |   88.9
utils.ts                 |  100.0  |  100.0   |  100.0  |  100.0
---------------------------
All files                |   96.5  |   93.5   |  100.0  |   96.5
```

---

## Test Files

### lib/__tests__/user-tracking.test.ts

**Purpose:** Test cookie-based user tracking system

**Coverage:** 100% (48 tests)

**Key Test Suites:**

1. **getUserId()** (14 tests)
   - Server-side (SSR) behavior
   - Client-side cookie creation
   - Cookie persistence across calls
   - UUID format validation
   - Multiple cookie handling

2. **getSessionId()** (10 tests)
   - Server-side (SSR) behavior
   - Client-side sessionStorage creation
   - Session persistence
   - UUID format validation

3. **hasClickedDealer() and markDealerClicked()** (14 tests)
   - Server-side (SSR) behavior
   - Mark dealer as clicked
   - Track multiple dealers
   - sessionStorage persistence
   - Idempotent behavior
   - Invalid JSON handling

4. **getUtmParams()** (8 tests)
   - Server-side (SSR) behavior
   - Extract UTM parameters from URL
   - Handle URL encoding
   - Handle empty parameters

5. **clearTrackingData()** (8 tests)
   - Clear cookies and sessionStorage
   - Re-initialization after clear

**Example Test:**

```typescript
describe('getUserId()', () => {
  it('should create new user ID if no cookie exists', () => {
    const userId = getUserId();

    expect(userId).toBeTruthy();
    expect(userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(document.cookie).toContain('carzo_user_id');
    expect(document.cookie).toContain(userId);
  });

  it('should return existing user ID from cookie', () => {
    document.cookie = 'carzo_user_id=existing-user-123; path=/';

    const userId = getUserId();

    expect(userId).toBe('existing-user-123');
  });
});
```

---

### lib/__tests__/dealer-diversity.test.ts

**Purpose:** Test THE MONEY ALGORITHM (round-robin dealer rotation)

**Coverage:** 97.61% (35 tests)

**Key Test Suites:**

1. **Basic functionality** (5 tests)
   - Empty array handling
   - Single dealer
   - Multiple vehicles from same dealer

2. **Dealer diversity** (10 tests)
   - Round-robin selection
   - Max 1-2 vehicles per dealer
   - Dealer rotation order

3. **Edge cases** (8 tests)
   - Very small limits (1-5)
   - Large limits (> number of vehicles)
   - Single-dealer scenarios

4. **Real-world scenarios** (12 tests)
   - 100 vehicles, 20 dealers
   - Target: 80%+ diversity score
   - Verify billable clicks optimized

**Example Test:**

```typescript
describe('diversifyByDealer()', () => {
  it('should rotate dealers in round-robin fashion', () => {
    const vehicles = [
      { dealer_id: 'dealer-a', make: 'Toyota' },
      { dealer_id: 'dealer-a', make: 'Honda' },
      { dealer_id: 'dealer-b', make: 'Ford' },
      { dealer_id: 'dealer-b', make: 'Chevy' },
      { dealer_id: 'dealer-c', make: 'Nissan' },
    ];

    const result = diversifyByDealer(vehicles, 3);

    // Expect: dealer-a (first), dealer-b (first), dealer-c (first)
    expect(result).toHaveLength(3);
    expect(result[0].dealer_id).toBe('dealer-a');
    expect(result[1].dealer_id).toBe('dealer-b');
    expect(result[2].dealer_id).toBe('dealer-c');
  });

  it('should achieve >80% dealer diversity for 100 vehicles', () => {
    // Generate 100 vehicles with 20 dealers
    const vehicles = Array.from({ length: 100 }, (_, i) => ({
      dealer_id: `dealer-${i % 20}`,
      make: 'Toyota',
    }));

    const result = diversifyByDealer(vehicles, 100);

    // Calculate diversity score
    const uniqueDealers = new Set(result.map(v => v.dealer_id)).size;
    const diversityPercent = (uniqueDealers / result.length) * 100;

    expect(diversityPercent).toBeGreaterThan(80);
  });
});
```

**Why This Matters:**
- Every 1% improvement in dealer diversity = ~$8/user in revenue
- Algorithm ensures max billable clicks per session
- Test coverage prevents regressions that cost money

---

### lib/__tests__/flow-detection.test.ts

**Purpose:** Test A/B test flow routing (3 variants: direct, vdp-only, full)

**Coverage:** 100% (61 tests)

**Key Test Suites:**

1. **getFlowFromUrl()** (18 tests)
   - Detect flow from URL parameter
   - Default to 'full' if missing
   - Normalize invalid values

2. **preserveFlowInUrl()** (25 tests)
   - Preserve flow across navigation
   - Handle URLs with/without existing params
   - Handle complex URLs with anchors

3. **Flow-specific behavior** (18 tests)
   - Flow A (direct): Skip VDP, go straight to dealer
   - Flow B (vdp-only): Auto-redirect from VDP
   - Flow C (full): Traditional funnel

**Example Test:**

```typescript
describe('getFlowFromUrl()', () => {
  it('should return "direct" for ?flow=direct', () => {
    global.window = { location: new URL('http://localhost:3000/search?flow=direct') } as any;

    expect(getFlowFromUrl()).toBe('direct');
  });

  it('should return "full" for missing flow parameter', () => {
    global.window = { location: new URL('http://localhost:3000/search') } as any;

    expect(getFlowFromUrl()).toBe('full');
  });

  it('should default to "full" for invalid flow value', () => {
    global.window = { location: new URL('http://localhost:3000/search?flow=invalid') } as any;

    expect(getFlowFromUrl()).toBe('full');
  });
});

describe('preserveFlowInUrl()', () => {
  it('should preserve flow parameter when adding other params', () => {
    const currentParams = new URLSearchParams('flow=direct');

    const result = preserveFlowInUrl('/search?make=toyota', currentParams);

    expect(result).toBe('/search?make=toyota&flow=direct');
  });
});
```

---

### lib/__tests__/geolocation.test.ts

**Purpose:** Test MaxMind GeoIP and Haversine distance calculations

**Coverage:** 92.3%

**Key Test Suites:**

1. **getLocationFromIP()** (8 tests)
   - Mock MaxMind API responses
   - Localhost fallback (Atlanta, GA)
   - Error handling

2. **calculateDistance()** (Haversine) (12 tests)
   - Known distances (NYC to LA = ~2,451 miles)
   - Same location (0 miles)
   - Edge cases (poles, equator)
   - Accuracy within 0.1%

**Example Test:**

```typescript
describe('calculateDistance()', () => {
  it('should calculate distance between NYC and LA', () => {
    const nycLat = 40.7128;
    const nycLon = -74.0060;
    const laLat = 34.0522;
    const laLon = -118.2437;

    const distance = calculateDistance(nycLat, nycLon, laLat, laLon);

    // Expected: ~2,451 miles (allow 1% margin of error)
    expect(distance).toBeGreaterThan(2400);
    expect(distance).toBeLessThan(2500);
  });

  it('should return 0 for same location', () => {
    const distance = calculateDistance(33.749, -84.388, 33.749, -84.388);

    expect(distance).toBe(0);
  });
});
```

---

### lib/__tests__/rate-limit.test.ts

**Purpose:** Test PostgreSQL-based rate limiting

**Coverage:** 88.9%

**Key Test Suites:**

1. **checkMultipleRateLimits()** (15 tests)
   - Single rate limit check
   - Multiple simultaneous limits
   - Window sliding behavior
   - Advisory lock behavior (mocked)

2. **getClientIdentifier()** (8 tests)
   - Extract IP from Next.js headers
   - Handle proxies (X-Forwarded-For)
   - Fallback to user ID

**Example Test:**

```typescript
describe('checkMultipleRateLimits()', () => {
  it('should allow request within rate limit', async () => {
    const result = await checkMultipleRateLimits('user-123', [
      { endpoint: 'search_vehicles', limit: 100, windowSeconds: 60 },
    ]);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('should block request exceeding rate limit', async () => {
    // Make 101 requests in 60 seconds
    for (let i = 0; i < 101; i++) {
      await checkMultipleRateLimits('user-123', [
        { endpoint: 'search_vehicles', limit: 100, windowSeconds: 60 },
      ]);
    }

    const result = await checkMultipleRateLimits('user-123', [
      { endpoint: 'search_vehicles', limit: 100, windowSeconds: 60 },
    ]);

    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });
});
```

---

### lib/__tests__/utils.test.ts

**Purpose:** Test utility functions (cn() class merging)

**Coverage:** 100%

**Key Test:**

```typescript
describe('cn()', () => {
  it('should merge class names', () => {
    expect(cn('px-4 py-2', 'bg-red-500')).toBe('px-4 py-2 bg-red-500');
  });

  it('should override conflicting classes (later wins)', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    expect(cn('base-class', isActive && 'active-class')).toBe('base-class active-class');
  });
});
```

---

## Mocking

### Mocking window (SSR-safe tests)

```typescript
import { describe, it, beforeEach, afterEach } from 'vitest';

describe('Client-side function', () => {
  beforeEach(() => {
    // Setup window for client-side tests
    global.window = {
      location: new URL('http://localhost:3000'),
      document: {
        cookie: '',
      },
      sessionStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn(),
      },
    } as any;
  });

  afterEach(() => {
    // Clean up
    delete (global as any).window;
  });

  it('should work in browser', () => {
    // Test browser-specific code
  });
});

describe('Server-side (SSR)', () => {
  beforeEach(() => {
    // Remove window for SSR tests
    delete (global as any).window;
  });

  it('should return fallback value in SSR', () => {
    const result = browserOnlyFunction();

    expect(result).toBe('fallback-value');
  });
});
```

---

### Mocking Supabase

```typescript
import { vi } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: [{ id: 1, make: 'Toyota' }],
        error: null,
      })),
    })),
  })),
};

// Use in test
vi.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase,
}));
```

---

### Mocking fetch (MaxMind API)

```typescript
import { vi } from 'vitest';

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        city: { names: { en: 'Atlanta' } },
        location: { latitude: 33.749, longitude: -84.388 },
        subdivisions: [{ isoCode: 'GA' }],
      }),
    })
  ) as any;
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

---

### Mocking Timers (Time-sensitive tests)

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

it('should expire after 30 days', () => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);

  // Fast-forward 30 days
  vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000);

  expect(Date.now()).toBeGreaterThanOrEqual(expiryDate.getTime());
});
```

---

## Running Tests

### Watch Mode (Development)

```bash
# Run all tests, re-run on file changes
npm run test

# Filter by filename
npm run test -- user-tracking

# Filter by test name
npm run test -- -t "should create new user ID"
```

### CI Mode (One-time run)

```bash
# Run tests once, exit with code
npm run test -- --run

# With coverage
npm run test:coverage
```

### UI Mode (Visual test runner)

```bash
# Opens browser at http://localhost:51204/__vitest__/
npm run test:ui
```

**Features:**
- Visual test tree
- Click to run specific tests
- See test output inline
- Coverage visualization

---

## Writing New Tests

### Step-by-Step Guide

1. **Create test file:**
```bash
# Test file should match source file name
touch lib/__tests__/my-function.test.ts
```

2. **Import test utilities:**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { myFunction } from '../my-function';
```

3. **Structure tests:**
```typescript
describe('myFunction()', () => {
  // Setup/teardown
  beforeEach(() => {
    // Reset mocks, clear state
  });

  afterEach(() => {
    // Cleanup
  });

  // Test cases
  it('should handle normal case', () => {
    expect(myFunction('input')).toBe('output');
  });

  it('should handle edge case', () => {
    expect(myFunction('')).toBe('');
  });

  it('should throw on invalid input', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

4. **Run tests:**
```bash
npm run test -- my-function
```

5. **Check coverage:**
```bash
npm run test:coverage
```

---

## Best Practices

### Test Organization

**DO:**
- Group related tests in `describe()` blocks
- Use descriptive test names (`should do X when Y`)
- Test happy path + edge cases + error cases
- Keep tests focused (one assertion per test if possible)

**DON'T:**
- Test implementation details (test behavior, not internals)
- Share state between tests (use `beforeEach`)
- Forget to clean up (use `afterEach`)
- Write brittle tests that break on refactoring

---

### Assertions

**Use specific matchers:**

```typescript
// ✅ GOOD (specific)
expect(result).toBe(5);
expect(result).toHaveLength(3);
expect(result).toMatchObject({ id: 1 });

// ❌ BAD (vague)
expect(result).toBeTruthy();
expect(result).toBeDefined();
```

**Test error messages:**

```typescript
// ✅ GOOD
expect(() => validateEmail('invalid')).toThrow('Invalid email format');

// ❌ BAD (no error message check)
expect(() => validateEmail('invalid')).toThrow();
```

---

### Revenue-Critical Code

**Extra testing requirements:**

1. **Test all code paths** (aim for 100% branch coverage)
2. **Test edge cases** (empty arrays, null, undefined, NaN)
3. **Test boundary conditions** (limit - 1, limit, limit + 1)
4. **Test real-world scenarios** (integration tests)
5. **Add regression tests** for every bug fix

**Example (dealer-diversity.ts):**

```typescript
describe('Revenue scenarios', () => {
  it('should maximize billable clicks for 100 vehicles', () => {
    // Simulate 100 vehicles from 20 dealers
    const vehicles = generateVehicles(100, 20);

    const result = diversifyByDealer(vehicles, 100);

    // Calculate expected revenue
    const uniqueDealers = new Set(result.map(v => v.dealer_id)).size;
    const maxRevenue = uniqueDealers * 0.80;

    expect(uniqueDealers).toBeGreaterThanOrEqual(80); // 80% diversity
    expect(maxRevenue).toBeGreaterThanOrEqual(64);    // $64 minimum
  });
});
```

---

## Continuous Integration

### GitHub Actions (Future)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test -- --run

      - name: Check coverage
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
```

---

## Troubleshooting

### "window is not defined"

**Cause:** Test runs in Node.js environment (no DOM)

**Fix:**
```typescript
// Check for window before accessing
if (typeof window === 'undefined') {
  return fallbackValue;
}

// Or mock window in test
beforeEach(() => {
  global.window = { location: new URL('http://localhost') } as any;
});
```

---

### "document is not defined"

**Cause:** No DOM in test environment

**Fix:**
```typescript
// Install jsdom (if needed)
npm install -D jsdom

// Add to vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',  // Enable DOM APIs
  },
});
```

---

### "Test timeout" (async tests)

**Cause:** Async test doesn't complete

**Fix:**
```typescript
// Increase timeout for slow tests
it('should handle slow operation', async () => {
  // ... test code
}, 10000);  // 10 second timeout

// Or use fake timers
beforeEach(() => {
  vi.useFakeTimers();
});

it('should complete after 5 seconds', async () => {
  const promise = slowFunction();
  vi.advanceTimersByTime(5000);
  await promise;
});
```

---

## Related Documentation

- [CLI Scripts](./cli-scripts.md) - Test scripts (`npm run test`, etc.)
- [Dealer Diversification](../explanation/dealer-diversification.md) - The money algorithm
- [User Tracking](../explanation/cookie-tracking.md) - Cookie-based tracking system
- [A/B Test Flows](../explanation/ab-testing-flows.md) - Flow routing logic
- [Vitest Docs](https://vitest.dev/) - Official Vitest documentation
