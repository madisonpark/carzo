# Campaign Planning Dashboard - QA Report (Round 2)

**Date:** 2025-11-13
**Commits Tested:** 5ec1bf2, 7a3c05a, 94bcfaa
**Tester:** Claude Code (Automated QA)
**Status:** ⚠️ **FAILED** - Critical issues found

---

## Executive Summary

Second round QA performed after initial fixes were applied to campaign planning dashboard. **5 new critical/high issues discovered**, including a major bug in the claimed totalDealers fix and non-functional rate limiting.

### Overall Status
- ✅ **Build:** Passes (after fixing TypeScript errors during QA)
- ✅ **Database Functions:** Working correctly
- ✅ **API Endpoints:** All 5 endpoints functional
- ⚠️ **Security:** Authentication works, but rate limiting fails silently
- ❌ **Data Integrity:** totalDealers calculation is WRONG
- ⚠️ **Input Validation:** Missing for several edge cases

### Recommendation
**DO NOT PROCEED** to next phase. Fix critical issues first:
1. Fix totalDealers calculation (use proper COUNT DISTINCT)
2. Fix rate limiting (currently failing silently)
3. Add input validation for negative budgets
4. Handle nonexistent metros properly

---

## Test Results Summary

| Category | Tests Run | Passed | Failed | Issues Found |
|----------|-----------|--------|--------|--------------|
| Build | 1 | 1 | 0 | 3 (fixed during QA) |
| Database Functions | 2 | 2 | 0 | 0 |
| API Endpoints | 5 | 5 | 0 | 0 |
| Authentication | 2 | 2 | 0 | 0 |
| Rate Limiting | 1 | 0 | 1 | 1 (critical) |
| CSV Exports | 2 | 2 | 0 | 0 |
| Regressions | 2 | 2 | 0 | 0 |
| Edge Cases | 4 | 1 | 3 | 3 |
| Data Integrity | 2 | 1 | 1 | 1 (critical) |
| **TOTAL** | **22** | **18** | **5** | **8** |

---

## ✅ Fixes Verified Working

### 1. Database Functions (100% Pass)
- ✅ **get_nearby_zips**: Returns 182 ZIPs for Tampa, FL (claimed fix verified!)
- ✅ **get_zips_for_metro**: Bulk function working, no N+1 query
- ✅ **get_metro_inventory**: Returns 414 metros
- ✅ **get_body_style_inventory**: Returns 10 body styles
- ✅ **get_make_inventory**: Returns 29 makes

**Test Output:**
```
✅ Success! Found 182 ZIP codes within 25 miles of Tampa
Sample ZIPs:
  33622 - Tampa, FL (0.01 mi)
  33623 - Tampa, FL (0.01 mi)
  ...
```

### 2. API Endpoints (100% Pass)
All 5 admin endpoints are operational:

#### ✅ campaign-recommendations
- Returns tier1, tier2, tier3 campaigns
- dealer_concentration calculation is CORRECT (19/1337 = 0.0142)
- Response time: ~200ms

#### ✅ inventory-snapshot
- Returns total_vehicles, total_dealers (⚠️ BUT value is WRONG - see issues below)
- Returns top 10 metros, all body styles, top 15 makes
- Response time: ~150ms

#### ✅ calculate-budget
- Accepts total_budget, cpc, conversion_rate as query params
- Returns allocations and summary with ROI projections
- Response time: ~250ms
- ⚠️ Accepts negative budgets (see edge cases)

#### ✅ export-targeting (Facebook)
- Returns JSON array of dealer locations with radius
- Format: `[{latitude, longitude, radius_miles, dealer_name, vehicle_count}]`
- Tampa, FL: 19 dealers exported

#### ✅ export-targeting (Google)
- Returns CSV with ZIP codes
- Format: `zip_code\n33782\n33732\n...`
- Tampa, FL: 212 lines (211 ZIPs + header)
- ✅ N+1 query fix verified (uses get_zips_for_metro bulk function)

