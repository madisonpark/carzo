# How to Export Campaign Targeting Files

**Audience:** Media buyers preparing Facebook/Google ad campaigns

**Time Required:** 5-10 minutes per campaign

**Prerequisites:**
- Admin dashboard access (`/admin/campaign-planning`)
- Admin password for API authentication

---

## Overview

Export targeting files (location data) for Facebook Ads, Google Ads, and other platforms. Each platform requires different targeting formats:
- **Facebook:** Latitude/longitude coordinates (radius targeting)
- **Google:** ZIP codes (location targeting)
- **TikTok:** DMA names (designated marketing area)

---

## Quick Start

### Single Metro Export

**Scenario:** You want to run a "Toyota" campaign in Tampa, FL

```bash
# Facebook export (lat/long + radius)
curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
  "https://carzo.net/api/admin/export-targeting?metro=Tampa,%20FL&campaign_type=make&campaign_value=Toyota&platform=facebook" \
  --output tampa-toyota-facebook.csv

# Google export (ZIP codes)
curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
  "https://carzo.net/api/admin/export-targeting?metro=Tampa,%20FL&campaign_type=make&campaign_value=Toyota&platform=google" \
  --output tampa-toyota-google.csv
```

### Multi-Metro Export

**Scenario:** You want to run a "SUV" campaign across all qualifying metros

```bash
# Export targeting for all metros with 6+ SUVs
curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
  "https://carzo.net/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&platform=facebook&min_vehicles=6" \
  --output suv-multi-metro-facebook.csv
```

---

## API Reference

### Single Metro Export

**Endpoint:** `GET /api/admin/export-targeting`

**Query Parameters:**
| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `metro` | Yes | Metro name (city, state) | `Tampa, FL` |
| `platform` | No | Ad platform (default: facebook) | `facebook`, `google`, `tiktok` |
| `make` | No | Vehicle make to filter by | `Toyota`, `Honda`, `Ford` |
| `body_style` | No | Vehicle body style to filter by | `suv`, `truck`, `sedan` |
| `radius` | No | Targeting radius in miles (default: 25) | `30` |
| `format` | No | Output format (default: csv) | `csv`, `json` |

**Response:** CSV download

**Example (no filtering):**
```bash
curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
  "https://carzo.net/api/admin/export-targeting?metro=Atlanta,%20GA&platform=facebook" \
  --output atlanta-all-facebook.csv
```

**Example (filter by make):**
```bash
curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
  "https://carzo.net/api/admin/export-targeting?metro=Miami,%20FL&make=Honda&platform=google" \
  --output miami-honda-google.csv
```

**Example (filter by body style):**
```bash
curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
  "https://carzo.net/api/admin/export-targeting?metro=Phoenix,%20AZ&body_style=truck&platform=facebook" \
  --output phoenix-trucks-facebook.csv
```

**Example (filter by make AND body style):**
```bash
curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
  "https://carzo.net/api/admin/export-targeting?metro=Dallas,%20TX&make=Jeep&body_style=suv&platform=facebook" \
  --output dallas-jeep-suvs-facebook.csv
```

---

### Multi-Metro Export

**Endpoint:** `GET /api/admin/export-targeting-combined`

**Query Parameters:**
| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `campaign_type` | Yes | Campaign filter type | `make`, `body_style`, `make_body_style`, `make_model` |
| `campaign_value` | Yes | Value to filter by | `Toyota`, `suv`, `Kia suv`, `Jeep Wrangler` |
| `platform` | No | Ad platform (default: facebook) | `facebook`, `google` |
| `min_vehicles` | No | Minimum vehicles per metro (default: 6) | `10` |
| `max_metros` | No | Maximum metros to include (default: 100) | `50` |

**Response:** Single CSV file with all qualifying metros

**Example (all metros with 10+ Toyota vehicles):**
```bash
curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
  "https://carzo.net/api/admin/export-targeting-combined?campaign_type=make&campaign_value=Toyota&min_vehicles=10" \
  --output toyota-multi-metro.csv
```

**Example (all metros with 6+ SUVs):**
```bash
curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
  "https://carzo.net/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&min_vehicles=6" \
  --output suv-multi-metro.csv
```

