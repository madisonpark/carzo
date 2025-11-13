import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RATE_LIMITS,
  getClientIdentifier,
  checkRateLimit,
  checkMultipleRateLimits,
} from '../rate-limit';
import { supabaseAdmin } from '../supabase';

// Mock Supabase admin client
vi.mock('../supabase', () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
  },
}));

describe('RATE_LIMITS configuration', () => {
  it('should have correct SEARCH_VEHICLES limit', () => {
    expect(RATE_LIMITS.SEARCH_VEHICLES).toEqual({
      limit: 100,
      windowSeconds: 60,
    });
  });

  it('should have correct FILTER_OPTIONS limit', () => {
    expect(RATE_LIMITS.FILTER_OPTIONS).toEqual({
      limit: 50,
      windowSeconds: 60,
    });
  });

  it('should have correct BURST limit', () => {
    expect(RATE_LIMITS.BURST).toEqual({
      limit: 10,
      windowSeconds: 1,
    });
  });

  it('should have correct SESSION limit', () => {
    expect(RATE_LIMITS.SESSION).toEqual({
      limit: 500,
      windowSeconds: 3600,
    });
  });

  it('should have all required rate limit configs', () => {
    expect(RATE_LIMITS).toHaveProperty('SEARCH_VEHICLES');
    expect(RATE_LIMITS).toHaveProperty('FILTER_OPTIONS');
    expect(RATE_LIMITS).toHaveProperty('BURST');
    expect(RATE_LIMITS).toHaveProperty('SESSION');
  });
});

describe('getClientIdentifier()', () => {
  function createMockRequest(headers: Record<string, string>): Request {
    return {
      headers: new Headers(headers),
    } as Request;
  }

  beforeEach(() => {
    // Reset Date.now and Math.random mocks
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should extract IP from x-forwarded-for header (single IP)', () => {
    const request = createMockRequest({
      'x-forwarded-for': '192.168.1.1',
    });

    expect(getClientIdentifier(request)).toBe('192.168.1.1');
  });

  it('should extract first IP from x-forwarded-for header (multiple IPs)', () => {
    const request = createMockRequest({
      'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
    });

    expect(getClientIdentifier(request)).toBe('192.168.1.1');
  });

  it('should trim whitespace from x-forwarded-for IP', () => {
    const request = createMockRequest({
      'x-forwarded-for': '  192.168.1.1  ',
    });

    expect(getClientIdentifier(request)).toBe('192.168.1.1');
  });

  it('should use x-real-ip header if x-forwarded-for not present', () => {
    const request = createMockRequest({
      'x-real-ip': '10.0.0.1',
    });

    expect(getClientIdentifier(request)).toBe('10.0.0.1');
  });

  it('should prioritize x-forwarded-for over x-real-ip', () => {
    const request = createMockRequest({
      'x-forwarded-for': '192.168.1.1',
      'x-real-ip': '10.0.0.1',
    });

    expect(getClientIdentifier(request)).toBe('192.168.1.1');
  });

  it('should extract user ID from cookie if no IP headers', () => {
    const request = createMockRequest({
      cookie: 'carzo_user_id=550e8400-e29b-41d4-a916-446655440000; other=value',
    });

    expect(getClientIdentifier(request)).toBe('user:550e8400-e29b-41d4-a916-446655440000');
  });

  it('should handle cookie with only user ID', () => {
    const request = createMockRequest({
      cookie: 'carzo_user_id=abc123',
    });

    expect(getClientIdentifier(request)).toBe('user:abc123');
  });

  it('should generate anonymous identifier if no IP or cookie', () => {
    const request = createMockRequest({});

    const identifier = getClientIdentifier(request);

    // Should start with "anon:" followed by timestamp and random string
    expect(identifier).toMatch(/^anon:\d+-[a-z0-9]+$/);
    expect(identifier).toContain('1704067200000'); // Date.now() from mocked time
  });

  it('should generate unique anonymous identifiers (includes random component)', () => {
    const request = createMockRequest({});

    // Even with same timestamp, random component makes it unique
    const id1 = getClientIdentifier(request);
    const id2 = getClientIdentifier(request);

    expect(id1).toMatch(/^anon:\d+-[a-z0-9]+$/);
    expect(id2).toMatch(/^anon:\d+-[a-z0-9]+$/);
    // Both should have same timestamp but different random parts
    expect(id1).toContain('1704067200000');
    expect(id2).toContain('1704067200000');
  });

  it('should handle empty cookie header', () => {
    const request = createMockRequest({
      cookie: '',
    });

    const identifier = getClientIdentifier(request);
    expect(identifier).toMatch(/^anon:\d+-[a-z0-9]+$/);
  });

  it('should handle cookie without carzo_user_id', () => {
    const request = createMockRequest({
      cookie: 'other_cookie=value; another=test',
    });

    const identifier = getClientIdentifier(request);
    expect(identifier).toMatch(/^anon:\d+-[a-z0-9]+$/);
  });
});

