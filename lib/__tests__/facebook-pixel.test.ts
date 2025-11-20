import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as pixel from '../facebook-pixel';

describe('facebook-pixel', () => {
  // Save original window.fbq
  const originalFbq = (global as any).fbq;

  beforeEach(() => {
    // Reset window.fbq before each test
    (global as any).fbq = vi.fn();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original window.fbq
    (global as any).fbq = originalFbq;
    vi.restoreAllMocks();
  });

  describe('pageview', () => {
    it('should track PageView event when fbq exists', () => {
      pixel.pageview();
      expect((global as any).fbq).toHaveBeenCalledWith('track', 'PageView');
    });

    it('should safely handle missing fbq without throwing', () => {
      (global as any).fbq = undefined;
      expect(() => pixel.pageview()).not.toThrow();
    });
  });

  describe('event', () => {
    it('should track custom events with options', () => {
      const eventName = 'TestEvent';
      const options = { foo: 'bar' };
      pixel.event(eventName, options);
      expect((global as any).fbq).toHaveBeenCalledWith('track', eventName, options);
    });

    it('should safely handle missing fbq without throwing', () => {
      (global as any).fbq = undefined;
      expect(() => pixel.event('Test', {})).not.toThrow();
    });
  });

  describe('trackPurchase', () => {
    it('should track Purchase event with default values', () => {
      pixel.trackPurchase();
      expect((global as any).fbq).toHaveBeenCalledWith('track', 'Purchase', {
        value: 0.80,
        currency: 'USD',
      });
    });

    it('should track Purchase event with custom values', () => {
      pixel.trackPurchase(1.50, 'EUR');
      expect((global as any).fbq).toHaveBeenCalledWith('track', 'Purchase', {
        value: 1.50,
        currency: 'EUR',
      });
    });
  });
});