**Example (limit to top 20 metros only):**
```bash
curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
  "https://carzo.net/api/admin/export-targeting-combined?campaign_type=make&campaign_value=Ford&max_metros=20" \
  --output ford-top20-metros.csv
```

---

## Campaign Type Reference (Multi-Metro Only)

The `/export-targeting-combined` endpoint supports campaign types for filtering across multiple metros. The `/export-targeting` endpoint uses simple `make` and `body_style` parameters instead.

### 1. Body Style Campaign

**Use case:** Target all vehicles of a specific body style (e.g., all SUVs, all trucks)

```bash
# Multi-metro
?campaign_type=body_style&campaign_value=suv&min_vehicles=8
```

**Valid body styles:** `suv`, `truck`, `sedan`, `coupe`, `convertible`, `wagon`, `van`, `hatchback`

### 2. Make Campaign

**Use case:** Target all vehicles from a specific manufacturer (e.g., all Toyota, all Honda)

```bash
# Multi-metro
?campaign_type=make&campaign_value=Toyota&min_vehicles=10
```

**Valid makes:** Any make in inventory (use title case: `Toyota`, `Honda`, `Ford`, `Jeep`)

### 3. Make + Body Style Campaign

**Use case:** Target specific make + body style combination (e.g., Jeep SUVs, Ford trucks)

```bash
# Multi-metro
?campaign_type=make_body_style&campaign_value=Jeep%20suv&min_vehicles=8
```

**Format:** `Make BodyStyle` (space-separated, URL-encoded)
- Example: `Jeep suv` → `Jeep%20suv`
- Example: `Ford truck` → `Ford%20truck`

### 4. Make + Model Campaign

**Use case:** Target specific make + model (e.g., Jeep Wrangler, Ford F-150)

```bash
# Multi-metro
?campaign_type=make_model&campaign_value=Jeep%20Wrangler&min_vehicles=5
```

**Format:** `Make Model` (space-separated, URL-encoded)
- Example: `Jeep Wrangler` → `Jeep%20Wrangler`
- Example: `Ford F-150` → `Ford%20F-150`

---

## Output Formats

### Facebook CSV (Lat/Long)

**Format:** One row per dealer location with radius targeting

```csv
latitude,longitude,radius_miles,dealer_name,vehicle_count,destination_url
27.9506,-82.4572,25,"Tampa Toyota",87,https://carzo.net/search?make=Toyota
27.9234,-82.3456,25,"Tampa Honda",42,https://carzo.net/search?make=Toyota
```

**Upload to Facebook:**
1. Facebook Ads Manager → Create Campaign
2. Ad Set → Locations → Bulk Locations
3. Upload CSV
4. Radius already set (25 miles per location)

### Google CSV (ZIP Codes)

**Format:** One row per ZIP code

```csv
zip_code,destination_url
33602,https://carzo.net/search?make=Toyota
33603,https://carzo.net/search?make=Toyota
33604,https://carzo.net/search?make=Toyota
```

**Upload to Google Ads:**
1. Google Ads → Campaign Settings → Locations
2. Bulk Locations → Upload ZIP Codes
3. Paste ZIP codes from CSV

### Multi-Metro CSV (Facebook)

**Format:** One row per metro with centroid + radius

```csv
metro,latitude,longitude,radius_miles,distance_unit,destination_url,vehicle_count,dealers
"Tampa, FL",27.9506,-82.4572,30,mile,https://carzo.net/search?make=Toyota,1337,19
"Miami, FL",25.7617,-80.1918,30,mile,https://carzo.net/search?make=Toyota,982,14
```

**How centroids are calculated:**
- Average latitude/longitude of all dealer locations in metro
- Radius set to 30 miles (covers entire metro + surrounding area)

---

## Common Scenarios

### Scenario 1: Launch First Campaign

**Goal:** Test Facebook ads for SUVs in top 5 metros

**Steps:**
1. Export multi-metro targeting for SUVs (min 20 vehicles per metro):
   ```bash
   curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
     "https://carzo.net/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&min_vehicles=20&max_metros=5" \
     --output suv-top5-metros.csv
   ```

2. Upload to Facebook Ads Manager (bulk locations)