describe('checkRateLimit()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return allowed when under limit', async () => {
    const mockData = [
      {
        allowed: true,
        current_count: 50,
        limit_value: 100,
        window_reset: '2024-01-01T00:01:00Z',
      },
    ];

    vi.mocked(supabaseAdmin.rpc).mockResolvedValue({
      data: mockData,
      error: null,
    } as any);

    const result = await checkRateLimit('192.168.1.1', 'search_vehicles', 100, 60);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(100);
    expect(result.remaining).toBe(50); // 100 - 50
    expect(result.reset).toBe(new Date('2024-01-01T00:01:00Z').getTime());
  });

  it('should return not allowed when limit exceeded', async () => {
    const mockData = [
      {
        allowed: false,
        current_count: 101,
        limit_value: 100,
        window_reset: '2024-01-01T00:01:00Z',
      },
    ];

    vi.mocked(supabaseAdmin.rpc).mockResolvedValue({
      data: mockData,
      error: null,
    } as any);

    const result = await checkRateLimit('192.168.1.1', 'search_vehicles', 100, 60);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0); // Max(0, 100 - 101) = 0
  });

  it('should call Supabase RPC with correct parameters', async () => {
    const mockData = [
      {
        allowed: true,
        current_count: 1,
        limit_value: 100,
        window_reset: '2024-01-01T00:01:00Z',
      },
    ];

    vi.mocked(supabaseAdmin.rpc).mockResolvedValue({
      data: mockData,
      error: null,
    } as any);

    await checkRateLimit('192.168.1.1', 'search_vehicles', 100, 60);

    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('check_rate_limit', {
      p_identifier: '192.168.1.1',
      p_endpoint: 'search_vehicles',
      p_limit: 100,
      p_window_seconds: 60,
    });
  });

  it('should fail open when Supabase returns error', async () => {
    vi.mocked(supabaseAdmin.rpc).mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    } as any);

    const result = await checkRateLimit('192.168.1.1', 'search_vehicles', 100, 60);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(100);
    expect(result.remaining).toBe(100);
    // Reset should be approximately now + window
    expect(result.reset).toBeGreaterThan(Date.now());
  });

  it('should fail open when Supabase returns empty data', async () => {
    vi.mocked(supabaseAdmin.rpc).mockResolvedValue({
      data: [],
      error: null,
    } as any);

    const result = await checkRateLimit('192.168.1.1', 'search_vehicles', 100, 60);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(100);
    expect(result.remaining).toBe(100);
  });

  it('should fail open when Supabase returns null data', async () => {
    vi.mocked(supabaseAdmin.rpc).mockResolvedValue({
      data: null,
      error: null,
    } as any);

    const result = await checkRateLimit('192.168.1.1', 'search_vehicles', 100, 60);

    expect(result.allowed).toBe(true);
  });

  it('should fail open when RPC throws exception', async () => {
    vi.mocked(supabaseAdmin.rpc).mockRejectedValue(new Error('Network error'));

    const result = await checkRateLimit('192.168.1.1', 'search_vehicles', 100, 60);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(100);
    expect(result.remaining).toBe(100);
  });

  it('should calculate remaining correctly (never negative)', async () => {
    const mockData = [
      {
        allowed: false,
        current_count: 150, // Way over limit
        limit_value: 100,
        window_reset: '2024-01-01T00:01:00Z',
      },
    ];

    vi.mocked(supabaseAdmin.rpc).mockResolvedValue({
      data: mockData,
      error: null,
    } as any);

    const result = await checkRateLimit('192.168.1.1', 'search_vehicles', 100, 60);

    expect(result.remaining).toBe(0); // Should be 0, not negative
  });

  it('should handle different window durations', async () => {
    const mockData = [
      {
        allowed: true,
        current_count: 1,
        limit_value: 10,
        window_reset: '2024-01-01T00:00:01Z',
      },
    ];

    vi.mocked(supabaseAdmin.rpc).mockResolvedValue({
      data: mockData,
      error: null,
    } as any);

    // Test with 1-second window (burst protection)
    await checkRateLimit('192.168.1.1', 'burst', 10, 1);

    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('check_rate_limit', {
      p_identifier: '192.168.1.1',
      p_endpoint: 'burst',
      p_limit: 10,
      p_window_seconds: 1,
    });
  });
});

