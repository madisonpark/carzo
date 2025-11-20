# How to Setup Facebook Pixel

This guide explains how to configure and verify the Facebook Pixel integration in Carzo.

## 1. Configuration

The Pixel ID is managed via environment variables for security and flexibility across environments.

### Local Development
1.  Create or edit `.env.local` in the project root.
2.  Add your Pixel ID:
    ```bash
    NEXT_PUBLIC_FB_PIXEL_ID=your_pixel_id_here
    ```

### Production (Vercel)
1.  Go to your Vercel project settings.
2.  Navigate to **Environment Variables**.
3.  Add `NEXT_PUBLIC_FB_PIXEL_ID` with the live Pixel ID.

## 2. Verification

To verify that the pixel is firing correctly:

1.  **Install Helper:** Install the [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) Chrome extension.
2.  **Check PageView:**
    *   Navigate to any page on `localhost:3000` or the production site.
    *   Click the extension icon. You should see a green checkmark next to `PageView`.
3.  **Check Purchase (Revenue Event):**
    *   Go to a Vehicle Detail Page (VDP).
    *   Click the "See Full Photo Gallery" button.
    *   The extension should show a `Purchase` event with:
        *   Value: `0.80`
        *   Currency: `USD`

## 3. Troubleshooting

*   **Pixel ID not found:** Ensure `NEXT_PUBLIC_FB_PIXEL_ID` is set in your environment variables. Restart the dev server after changing `.env.local`.
*   **Duplicate PageViews:** The integration is designed to fire `PageView` only once per route change via `useEffect`. Ensure you haven't manually added the pixel script elsewhere.
