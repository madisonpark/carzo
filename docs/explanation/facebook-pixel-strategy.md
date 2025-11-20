# Facebook Pixel Strategy

## Business Goal
We use paid traffic (Facebook Ads) to drive users to our site. Our revenue model depends on users clicking outbound links to dealer websites. To optimize our ad spend (ROAS), we must feed this conversion data back to Facebook.

## The "Purchase" Event
Unlike a traditional e-commerce site where a "Purchase" happens on a checkout page, our "Purchase" event is defined as **the click that generates revenue for us**.

*   **Event:** `Purchase`
*   **Trigger:** Click on "See Full Photo Gallery", "View at Dealer", or similar CTAs.
*   **Value:** `$0.80` (Our standard revenue per click).

## Attribution Flow
1.  User sees Ad on Facebook → Clicks to Carzo.
2.  Facebook appends `fbclid` (Facebook Click ID) to the URL.
3.  Pixel on Carzo.net initializes and tracks the user session.
4.  User clicks "See Full Photo Gallery".
5.  We fire `fbq('track', 'Purchase', { value: 0.80, currency: 'USD' })`.
6.  Facebook matches this event back to the original ad click, attributing the $0.80 revenue to that specific campaign/ad set.

## Why Client-Side Tracking?
We currently use client-side pixel tracking for simplicity and immediacy. The event fires exactly when the user interaction occurs.

*   **Pros:** Easy to implement, standard industry practice.
*   **Cons:** Can be blocked by ad blockers.
*   **Future Optimization:** Implement Facebook Conversions API (CAPI) server-side to capture events blocked by browsers.