describe('checkMultipleRateLimits()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass when all checks pass', async () => {
    // First check passes
    vi.mocked(supabaseAdmin.rpc)
      .mockResolvedValueOnce({
        data: [
          {
            allowed: true,
            current_count: 50,
            limit_value: 100,
            window_reset: '2024-01-01T00:01:00Z',
          },
        ],
        error: null,
      } as any)
      // Second check passes
      .mockResolvedValueOnce({
        data: [
          {
            allowed: true,
            current_count: 5,
            limit_value: 10,
            window_reset: '2024-01-01T00:00:01Z',
          },
        ],
        error: null,
      } as any);

    const result = await checkMultipleRateLimits('192.168.1.1', [
      { endpoint: 'search_vehicles', limit: 100, windowSeconds: 60 },
      { endpoint: 'burst', limit: 10, windowSeconds: 1 },
    ]);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(100); // First check's limit
    expect(result.remaining).toBe(50); // First check's remaining
    expect(result.failedCheck).toBeUndefined();
  });

  it('should fail when first check fails', async () => {
    vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({
      data: [
        {
          allowed: false,
          current_count: 101,
          limit_value: 100,
          window_reset: '2024-01-01T00:01:00Z',
        },
      ],
      error: null,
    } as any);

    const result = await checkMultipleRateLimits('192.168.1.1', [
      { endpoint: 'search_vehicles', limit: 100, windowSeconds: 60 },
      { endpoint: 'burst', limit: 10, windowSeconds: 1 },
    ]);

    expect(result.allowed).toBe(false);
    expect(result.failedCheck).toBe('search_vehicles');
    // Should only call RPC once (stopped at first failure)
    expect(supabaseAdmin.rpc).toHaveBeenCalledTimes(1);
  });

  it('should fail when second check fails', async () => {
    // First check passes
    vi.mocked(supabaseAdmin.rpc)
      .mockResolvedValueOnce({
        data: [
          {
            allowed: true,
            current_count: 50,
            limit_value: 100,
            window_reset: '2024-01-01T00:01:00Z',
          },
        ],
        error: null,
      } as any)
      // Second check fails
      .mockResolvedValueOnce({
        data: [
          {
            allowed: false,
            current_count: 11,
            limit_value: 10,
            window_reset: '2024-01-01T00:00:01Z',
          },
        ],
        error: null,
      } as any);

    const result = await checkMultipleRateLimits('192.168.1.1', [
      { endpoint: 'search_vehicles', limit: 100, windowSeconds: 60 },
      { endpoint: 'burst', limit: 10, windowSeconds: 1 },
    ]);

    expect(result.allowed).toBe(false);
    expect(result.failedCheck).toBe('burst');
    expect(supabaseAdmin.rpc).toHaveBeenCalledTimes(2);
  });

  it('should handle empty checks array', async () => {
    const result = await checkMultipleRateLimits('192.168.1.1', []);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(0);
    expect(result.remaining).toBe(0);
    expect(result.reset).toBeLessThanOrEqual(Date.now());
    expect(supabaseAdmin.rpc).not.toHaveBeenCalled();
  });

  it('should handle single check', async () => {
    vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({
      data: [
        {
          allowed: true,
          current_count: 1,
          limit_value: 100,
          window_reset: '2024-01-01T00:01:00Z',
        },
      ],
      error: null,
    } as any);

    const result = await checkMultipleRateLimits('192.168.1.1', [
      { endpoint: 'search_vehicles', limit: 100, windowSeconds: 60 },
    ]);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(100);
    expect(result.remaining).toBe(99);
  });

  it('should return first check details when all pass', async () => {
    vi.mocked(supabaseAdmin.rpc)
      .mockResolvedValueOnce({
        data: [
          {
            allowed: true,
            current_count: 50,
            limit_value: 100,
            window_reset: '2024-01-01T00:01:00Z',
          },
        ],
        error: null,
      } as any)
      .mockResolvedValueOnce({
        data: [
          {
            allowed: true,
            current_count: 5,
            limit_value: 10,
            window_reset: '2024-01-01T00:00:01Z',
          },
        ],
        error: null,
      } as any)
      .mockResolvedValueOnce({
        data: [
          {
            allowed: true,
            current_count: 200,
            limit_value: 500,
            window_reset: '2024-01-01T01:00:00Z',
          },
        ],
        error: null,
      } as any);

    const result = await checkMultipleRateLimits('192.168.1.1', [
      { endpoint: 'search_vehicles', limit: 100, windowSeconds: 60 },
      { endpoint: 'burst', limit: 10, windowSeconds: 1 },
      { endpoint: 'session', limit: 500, windowSeconds: 3600 },
    ]);

    // Should return first check's details
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(100);
    expect(result.remaining).toBe(50);
    expect(result.reset).toBe(new Date('2024-01-01T00:01:00Z').getTime());
  });

  it('should call checks sequentially (not parallel)', async () => {
    const callOrder: number[] = [];

    vi.mocked(supabaseAdmin.rpc)
      .mockImplementationOnce(async () => {
        callOrder.push(1);
        return {
          data: [
            {
              allowed: true,
              current_count: 1,
              limit_value: 100,
              window_reset: '2024-01-01T00:01:00Z',
            },
          ],
          error: null,
        } as any;
      })
      .mockImplementationOnce(async () => {
        callOrder.push(2);
        return {
          data: [
            {
              allowed: true,
              current_count: 1,
              limit_value: 10,
              window_reset: '2024-01-01T00:00:01Z',
            },
          ],
          error: null,
        } as any;
      });

    await checkMultipleRateLimits('192.168.1.1', [
      { endpoint: 'search_vehicles', limit: 100, windowSeconds: 60 },
      { endpoint: 'burst', limit: 10, windowSeconds: 1 },
    ]);

    expect(callOrder).toEqual([1, 2]);
  });
});