### 3. CSV Sanitization (Pass)
- ✅ Function `sanitizeCsvField()` implemented
- ✅ Prevents formula injection (=, +, -, @, tab, carriage return)
- ✅ Escapes double quotes
- ✅ Removes newlines

**Code Review:**
```typescript
function sanitizeCsvField(value: string): string {
  if (!value) return '""';

  let sanitized = value;
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = `'${sanitized}`; // Prefix with single quote
  }

  sanitized = sanitized.replace(/"/g, '""');
  sanitized = sanitized.replace(/[\r\n]/g, ' ');

  return `"${sanitized}"`;
}
```

### 4. Authentication (100% Pass)
- ✅ Returns 401 for missing Authorization header
- ✅ Returns 401 for wrong password
- ✅ Allows requests with correct Bearer token

**Test Results:**
```bash
curl -H "Authorization: Bearer wrong-password" ...
# {"error":"Unauthorized"}

curl (no header) ...
# {"error":"Unauthorized"}

curl -H "Authorization: Bearer carzo2024admin" ...
# 200 OK
```

### 5. No Regressions in Existing Functionality (Pass)
- ✅ `/api/search-vehicles`: Working (returns vehicles near Tampa)
- ✅ `/api/filter-options`: Working (returns makes, body_styles, etc.)

---

## ❌ Critical Issues Found

### 🔴 CRITICAL #1: totalDealers Calculation is WRONG

**Severity:** CRITICAL
**Category:** Data Integrity
**Status:** CLAIMED FIXED but STILL BROKEN

**Issue:**
The fix claimed to use `COUNT DISTINCT dealer_id` but the code is still counting ALL rows with dealer_id, not unique dealers.

**Current Code (Line 44-48 in `/app/api/admin/inventory-snapshot/route.ts`):**
```typescript
// Get actual unique dealer count from database
const { count: totalDealers } = await supabase
  .from('vehicles')
  .select('dealer_id', { count: 'exact', head: true })
  .eq('is_active', true)
  .then(result => ({ count: result.count || 0 }));
```

**Problem:**
- `.select('dealer_id', { count: 'exact' })` counts ALL rows, not unique values
- Returns 72,051 (total vehicles) instead of ~400-500 (unique dealers)

**Test Results:**
```bash
curl .../inventory-snapshot
# {"total_vehicles":56417,"total_dealers":72051,...}
# ❌ 72,051 is clearly wrong (should be ~400-500)
```

**Expected Behavior:**
Should use a PostgreSQL query like:
```sql
SELECT COUNT(DISTINCT dealer_id)
FROM vehicles
WHERE is_active = true
```

**Impact:**
- Dashboard shows completely wrong dealer count
- Affects business decisions about dealer diversity
- Misleading for campaign planning

**Fix Required:**
Replace Supabase count with raw SQL query or RPC function:
```typescript
const { data } = await supabase.rpc('get_unique_dealer_count');
const totalDealers = data?.[0]?.count || 0;
```

---

### 🔴 CRITICAL #2: Rate Limiting Not Working

**Severity:** CRITICAL
**Category:** Security
**Status:** NEW ISSUE

**Issue:**
Rate limiting is **failing silently** and not enforcing 50 req/min limit. All 60 rapid requests succeeded.

**Test Results:**
```bash
# Sent 60 rapid requests
429 responses: 0 out of 60
# ❌ Should have gotten ~10 rate limit errors
```

**Root Cause:**
The `checkRateLimit()` function is designed to **fail open** on errors (line 95-96 in `/lib/rate-limit.ts`):
```typescript
if (error) {
  console.error('Error checking rate limit:', error);
  // On error, allow request (fail open)
  return {
    allowed: true,
    limit,
    remaining: limit,
    reset: Date.now() + windowSeconds * 1000,
  };
}
```

**Likely Cause:**
- `check_rate_limit` database function is erroring or not found
- Rate limits table might not exist
- PostgreSQL connection issues

**Impact:**
- ⚠️ **NO BRUTE FORCE PROTECTION** on admin endpoints
- Anyone can spam requests to guess admin password
- Database could be overloaded

**Fix Required:**
1. Verify `check_rate_limit()` database function exists
2. Verify `rate_limits` table exists with correct schema
3. Add logging to see why rate limiting is failing
4. Consider failing closed (deny requests) if rate limit check fails

---

### 🟠 HIGH #3: TypeScript Errors in Build (Fixed During QA)

**Severity:** HIGH (blocks deployment)
**Category:** Build
**Status:** FIXED during QA

**Issues Found:**
1. Line 83 in `calculate-budget/route.ts`: Missing type for `sum` parameter
2. Line 88 in `calculate-budget/route.ts`: Missing type for `alloc` parameter
3. Line 140 in `export-targeting/route.ts`: Missing type for `r` parameter
4. Line 50 in `admin-auth.ts`: `resetTime` doesn't exist (should be `reset`)
5. `scripts/` folder was being type-checked (should be excluded)

**Fixes Applied:**
```typescript
// 1. Added Allocation type definition
type Allocation = {
  campaign: string;
  metro: string;
  monthly_budget: number;
  daily_budget: number;
  expected_clicks: number;
  expected_revenue: number;
  expected_profit: number;
  roi_pct: number;
};

