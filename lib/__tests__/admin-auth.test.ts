import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { validateAdminAuth } from '../admin-auth';
import * as rateLimit from '../rate-limit';

// Mock rate limiting
vi.mock('../rate-limit', () => ({
  getClientIdentifier: vi.fn(() => '127.0.0.1'),
  checkMultipleRateLimits: vi.fn(),
  RATE_LIMITS: {
    FILTER_OPTIONS: { limit: 50, windowSeconds: 60 },
  },
}));

describe('validateAdminAuth', () => {
  const VALID_PASSWORD = 'test-password';
  const originalEnv = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_PASSWORD = VALID_PASSWORD;

    // Default: rate limit allows request
    vi.mocked(rateLimit.checkMultipleRateLimits).mockResolvedValue({
      allowed: true,
      limit: 50,
      remaining: 49,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    process.env.ADMIN_PASSWORD = originalEnv;
  });

  describe('Environment Variable Validation', () => {
    it('should return 500 if ADMIN_PASSWORD is not set', async () => {
      delete process.env.ADMIN_PASSWORD;

      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: { Authorization: 'Bearer anything' },
      });

      const result = await validateAdminAuth(request);

      expect(result.authorized).toBe(false);
      expect(result.response).toBeDefined();
      const json = await result.response!.json();
      expect(json.error).toContain('Server configuration error');
      expect(result.response!.status).toBe(500);
    });

    it('should return 500 if ADMIN_PASSWORD is empty string', async () => {
      process.env.ADMIN_PASSWORD = '';

      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: { Authorization: 'Bearer test' },
      });

      const result = await validateAdminAuth(request);

      expect(result.authorized).toBe(false);
      expect(result.response!.status).toBe(500);
    });
  });

  describe('Rate Limiting', () => {
    it('should check rate limits before validating password', async () => {
      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: { Authorization: `Bearer ${VALID_PASSWORD}` },
      });

      await validateAdminAuth(request);

      expect(rateLimit.checkMultipleRateLimits).toHaveBeenCalledWith(
        '127.0.0.1',
        expect.arrayContaining([
          expect.objectContaining({ endpoint: 'admin_api' }),
        ])
      );
    });

    it('should return 429 if rate limit exceeded', async () => {
      vi.mocked(rateLimit.checkMultipleRateLimits).mockResolvedValue({
        allowed: false,
        limit: 50,
        remaining: 0,
        reset: Date.now() + 60000,
      });

      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: { Authorization: `Bearer ${VALID_PASSWORD}` },
      });

      const result = await validateAdminAuth(request);

      expect(result.authorized).toBe(false);
      expect(result.response!.status).toBe(429);

      const json = await result.response!.json();
      expect(json.error).toContain('Rate limit exceeded');
    });

    it('should include rate limit headers in 429 response', async () => {
      const resetTime = Date.now() + 60000;
      vi.mocked(rateLimit.checkMultipleRateLimits).mockResolvedValue({
        allowed: false,
        limit: 50,
        remaining: 0,
        reset: resetTime,
      });

      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: { Authorization: `Bearer ${VALID_PASSWORD}` },
      });

      const result = await validateAdminAuth(request);

      expect(result.response!.headers.get('X-RateLimit-Limit')).toBe('50');
      expect(result.response!.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(result.response!.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });

  describe('Password Validation', () => {
    it('should return 401 for missing Authorization header', async () => {
      const request = new NextRequest('http://localhost/api/admin/test');

      const result = await validateAdminAuth(request);

      expect(result.authorized).toBe(false);
      expect(result.response!.status).toBe(401);

      const json = await result.response!.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 401 for wrong password', async () => {
      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: { Authorization: 'Bearer wrong-password' },
      });

      const result = await validateAdminAuth(request);

      expect(result.authorized).toBe(false);
      expect(result.response!.status).toBe(401);
    });

    it('should return 401 for malformed auth header (no Bearer prefix)', async () => {
      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: { Authorization: VALID_PASSWORD }, // Missing "Bearer"
      });

      const result = await validateAdminAuth(request);

      expect(result.authorized).toBe(false);
      expect(result.response!.status).toBe(401);
    });

    it('should return 401 for Bearer without password', async () => {
      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: { Authorization: 'Bearer ' }, // Space but no password
      });

      const result = await validateAdminAuth(request);

      expect(result.authorized).toBe(false);
      expect(result.response!.status).toBe(401);
    });

    it('should return authorized: true for valid password', async () => {
      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: { Authorization: `Bearer ${VALID_PASSWORD}` },
      });

      const result = await validateAdminAuth(request);

      expect(result.authorized).toBe(true);
      expect(result.response).toBeUndefined();
    });

    it('should be case-sensitive for password', async () => {
      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: { Authorization: 'Bearer TEST-PASSWORD' }, // Wrong case
      });

      const result = await validateAdminAuth(request);

      expect(result.authorized).toBe(false);
      expect(result.response!.status).toBe(401);
    });
  });

  describe('Request Flow', () => {
    it('should check env var → rate limit → password in order', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      delete process.env.ADMIN_PASSWORD;

      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: { Authorization: 'Bearer test' },
      });

      await validateAdminAuth(request);

      // Should fail at step 1 (env var check) without calling rate limit
      expect(rateLimit.checkMultipleRateLimits).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not validate password if rate limit exceeded', async () => {
      vi.mocked(rateLimit.checkMultipleRateLimits).mockResolvedValue({
        allowed: false,
        limit: 50,
        remaining: 0,
        reset: Date.now() + 60000,
      });

      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: { Authorization: `Bearer ${VALID_PASSWORD}` },
      });

      const result = await validateAdminAuth(request);

      // Should fail at step 2 (rate limit) and return 429, not 401
      expect(result.authorized).toBe(false);
      expect(result.response!.status).toBe(429);
    });
  });
});