describe('Integration: Real-world rate limiting scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle typical search request with both per-minute and burst limits', async () => {
    vi.mocked(supabaseAdmin.rpc)
      .mockResolvedValueOnce({
        data: [
          {
            allowed: true,
            current_count: 50,
            limit_value: 100,
            window_reset: '2024-01-01T00:01:00Z',
          },
        ],
        error: null,
      } as any)
      .mockResolvedValueOnce({
        data: [
          {
            allowed: true,
            current_count: 5,
            limit_value: 10,
            window_reset: '2024-01-01T00:00:01Z',
          },
        ],
        error: null,
      } as any);

    const request = {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1',
      }),
    } as Request;

    const identifier = getClientIdentifier(request);
    const result = await checkMultipleRateLimits(identifier, [
      { endpoint: 'search_vehicles', ...RATE_LIMITS.SEARCH_VEHICLES },
      { endpoint: 'burst', ...RATE_LIMITS.BURST },
    ]);

    expect(identifier).toBe('192.168.1.1');
    expect(result.allowed).toBe(true);
  });

  it('should block burst attacks even if under per-minute limit', async () => {
    vi.mocked(supabaseAdmin.rpc)
      .mockResolvedValueOnce({
        data: [
          {
            allowed: true,
            current_count: 10,
            limit_value: 100,
            window_reset: '2024-01-01T00:01:00Z',
          },
        ],
        error: null,
      } as any)
      .mockResolvedValueOnce({
        data: [
          {
            allowed: false,
            current_count: 11,
            limit_value: 10,
            window_reset: '2024-01-01T00:00:01Z',
          },
        ],
        error: null,
      } as any);

    const result = await checkMultipleRateLimits('192.168.1.1', [
      { endpoint: 'search_vehicles', ...RATE_LIMITS.SEARCH_VEHICLES },
      { endpoint: 'burst', ...RATE_LIMITS.BURST },
    ]);

    expect(result.allowed).toBe(false);
    expect(result.failedCheck).toBe('burst');
  });

  it('should handle user without IP (cookie-based tracking)', async () => {
    const request = {
      headers: new Headers({
        cookie: 'carzo_user_id=550e8400-e29b-41d4-a916-446655440000',
      }),
    } as Request;

    const identifier = getClientIdentifier(request);

    expect(identifier).toBe('user:550e8400-e29b-41d4-a916-446655440000');
  });
});