// 2. Added type annotations to reduce
const summary = allocations.reduce(
  (sum: { ... }, alloc: Allocation) => ({ ... }),
  { ... }
);

// 3. Fixed rate limit reset time
'X-RateLimit-Reset': new Date(rateLimitResult.reset * 1000).toISOString(),

// 4. Excluded scripts from tsconfig.json
"exclude": [
  "node_modules",
  "reference_vdp",
  "scripts",  // ← Added
  ...
]
```

**Build Status:**
- ❌ Before fixes: Failed TypeScript compilation
- ✅ After fixes: Build succeeds

---

## ⚠️ Medium Issues

### 🟡 MEDIUM #4: Negative Budget Accepted

**Severity:** MEDIUM
**Category:** Input Validation
**Status:** NEW ISSUE

**Issue:**
`calculate-budget` endpoint accepts negative budgets and produces nonsensical results.

**Test:**
```bash
curl .../calculate-budget?total_budget=-1000
```

**Response:**
```json
{
  "assumptions": {"total_monthly_budget": -1000, ...},
  "allocations": [
    {
      "campaign": "Tampa, FL - All Vehicles",
      "monthly_budget": -306.41,
      "daily_budget": -10.21,
      "expected_clicks": -613,
      "expected_revenue": -171.59,
      "expected_profit": 134.82,
      "roi_pct": -44
    },
    ...
  ]
}
```

**Expected:**
Should return 400 Bad Request with error message.

**Fix Required:**
Add validation in `calculate-budget/route.ts`:
```typescript
const totalBudget = Number(request.nextUrl.searchParams.get('total_budget') || 7500);

if (totalBudget <= 0) {
  return NextResponse.json(
    { error: 'total_budget must be positive' },
    { status: 400 }
  );
}
```

---

### 🟡 MEDIUM #5: Nonexistent Metro Returns Empty CSV

**Severity:** MEDIUM
**Category:** Error Handling
**Status:** NEW ISSUE

**Issue:**
When exporting targeting for a metro that doesn't exist, the API returns an empty CSV with just the header instead of an error.

**Test:**
```bash
curl .../export-targeting?metro=NonexistentCity,%20XX&platform=google&format=csv
```

**Response:**
```csv
zip_code
```
(Empty CSV, no ZIPs)

**Expected:**
Should return 404 Not Found or 400 Bad Request with error message like:
```json
{"error": "Metro not found: NonexistentCity, XX"}
```

**Fix Required:**
Check if dealers exist for metro before querying ZIPs:
```typescript
const { data: dealers } = await supabase
  .from('vehicles')
  .select('dealer_id')
  .eq('dealer_city', city)
  .eq('dealer_state', state)
  .eq('is_active', true);

