import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, OPTIONS } from '../route';
import { NextRequest } from 'next/server';

// Type definition for mocked Supabase client
type MockSupabaseClient = {
  from: ReturnType<typeof vi.fn> & (() => MockSupabaseClient);
  insert: ReturnType<typeof vi.fn>;
};

// Mock Supabase module
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    insert: vi.fn(),
  },
}));

// Helper to anonymize IP (zero out last octet for IPv4, last 80 bits for IPv6)
function anonymizeIp(ip: string): string {
  if (ip.includes(':')) {
    // IPv6
    const parts = ip.split(':');
    // Anonymize last 5 parts (80 bits)
    return [...parts.slice(0, 3), '0:0:0:0:0'].join(':');
  }
  // IPv4
  const parts = ip.split('.');
  if (parts.length === 4) {
    return parts.slice(0, 3).join('.') + '.0';
  }
  return ip; // Return as is if not a standard IPv4/IPv6
}

// Helper to create mock NextRequest
function createMockRequest(body: unknown, headers?: Record<string, string>): NextRequest {
  const request = {
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers(headers),
    url: 'http://localhost:3000/api/track-impression',
    method: 'POST',
  } as unknown as NextRequest;

  return request;
}

describe('POST /api/track-impression', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get mocked Supabase instance
    const { supabaseAdmin } = await import('@/lib/supabase');
    mockSupabase = supabaseAdmin as unknown as MockSupabaseClient;
  });

  // Helper function to mock successful impression insert
  const mockSuccessfulImpressionInsert = () => {
    mockSupabase.from.mockReturnThis();
    mockSupabase.insert.mockResolvedValue({ error: null });
  };

  describe('Request Validation', () => {
    it('should return 400 for empty request body', async () => {
      const request = createMockRequest('');
      request.text = vi.fn().mockResolvedValue('');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Empty request body');
    });

    it('should return 400 for invalid JSON', async () => {
      const request = createMockRequest({});
      request.text = vi.fn().mockResolvedValue('invalid-json{]');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON in request body');
    });

    // Parameterized test for missing required fields
    it.each([
      { field: 'vehicleId', body: { pageType: 'vdp' } },
      { field: 'pageType', body: { vehicleId: 'vehicle-123' } },
    ])('should return 400 when missing $field', async ({ body }) => {
      const request = createMockRequest(body);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid pageType', async () => {
      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        pageType: 'invalid-page-type',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid pageType');
      expect(data.error).toContain('search, homepage, or vdp');
    });
  });

  describe('Valid Page Types', () => {
    it('should accept "search" as valid pageType', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        pageType: 'search',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should accept "homepage" as valid pageType', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        pageType: 'homepage',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should accept "vdp" as valid pageType', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        pageType: 'vdp',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Flow Parameter Normalization', () => {
    it('should normalize valid flow parameter', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        pageType: 'vdp',
        flow: 'vdp-only',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.flow).toBe('vdp-only');

      // Verify impression was inserted with normalized flow
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ flow: 'vdp-only' })
      );
    });

    it('should accept "direct" flow', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        pageType: 'search',
        flow: 'direct',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.flow).toBe('direct');
    });

    it('should accept "full" flow', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        pageType: 'vdp',
        flow: 'full',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.flow).toBe('full');
    });

    it('should default invalid flow to "full"', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        pageType: 'vdp',
        flow: 'invalid-flow',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.flow).toBe('full');

      // Verify impression was inserted with default flow
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ flow: 'full' })
      );
    });

    it('should default missing flow to "full"', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        pageType: 'vdp',
        // flow missing
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.flow).toBe('full');
    });
  });

  describe('Database Operations', () => {
    it('should insert impression with all fields', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-456',
        pageType: 'search',
        flow: 'direct',
      });

      await POST(request);

      expect(mockSupabase.from).toHaveBeenCalledWith('impressions');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicle_id: 'vehicle-456',
          page_type: 'search',
          flow: 'direct',
        })
      );

      // Verify created_at is set
      const insertCall = mockSupabase.insert.mock.calls[0][0];
      expect(insertCall.created_at).toBeDefined();
      expect(new Date(insertCall.created_at)).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 when vehicle does not exist (foreign key constraint)', async () => {
      mockSupabase.from.mockReturnThis();

      // Mock foreign key constraint error
      mockSupabase.insert.mockResolvedValue({
        error: { code: '23503', message: 'Foreign key violation' },
      });

      const request = createMockRequest({
        vehicleId: 'nonexistent-vehicle',
        pageType: 'vdp',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Vehicle not found');
    });

    it('should return 500 for database errors (non-FK constraint)', async () => {
      mockSupabase.from.mockReturnThis();

      // Mock generic database error
      mockSupabase.insert.mockResolvedValue({
        error: { code: '42P01', message: 'Table does not exist' },
      });

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        pageType: 'vdp',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to log impression');
    });

    it('should return 400 for text parsing errors', async () => {
      const request = createMockRequest({});
      request.text = vi.fn().mockRejectedValue(new Error('Network error'));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON in request body');
    });

    it('should return 500 for errors during database operations', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        pageType: 'vdp',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Response Format', () => {
    it('should return complete success response', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-789',
        pageType: 'homepage',
        flow: 'full',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        message: 'Impression tracked successfully',
        vehicleId: 'vehicle-789',
        pageType: 'homepage',
        flow: 'full',
      });
    });

    it('should include normalized flow in response', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        pageType: 'vdp',
        flow: 'invalid',
      });

      const response = await POST(request);
      const data = await response.json();

      // Should normalize to 'full' in response
      expect(data.flow).toBe('full');
    });
  });

  describe('Attribution and User Context', () => {
    it('should log user_agent, anonymized ip_address, user_id, session_id and all UTM params', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest(
        {
          vehicleId: 'vehicle-123',
          pageType: 'vdp',
          userId: 'user-456',
          sessionId: 'session-123',
          flow: 'full',
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'summer_sale',
          fbclid: 'fb_cl_id',
          gclid: 'g_cl_id',
          ttclid: 'tt_cl_id',
          tblci: 'tb_cl_id',
        },
        {
          'User-Agent': 'Test-Agent/1.0',
          'X-Forwarded-For': '192.168.1.100, 10.0.0.1', // Example with multiple IPs
        }
      );

      await POST(request);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-456',
          session_id: 'session-123',
          user_agent: 'Test-Agent/1.0',
          ip_address: '192.168.1.0', // Anonymized
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'summer_sale',
          fbclid: 'fb_cl_id',
          gclid: 'g_cl_id',
          ttclid: 'tt_cl_id',
          tblci: 'tb_cl_id',
        })
      );
    });

    it('should anonymize IPv4 address (last octet to 0)', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest(
        {
          vehicleId: 'v1',
          pageType: 'vdp',
          userId: 'u1',
        },
        { 'X-Forwarded-For': '192.168.1.100' }
      );

      await POST(request);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ ip_address: '192.168.1.0' })
      );
    });

    it('should anonymize IPv6 address (last 5 parts to 0)', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest(
        {
          vehicleId: 'v1',
          pageType: 'vdp',
          userId: 'u1',
        },
        { 'X-Forwarded-For': '2001:0db8:85a3:0000:0000:8a2e:0370:7334' }
      );

      await POST(request);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ ip_address: '2001:0db8:85a3:0:0:0:0:0' }) // Adjusted to match anonymizeIp
      );
    });

    it('should handle missing user-agent and ip_address', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest(
        {
          vehicleId: 'v1',
          pageType: 'vdp',
          userId: 'u1',
        },
        // No headers
      );

      await POST(request);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ user_agent: 'unknown', ip_address: null })
      );
    });

    it('should handle missing UTM parameters and user/session IDs (set to null)', async () => {
      mockSuccessfulImpressionInsert();

      const request = createMockRequest(
        {
          vehicleId: 'v1',
          pageType: 'vdp',
          // No UTMs, userId, sessionId in body
        },
        // No headers
      );

      await POST(request);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: null,
          session_id: null,
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          fbclid: null,
          gclid: null,
          ttclid: null,
          tblci: null,
        })
      );
    });
  });
});

describe('OPTIONS /api/track-impression', () => {
  it('should return 200 for CORS preflight', async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(200);
  });

  it('should return empty JSON for CORS preflight', async () => {
    const response = await OPTIONS();
    const data = await response.json();

    expect(data).toEqual({});
  });
});
