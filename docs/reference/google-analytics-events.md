# Google Analytics 4 Event Reference

This document provides a comprehensive reference for all custom Google Analytics 4 (GA4) events implemented in the Carzo project. These events are tracked using the `lib/google-analytics.ts` library.

**Measurement ID:** Configured via `NEXT_PUBLIC_GA_MEASUREMENT_ID` (e.g., `G-FC4SWNKECE`)

All events are sent via the `sendEvent` wrapper function in `lib/google-analytics.ts`, which ensures `gtag()` is available before attempting to send data.

---

## 1. Revenue Events

### `dealer_click`

**Description:** Tracks a user's click on a dealer call-to-action (CTA), which is a primary revenue-generating action.
**When it fires:** When a user clicks any CTA that leads to a dealer VDP or contact form.
**Location:** `hooks/useClickTracking.ts`
**Parameters:**

*   `dealer_id` (string, required): Unique identifier for the dealer.
*   `vehicle_id` (string, required): Unique identifier for the vehicle.
*   `vehicle_vin` (string, optional): Vehicle Identification Number.
*   `is_billable` (boolean): Indicates if the click is considered billable (defaults to `true`, adjusted after API response).
*   `cta_clicked` (string): Type of CTA clicked (e.g., `'primary'`, `'photos'`, `'history'`, `'payment'`).
*   `flow` (string): The A/B test flow variant the user is currently in (e.g., `'full'`, `'direct'`, `'vdp-only'`).
*   `utm_source` (string, optional): UTM source from URL.
*   `utm_medium` (string, optional): UTM medium from URL.
*   `utm_campaign` (string, optional): UTM campaign from URL.
*   `value` (number): Hardcoded revenue value for a click (`0.80`).
*   `currency` (string): Currency of the revenue value (`'USD'`).

---

## 2. User Journey Events

### `search`

**Description:** Tracks when a user performs a vehicle search.
**When it fires:** On initial page load of `/search` or when search parameters change.
**Location:** `components/Search/SearchResults.tsx`
**Parameters:**

*   `search_term` (string): Constructed from `make` and `model` (e.g., "Toyota Camry").
*   `make` (string, optional): The selected vehicle make.
*   `model` (string, optional): The selected vehicle model.
*   `condition` (string, optional): Vehicle condition (e.g., 'new', 'used').
*   `bodyStyle` (string, optional): Vehicle body style.
*   `minPrice` (number, optional): Minimum price filter.
*   `maxPrice` (number, optional): Maximum price filter.
*   `minYear` (number, optional): Minimum year filter.
*   `maxYear` (number, optional): Maximum year filter.
*   `zipCode` (string, optional): Zip code used for search (if available).
*   `radius` (number, optional): Search radius in miles.
*   `flow` (string, optional): The A/B test flow variant.

### `view_search_results`

**Description:** Tracks the display of search results to the user.
**When it fires:** After search results are loaded and displayed on the `/search` page.
**Location:** `components/Search/SearchResults.tsx`
**Parameters:**

*   `result_count` (number): The total number of vehicles found for the search query.
*   `make` (string, optional): The selected vehicle make.
*   `model` (string, optional): The selected vehicle model.
*   `zipCode` (string, optional): Zip code used for search (if available).
*   `flow` (string, optional): The A/B test flow variant.

### `view_item` (Vehicle Impression)

**Description:** Tracks a vehicle impression, either on a Vehicle Details Page (VDP) or within search results.
**When it fires:**
    *   On VDP load (`app/vehicles/[vin]/page.tsx`).
    *   *(Planned for future: When a vehicle card becomes visible in the viewport on the search results page (`components/Search/VehicleCard.tsx`)).*
**Location:** `components/VDP/VehicleBridgePage.tsx`
**Parameters:**

*   `items` (array of objects): An array containing details of the viewed item.
    *   `item_id` (string): Unique ID of the vehicle.
    *   `item_name` (string): Formatted name (e.g., "2022 Honda Civic").
    *   `price` (number): Vehicle price.
    *   `item_category` (string): Vehicle make.
    *   `item_category2` (string): Vehicle model.
*   `page_type` (string): Indicates where the impression occurred (`'vdp'`, `'search_result'`, `'related'`).
*   `flow` (string): The A/B test flow variant.

---

## 3. A/B Testing Events

### `flow_variant_exposure`

**Description:** Tracks which A/B test flow variant a user is exposed to.
**When it fires:** On VDP load or any key page where the flow is determined.
**Location:** `components/VDP/VehicleBridgePage.tsx`
**Parameters:**

*   `flow` (string): The A/B test flow variant (e.g., `'full'`, `'direct'`, `'vdp-only'`).

### `auto_redirect`

**Description:** Tracks when a VDP-only flow (Flow B) auto-redirects the user to a dealer's website.
**When it fires:** Before the `window.open()` call for an auto-redirect on Flow B VDPs.
**Location:** `components/VDP/VehicleBridgePage.tsx` (within `VDPRedirect` component).
**Parameters:**

*   `vehicle_id` (string): Unique identifier for the vehicle.
*   `dealer_id` (string): Unique identifier for the dealer.
*   `delay_ms` (number): The delay in milliseconds before the redirect occurs.

---

## 4. Location Events

### `location_detected`

**Description:** Tracks when a user's location is detected or manually entered.
**When it fires:**
    *   When a user manually enters a zip code.
    *   *(Planned for future: When IP-based location detection occurs).*
**Location:** `components/Location/ZipCodeInput.tsx`
**Parameters:**

*   `zipCode` (string, optional): The detected or entered zip code.
*   `city` (string, optional): The city corresponding to the location.
*   `state` (string, optional): The state corresponding to the location.
*   `method` (string): How the location was determined (`'manual'`, `'ip'`, `'browser'`).

### `radius_change`

**Description:** Tracks when a user adjusts the search radius.
**When it fires:** *(Future implementation, likely in a radius filter component).*
**Location:** `lib/google-analytics.ts` (function defined, but no current integration point).
**Parameters:**

*   `radius` (number): The new search radius in miles.

---

## 5. Engagement Events

### `filter_change`

**Description:** Tracks when a user applies or changes a filter on the search results page.
**When it fires:** When a filter (e.g., make, model, price range) is updated.
**Location:** `components/Search/FilterSidebar.tsx`
**Parameters:**

*   `filter_type` (string): The type of filter changed (e.g., `'make'`, `'model'`, `'price'`).
*   `filter_value` (string): The new value of the filter.
*   `result_count` (number, optional): The number of results after applying the filter (if available).

### `view_related_vehicles`

**Description:** Tracks when a user views a section of related vehicles.
**When it fires:** *(Future implementation: When a "Related Vehicles" section becomes visible).*
**Location:** `lib/google-analytics.ts` (function defined, but no current integration point).
**Parameters:**

*   `vehicle_id` (string): The ID of the primary vehicle the related vehicles are shown for.
*   `count` (number): The number of related vehicles displayed.

---

## 6. Error Events

### `no_results`

**Description:** Tracks when a search query yields no results.
**When it fires:** When `view_search_results` would normally fire, but `result_count` is zero.
**Location:** `lib/google-analytics.ts` (function defined, but no current integration point in `SearchResults`).
**Parameters:**

*   `search_term` (string, optional): The search term that yielded no results.
*   *(All other search parameters from `trackSearch` can also be passed).*

### `location_detection_failed`

**Description:** Tracks when an automatic location detection attempt fails.
**When it fires:** *(Future implementation: When a location detection service fails).*
**Location:** `lib/google-analytics.ts` (function defined, but no current integration point).
**Parameters:**

*   `error_message` (string): Details about the failure.

---
