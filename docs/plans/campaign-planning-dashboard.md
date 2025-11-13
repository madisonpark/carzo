# Campaign Planning Dashboard - Implementation Plan

**Status:** 🔄 In Progress
**Branch:** `feature/campaign-planning-dashboard`
**Started:** 2025-01-13
**Target Completion:** TBD
**Effort Estimate:** 10-12 hours

---

## Overview

Build a **campaign planning dashboard** to help media buyers identify which advertising campaigns to create based on current inventory availability and geographic coverage.

**Purpose:** Pre-launch planning tool (NOT performance analytics)

**User:** Media buyer preparing to launch first paid advertising campaigns on Facebook, Google, TikTok, etc.

**Goal:** Answer "What campaigns should I create, where should I target them, and how do I set them up?"

---

## Business Context

### Revenue Model
- **$0.80 per UNIQUE dealer click** per user per 30 days
- Paid advertising required to drive traffic (minimal organic)
- Need to target only geos with sufficient vehicle inventory

### Key Constraints
- Inventory is volatile (20k-70k vehicles, changes 4x/day)
- Vehicles unevenly distributed across USA (cluster around dealers)
- Each vehicle has `targeting_radius` (typically 25-30 miles)
- Dealer budgets exhaust → vehicles removed from feed

### Success Criteria
Media buyer can:
1. ✅ Identify 10-15 viable campaigns in under 10 minutes
2. ✅ Export targeting files (Facebook lat/long, Google ZIP codes)
3. ✅ Understand budget allocation across campaigns
4. ✅ Identify risky metros (declining inventory) before launching
5. ✅ Get ad copy suggestions with accurate inventory numbers

---

## Architecture

### Dashboard Sections (5 Total)

**Section 1: Recommended Campaigns** 🔥 **PRIORITY**
- Auto-generate campaign recommendations (TIER 1/2/3 structure)
- One-click export buttons for targeting files
- Shows: Campaign name, inventory stats, recommended budget

**Section 2: Campaign Setup Wizard** 🔥 **PRIORITY**
- Step-by-step setup guide
- Download targeting files (Facebook/Google/TikTok formats)
- Ad copy suggestions (dynamic based on inventory)
- Platform setup instructions

**Section 3: Inventory Snapshot**
- Quick reference numbers for ad copy
- Total vehicles, breakdown by metro/body style/make

**Section 4: Budget Allocation Calculator**
- Input: Total monthly budget
- Output: Recommended allocation per campaign
- Scenario modeling (CPC/conversion assumptions)

**Section 5: Inventory Stability Monitor**
- 7-day trend (growing/stable/declining)
- Alerts for risky metros
- Burn rate projections

### API Endpoints (5 Total)

**Authentication:** Simple password-based (single shared password for small team)

1. **`GET /api/admin/campaign-recommendations`** - Generate tier-based campaign list
2. **`GET /api/admin/export-targeting`** - Export lat/long CSV, ZIP codes, DMAs
3. **`GET /api/admin/inventory-snapshot`** - Quick reference stats
4. **`POST /api/admin/calculate-budget`** - Budget allocation + ROI scenarios
5. **`GET /api/admin/inventory-trends`** - 7-day volatility analysis

**Auth pattern:** Check `Authorization` header against `ADMIN_PASSWORD` env var

### Database Changes

**New Table: `us_zip_codes`** (reference data)
- ~40,000 US ZIP codes with lat/long
- Required for Google Ads ZIP code targeting
- One-time import from public dataset

**No changes to existing tables** - uses `vehicles` and `feed_sync_logs`

---

## Implementation Phases

### ✅ Phase 0: Setup (Completed)
- [x] Create feature branch `feature/campaign-planning-dashboard`
- [x] Document implementation plan in `/docs/plans/`

---

### 🔄 Phase 1: Data Foundation (In Progress)

**Goal:** Build data layer for dashboard

**Tasks:**
- [ ] Create database migration for `us_zip_codes` table
- [ ] Import US ZIP codes dataset (~40k records)
- [ ] Build inventory snapshot aggregation query
- [ ] Build 7-day trend comparison query (uses `feed_sync_logs`)
- [ ] Test queries with production-like data

**Files to create:**
- `/supabase/migrations/[timestamp]_add_us_zip_codes_table.sql`
- `/scripts/import-zip-codes.ts` (one-time data import)

**Estimated effort:** 2-3 hours

**Acceptance criteria:**
- ✅ ZIP codes table populated with 40k+ records
- ✅ Can query inventory by metro/body style/make in <100ms
- ✅ Can calculate 7-day trend for all metros

---

### ⏳ Phase 2: API Endpoints (Not Started)

**Goal:** Build 5 API endpoints that power the dashboard

**Tasks:**
- [ ] `/api/admin/campaign-recommendations` - Tier-based campaign list
- [ ] `/api/admin/export-targeting` - Multi-format exports (CSV/JSON)
- [ ] `/api/admin/inventory-snapshot` - Quick stats aggregation
- [ ] `/api/admin/calculate-budget` - Budget allocation logic
- [ ] `/api/admin/inventory-trends` - Volatility analysis

