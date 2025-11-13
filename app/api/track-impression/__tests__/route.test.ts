import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, OPTIONS } from '../route';
import { NextRequest } from 'next/server';

// Mock Supabase module
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    insert: vi.fn(),
  },
}));

// Helper to create mock NextRequest
function createMockRequest(body: any): NextRequest {
  const request = {
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers(),
    url: 'http://localhost:3000/api/track-impression',
    method: 'POST',
  } as unknown as NextRequest;

  return request;
}

describe('POST /api/track-impression', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get mocked Supabase instance
    const { supabaseAdmin } = await import('@/lib/supabase');
    mockSupabase = supabaseAdmin;
  });

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

    it('should return 400 when missing vehicleId', async () => {
      const request = createMockRequest({
        // vehicleId missing
        pageType: 'vdp',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 when missing pageType', async () => {
      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        // pageType missing
      });

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
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockResolvedValue({ error: null });

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        pageType: 'search',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should accept "homepage" as valid pageType', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockResolvedValue({ error: null });

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        pageType: 'homepage',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should accept "vdp" as valid pageType', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockResolvedValue({ error: null });

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
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockResolvedValue({ error: null });

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
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockResolvedValue({ error: null });

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
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockResolvedValue({ error: null });

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
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockResolvedValue({ error: null });

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
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockResolvedValue({ error: null });

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
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockResolvedValue({ error: null });

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
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockResolvedValue({ error: null });

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
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockResolvedValue({ error: null });

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
