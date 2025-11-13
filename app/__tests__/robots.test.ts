import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import robots from '../robots';

describe('robots.ts', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
  });

  describe('Production environment (carzo.net)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://carzo.net';
    });

    it('should allow crawling of homepage, search, and vehicles', () => {
      const result = robots();

      expect(result.rules).toHaveLength(1);
      expect(result.rules[0].allow).toContain('/');
      expect(result.rules[0].allow).toContain('/search$');
      expect(result.rules[0].allow).toContain('/vehicles/');
    });

    it('should block /admin/ and /api/ routes', () => {
      const result = robots();

      expect(result.rules[0].disallow).toContain('/admin/');
      expect(result.rules[0].disallow).toContain('/api/');
    });

    it('should block search query params and flow parameters', () => {
      const result = robots();

      expect(result.rules[0].disallow).toContain('/search?*');
      expect(result.rules[0].disallow).toContain('/*?flow=*');
    });

    it('should include sitemap reference', () => {
      const result = robots();

      expect(result.sitemap).toBe('https://carzo.net/sitemap.xml');
    });

  });

  describe('Staging environment (stage.carzo.net)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://stage.carzo.net';
    });

    it('should block all crawlers', () => {
      const result = robots();

      expect(result.rules).toHaveLength(1);
      expect(result.rules[0].userAgent).toBe('*');
      expect(result.rules[0].disallow).toBe('/');
    });

    it('should not include sitemap for staging', () => {
      const result = robots();

      expect(result.sitemap).toBeUndefined();
    });
  });

  describe('Default environment (no NEXT_PUBLIC_SITE_URL)', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    });

    it('should default to carzo.net and allow crawling', () => {
      const result = robots();

      expect(result.sitemap).toBe('https://carzo.net/sitemap.xml');
      expect(result.rules).toHaveLength(1);
    });
  });
});