if (!dealers || dealers.length === 0) {
  return NextResponse.json(
    { error: `Metro not found: ${metro}` },
    { status: 404 }
  );
}
```

---

## ℹ️ Low Issues

### 🔵 LOW #6: Rate Limit Headers Not Returned

**Severity:** LOW
**Category:** API Response
**Status:** Related to Critical #2

**Issue:**
Successful requests don't include `X-RateLimit-*` headers to show remaining quota.

**Test:**
```bash
curl -v .../inventory-snapshot | grep -i "x-ratelimit"
# (no output - headers not present)
```

**Expected:**
All responses should include:
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 2025-11-13T19:45:00Z
```

**Note:** This is likely because rate limiting is failing (see Critical #2), so headers are never set.

---

### 🔵 LOW #7: No Logging for Rate Limit Failures

**Severity:** LOW
**Category:** Observability
**Status:** Related to Critical #2

**Issue:**
When rate limit check fails, there's a `console.error()` but we didn't see any errors in the dev server output during testing. This suggests either:
1. Rate limit is silently succeeding (but not enforcing limits)
2. Errors are being swallowed somewhere

**Fix Required:**
Add more verbose logging to debug rate limiting:
```typescript
console.error('Error checking rate limit:', error);
console.error('Identifier:', identifier);
console.error('Endpoint:', endpoint);
console.error('Limit:', limit);
```

---

### 🔵 LOW #8: Missing Tier Descriptions in Response

**Severity:** LOW
**Category:** API Response
**Status:** Enhancement suggestion

**Issue:**
`campaign-recommendations` response doesn't explain what tier1/tier2/tier3 mean.

**Current:**
```json
{
  "tier1": [...],
  "tier2": [...],
  "tier3": [...]
}
```

**Suggested Enhancement:**
```json
{
  "tier1": {
    "description": "High inventory, many dealers, recommended for immediate launch",
    "criteria": "≥500 vehicles AND ≥10 dealers",
    "campaigns": [...]
  },
  ...
}
```

**Priority:** Low - nice to have for API consumers

---

## Performance Verification

### Database Functions
- ✅ `get_nearby_zips`: ~50-100ms (PostGIS GIST index working)
- ✅ `get_zips_for_metro`: Single query (no N+1)
- ✅ Campaign planning functions: <200ms

### API Endpoints
| Endpoint | Response Time | Status |
|----------|---------------|--------|
| campaign-recommendations | ~200ms | ✅ Good |
| inventory-snapshot | ~150ms | ✅ Good |
| calculate-budget | ~250ms | ✅ Good |
| export-targeting (FB) | ~100ms | ✅ Good |
| export-targeting (Google) | ~120ms | ✅ Good |

All endpoints respond well below 1s target.

---

## Regression Testing Results

### Existing Functionality
- ✅ `/api/search-vehicles`: Returns vehicles near Tampa (2,531 results)
- ✅ `/api/filter-options`: Returns 33 makes, 10 body styles
- ✅ Dealer diversification algorithm: Untouched (no changes)
- ✅ Click tracking: Untouched (no changes)

### Database Schema
- ✅ `us_zip_codes.location` column exists with GIST index
- ✅ All 40,933 ZIPs imported successfully
- ✅ PostGIS spatial queries working

---

## Code Quality Observations

### Positive
- ✅ CSV sanitization properly implemented
- ✅ Authentication uses environment variable (not hardcoded)
- ✅ Error handling with try/catch in most endpoints
- ✅ Proper TypeScript types (after QA fixes)
- ✅ Comments explain what each function does

### Concerns
- ❌ Rate limiting fails silently (fail-open design)
- ❌ No input validation for negative budgets
- ❌ No validation for nonexistent metros
- ⚠️ Some `any` types still present (e.g., `metro: any`)
- ⚠️ No tests for admin endpoints (manual testing only)

---

## Security Assessment

| Item | Status | Notes |
|------|--------|-------|
| Authentication | ✅ Pass | Bearer token validation works |
| Rate Limiting | ❌ **FAIL** | Not enforcing limits |
| SQL Injection | ✅ Pass | Using parameterized queries |
| CSV Injection | ✅ Pass | Sanitization implemented |
| ADMIN_PASSWORD env check | ✅ Pass | Returns 500 if missing |
| Input Validation | ⚠️ Partial | Missing for budgets, metros |

**Overall Security Status:** ⚠️ **NEEDS ATTENTION**

---

## Files Modified During QA

### Fixed TypeScript Errors
1. `/app/api/admin/calculate-budget/route.ts`
   - Added `Allocation` type definition
   - Added type annotations to reduce function

2. `/app/api/admin/export-targeting/route.ts`
   - Added type annotation to `rows.map()`

3. `/lib/admin-auth.ts`
   - Fixed `resetTime` → `reset * 1000` conversion

4. `/tsconfig.json`
   - Added `"scripts"` to exclude array

---

## Test Environment

- **Node.js:** v22.18.0
- **Next.js:** 16.0.1 (Turbopack)
- **Supabase:** Remote (wuzgdyqbyhpfozepkfuq)
- **Database:** 56,417 active vehicles, ~400-500 dealers (estimate)
- **Test Location:** Tampa, FL (27.9506, -82.4572)

---

## Recommendations

### Immediate (Before Next Phase)

1. **FIX CRITICAL #1: totalDealers Calculation**
   ```typescript
   // Create database function
   CREATE OR REPLACE FUNCTION get_unique_dealer_count()
   RETURNS TABLE(count bigint) AS $$
   BEGIN
     RETURN QUERY
     SELECT COUNT(DISTINCT dealer_id)::bigint
     FROM vehicles
     WHERE is_active = true;
   END;
   $$ LANGUAGE plpgsql;

   // Use in API
   const { data } = await supabase.rpc('get_unique_dealer_count');
   const totalDealers = data?.[0]?.count || 0;
   ```

2. **FIX CRITICAL #2: Rate Limiting**
   - Debug why `check_rate_limit()` is failing
   - Verify database function exists
   - Add logging to track failures
   - Consider failing closed instead of open

3. **FIX MEDIUM #4: Input Validation**
   - Add validation for negative/zero budgets
   - Add validation for invalid CPC/conversion rates

4. **FIX MEDIUM #5: Error Handling**
   - Return 404 for nonexistent metros
   - Return 400 for invalid platforms (already done)

### Short-term (Next Sprint)

5. **Add Tests**
   - Write unit tests for all 5 admin endpoints
   - Test edge cases (negative budgets, missing metros)
   - Test rate limiting enforcement

6. **Improve Observability**
   - Add structured logging
   - Track rate limit failures
   - Monitor endpoint response times

7. **Add API Documentation**
   - Document query parameters
   - Document response formats
   - Document error codes

### Long-term (Future Enhancement)

8. **Replace Password Auth**
   - Consider JWT tokens
   - Add role-based access control
   - Support multiple admin users

9. **Add Caching**
   - Cache inventory-snapshot (updates hourly)
   - Cache campaign-recommendations (updates daily)
   - Use Redis or Next.js cache

---

## Sign-off

**QA Status:** ⚠️ **CONDITIONAL FAIL**

**Issues Summary:**
- 🔴 Critical: 2
- 🟠 High: 1 (fixed during QA)
- 🟡 Medium: 2
- 🔵 Low: 3

**Recommendation:**
Fix Critical #1 (totalDealers) and Critical #2 (rate limiting) before proceeding. Medium issues can be addressed in next sprint.

**Next Steps:**
1. Developer fixes critical issues
2. Run Round 3 QA to verify fixes
3. If Round 3 passes → ready for production
4. If Round 3 fails → investigate root cause

---

**QA Performed By:** Claude Code (Automated Testing)
**Date:** 2025-11-13
**Time:** 11:30 AM PST
**Duration:** ~30 minutes
