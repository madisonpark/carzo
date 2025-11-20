type FacebookPixelFunction = {
  (command: 'track', eventName: string, params?: Record<string, unknown>): void;
  (command: 'init', pixelId: string): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: (...args: unknown[]) => void;
};

type FacebookPixelWindow = Window & {
  fbq?: FacebookPixelFunction;
  _fbq?: FacebookPixelFunction;
};

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || '';

export const pageview = () => {
  try {
    const w = window as unknown as FacebookPixelWindow;
    if (w.fbq) {
      w.fbq('track', 'PageView');
    }
  } catch (error) {
    console.warn('Facebook Pixel error:', error);
  }
};

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const event = (name: string, options = {}) => {
  try {
    const w = window as unknown as FacebookPixelWindow;
    if (w.fbq) {
      w.fbq('track', name, options);
    }
  } catch (error) {
    console.warn('Facebook Pixel error:', error);
  }
};

export const trackPurchase = (value: number = 0.80, currency: string = 'USD') => {
  event('Purchase', { value, currency });
};
