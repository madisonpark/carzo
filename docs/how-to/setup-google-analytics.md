# Setup Google Analytics with Carzo

This guide details how to set up and verify Google Analytics 4 (GA4) integration within the Carzo project, leveraging the `@next/third-parties` package for optimized performance.

## 1. Installation

The `@next/third-parties` package is a core dependency. If it's not already installed, run:

```bash
npm install @next/third-parties@latest
```

## 2. Adding the GoogleAnalytics Component

The `GoogleAnalytics` component needs to be added to the root layout of the application (`app/layout.tsx`). This ensures that GA4 is loaded on all pages and automatically tracks page views.

**File:** `app/layout.tsx`

1.  **Import:** Add the import statement at the top of the file:
    ```typescript
    import { GoogleAnalytics } from "@next/third-parties/google";
    ```
2.  **Component Placement:** Place the `<GoogleAnalytics />` component just before the closing `</html>` tag, after the `</body>` tag. Use the environment variable `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
    ```typescript
          </body>
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""} />
        </html>
    ```

**Environment Variable:**
Ensure `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set in your `.env.local` and Vercel project settings.

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-FC4SWNKECE
```

## 3. Event Tracking Library

All custom event tracking logic resides in `lib/google-analytics.ts`. This file exports a `sendEvent` function, which acts as a wrapper around the global `gtag()` function. It also uses the environment variable `NEXT_PUBLIC_GA_MEASUREMENT_ID`.

Refer to `docs/reference/google-analytics-events.md` for a comprehensive list of all custom events tracked.

## 4. Verification

To verify that Google Analytics is correctly set up and events are firing:

### Using Browser Developer Tools

1.  Open your browser's developer tools (usually F12 or right-click -> Inspect).
2.  Go to the "Network" tab.
3.  Filter for requests containing `collect`. These are GA4 data collection requests.
4.  Navigate through the Carzo application and perform actions that should trigger events (e.g., searches, clicks on vehicle cards, zip code input).
5.  Observe the `collect` requests. Inspect their payload (under "Payload" or "Headers" tab) to ensure the correct event names and parameters (`en`, `ep`, `epn`) are being sent.

### Using GA4 Real-Time Reports

1.  Log in to your Google Analytics 4 property (G-FC4SWNKECE).
2.  Navigate to "Realtime" reports.
3.  As you interact with the Carzo application, you should see your activity reflected in the real-time reports, including page views and custom events as they are triggered.

### Custom Event Testing

Refer to the `docs/reference/google-analytics-events.md` for details on specific events and their expected parameters. Perform actions in the application that are designed to trigger these events and verify their appearance in both browser network requests and GA4 Real-Time reports.

## 5. Troubleshooting Common Issues

*   **`gtag` is not defined:** Ensure the `GoogleAnalytics` component is correctly placed in `app/layout.tsx` and that the `@next/third-parties` package is installed.
*   **Events not appearing in GA4:**
    *   Verify the `gaId` in `GoogleAnalytics` component matches the GA4 property ID.
    *   Check for network errors or ad blockers preventing `collect` requests.
    *   Ensure events are being sent with `sendEvent()` from `lib/google-analytics.ts`.
    *   Allow up to 24-48 hours for data to fully process and appear in standard GA4 reports (Real-time reports should be instant).
*   **Incorrect event parameters:** Double-check the parameters passed to `sendEvent()` or specific tracking functions in `lib/google-analytics.ts` against the expected schema.