3. Create ad set with:
   - Budget: Split evenly across 5 metros
   - Creative: "Find Your Perfect SUV - Thousands Available Near You"
   - Landing page: `https://carzo.net/search?body_style=suv`

### Scenario 2: Scale Winning Campaign

**Goal:** You ran "Toyota" in Tampa and it's profitable. Scale to all metros with 10+ Toyotas.

**Steps:**
1. Export all qualifying metros:
   ```bash
   curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
     "https://carzo.net/api/admin/export-targeting-combined?campaign_type=make&campaign_value=Toyota&min_vehicles=10" \
     --output toyota-scale.csv
   ```

2. Upload to Facebook/Google

3. Increase budget proportionally to number of metros

### Scenario 3: Niche Campaign

**Goal:** Target Jeep Wranglers specifically (high demand, high margins)

**Steps:**
1. Export all metros with 5+ Wranglers:
   ```bash
   curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
     "https://carzo.net/api/admin/export-targeting-combined?campaign_type=make_model&campaign_value=Jeep%20Wrangler&min_vehicles=5" \
     --output wrangler-campaign.csv
   ```

2. Upload to Facebook/Google

3. Create niche ad creative ("Adventure-Ready Jeep Wranglers")

---

## Inventory Filtering Benefits

### Why Use Inventory Filtering?

**Without filtering (old behavior):**
- Export includes ALL vehicles in metro
- You create campaign for "Toyota" but targeting includes Honda dealers
- Wasted impressions on non-Toyota inventory

**With filtering (new behavior):**
- Export includes ONLY dealers with matching inventory
- Campaign for "Toyota" targets ONLY dealers selling Toyotas
- Better ad relevance, higher CTR, lower CPC

### Performance Impact

**Estimated improvements with inventory filtering:**
- **+15-25% CTR** (more relevant targeting)
- **-20-30% CPC** (better Quality Score)
- **+10-15% conversion rate** (users see what ad promised)

**Example:**
- Campaign: "Ford Trucks in Dallas"
- Without filtering: 50 dealer locations (only 30 have Ford trucks)
- With filtering: 30 dealer locations (all have Ford trucks)
- Result: 40% fewer wasted impressions, 25% lower CPC

---

## Troubleshooting

### Error: "No metros found with >= X vehicles"

**Cause:** Inventory too low for your filters

**Solutions:**
1. Lower `min_vehicles` parameter (try 5 or 6 instead of 10)
2. Broaden campaign type (try `make` instead of `make_model`)
3. Check current inventory with:
   ```bash
   curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
     "https://carzo.net/api/admin/inventory-snapshot"
   ```

### Error: "Invalid campaign_type"

**Cause:** Typo in `campaign_type` parameter

**Valid values:** `body_style`, `make`, `make_body_style`, `make_model` (all lowercase with underscore)

### Error: "campaign_value cannot be empty"

**Cause:** Missing or empty `campaign_value` parameter

**Fix:** Provide valid value:
- Body style: `suv`, `truck`, `sedan`
- Make: `Toyota`, `Honda`, `Ford` (title case)
- Make + body style: `Jeep suv` (space-separated)
- Make + model: `Jeep Wrangler` (space-separated)

---

## API Rate Limits

**All admin endpoints:** 50 requests per minute

If you hit rate limit (429 response), wait 60 seconds before retrying.

**Headers returned:**
- `X-RateLimit-Limit`: Total requests allowed per window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Timestamp when window resets

---

## Security Notes

**Admin password storage:**
- Never commit `ADMIN_PASSWORD` to git
- Store in `.env.local` (gitignored)
- Rotate password periodically (change in Vercel env vars)

**API authentication:**
```bash
# Correct
curl -H "Authorization: Bearer ${ADMIN_PASSWORD}" ...

# Incorrect (no "Bearer" prefix)
curl -H "Authorization: ${ADMIN_PASSWORD}" ...
```

---

## Related Documentation

- [Campaign Planning Dashboard](/docs/plans/campaign-planning-dashboard.md) - Overall implementation plan
- [Database Schema](/docs/reference/database-schema.md) - PostGIS functions used for targeting
- [API Endpoint Pattern](/docs/how-to/add-api-endpoint.md) - How these endpoints work

---

**Last Updated:** 2025-11-19
**Version:** 2.0 (with inventory filtering)