**Files to create:**
- `/app/api/admin/campaign-recommendations/route.ts`
- `/app/api/admin/export-targeting/route.ts`
- `/app/api/admin/inventory-snapshot/route.ts`
- `/app/api/admin/calculate-budget/route.ts`
- `/app/api/admin/inventory-trends/route.ts`
- `/lib/campaign-planning.ts` (helper functions)

**Estimated effort:** 3-4 hours

**Acceptance criteria:**
- ✅ All endpoints return valid JSON
- ✅ Targeting exports work with real Facebook/Google upload
- ✅ Budget calculations mathematically correct
- ✅ Response times <200ms for all endpoints

---

### ⏳ Phase 3: Dashboard UI (Not Started)

**Goal:** Build admin dashboard page with 5 sections

**Tasks:**
- [ ] Create main dashboard page `/app/admin/campaign-planning/page.tsx`
- [ ] Build 5 section components (RecommendedCampaigns, SetupWizard, etc.)
- [ ] Implement CSV download buttons
- [ ] Add simple tables (no fancy charts needed for MVP)
- [ ] Mobile-responsive layout

**Files to create:**
- `/app/admin/campaign-planning/page.tsx`
- `/app/admin/campaign-planning/components/RecommendedCampaigns.tsx`
- `/app/admin/campaign-planning/components/SetupWizard.tsx`
- `/app/admin/campaign-planning/components/InventorySnapshot.tsx`
- `/app/admin/campaign-planning/components/BudgetCalculator.tsx`
- `/app/admin/campaign-planning/components/TrendsMonitor.tsx`

**Estimated effort:** 3-4 hours

**Acceptance criteria:**
- ✅ Dashboard loads in <1s
- ✅ Can export targeting CSVs successfully
- ✅ Budget calculator shows realistic ROI scenarios
- ✅ Mobile-friendly (works on phone)

---

### ⏳ Phase 4: Add DMA and Missing LotLinx Fields (Not Started)

**Goal:** Add DMA column and update feed sync to store all LotLinx data

**Why this is critical:**
- TikTok/Taboola require DMA targeting (no lat/long support)
- More accurate than city/state for campaign planning
- Matches how ad platforms organize campaigns

**Tasks:**
- [ ] Add `dma VARCHAR(100)` column to vehicles table
- [ ] Add `certified BOOLEAN` column (CPO status)
- [ ] Add `dol INT` column (days on lot - optional)
- [ ] Update `lib/feed-sync.ts` to map and save these fields from LotLinx
- [ ] Update database functions to use `dma` instead of `dealer_city || ', ' || dealer_state`
- [ ] Re-test all campaign planning functions
- [ ] Update plan document with actual DMA-based recommendations

**Files to modify:**
- `/supabase/migrations/[timestamp]_add_dma_columns.sql` (new)
- `/lib/feed-sync.ts` (update DbVehicle interface and mapping)
- `/supabase/migrations/[timestamp]_update_functions_use_dma.sql` (new)

**Estimated effort:** 2-3 hours

**Acceptance criteria:**
- ✅ DMA column populated with data from LotLinx
- ✅ Feed sync saves DMA on every sync (4x/day)
- ✅ Dashboard shows "Philadelphia DMA" instead of "Philadelphia, PA"
- ✅ Tier 1/Tier 2 campaigns appear (currently all Tier 3 due to city fragmentation)

---

### ⏳ Phase 5: Testing & Documentation (Not Started)

**Goal:** Ensure reliability and usability

**Tasks:**
- [ ] Write API endpoint tests (5 test files)
- [ ] Write helper function tests (`lib/campaign-planning.ts`)
- [ ] Integration test: Full workflow (select campaign → export → budget)
- [ ] Manual testing: Upload targeting CSV to real Facebook Ads Manager
- [ ] Document in `/docs/how-to/plan-ad-campaigns.md`

**Files to create:**
- `/app/api/admin/campaign-recommendations/__tests__/route.test.ts`
- `/app/api/admin/export-targeting/__tests__/route.test.ts`
- `/app/api/admin/inventory-snapshot/__tests__/route.test.ts`
- `/app/api/admin/calculate-budget/__tests__/route.test.ts`
- `/app/api/admin/inventory-trends/__tests__/route.test.ts`
- `/lib/__tests__/campaign-planning.test.ts`
- `/docs/how-to/plan-ad-campaigns.md`

**Estimated effort:** 2-3 hours

**Acceptance criteria:**
- ✅ Test coverage >80% for all new code
- ✅ All tests pass (`npm test`)
- ✅ How-to guide reviewed by user
- ✅ Targeting CSV successfully uploads to Facebook

---

## Technical Decisions

### Decision Log

**2025-01-13: Use /docs/plans/ for implementation plans**
- **Rationale:** Plans are working documents, not user-facing Diátaxis docs
- **Alternative considered:** Keep at docs root like qa-report-*.md
- **Outcome:** Created `/docs/plans/` directory for better organization

