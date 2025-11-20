# Facebook Pixel API Reference

Helper functions for interacting with the Facebook Pixel. Located in `lib/facebook-pixel.ts`.

## `pageview()`

Tracks a page view event. This is automatically called on route changes by `components/FacebookPixel.tsx`.

```typescript
import * as fbq from '@/lib/facebook-pixel';

fbq.pageview();
```

## `event(name, options)`

Tracks a custom or standard event.

**Parameters:**
*   `name` (string): The name of the event (e.g., 'Purchase', 'Lead', 'AddToCart').
*   `options` (object, optional): Additional data to send with the event.

**Example:**
```typescript
import * as fbq from '@/lib/facebook-pixel';

fbq.event('AddToCart', { content_ids: ['123'], content_type: 'product' });
```

## `trackPurchase(value, currency)`

Specific helper for tracking revenue-generating clicks (outbound clicks to dealers).

**Parameters:**
*   `value` (number, default: `0.80`): The revenue value of the click.
*   `currency` (string, default: `'USD'`): The currency code.

**Example:**
```typescript
import { trackPurchase } from '@/lib/facebook-pixel';

// Track a standard $0.80 click
trackPurchase();

// Track with custom value
trackPurchase(1.50, 'USD');
```
