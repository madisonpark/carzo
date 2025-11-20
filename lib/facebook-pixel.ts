type FacebookPixelWindow = Window & {
  fbq: any;
  _fbq: any;
};

export const FB_PIXEL_ID = '1565494931112703';

export const pageview = () => {
  const w = window as unknown as FacebookPixelWindow;
  if (w.fbq) {
    w.fbq('track', 'PageView');
  }
};

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const event = (name: string, options = {}) => {
  const w = window as unknown as FacebookPixelWindow;
  if (w.fbq) {
    w.fbq('track', name, options);
  }
};

export const trackPurchase = (value: number = 0.80, currency: string = 'USD') => {
  event('Purchase', { value, currency });
};
