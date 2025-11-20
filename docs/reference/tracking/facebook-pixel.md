# Facebook Pixel Reference

**Pixel ID:** `1565494931112703`

## Overview
We use the Meta (Facebook) Pixel to track user engagement and ad conversion performance. The primary goal is to measure Return on Ad Spend (ROAS) by tracking the "Purchase" event when a user clicks out to a dealer's website.

## Events Tracked

### 1. PageView
*   **Trigger:** Fires on every page load and route change.
*   **Implementation:** Handled automatically by `components/FacebookPixel.tsx` via `useEffect` on pathname changes.

### 2. Purchase
*   **Trigger:** Fires when a user clicks any link that leads to a Dealer VDP.
*   **Value:** `$0.80` USD (Fixed revenue value per click).
*   **Locations:**
    1.  **VDP Primary/Secondary CTAs:** `hooks/useClickTracking.ts`
    2.  **Search Result Direct Clicks (Flow A):** `components/Search/VehicleCard.tsx`
    3.  **VDP Auto-Redirect (Flow B):** `components/VDP/VehicleBridgePage.tsx`

## Implementation Details

### Files
*   `components/FacebookPixel.tsx`: Injects the base pixel code using Next.js `Script` (strategy: `afterInteractive`).
*   `lib/facebook-pixel.ts`: Helper functions (`pageview`, `trackPurchase`) for type-safe event firing.

### Testing
To verify the pixel is firing:
1.  Install the **Meta Pixel Helper** Chrome extension.
2.  Visit the site. Verify `PageView` fires.
3.  Click a "See Full Photo Gallery" button. Verify `Purchase` fires with parameters:
    *   `value`: 0.80
    *   `currency`: 'USD'