**2025-01-13: Simple password-based auth for admin endpoints**
- **Rationale:** Small team (2-3 people), don't need complex auth
- **Implementation:** Check `Authorization: Bearer <password>` header against `ADMIN_PASSWORD` env var
- **Alternatives considered:**
  - JWT tokens: Overkill for small team
  - API keys per user: Unnecessary complexity
  - Session-based: Requires state management
- **Benefits:**
  - ✅ One shared password for whole team
  - ✅ Easy to rotate (just change env var)
  - ✅ No database storage needed
  - ✅ Works with curl/Postman for testing
- **Security:**
  - Password stored in Vercel env vars (encrypted at rest)
  - HTTPS enforced in production (password never sent in clear text)
  - Can rotate password anytime without code changes
- **Usage:**
  ```bash
  curl -H "Authorization: Bearer your-secret-password" \
    https://carzo.net/api/admin/campaign-recommendations
  ```
- **Frontend:** Dashboard stores password in sessionStorage (user enters once per session)

**2025-01-13: Supabase CLI for migrations (not API)**
- **Research finding:** Supabase has no API endpoint for executing raw SQL
- **Correct tool:** Use `supabase migration repair` + `supabase db push` CLI commands
- **Why:** Migration tracking requires CLI (`supabase_migrations.schema_migrations` table)
- **For out-of-sync scenarios:**
  1. Use `supabase migration list --linked` to check status
  2. Use `supabase migration repair [timestamps] --status applied --linked` to sync tracking
  3. Use `supabase db push --linked` to apply new migrations only
- **Alternative:** `psql` with direct connection string (requires PostgreSQL client)

---

## Data Sources

### What We Have
1. ✅ **Inventory data** (`vehicles` table - 20k-70k vehicles)
   - Metro, make, model, body style, price
   - Dealer counts, diversity scores
   - DMA, lat/long for targeting

2. ✅ **Feed sync history** (`feed_sync_logs` table)
   - Inventory changes over time (4x/day)
   - 7-day trend analysis

### What We DON'T Have (Yet)
1. ❌ **US ZIP codes reference** (need to import)
2. ❌ **Paid traffic performance data** (no ads running yet)
3. ❌ **Conversion rates** (will come after 2 weeks of paid traffic)

---

## Risks & Mitigations

### Risk 1: ZIP Code Import Complexity
**Risk:** 40k records, may be slow or error-prone
**Mitigation:** Use batch insert, test with sample data first
**Status:** Monitoring

### Risk 2: Inventory Volatility
**Risk:** Recommendations based on current inventory, may change before launch
**Mitigation:** Show 7-day trend, alert on rapid depletion
**Status:** Addressed in design

### Risk 3: Targeting Export Formats
**Risk:** Facebook/Google may reject CSV format
**Mitigation:** Test with real upload before full implementation
**Status:** Will validate in Phase 4

---

## Post-MVP Roadmap

**PRIORITY: Add DMA and Missing LotLinx Fields**
**When:** Before Phase 2 (after MVP dashboard complete)

Tasks:
1. Add columns to vehicles table:
   - `dma VARCHAR(100)` - Designated Marketing Area (for TikTok/Taboola targeting)
   - `certified BOOLEAN` - CPO (Certified Pre-Owned) status
   - `dol INT` - Days on lot (optional, if useful)
2. Update feed sync (`lib/feed-sync.ts`) to save these fields from LotLinx
3. Update dashboard functions to use `dma` instead of `dealer_city || ', ' || dealer_state`
4. Re-test all campaign planning functions

**Rationale:**
- DMA required for TikTok/Taboola targeting (no lat/long support)
- Matches how ad platforms think (easier campaign naming)
- More accurate than city (includes suburbs automatically)
- Current MVP uses city/state as workaround (functional but less precise)

**Fields to IGNORE from LotLinx:**
- ❌ `Payout` - Always $0.80, no need to store
- ❌ `Priority` - Not useful for our model

---

**After 2 weeks of paid traffic:**
1. Build Performance Analytics Dashboard
   - Actual ROAS by campaign
   - Actual conversion rates (paid vs organic)
   - Platform comparison (Facebook vs Google)

2. Automate Ad Spend Logging
   - Integrate with Facebook Marketing API
   - Integrate with Google Ads API
   - Daily spend sync via cron

3. Campaign Auto-Optimization
   - Auto-pause campaigns when inventory < 50 vehicles
   - Auto-scale campaigns with ROAS > 1.5x
   - Daily email alerts for inventory depletion

---

## Changelog

### 2025-01-13
- **Created feature branch:** `feature/campaign-planning-dashboard`
- **Documented initial plan** in `/docs/plans/campaign-planning-dashboard.md`
- **Status:** Phase 1 starting (Data Foundation)

---

## Related Documentation

- **Business Context:** [docs/explanation/business-model.md](../explanation/business-model.md)
- **Architecture:** [docs/explanation/architecture-overview.md](../explanation/architecture-overview.md)
- **Database Schema:** [docs/reference/database-schema.md](../reference/database-schema.md)
- **Project Context:** [AGENTS.md](../../AGENTS.md)

---

**Last Updated:** 2025-11-13
**Next Review:** After Phase 1 completion
