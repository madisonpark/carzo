# Manual Testing Guide: A/B Test Flow Implementation

**Dev Server**: http://localhost:3000
**Branch**: `feature/ab-test-flow-routing`
**Tester**: [Your Name]
**Date**: 2025-11-12

---

## Pre-Testing Setup

### 1. Start Dev Server
```bash
npm run dev
```
Server should be running at: http://localhost:3000

### 2. Open Browser DevTools
- **Chrome**: Cmd+Option+J (Mac) or Ctrl+Shift+J (Windows)
- **Network Tab**: Monitor API calls
- **Console Tab**: Watch for errors

### 3. Clear Browser Data (Recommended)
- Clear cookies to reset user tracking
- Clear localStorage/sessionStorage
- Start with fresh state

---

## Flow A: Direct to Dealer Testing

**Goal**: Verify vehicle cards link directly to dealer sites, bypassing VDP

### Test Case A1: Basic Flow A Navigation

**Steps**:
1. Navigate to: http://localhost:3000/search?flow=direct
2. Observe vehicle cards
3. Click on any vehicle card

**Expected Results**:
- ✅ Vehicle card button shows "View at Dealer" (not "See Full Photo Gallery")
- ✅ Button has ExternalLink icon (not Camera icon)
- ✅ Click opens dealer site in NEW TAB
- ✅ Original tab stays on search page (doesn't navigate away)
- ✅ Network tab shows POST to `/api/track-click` with:
  ```json
  {
    "flow": "direct",
    "ctaClicked": "serp_direct"
  }
  ```

**Pass/Fail**: [ ]

---

### Test Case A2: Flow Preservation with Filters

**Steps**:
1. Navigate to: http://localhost:3000/search?flow=direct
2. Select a make (e.g., Toyota)
3. Check URL after filter applied
4. Click a vehicle card

**Expected Results**:
- ✅ URL becomes: `/search?flow=direct&make=toyota`
- ✅ Flow parameter preserved after filter change
- ✅ Vehicle card still shows "View at Dealer"
- ✅ Click still opens dealer site in new tab

**Pass/Fail**: [ ]

---

### Test Case A3: Flow Preservation with Pagination

**Steps**:
1. Navigate to: http://localhost:3000/search?make=toyota&flow=direct
2. Click "Next Page" or page number
3. Check URL and vehicle card behavior

**Expected Results**:
- ✅ URL becomes: `/search?make=toyota&flow=direct&page=2`
- ✅ Flow parameter preserved
- ✅ Vehicle cards still show "View at Dealer"

**Pass/Fail**: [ ]

---

### Test Case A4: Flow Preservation with Sorting

**Steps**:
1. Navigate to: http://localhost:3000/search?flow=direct
2. Change sort to "Price: Low to High"
3. Check URL and behavior

**Expected Results**:
- ✅ URL becomes: `/search?flow=direct&sortBy=price_asc`
- ✅ Flow parameter preserved
- ✅ Results re-sorted
- ✅ Vehicle cards still show "View at Dealer"

**Pass/Fail**: [ ]

---

### Test Case A5: Clear Filters Preserves Flow

**Steps**:
1. Navigate to: http://localhost:3000/search?make=toyota&price=20000&flow=direct
2. Click "Clear Filters" button
3. Check URL

**Expected Results**:
- ✅ URL becomes: `/search?flow=direct` (flow preserved, filters cleared)
- ✅ Vehicle cards still show "View at Dealer"

**Pass/Fail**: [ ]

---

### Test Case A6: Edge Case - Missing dealer_vdp_url

**Note**: This requires a vehicle with no `dealer_vdp_url`. You may need to temporarily modify data or mock this.

**Expected Results**:
- ✅ Vehicle card falls back to VDP flow (not direct)
- ✅ Button shows "See Full Photo Gallery"
- ✅ Click goes to `/vehicles/[vin]?flow=direct` (not dealer site)

**Pass/Fail**: [ ] or N/A

---

## Flow B: VDP-Only Testing

**Goal**: Verify VDP auto-redirects to dealer site after tracking

### Test Case B1: Basic Flow B Auto-Redirect

**Steps**:
1. Find any vehicle VIN from search (e.g., copy from a vehicle card)
2. Navigate to: http://localhost:3000/vehicles/[VIN]?flow=vdp-only
3. Observe page behavior

**Expected Results**:
- ✅ Page shows loading spinner with car icon
- ✅ Text: "Redirecting to [YEAR MAKE MODEL]"
- ✅ Shows dealer info: "[DEALER_NAME] • [CITY], [STATE]"
- ✅ After ~1.5 seconds, dealer site opens in NEW TAB
- ✅ Original tab remains on redirect page
- ✅ Network tab shows TWO requests:
  - POST to `/api/track-impression` with `flow: 'vdp-only'`
  - POST to `/api/track-click` with `flow: 'vdp-only'` and `ctaClicked: 'vdp_redirect'`

**Pass/Fail**: [ ]

---

### Test Case B2: Flow B from Search

**Steps**:
1. Navigate to: http://localhost:3000/search?flow=vdp-only
2. Click any vehicle card
3. Observe behavior

**Expected Results**:
- ✅ Vehicle card shows "See This Vehicle" (not "See Full Photo Gallery")
- ✅ Click goes to `/vehicles/[vin]?flow=vdp-only`
- ✅ VDP auto-redirects as in Test Case B1

**Pass/Fail**: [ ]

---

### Test Case B3: Edge Case - Missing dealer_vdp_url

**Note**: Requires vehicle with no `dealer_vdp_url`

**Expected Results**:
- ✅ VDP shows error state
- ✅ Error icon (⚠️) displayed
- ✅ Text: "Unable to Redirect"
- ✅ Message: "Dealer URL not available. This vehicle listing may be incomplete."
- ✅ "Return to Search" button displayed
- ✅ Click button goes to `/search`

**Pass/Fail**: [ ] or N/A

---

## Flow C: Full Funnel Testing (Default)

**Goal**: Verify standard VDP bridge flow works correctly

### Test Case C1: Default Flow (No Parameter)

**Steps**:
1. Navigate to: http://localhost:3000/search
2. Click any vehicle card
3. Observe VDP page

**Expected Results**:
- ✅ Vehicle card shows "See Full Photo Gallery"
- ✅ Click goes to `/vehicles/[vin]` (no flow parameter)
- ✅ VDP shows FULL bridge page (not redirect)
- ✅ Photo gallery tease visible (blurred thumbnails + "+X More")
- ✅ Primary CTA: "See Full Photo Gallery" button
- ✅ Click CTA opens dealer site in NEW TAB

**Pass/Fail**: [ ]

---

### Test Case C2: Explicit Flow C Parameter

**Steps**:
1. Navigate to: http://localhost:3000/search?flow=full
2. Verify behavior matches Test Case C1

**Expected Results**:
- ✅ Same behavior as default (no parameter)

**Pass/Fail**: [ ]

---

### Test Case C3: Invalid Flow Parameter

**Steps**:
1. Navigate to: http://localhost:3000/search?flow=invalid
2. Observe behavior

**Expected Results**:
- ✅ Defaults to Flow C (full funnel)
- ✅ Vehicle cards show "See Full Photo Gallery"
- ✅ VDP shows full bridge page (not redirect)

**Pass/Fail**: [ ]

---

## Database Verification

**Goal**: Verify click tracking stores correct flow values

### Test Case DB1: Flow Tracking in Database

**Steps**:
1. Perform Test Cases A1, B1, and C1 (one click each)
2. Open Supabase Dashboard → Table Editor → `clicks`
3. View most recent 3 clicks

**Expected Results**:
- ✅ Flow A click has `flow: 'direct'` and `cta_clicked: 'serp_direct'`
- ✅ Flow B click has `flow: 'vdp-only'` and `cta_clicked: 'vdp_redirect'`
- ✅ Flow C click has `flow: 'full'` and `cta_clicked: 'primary'`
- ✅ All have `is_billable: true` (assuming first click to each dealer)

**Pass/Fail**: [ ]

---

### Test Case DB2: Impression Tracking

**Steps**:
1. Perform Test Case B1 (VDP redirect)
2. Check `impressions` table in Supabase

**Expected Results**:
- ✅ One impression with `flow: 'vdp-only'` and `page_type: 'vdp'`

**Pass/Fail**: [ ]

---

## Cross-Browser Testing (Optional but Recommended)

Repeat key test cases in:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## Mobile Testing (Optional but Recommended)

**Steps**:
1. Open DevTools → Device Toolbar (Cmd+Shift+M)
2. Select iPhone or Android device
3. Repeat Flow A, B, C tests

**Expected Results**:
- ✅ All flows work on mobile
- ✅ New tabs open correctly
- ✅ Click tracking works

**Pass/Fail**: [ ]

---

## Known Limitations

1. **Localhost Testing**: `dealer_vdp_url` points to external dealer sites. These will open in new tabs, but you can't fully test the dealer site experience locally.

2. **User Tracking**: Cookie-based tracking requires browser cookies enabled. Private/Incognito mode may affect behavior.

3. **Network Delays**: Click tracking uses `keepalive: true`. In rare cases, extremely fast navigation might not complete tracking (unlikely in practice).

---

## Troubleshooting

### Issue: Click tracking not showing in Network tab
- **Solution**: Open DevTools BEFORE clicking, ensure Network tab is recording

### Issue: Dealer site doesn't open
- **Solution**: Check browser popup blocker settings, allow popups for localhost:3000

### Issue: Flow parameter not preserved
- **Solution**: Check for JavaScript errors in Console tab, ensure dev server is running

### Issue: "Unable to Redirect" error on valid vehicle
- **Solution**: Check vehicle record in Supabase, ensure `dealer_vdp_url` is not NULL

---

## Testing Checklist

**Flow A (Direct)**:
- [ ] A1: Basic navigation
- [ ] A2: Filter preservation
- [ ] A3: Pagination preservation
- [ ] A4: Sorting preservation
- [ ] A5: Clear filters preservation
- [ ] A6: Missing URL edge case (optional)

**Flow B (VDP-Only)**:
- [ ] B1: Auto-redirect
- [ ] B2: From search
- [ ] B3: Missing URL edge case (optional)

**Flow C (Full)**:
- [ ] C1: Default (no param)
- [ ] C2: Explicit param
- [ ] C3: Invalid param

**Database**:
- [ ] DB1: Flow tracking
- [ ] DB2: Impression tracking

**Cross-Browser** (optional):
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Mobile** (optional):
- [ ] iOS simulation
- [ ] Android simulation

---

## Sign-Off

**Tester**: ___________________________
**Date**: ___________________________
**Overall Result**: PASS / FAIL
**Notes**:

---

## Next Steps After Testing

1. **If ALL PASS**:
   - Document any observations
   - Proceed to Phase 6 (Analytics Dashboard)
   - Prepare for production deployment

2. **If ANY FAIL**:
   - Document failure details
   - Create GitHub issue
   - Fix bugs
   - Re-test failed cases
   - Repeat until all pass

---

**Happy Testing! 🚗**
